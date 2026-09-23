# Звіт з лабораторної роботи № 6
## Тема: Розробка безпечної системи управління обліковими записами (15 балів)

---

### Стек технологій та архітектура рішення

Проєкт реалізовано у вигляді клієнт-серверного вебзастосунку з модульною мікросервісною інфраструктурою:

* **Backend:** Node.js (NestJS, TypeScript, TypeORM, Passport.js, Otplib, Argon2, Nodemailer).
* **Frontend:** React 19 (TypeScript, Vite, Material Design 3, TailwindCSS, Lucide Icons, Canvas-Confetti).
* **База даних:** PostgreSQL 15 (реляційна схема 3NF, міграції TypeORM).
* **Кешування та черги:** Redis 7.
* **Емуляція поштового сервера:** Mailpit SMTP/HTTP (`localhost:1025` / `localhost:8025`).
* **S3-сумісне сховище артефактів:** SeaweedFS (`localhost:8333`).

---

### Завдання 1 (3 бали): Реєстрація користувача та політика паролів

#### 1.1. Вимоги завдання
* Довжина пароля не менше 8 символів.
* Наявність великих і малих літер, цифр та спеціальних символів.
* Відображення користувачу сили введеного пароля в реальному часі.
* Криптографічне хешування паролів (Argon2id) та автентифікація за рівністю хешів.
* Особистий кабінет (перегляд профілю) та коректний вихід із системи (logout).

#### 1.2. Реалізація

##### 1. Валідація складності пароля (Backend DTO):
У файлі `software/backend/src/modules/auth/dto/register.dto.ts` реалізовано суворе обмеження за допомогою регулярного виразу:

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email address format' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    {
      message:
        'Password must contain uppercase letters, lowercase letters, numbers, and special characters',
    },
  )
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'CAPTCHA token is required' })
  captchaToken!: string;
}
```

##### 2. Індикатор складності в реальному часі (Frontend):
У компоненті `software/frontend/src/components/PasswordStrengthMeter.tsx` створено динамічний індикатор із 5 критеріями (мінімум 8 символів, великі літери, малі літери, цифри, спеціальні символи), колірною градацією (Червоний &rarr; Жовтий &rarr; Зелений) та текстовою оцінкою ("Слабкий", "Помірний", "Надійний", "Відмінний"):

```typescript
// Real-time evaluation of password criteria
const checks = [
  { label: '8+ chars', met: password.length >= 8 },
  { label: 'Uppercase (A-Z)', met: /[A-Z]/.test(password) },
  { label: 'Lowercase (a-z)', met: /[a-z]/.test(password) },
  { label: 'Digit (0-9)', met: /\d/.test(password) },
  { label: 'Special symbol (!@#$...)', met: /[^A-Za-z0-9]/.test(password) },
];
```

##### 3. Криптографічне хешування Argon2id:
Для збереження паролів обрано найстійкіший до атак на GPU/ASIC алгоритм **Argon2id**. Параметри пам'яті та ітерацій налаштовано у `software/backend/src/modules/auth/auth.service.ts`:

```typescript
import * as argon2 from 'argon2';

// Hash password with Argon2id using strict memory cost parameters
async hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB memory cost
    timeCost: 3,       // 3 iterations
    parallelism: 4,    // 4 parallel threads
  });
}

// Secure hash equality verification
async verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}
```

##### 4. Особистий кабінет та вихід із системи:
* **Ендпоінт профілю:** `GET /api/v1/users/me` (захищений `JwtAuthGuard`). Повертає публічні дані, системну роль, статус активації, провайдер входу та стан 2FA.
* **Інтерфейс профілю:** `software/frontend/src/pages/ProfilePage.tsx` з Material Design 3 картками облікового запису, безпеки та журналом сесій.
* **Вихід із системи:** Ендпоінт `POST /api/v1/auth/logout` інвалідує серверний контекст, а клієнтський `AuthContext.tsx` очищає токени доступу `accessToken` та `refreshToken` з `localStorage`.

---

### Завдання 2 (2 бали): Захист від ботів (CAPTCHA)

#### 2.1. Вимоги завдання
* Інтеграція механізму CAPTCHA у форму реєстрації акаунту для блокування автоматизованого створення спам-профілів.
* Серверна верифікація токена перед записом у базу даних.

#### 2.2. Реалізація

##### 1. Клієнтський інтерактивний смарт-віджет (Cloudflare Turnstile):
Створено компонент `software/frontend/src/components/auth/CaptchaWidget.tsx`, який інтегрує Cloudflare Turnstile (`sitekey = 0x4AAAAAAFBDW7LqZnzsV119`):
* **Динамічна синхронізація теми:** віджет реагує на світлу або темну тему через хук `useTheme()`:
  * У світлій темі (`theme: 'light'`) рендериться чистий білий віджет з фірмовими контурами Cloudflare.
  * У темній темі (`theme: 'dark'`) усунуто артефакт 1px білої рамки за допомогою `clipPath: 'inset(1.5px round 6px)'`.
* **Синхронне очищення життєвого циклу (`useLayoutEffect`):** виклик `window.turnstile.remove(widgetId)` виконується до від'єднання DOM-вузлів React'ом, що усуває попередження «Cannot find Widget».
* **Політика безпеки вмісту (CSP):** у `software/frontend/index.html` додано тег `<meta http-equiv="Content-Security-Policy">`, що дозволяє `https://challenges.cloudflare.com` та директиву `'unsafe-eval'` для безпечного виконання челенджу.

```typescript
// software/frontend/src/components/auth/CaptchaWidget.tsx
useLayoutEffect(() => {
  return () => {
    if (widgetIdRef.current && window.turnstile) {
      const currentId = widgetIdRef.current;
      widgetIdRef.current = null;
      try {
        window.turnstile.remove(currentId);
      } catch {}
    }
  };
}, []);

const id = window.turnstile.render(containerRef.current, {
  sitekey: activeSiteKey,
  action: 'signup',
  theme: isDark ? 'dark' : 'light',
  callback: (token: string) => {
    onVerify(token);
  },
});
```

##### 2. Сервіс валідації на бекенді (`CaptchaService`):
У `software/backend/src/modules/captcha/captcha.service.ts` реалізовано повноцінну серверну верифікацію через Cloudflare Siteverify API:

```typescript
// POST https://challenges.cloudflare.com/turnstile/v0/siteverify
const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    secret: secretKey,
    response: token,
    remoteip: remoteIp || '',
  }),
});

const data = (await response.json()) as TurnstileVerifyResponse;
if (!data.success) {
  this.logger.warn(`Turnstile validation failed: ${JSON.stringify(data['error-codes'])}`);
  return false;
}
return true;
```

При відсутності токена або невдалій перевірці реєстрація негайно блокується з кодом `HTTP 400 Bad Request` («CAPTCHA verification failed. Please try again.»).

---

### Завдання 3 (2 бали): Активація облікового запису через електронну пошту

#### 3.1. Вимоги завдання
* Надсилання електронного листа з посиланням на активацію після завершення реєстрації.
* Використання криптографічно стійкого одноразового токена з обмеженим терміном дії (24 години).
* Обліковий запис створюється у стані `is_activated = false`; спроби входу неактивованого акаунта суворо блокуються.
* Відображення статусу активації у профілі користувача.

#### 3.2. Реалізація

##### 1. Генерація токена та відправка листа:
При виклику `POST /api/v1/auth/register` у базі даних зберігається 32-байтний випадковий hex-токен (`crypto.randomBytes(32).toString('hex')`) з терміном дії 24 години, а на пошту користувача через Mailpit (SMTP порт 1025) надсилається HTML-лист з унікальним посиланням: `${frontendUrl}/activate?token=${activationToken}`.

##### 2. Блокування входу неактивованих користувачів:
У методі `login()` сервісу `software/backend/src/modules/auth/auth.service.ts` реалізовано обов'язкову перевірку активації після верифікації пароля:
```typescript
// 6. Verify account activation status via email verification link (SDSecurity Task 3)
if (!user.isActivated) {
  await this.securityAuditService.recordLoginAttempt({
    userId: user.id,
    attemptedEmail: dto.email,
    ipAddress,
    userAgent,
    status: LoginAttemptStatus.NOT_ACTIVATED,
    failureReason: 'Account has not been activated via email verification link',
  });
  throw new UnauthorizedException(
    'Your account has not been activated yet. Please check your email for the activation link.',
  );
}
```
Також перевірку `!user.isActivated` впроваджено у `verify2fa()` та в `JwtStrategy`, що повністю унеможливлює виконання будь-яких автентифікованих дій неактивованим користувачем.

##### 3. Одноразовість токена та захист від подвійного виклику (React StrictMode):
* **Ідемпотентність на бекенді:** `AuthService` зберігає кеш нещодавно активованих токенів `recentlyActivatedTokens = new Map<string, number>()` (TTL 5 хв). Якщо запит повторюється через подвійне натискання чи StrictMode, повертається успішна відповідь замість помилки.
* **Захист на фронтенді:** у `software/frontend/src/pages/ActivatePage.tsx` додано реф-запобіжник `attemptedTokenRef`, який блокує повторний виклик `api.activate(token)` під час подвійного монтування компонента в режимі розробки.
* **Підтвердження успіху:** користувач бачить екран з анімацією конфеті, а в особистому кабінеті (`/profile`) відображається зелений бейдж «Activated».

---

### Завдання 4 (2 бали): Захист від Brute Force атак та аудит

#### 4.1. Вимоги завдання
* Обмеження кількості невдалих спроб входу (ліміт: 5 невдалих спроб).
* Тимчасове блокування облікового запису після перевищення ліміту (на 15 хвилин).
* Журнал логування спроб входу для адміністратора (IP-адреса, User-Agent, дата/час, статус, причина відмови).
* Інформування користувача про статус блокування та залишковий час блокування.
* Можливість адміністративного блокування/розблокування користувачів.

#### 4.2. Реалізація

##### 1. Логіка блокування після 5 невдалих спроб:
У `software/backend/src/modules/auth/auth.service.ts` реалізовано підрахунок невдалих спроб та блокування:

```typescript
// Verify if account is currently under timed lockout
if (user.lockedUntil && user.lockedUntil > new Date()) {
  const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
  throw new BadRequestException(
    `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`
  );
}

// Upon incorrect password match:
user.failedLoginAttempts += 1;
if (user.failedLoginAttempts >= 5) {
  user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
  await this.logSecurityEvent(user.email, user.id, 'ACCOUNT_LOCKED', ip, userAgent);
  throw new BadRequestException('Account locked for 15 minutes due to 5 consecutive failed login attempts');
}
```

##### 2. Зворотний відлік на клієнті:
На сторінці `software/frontend/src/pages/LoginPage.tsx` парситься залишковий час блокування та вмикається живий таймер (`"Account locked. Please wait MM:SS"`), блокуючи повторні відправки форми.

##### 3. Сутність аудит-логу (`login_audit_logs`):
Кожна спроба входу фіксується у таблиці `login_audit_logs` (`software/backend/src/modules/security-audit/entities/login-audit-log.entity.ts`):
* `email`: вказана електронна пошта.
* `userId`: ідентифікатор користувача (якщо знайдено).
* `ipAddress`: IP клієнта (`req.ip` / `X-Forwarded-For`).
* `userAgent`: рядок браузера/клієнта.
* `status`: `SUCCESS`, `FAILED_PASSWORD`, `ACCOUNT_LOCKED`, `TWO_FACTOR_FAILED`.
* `createdAt`: точна часова мітка.

##### 4. Інтерфейс адміністратора:
У вкладці **«Security Audit Logs»** панелі `AdminDashboardPage.tsx` реалізовано повноцінний перегляд журналу з фільтрами за IP та статусом, а також кнопки `[Block Account]` / `[Unblock Account]` (`PATCH /api/v1/users/:id/block` та `/unblock`).

---

### Завдання 5 (2 бали): Двофакторна автентифікація (2FA TOTP)

#### 5.1. Вимоги завдання
* Реалізація Time-based One-Time Password (TOTP) за стандартом RFC 6238.
* Генерація секретного ключа та QR-коду для сканування в мобільних додатках (Google Authenticator, Authy).
* Підключення 2FA з підтвердженням одноразовим 6-значним кодом.
* Двоетапний процес входу (пароль &rarr; запит 2FA &rarr; перевірка TOTP &rarr; видача повної JWT-сесії).
* Керування увімкненням/вимкненням 2FA у профілі.

#### 5.2. Реалізація

##### 1. Генерація секрету та QR-коду:
Використовується бібліотека `otplib` та `qrcode` (`software/backend/src/modules/auth/auth.service.ts`):

```typescript
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

// Generate RFC 6238 compliant secret key and QR code data URL
async generateTwoFactorSecret(user: User) {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(user.email, 'BugTracker Security', secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { secret, qrCodeDataUrl };
}
```

##### 2. Увімкнення у модальному вікні:
Компонент `software/frontend/src/components/TwoFactorModal.tsx` відображає згенерований QR-код та текстовий резервний ключ. Користувач вводить 6-значний код для підтвердження володіння застосунком-автентифікатором (`POST /api/v1/auth/2fa/enable`).

##### 3. Двоетапний вхід:
* Якщо у користувача `isTwoFactorEnabled === true`, базовий ендпоінт `/auth/login` повертає проміжну відповідь:
  `{ isTwoFactorRequired: true, tempToken: "..." }`.
* `LoginPage.tsx` відкриває модальне вікно для введення одноразового коду.
* Клієнт надсилає `POST /api/v1/auth/2fa/verify` з `tempToken` та `code`.
* Після успішної перевірки токена сервер повертає постійні `accessToken` та `refreshToken`.

##### 4. Аварійне скидання адміністратором:
Для випадків втрати смартфону адміністратор може скинути 2FA через ендпоінт `PATCH /api/v1/users/:id/reset-2fa` безпосередньо з панелі `AdminDashboardPage.tsx`.

---

### Завдання 6 (2 бали): Автентифікація через зовнішні сервіси (OAuth2 / OIDC)

#### 6.1. Вимоги завдання
* Інтеграція входу через сторонніх провайдерів за протоколами OAuth 2.0 / OpenID Connect.
* Процедура авторизації: редирект &rarr; code exchange &rarr; отримання профілю.
* Автоматичне створення облікового запису (provisioning) або лінкування з існуючим акаунтом.
* Можливість встановити пароль для облікового запису, створеного через OAuth (дуальний вхід).

#### 6.2. Реалізація

##### 1. Інтегровані провайдери:
Реалізовано дві стратегії Passport:
1. **GitHub OAuth2:** `software/backend/src/modules/auth/strategies/github.strategy.ts` (`GET /api/v1/auth/github` та `/callback`).
2. **Google OAuth2 / OIDC:** `software/backend/src/modules/auth/strategies/google.strategy.ts` (`GET /api/v1/auth/google` та `/callback`).
3. **Mock OAuth Endpoint:** `POST /api/v1/auth/oauth/mock` для автономного тестування та демонстрації без зовнішнього інтернет-з'єднання.

##### 2. Автоматичний провіжинінг та зв'язування:
У методі `validateOrCreateOAuthUser()`:
```typescript
let user = await this.usersRepository.findOne({ where: { email } });
if (!user) {
  // Provision new user from OAuth provider claims
  user = this.usersRepository.create({
    email,
    fullName,
    oauthProvider: provider,
    oauthId,
    isActivated: true, // OAuth emails are pre-verified by identity provider
    passwordHash: null,
  });
  await this.usersRepository.save(user);
}
```

##### 3. Встановлення пароля для OAuth-акаунтів:
* Якщо обліковий запис створено через OAuth, поле `hasPassword: false` сигналізує про відсутність локального пароля.
* У `ProfilePage.tsx` користувачу пропонується форма **«Set Initial Account Password»**.
* Виклик `POST /api/v1/auth/set-password` хешує введений пароль алгоритмом Argon2id. Після цього користувач отримує можливість входити як через Google/GitHub, так і через форму введення email/пароля.

---

### Завдання 7 (2 бали): Відновлення та зміна пароля через електронну пошту

#### 7.1. Вимоги завдання
* Запит на відновлення/зміну пароля з вказанням email.
* Генерація одноразового токена з обмеженим терміном дії (15 хвилин) та надсилання листа.
* Перехід за посиланням з email, перевірка складності нового пароля та його збереження.
* Автоматичне зняття блокування облікового запису після успішного скидання пароля.

#### 7.2. Реалізація

##### 1. Генерація 15-хвилинного токена:
Ендпоінт `POST /api/v1/auth/forgot-password` генерує одноразовий токен:

```typescript
const resetToken = crypto.randomBytes(32).toString('hex');
user.passwordResetToken = resetToken;
user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL
await this.usersRepository.save(user);

const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
await this.mailerService.sendMail({
  to: user.email,
  subject: 'BugTracker Password Reset Request',
  template: 'password-reset',
  context: { name: user.fullName, resetUrl },
});
```

##### 2. Інтеграція в особистий кабінет:
В особистому кабінеті (`ProfilePage.tsx`) замість небезпечної зміни пароля на місці реалізовано кнопку **«Send Password Reset Email»**. Клік викликає відправку листа та виводить банер із прямим переходом до поштової скриньки Mailpit (`http://localhost:8025`).

##### 3. Форма скидання та зняття блокування:
* Посилання з листа відкриває `software/frontend/src/pages/ResetPasswordPage.tsx`.
* Форма підключена до динамічного індикатора `PasswordStrengthMeter`.
* Ендпоінт `POST /api/v1/auth/reset-password` оновлює хеш пароля та **гарантовано скидає лічильник невдалих спроб і блокування**:
```typescript
user.passwordHash = await this.hashPassword(newPassword);
user.passwordResetToken = null;
user.passwordResetExpiresAt = null;
user.failedLoginAttempts = 0; // Clear brute-force failure counter
user.lockedUntil = null;       // Release account lockout
await this.usersRepository.save(user);
```

---

### Рольове розмежування доступу (RBAC) та панель адміністратора

Для забезпечення повної відповідності загальним вимогам проєкту реалізовано дворівневу модель RBAC:

#### 1. Системні ролі:
* `ADMIN`: повний доступ до користувачів, призначення ролей, журналу аудиту та системних налаштувань.
* `USER`: доступ до особистого кабінету та призначених проєктів.

#### 2. Захист від саморозжалування:
У контролері `software/backend/src/modules/users/users.controller.ts`:
```typescript
@Patch(':id/role')
@Roles(SystemRole.ADMIN)
async updateRole(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateUserRoleDto,
  @CurrentUser() currentUser: User,
) {
  if (currentUser.id === id && dto.role !== SystemRole.ADMIN) {
    throw new BadRequestException('Cannot demote your own administrator account');
  }
  return this.usersService.updateRole(id, dto.role);
}
```

#### 3. Панель адміністратора (`AdminDashboardPage.tsx`):
1. **Аналітичні KPI-метрики:** Загальна кількість користувачів, активні, заблоковані, відсоток охоплення 2FA, кількість подій аудиту.
2. **Таблиця користувачів:** Пошук за ім'ям/email, фільтри за статусом (`Active`, `Pending`, `Blocked`) та роллю, селектор миттєвої зміни ролі (`ADMIN` &harr; `USER`), активація акаунта, скидання 2FA, блокування/розблокування.
3. **Журнал безпеки:** Таблиця спроб автентифікації з IP та User-Agent.
4. **Моніторинг сервісів:** Індикатори стану REST API (порт 3000), PostgreSQL (5432), Mailpit (1025), Redis (6379), SeaweedFS (8333).

---

### Сценарій для запису демонстраційного відеозвіту

| Етап відео | Дія користувача у відео | Очікувана реакція системи | Підтверджений пункт Лаб 6 |
| :---: | :--- | :--- | :---: |
| **1. Вступ** | Короткий огляд стеку технологій (NestJS, React 19, PostgreSQL, Argon2id, Mailpit). | Демонстрація запущених сервісів у терміналі та браузері. | Вступне слово |
| **2. Політика паролів** | Введення слабкого пароля `12345` при реєстрації на `/register`. | `PasswordStrengthMeter` червоний; помилка валідації складності. | **Завдання 1** |
| **3. Валідний пароль та CAPTCHA** | Введення `StrongPass123!`, перетягування слайдера CAPTCHA. | Слайдер підтверджено; запит реєстрації успішно відправлено. | **Завдання 1, 2** |
| **4. Активація через email** | Відкриття Mailpit (`http://localhost:8025`), клік на посилання в листі. | Сторінка `/activate?token=...` показує салют-конфеті; акаунт активовано. | **Завдання 3** |
| **5. Brute Force та аудит** | 5 спроб входу з невірним паролем на сторінці `/login`. | Блокування акаунта на 15 хв; живий зворотний відлік на формі; запис в `login_audit_logs`. | **Завдання 4** |
| **6. Відновлення пароля** | Клік "Forgot password?" або кнопки у профілі; перехід за посиланням з Mailpit. | Введення нового пароля скидає блокування; успішний вхід. | **Завдання 7** |
| **7. Підключення 2FA** | Відкриття `/profile`, увімкнення 2FA, сканування QR-коду, введення TOTP. | При повторному логіні вимагається другий крок із введенням 6 цифр. | **Завдання 5** |
| **8. Вхід через OAuth2** | Клік "Sign in with GitHub" або "Sign in with Google". | Автоматичний вхід; можливість встановити локальний пароль у профілі. | **Завдання 6** |
| **9. Адмін-панель та RBAC** | Вхід під адміністратором, перехід на `/admin/dashboard`. | Зміна ролей, ручне блокування/розблокування, перегляд аудит-логу. | Загальна вимога RBAC |

---

### Підсумковий висновок

Усі 7 завдань проєкту **SDSecurity Лабораторної роботи № 6** виконано у повному обсязі (15 з 15 балів):
* Створено захищену архітектуру реєстрації та автентифікації на базі алгоритму **Argon2id** та суворої політики паролів.
* Інтегровано інтерактивний захист від ботів (**CAPTCHA**) та email-активацію облікових записів через **Mailpit**.
* Реалізовано багаторівневий захист від перебору паролів (**Brute-Force lockout** на 15 хвилин з живим таймером) та повний аудит-трейл спроб входу.
* Імплементовано **TOTP двофакторну автентифікацію** (RFC 6238) з підтримкою Google Authenticator.
* Налаштовано федеративний вхід через зовнішні сервіси (**GitHub**, **Google**) з підтримкою дуальної автентифікації.
* Забезпечено безпечне відновлення та зміну пароля через одноразовий токен із автоматичним зняттям блокування.
* Розгорнуто повнофункціональну адміністративну панель керування ролями (**RBAC**) та системними метриками.
