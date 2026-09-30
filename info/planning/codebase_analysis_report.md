# Комплексний Аналіз Кодової Бази — BugTracker

**Дата:** 2026-09-28  
**Область:** `/home/finkord/dev/PPofSE/software`  
**Стек:** NestJS (backend) + React 18 / TailwindCSS (frontend)  
**Масштаб:** 158 frontend файлів, 106 backend файлів, 13 spec-файлів

---

## 1. Загальна Структура Проєкту

```
software/
├── backend/src/
│   ├── modules/          # 10 доменних модулів
│   │   ├── auth/         # Фасад + 5 субсервісів [OK]
│   │   ├── rbac/         # RBAC + Permission Evaluator [OK]
│   │   ├── issues/       # Core, Comments, Worklog, Attachments, Links [OK]
│   │   ├── users/        # + saved-filter entity [OK]
│   │   ├── projects/     [OK]
│   │   ├── sprints/      [OK]
│   │   ├── events/       # WebSocket Gateway [OK]
│   │   ├── admin/        # Seed ([WARN] 1484 рядки!)
│   │   ├── captcha/      [OK]
│   │   └── security-audit/ [OK]
│   └── common/           # Guards, Filters, Decorators [OK]
└── frontend/src/
    ├── pages/            # 19 сторінок [OK]
    ├── components/       # 14 директорій компонентів [OK]
    ├── api/              # Модульний API-клієнт [OK]
    ├── context/          # Auth, Theme, Sidebar, Broadcast [OK]
    └── hooks/ types/ utils/ [OK]
```

---

## 2. Оцінка Складності та Підтримки

### 2.1 Backend — NestJS

**Оцінка: 8/10 [OK] Добре**

#### Сильні сторони:
- **Фасадний патерн в Auth**: `AuthService` є чистим фасадом над 5 субсервісами (`LocalAuthService`, `TwoFactorAuthService`, `PasswordResetService`, `TokenSessionService`, `OAuthService`). Відмінне дотримання SRP.
- **Modular Architecture**: 10 чітко розділених модулів. Кожен містить власні контролер, сервіс, DTOs, entities.
- **Clean validation**: `ValidationPipe` з `whitelist: true, forbidNonWhitelisted: true` — вхідні дані завжди валідуються.
- **Global exception filter**: `AllExceptionsFilter` запобігає витоку внутрішніх деталей.
- **Swagger**: документація API повністю налаштована.

#### Проблеми:

| Файл | Рядки | Проблема |
|------|-------|---------|
| `seed.service.ts` | **1484** | [CRITICAL] Критично великий — один сервіс робить надто багато. Порушення SRP |
| `users.service.ts` | 406 | [WARN] На межі — варто виділити субсервіси |
| `issue-core.service.ts` | 362 | [WARN] Починає ставати God Object |

```typescript
// [WARN] ПРОБЛЕМА в seed.service.ts: 14 залежностей в конструкторі!
constructor(
  @InjectRepository(User) private readonly userRepository: ...,
  @InjectRepository(Project) private readonly projectRepository: ...,
  // ... ще 12 репозиторіїв
```
> Правило: до 10 властивостей/залежностей. seed.service.ts порушує це.

---

### 2.2 Frontend — React/TypeScript

**Оцінка: 6.5/10 [WARN] Задовільно з резервами**

#### Сильні сторони:
- **Code splitting**: всі 19 сторінок завантажуються через `React.lazy()` + `Suspense`. [OK]
- **API-клієнт**: модульна структура (`auth.api`, `issues.api`...) агрегована через простий фасад `api = {...authApi, ...issuesApi}`. [OK]  
- **Context**: чітке розділення — `AuthContext`, `ThemeContext`, `SidebarContext`, `BroadcastContext`. [OK]
- **Оптимістичні оновлення**: `KanbanBoardPage` коректно реалізує патерн optimistic-update з rollback. [OK]

#### Проблеми:

| Файл | Рядки | Проблема |
|------|-------|---------|
| `TimesheetMatrixGrid.tsx` | **773** | [CRITICAL] Занадто великий компонент |
| `IssueLinksSection.tsx` | 574 | [CRITICAL] Порушення SRP |
| `KanbanBoardPage.tsx` | 499 | [WARN] Все управління станом в одному компоненті |
| `SprintAnalyticsModal.tsx` | 498 | [WARN] |

```typescript
// [WARN] ProjectSettingsPage.tsx — відсутність useCallback
const loadProjectData = async () => { // Не useCallback!
  const [proj, people, users, groups, schemes, perms] = await Promise.all([...]);
```

**TanStack Query взагалі не використовується** — попри те, що вказаний в `react_frontend_guidelines.md` як стандарт. Весь серверний стан управляється вручну через `useState` + `useEffect` + ручний `fetch`. Це:
- Відсутній кешинг
- Немає автоматичного refetch
- Ручний `loading`/`error` стан в кожному компоненті (дублювання)

**Zustand не використовується** — лише Context API.

---

## 3. Оцінка Спагетті-Коду

**Загальна оцінка: 3/10 (низький рівень спагеті) [OK]**

### 3.1 Відсутні патерни спагеті (позитивно):
- [OK] Чітка модульна структура — немає circular dependencies
- [OK] Компоненти мають смислові назви та одну відповідальність (здебільшого)
- [OK] Хуки виносяться в окремі кастомні хуки де потрібно
- [OK] Немає God Objects (крім `seed.service.ts`)
- [OK] API не змішано з UI-логікою

### 3.2 Знайдені проблеми спагеті:

**`KanbanBoardPage.tsx` — Стан-монстр (499 рядків):**
```typescript
// 15+ useState в одному компоненті — це занадто
const [projects, setProjects] = useState<ProjectItem[]>([]);
const [selectedProjectId, setSelectedProjectId] = useState<...>();
const [issues, setIssues] = useState<IssueItem[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [isMobile, setIsMobile] = useState<boolean>(...);
const [settings, setSettings] = useState<KanbanSettings>(...);
const [searchTerm, setSearchTerm] = useState<string>(...);
const [filterType, setFilterType] = useState<string>(...);
const [filterPriority, setFilterPriority] = useState<string>(...);
const [quickFilters, setQuickFilters] = useState<QuickFilterState>(...);
const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
// ... ще 5+
```

**`useEffect` без deps (warnings):**
```typescript
// KanbanBoardPage.tsx:78 - missing 'settings' in deps
useEffect(() => {
  const viewParam = searchParams.get('view');
  if (viewParam && (viewParam === 'flat' || viewParam === 'swimlanes')) {
    if (settings.viewMode !== viewParam) { // settings тут
      setSettings(...);
    }
  }
}, [searchParams]); // settings відсутній у deps!
```

**`(usersData as any)?.items` — типізований обхід:**
```typescript
// ProjectSettingsPage.tsx:61
const userList = (usersData as any)?.items || (Array.isArray(usersData) ? usersData : []);
```

---

## 4. Оцінка Безпеки

**Загальна оцінка: 9.5/10 [OK] Відмінний рівень**

### 4.1 Сильні місця:

| Механізм | Реалізація | Оцінка |
|---------|-----------|--------|
| Password hashing | Argon2id (memory=65536, time=3, parallel=4) | [OK] Excellent |
| Brute-force protection | 5 спроб → lockout 15 хв | [OK] OWASP compliant |
| 2FA / TOTP | Повна реалізація з challenge-token | [OK] |
| Account activation | Single-use token + 24h expiry | [OK] |
| JWT refresh & httpOnly cookies | tokenVersion bump при logout + 8h/7d httpOnly cookies | [OK] |
| Rate limiting | ThrottlerModule (10 req/60s) | [OK] |
| Input validation | ValidationPipe + class-validator DTOs | [OK] |
| RBAC | Повна система: groups, roles, actors, permissions | [OK] |
| Security Audit | Логування всіх спроб входу (IP, UA, status) | [OK] |
| Password reset | Криптографічний токен + 15хв expiry | [OK] |

### 4.2 Знайдені Вразливості:

#### [CRITICAL] КРИТИЧНО: CORS `origin: true` — [OK] ВИПРАВЛЕНО
```typescript
// main.ts:12
// Було: origin: true (дозволяв будь-який origin з credentials)
// Виправлено:
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});
```
*Статус:* **[OK] ВИПРАВЛЕНО** — встановлено явний whitelist через `process.env.FRONTEND_URL` з дефолтом на `http://localhost:5173`.

#### [CRITICAL] КРИТИЧНО: `synchronize: true` без умов середовища — [OK] ВИПРАВЛЕНО
```typescript
// app.module.ts:79
// Було: synchronize: true (авто-синхронізація схеми БД навіть у production)
// Виправлено:
synchronize: process.env.NODE_ENV !== 'production',
```
*Статус:* **[OK] ВИПРАВЛЕНО** — синхронізація схеми TypeORM відключена для production-середовища.

#### [WARN] СЕРЕДНЄ: OAuth tokens передавалися через URL redirect — [OK] ВИПРАВЛЕНО
```typescript
// Було: токени передавались у query-параметрах redirect URL (?accessToken=...&refreshToken=...)
// Виправлено:
// 1. Створено OAuthCodeStoreService (одноразові коди обміну з TTL 60 секунд)
// 2. Redirect повертає лише тимчасовий ?code=...
// 3. Frontend виконує POST /auth/oauth/exchange для безпечного отримання JWT
// 4. URL очищується через window.history.replaceState
```
*Статус:* **[OK] ВИПРАВЛЕНО** — реалізовано патерн безпечного обміну авторизаційними кодами (OAuth Code Exchange) на backend та frontend.

#### [WARN] СЕРЕДНЄ: Hardcoded frontend URL в backend — [OK] ВИПРАВЛЕНО
```typescript
// local-auth.service.ts:72
// Було: const activationUrl = `http://localhost:5173/activate?token=${activationToken}`;
// Виправлено:
const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
const activationUrl = `${frontendUrl}/activate?token=${activationToken}`;
```
*Статус:* **[OK] ВИПРАВЛЕНО** — впроваджено `ConfigService` для динамічного зчитування `FRONTEND_URL`.

#### [WARN] СЕРЕДНЄ: JWT токени в localStorage — [OK] ВИПРАВЛЕНО
```typescript
// Було: зберігання JWT токенів виключно у localStorage (вразливо до XSS)
// Виправлено:
// 1. Впроваджено cookie-parser middleware у NestJS (main.ts)
// 2. AuthController автоматично виставляє secure httpOnly cookies (accessToken 8h, refreshToken 7d)
// 3. JwtStrategy витягує токен як з Bearer header, так і з req.cookies.accessToken
// 4. Frontend http client надсилає credentials: 'include' на всі запити та refresh flow
// 5. AuthContext відновлює автентифіковану сесію напряму через httpOnly cookie
```
*Статус:* **[OK] ВИПРАВЛЕНО** — реалізовано повний захищений життєвий цикл `httpOnly` cookies на backend та frontend.

#### [WARN] СЕРЕДНЄ: `req: any` у OAuth callbacks — [OK] ВИПРАВЛЕНО
```typescript
// auth.controller.ts
interface OAuthAuthenticatedRequest extends Request {
  user?: User;
}
async githubCallback(@Req() req: OAuthAuthenticatedRequest, @Res() res: Response, ...)
async googleCallback(@Req() req: OAuthAuthenticatedRequest, @Res() res: Response, ...)
```
*Статус:* **[OK] ВИПРАВЛЕНО** — додано типізований інтерфейс `OAuthAuthenticatedRequest` без використання `any`.

#### [MEDIUM] НИЗЬКЕ: `type: any` у production entities — [OK] ВИПРАВЛЕНО
```typescript
// Виправлено у всіх сутностях (project.entity.ts, issue.entity.ts, rbac entities, sprint.entity.ts)
// Замінено any на строго типізовані зв'язки (PermissionScheme, IssueSecurityScheme, IssueSecurityLevel тощо)
```
*Статус:* **[OK] ВИПРАВЛЕНО** — 0 використань `any` у TypeORM entities.

#### [MEDIUM] НИЗЬКЕ: `prompt()` блокував потік UI — [OK] ВИПРАВЛЕНО
```typescript
// KanbanBoardPage.tsx
// Було: const filterName = prompt('Enter a name...'); // sync blocking!
// Виправлено:
// Створено доступний Material Design 3 діалог SaveFilterModal.tsx з плавною анімацією,
// фокусом, валідацією та підтримкою гарячих клавіш (Enter/Escape).
```
*Статус:* **[OK] ВИПРАВЛЕНО** — замінено на `SaveFilterModal.tsx`.

### 4.3 Відповідність OWASP Top 10 (2021):

| OWASP Category | Статус | Деталі |
|----------------|--------|--------|
| A01 Broken Access Control | [OK] PASS | RBAC + RolesGuard |
| A02 Cryptographic Failures | [OK] PASS | Argon2id, JWT HS256, OAuth Code Exchange, httpOnly cookies |
| A03 Injection | [OK] PASS | TypeORM parameterized + ValidationPipe |
| A05 Security Misconfiguration | [OK] PASS | CORS whitelist + conditional synchronize виправлено |
| A07 Auth Failures | [OK] PASS | Lockout, 2FA, tokenVersion, безпечний OAuth flow |
| A09 Logging Failures | [OK] PASS | SecurityAuditService |

---

## 5. Відповідність Material Design 3

**Загальна оцінка: 8/10 [OK] Дуже добре**

### Audit Scores:

| Category | Score | Status | Деталі |
|----------|-------|--------|--------|
| **Color tokens** | 9/10 | [OK] pass | Повний набір `--md-sys-color-*` для light/dark. Правильне тональне паювання (primary+on-primary etc.) |
| **Typography** | 7/10 | [OK] pass | Roboto як primary typeface (MD3-correct). Класи Tailwind замість CSS-токенів |
| **Shape** | 8/10 | [OK] pass | Канонічні shape tokens визначені. Використовуються `rounded-2xl`, `rounded-3xl` у Tailwind |
| **Elevation** | 8/10 | [OK] pass | Тональні surface containers замість shadows |
| **Components** | 7/10 | [OK] pass | Кастомні компоненти дотримуються MD3-патернів. Немає `@material/web` — Tailwind замість |
| **Layout** | 7/10 | [OK] pass | Sidebar + Workspace + Canvas патерн відповідає MD3 App Shell |
| **Navigation** | 8/10 | [OK] pass | Navigation Rail (Sidebar) + заголовок — коректний MD3 adaptive pattern |
| **Motion** | 6/10 | [WARN] warn | MD3 easing tokens визначені але не завжди використовуються. `animate-spin`, `animate-in` — Tailwind-specific |
| **Accessibility** | 5/10 | [WARN] warn | Відсутні ARIA labels у більшості інтерактивних елементів |
| **Theming** | 9/10 | [OK] pass | Light/dark через `html.dark` клас. Всі компоненти використовують CSS vars |

**Загальний M3 Score: 74/100**

---

## 6. Відповідність Правилам Проєкту

### Backend (TypeScript/NestJS rules):

| Правило | Статус | Деталі |
|---------|--------|--------|
| One export per file | [OK] | Переважно дотримується |
| Functions < 20 instructions | [WARN] | `login()` в LocalAuthService — ~60 рядків, але логіка guard-clause потоку виправдана |
| Classes < 200 instructions | [FAIL] | `SeedService` (1484 рядки) порушує |
| No `any` | [OK] | Усі TypeORM entities та контролери строго типізовані без `any` |
| Guard Clauses pattern | [OK] | `login()` використовує early-return правильно |
| JSDoc for public methods | [OK] | Добре задокументовано в auth services |
| Avoid magic numbers | [WARN] | Named constants визначено для нових модулів |

### Frontend (React guidelines):

| Правило | Статус | Деталі |
|---------|--------|--------|
| TanStack Query for server state | [FAIL] | Не використовується — весь стан через useState |
| Zustand for global state | [FAIL] | Не використовується — тільки Context API |
| Error boundaries | [FAIL] | Відсутні повністю |
| No `any` type | [WARN] | Зменшено у нових компонентах |
| React.memo for expensive components | [FAIL] | Немає memoization |
| Custom hooks for reusable logic | [WARN] | Частково — `useAuth`, але `useEffect`-логіка не виноситься |

---

## 7. Зведена Таблиця Оцінок

| Категорія | Оцінка | Рівень |
|-----------|--------|--------|
| Архітектура Backend | **9/10** | [OK] Відмінно |
| Архітектура Frontend | **6.5/10** | [WARN] Задовільно |
| Спагетті-код | **8/10** (малий рівень) | [OK] Добре |
| Безпека | **9.5/10** (після виправлень) | [OK] Відмінно |
| Material Design 3 | **7.4/10** | [OK] Добре |
| Тестування | **4/10** | [FAIL] Недостатньо |
| TypeScript Quality | **7/10** | [OK] Добре |
| **Загально** | **7.4/10** | [OK] Добре |

---

## 8. Пріоритетні Рекомендації

### [CRITICAL] Термінові (безпека):
1. ~~**Виправити CORS** — замінити `origin: true` на whitelist конкретних origin~~ — **[OK] ВИПРАВЛЕНО** (`main.ts`)
2. ~~**Захистити `synchronize`** — умовний для dev-середовища~~ — **[OK] ВИПРАВЛЕНО** (`app.module.ts`)
3. ~~**Виправити hardcoded URL** в `local-auth.service.ts`~~ — **[OK] ВИПРАВЛЕНО** (`local-auth.service.ts` + `ConfigService`)

### [MEDIUM] Важливі (архітектура):
4. **Розбити `SeedService`** на окремі субсервіси (UserSeedService, ProjectSeedService тощо)
5. **Впровадити TanStack Query** — замінити ручний fetch у компонентах
6. ~~**Замінити `prompt()`** на Dialog компонент~~ — **[OK] ВИПРАВЛЕНО** (`SaveFilterModal.tsx`)
7. **Впровадити Error Boundaries** для стійкості UI

### [LOW] Покращення (якість):
8. **Додати ARIA attributes** у ключові компоненти (spinner, modals, buttons)
9. ~~**Виправити `any`** у entities (`project.entity.ts`, `issue.entity.ts`, RBAC)~~ — **[OK] ВИПРАВЛЕНО** (всі TypeORM entities строго типізовані)
10. ~~**OAuth redirect** — безпечний обмін коду замість токенів у URL~~ — **[OK] ВИПРАВЛЕНО** (`OAuthCodeStoreService` + `exchangeOAuthCode`)
11. **Розбити `KanbanBoardPage`** — виділити custom hook `useKanbanBoard()`
12. **Named constants** для magic numbers (`LOCKOUT_DURATION_MS`, `ARGON2_MEMORY_COST`)
