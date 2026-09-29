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
│   │   ├── auth/         # Фасад + 5 субсервісів ✅
│   │   ├── rbac/         # RBAC + Permission Evaluator ✅
│   │   ├── issues/       # Core, Comments, Worklog, Attachments, Links ✅
│   │   ├── users/        # + saved-filter entity ✅
│   │   ├── projects/     ✅
│   │   ├── sprints/      ✅
│   │   ├── events/       # WebSocket Gateway ✅
│   │   ├── admin/        # Seed (⚠️ 1484 рядки!)
│   │   ├── captcha/      ✅
│   │   └── security-audit/ ✅
│   └── common/           # Guards, Filters, Decorators ✅
└── frontend/src/
    ├── pages/            # 19 сторінок ✅
    ├── components/       # 14 директорій компонентів ✅
    ├── api/              # Модульний API-клієнт ✅
    ├── context/          # Auth, Theme, Sidebar, Broadcast ✅
    └── hooks/ types/ utils/ ✅
```

---

## 2. Оцінка Складності та Підтримки

### 2.1 Backend — NestJS

**Оцінка: 8/10 ✅ Добре**

#### Сильні сторони:
- **Фасадний патерн в Auth**: `AuthService` є чистим фасадом над 5 субсервісами (`LocalAuthService`, `TwoFactorAuthService`, `PasswordResetService`, `TokenSessionService`, `OAuthService`). Відмінне дотримання SRP.
- **Modular Architecture**: 10 чітко розділених модулів. Кожен містить власні контролер, сервіс, DTOs, entities.
- **Clean validation**: `ValidationPipe` з `whitelist: true, forbidNonWhitelisted: true` — вхідні дані завжди валідуються.
- **Global exception filter**: `AllExceptionsFilter` запобігає витоку внутрішніх деталей.
- **Swagger**: документація API повністю налаштована.

#### Проблеми:

| Файл | Рядки | Проблема |
|------|-------|---------|
| `seed.service.ts` | **1484** | 🔴 Критично великий — один сервіс робить надто багато. Порушення SRP |
| `users.service.ts` | 406 | ⚠️ На межі — варто виділити субсервіси |
| `issue-core.service.ts` | 362 | ⚠️ Починає ставати God Object |

```typescript
// ⚠️ ПРОБЛЕМА в seed.service.ts: 14 залежностей в конструкторі!
constructor(
  @InjectRepository(User) private readonly userRepository: ...,
  @InjectRepository(Project) private readonly projectRepository: ...,
  // ... ще 12 репозиторіїв
```
> Правило: до 10 властивостей/залежностей. seed.service.ts порушує це.

---

### 2.2 Frontend — React/TypeScript

**Оцінка: 6.5/10 ⚠️ Задовільно з резервами**

#### Сильні сторони:
- **Code splitting**: всі 19 сторінок завантажуються через `React.lazy()` + `Suspense`. ✅
- **API-клієнт**: модульна структура (`auth.api`, `issues.api`...) агрегована через простий фасад `api = {...authApi, ...issuesApi}`. ✅  
- **Context**: чітке розділення — `AuthContext`, `ThemeContext`, `SidebarContext`, `BroadcastContext`. ✅
- **Оптимістичні оновлення**: `KanbanBoardPage` коректно реалізує патерн optimistic-update з rollback. ✅

#### Проблеми:

| Файл | Рядки | Проблема |
|------|-------|---------|
| `TimesheetMatrixGrid.tsx` | **773** | 🔴 Занадто великий компонент |
| `IssueLinksSection.tsx` | 574 | 🔴 Порушення SRP |
| `KanbanBoardPage.tsx` | 499 | ⚠️ Все управління станом в одному компоненті |
| `SprintAnalyticsModal.tsx` | 498 | ⚠️ |

```typescript
// ⚠️ ProjectSettingsPage.tsx — відсутність useCallback
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

**Загальна оцінка: 3/10 (низький рівень спагеті) ✅**

### 3.1 Відсутні патерни спагеті (позитивно):
- ✅ Чітка модульна структура — немає circular dependencies
- ✅ Компоненти мають смислові назви та одну відповідальність (здебільшого)
- ✅ Хуки виносяться в окремі кастомні хуки де потрібно
- ✅ Немає God Objects (крім `seed.service.ts`)
- ✅ API не змішано з UI-логікою

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

**Загальна оцінка: 9.5/10 ✅ Відмінний рівень**

### 4.1 Сильні місця:

| Механізм | Реалізація | Оцінка |
|---------|-----------|--------|
| Password hashing | Argon2id (memory=65536, time=3, parallel=4) | ✅ Excellent |
| Brute-force protection | 5 спроб → lockout 15 хв | ✅ OWASP compliant |
| 2FA / TOTP | Повна реалізація з challenge-token | ✅ |
| Account activation | Single-use token + 24h expiry | ✅ |
| JWT refresh & httpOnly cookies | tokenVersion bump при logout + 8h/7d httpOnly cookies | ✅ |
| Rate limiting | ThrottlerModule (10 req/60s) | ✅ |
| Input validation | ValidationPipe + class-validator DTOs | ✅ |
| RBAC | Повна система: groups, roles, actors, permissions | ✅ |
| Security Audit | Логування всіх спроб входу (IP, UA, status) | ✅ |
| Password reset | Криптографічний токен + 15хв expiry | ✅ |

### 4.2 Знайдені Вразливості:

#### 🔴 КРИТИЧНО: CORS `origin: true` — ✅ ВИПРАВЛЕНО
```typescript
// main.ts:12
// Було: origin: true (дозволяв будь-який origin з credentials)
// Виправлено:
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});
```
*Статус:* **✅ ВИПРАВЛЕНО** — встановлено явний whitelist через `process.env.FRONTEND_URL` з дефолтом на `http://localhost:5173`.

#### 🔴 КРИТИЧНО: `synchronize: true` без умов середовища — ✅ ВИПРАВЛЕНО
```typescript
// app.module.ts:79
// Було: synchronize: true (авто-синхронізація схеми БД навіть у production)
// Виправлено:
synchronize: process.env.NODE_ENV !== 'production',
```
*Статус:* **✅ ВИПРАВЛЕНО** — синхронізація схеми TypeORM відключена для production-середовища.

#### ⚠️ СЕРЕДНЄ: OAuth tokens передавалися через URL redirect — ✅ ВИПРАВЛЕНО
```typescript
// Було: токени передавались у query-параметрах redirect URL (?accessToken=...&refreshToken=...)
// Виправлено:
// 1. Створено OAuthCodeStoreService (одноразові коди обміну з TTL 60 секунд)
// 2. Redirect повертає лише тимчасовий ?code=...
// 3. Frontend виконує POST /auth/oauth/exchange для безпечного отримання JWT
// 4. URL очищується через window.history.replaceState
```
*Статус:* **✅ ВИПРАВЛЕНО** — реалізовано патерн безпечного обміну авторизаційними кодами (OAuth Code Exchange) на backend та frontend.

#### ⚠️ СЕРЕДНЄ: Hardcoded frontend URL в backend — ✅ ВИПРАВЛЕНО
```typescript
// local-auth.service.ts:72
// Було: const activationUrl = `http://localhost:5173/activate?token=${activationToken}`;
// Виправлено:
const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
const activationUrl = `${frontendUrl}/activate?token=${activationToken}`;
```
*Статус:* **✅ ВИПРАВЛЕНО** — впроваджено `ConfigService` для динамічного зчитування `FRONTEND_URL`.

#### ⚠️ СЕРЕДНЄ: JWT токени в localStorage — ✅ ВИПРАВЛЕНО
```typescript
// Було: зберігання JWT токенів виключно у localStorage (вразливо до XSS)
// Виправлено:
// 1. Впроваджено cookie-parser middleware у NestJS (main.ts)
// 2. AuthController автоматично виставляє secure httpOnly cookies (accessToken 8h, refreshToken 7d)
// 3. JwtStrategy витягує токен як з Bearer header, так і з req.cookies.accessToken
// 4. Frontend http client надсилає credentials: 'include' на всі запити та refresh flow
// 5. AuthContext відновлює автентифіковану сесію напряму через httpOnly cookie
```
*Статус:* **✅ ВИПРАВЛЕНО** — реалізовано повний захищений життєвий цикл `httpOnly` cookies на backend та frontend.

#### ⚠️ СЕРЕДНЄ: `req: any` у OAuth callbacks — ✅ ВИПРАВЛЕНО
```typescript
// auth.controller.ts
interface OAuthAuthenticatedRequest extends Request {
  user?: User;
}
async githubCallback(@Req() req: OAuthAuthenticatedRequest, @Res() res: Response, ...)
async googleCallback(@Req() req: OAuthAuthenticatedRequest, @Res() res: Response, ...)
```
*Статус:* **✅ ВИПРАВЛЕНО** — додано типізований інтерфейс `OAuthAuthenticatedRequest` без використання `any`.

#### 🟡 НИЗЬКЕ: `type: any` у production entities — ✅ ВИПРАВЛЕНО
```typescript
// Виправлено у всіх сутностях (project.entity.ts, issue.entity.ts, rbac entities, sprint.entity.ts)
// Замінено any на строго типізовані зв'язки (PermissionScheme, IssueSecurityScheme, IssueSecurityLevel тощо)
```
*Статус:* **✅ ВИПРАВЛЕНО** — 0 використань `any` у TypeORM entities.

#### 🟡 НИЗЬКЕ: `prompt()` блокував потік UI — ✅ ВИПРАВЛЕНО
```typescript
// KanbanBoardPage.tsx
// Було: const filterName = prompt('Enter a name...'); // sync blocking!
// Виправлено:
// Створено доступний Material Design 3 діалог SaveFilterModal.tsx з плавною анімацією,
// фокусом, валідацією та підтримкою гарячих клавіш (Enter/Escape).
```
*Статус:* **✅ ВИПРАВЛЕНО** — замінено на `SaveFilterModal.tsx`.

### 4.3 Відповідність OWASP Top 10 (2021):

| OWASP Category | Статус | Деталі |
|----------------|--------|--------|
| A01 Broken Access Control | ✅ PASS | RBAC + RolesGuard |
| A02 Cryptographic Failures | ✅ PASS | Argon2id, JWT HS256, OAuth Code Exchange, httpOnly cookies |
| A03 Injection | ✅ PASS | TypeORM parameterized + ValidationPipe |
| A05 Security Misconfiguration | ✅ PASS | CORS whitelist + conditional synchronize виправлено |
| A07 Auth Failures | ✅ PASS | Lockout, 2FA, tokenVersion, безпечний OAuth flow |
| A09 Logging Failures | ✅ PASS | SecurityAuditService |

---

## 5. Відповідність Material Design 3

**Загальна оцінка: 8/10 ✅ Дуже добре**

### Audit Scores:

| Category | Score | Status | Деталі |
|----------|-------|--------|--------|
| **Color tokens** | 9/10 | ✅ pass | Повний набір `--md-sys-color-*` для light/dark. Правильне тональне паювання (primary+on-primary etc.) |
| **Typography** | 7/10 | ✅ pass | Roboto як primary typeface (MD3-correct). Класи Tailwind замість CSS-токенів |
| **Shape** | 8/10 | ✅ pass | Канонічні shape tokens визначені. Використовуються `rounded-2xl`, `rounded-3xl` у Tailwind |
| **Elevation** | 8/10 | ✅ pass | Тональні surface containers замість shadows |
| **Components** | 7/10 | ✅ pass | Кастомні компоненти дотримуються MD3-патернів. Немає `@material/web` — Tailwind замість |
| **Layout** | 7/10 | ✅ pass | Sidebar + Workspace + Canvas патерн відповідає MD3 App Shell |
| **Navigation** | 8/10 | ✅ pass | Navigation Rail (Sidebar) + заголовок — коректний MD3 adaptive pattern |
| **Motion** | 6/10 | ⚠️ warn | MD3 easing tokens визначені але не завжди використовуються. `animate-spin`, `animate-in` — Tailwind-specific |
| **Accessibility** | 5/10 | ⚠️ warn | Відсутні ARIA labels у більшості інтерактивних елементів |
| **Theming** | 9/10 | ✅ pass | Light/dark через `html.dark` клас. Всі компоненти використовують CSS vars |

**Загальний M3 Score: 74/100**

---

## 6. Відповідність Правилам Проєкту

### Backend (TypeScript/NestJS rules):

| Правило | Статус | Деталі |
|---------|--------|--------|
| One export per file | ✅ | Переважно дотримується |
| Functions < 20 instructions | ⚠️ | `login()` в LocalAuthService — ~60 рядків, але логіка guard-clause потоку виправдана |
| Classes < 200 instructions | ❌ | `SeedService` (1484 рядки) порушує |
| No `any` | ✅ | Усі TypeORM entities та контролери строго типізовані без `any` |
| Guard Clauses pattern | ✅ | `login()` використовує early-return правильно |
| JSDoc for public methods | ✅ | Добре задокументовано в auth services |
| Avoid magic numbers | ⚠️ | Named constants визначено для нових модулів |

### Frontend (React guidelines):

| Правило | Статус | Деталі |
|---------|--------|--------|
| TanStack Query for server state | ❌ | Не використовується — весь стан через useState |
| Zustand for global state | ❌ | Не використовується — тільки Context API |
| Error boundaries | ❌ | Відсутні повністю |
| No `any` type | ⚠️ | Зменшено у нових компонентах |
| React.memo for expensive components | ❌ | Немає memoization |
| Custom hooks for reusable logic | ⚠️ | Частково — `useAuth`, але `useEffect`-логіка не виноситься |

---

## 7. Зведена Таблиця Оцінок

| Категорія | Оцінка | Рівень |
|-----------|--------|--------|
| Архітектура Backend | **9/10** | ✅ Відмінно |
| Архітектура Frontend | **6.5/10** | ⚠️ Задовільно |
| Спагетті-код | **8/10** (малий рівень) | ✅ Добре |
| Безпека | **9.5/10** (після виправлень) | ✅ Відмінно |
| Material Design 3 | **7.4/10** | ✅ Добре |
| Тестування | **4/10** | ❌ Недостатньо |
| TypeScript Quality | **7/10** | ✅ Добре |
| **Загально** | **7.4/10** | ✅ Добре |

---

## 8. Пріоритетні Рекомендації

### 🔴 Термінові (безпека):
1. ~~**Виправити CORS** — замінити `origin: true` на whitelist конкретних origin~~ — **✅ ВИПРАВЛЕНО** (`main.ts`)
2. ~~**Захистити `synchronize`** — умовний для dev-середовища~~ — **✅ ВИПРАВЛЕНО** (`app.module.ts`)
3. ~~**Виправити hardcoded URL** в `local-auth.service.ts`~~ — **✅ ВИПРАВЛЕНО** (`local-auth.service.ts` + `ConfigService`)

### 🟡 Важливі (архітектура):
4. **Розбити `SeedService`** на окремі субсервіси (UserSeedService, ProjectSeedService тощо)
5. **Впровадити TanStack Query** — замінити ручний fetch у компонентах
6. ~~**Замінити `prompt()`** на Dialog компонент~~ — **✅ ВИПРАВЛЕНО** (`SaveFilterModal.tsx`)
7. **Впровадити Error Boundaries** для стійкості UI

### 🟢 Покращення (якість):
8. **Додати ARIA attributes** у ключові компоненти (spinner, modals, buttons)
9. ~~**Виправити `any`** у entities (`project.entity.ts`, `issue.entity.ts`, RBAC)~~ — **✅ ВИПРАВЛЕНО** (всі TypeORM entities строго типізовані)
10. ~~**OAuth redirect** — безпечний обмін коду замість токенів у URL~~ — **✅ ВИПРАВЛЕНО** (`OAuthCodeStoreService` + `exchangeOAuthCode`)
11. **Розбити `KanbanBoardPage`** — виділити custom hook `useKanbanBoard()`
12. **Named constants** для magic numbers (`LOCKOUT_DURATION_MS`, `ARGON2_MEMORY_COST`)
