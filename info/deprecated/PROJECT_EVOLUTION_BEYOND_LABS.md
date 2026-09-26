# Еволюційний розвиток BugTracker під час розробки (Beyond Lab Requirements)

Даний документ фіксує та структурує функціональні й архітектурні вдосконалення, які були спроєктовані, розроблені та інтегровані в програмний комплекс **BugTracker**, виходячи за рамки початкових базових вимог навчальних лабораторних робіт 1–5.

---

## 1. Контекст та передумови розширення

У процесі практичної реалізації системи виявилося, що базовий функціонал (проста авторизація та мінімальна база даних дефектів) не задовольняє реальних вимог інженерії програмного забезпечення до сучасних корпоративних трекерів задач (Jira, Linear, GitHub Issues).

Тому під час переходу до Лабораторних робіт 6–7 проєкт еволюціонував у повноцінну платформу з високим рівнем безпеки, гнучким керуванням доступом (RBAC), багаторівневою аналітикою та підтримкою гнучких методологій розробки (Agile/Kanban).

---

## 2. Ключові еволюційні модулі, реалізовані понад початкові вимоги

### 2.1. Гібридний механізм головної сторінки (Guest Landing vs Personal Dashboard)
- **Початковий стан:** Статична презентаційна сторінка без розділення станів входу.
- **Еволюційне рішення:**
  - **Для гостей:** Висококонверсійний лендінг, що фокусується виключно на діях авторизації (Sign In) та реєстрації (Create Account), перевагах платформи та посиланні на Swagger REST API.
  - **Для авторизованих спеціалістів:** Автоматичне надання **Personal Dashboard** замість лендінгу:
    - Віджет задач, призначених безпосередньо на користувача (*«Assigned to Me»*) з можливістю відкриття та швидкої зміни статусу.
    - Швидкий перехід на Kanban-дошку закріпленого/активного проєкту.
    - Каталог збережених персональних фільтрів (*Saved Filters*) з можливістю запуску вибірки в один клік (підґрунтя для системи Advanced Search).
    - Лічильники ефективності: облік залогованих годин за поточний день/тиждень.

### 2.2. Окрема сторінка тікета (Standalone Issue Page `/issues/:id`)
- **Початковий стан:** Дефекти відкривалися виключно у модальних діалогових вікнах.
- **Еволюційне рішення:** Створено повноцінний екран `/issues/:id` з підтримкою deep-linking, навігаційними хлібними крихтами, редагуванням опису, віджетом прогресу залогованого часу, історією робочих логів та повнорозмірною стрічкою обговорення. Модальні вікна збережено для швидкого тріажу з додаванням кнопки переходу в повнорозмірний режим.

### 2.3. Механізм самопризначення («Assign to Me»)
- **Початковий стан:** Призначення виконавця вимагало відкриття випадаючого списку та пошуку власного імені.
- **Еволюційне рішення:** Одноклікова дія «Assign to Me» додана на картки Kanban, у модальні вікна та на окрему сторінку дефекту, що мінімізує кількість дій розробника при взятті задачі в роботу.

### 2.4. Система аватарів користувачів
- **Початковий стан:** Текстове відображення імен користувачів.
- **Еволюційне рішення:** Додано поле `avatar_url` та компонент `Avatar`, що підтримує:
  - Завантаження/встановлення власного URL зображення.
  - Пресети векторних аватарів (Dicebear).
  - Інтелектуальний fallback: градієнтні бейджі з ініціалами на основі детермінованого гешування імені.

### 2.5. Розширена система ролей (5-Role Enterprise RBAC)
- **Початковий стан:** Дві бінарні ролі (`ADMIN`, `USER`).
- **Еволюційне рішення:** Впроваджено 5 диференційованих ролей розробницької команди:
  1. `ADMIN` — повне системне керування, безпека, налаштування ролей та проєктів.
  2. `PROJECT_MANAGER` — планування спринтів, беклог, аналітика продуктивності та розподіл задач.
  3. `DEVELOPER` — взяття задач у роботу, зміна статусів, самопризначення, логування часу.
  4. `QA_ENGINEER` — реєстрація багів, верифікація виправлень, тріаж критичності.
  5. `USER` — базова роль для нових користувачів. **Усі зареєстровані користувачі (включаючи `USER`) мають право реєструвати дефекти.**
- **Перспектива розвитку:** Архітектура спроєктована з можливістю переходу до динамічної матриці прав (Permissions Matrix: `issues:create`, `issues:assign_self`, `projects:manage`, `worklogs:log`).

### 2.6. Адаптивна бокова панель (Collapsible Navigation Sidebar)
- **Початковий стан:** Тільки верхній Navbar.
- **Еволюційне рішення:** Впроваджено бічну панель навігації, яка перемикається між компактним значковим виглядом (Rail 64px) та розгорнутим (Expanded 240px). Забезпечує миттєве перемикання між:
  - Personal Dashboard
  - Projects Directory
  - Kanban Board
  - Agile Backlog & Sprints
  - Time Tracking
  - Admin Center

### 2.7. Розширення панелі адміністратора (4 функціональні модулі)
- **Початковий стан:** Простий список користувачів з однією дією зміни ролі.
- **Еволюційне рішення:** Повноцінний центр керування з 4 розділами:
  1. **User Management:** керування 5 ролями, аватар, скидання 2FA, блокування/активація облікових записів.
  2. **System & Security:** моніторинг невдалих спроб входу, IP-аудит, перевірка працездатності мікросервісів (PostgreSQL, Redis, SeaweedFS, Mailpit).
  3. **Projects Control:** адміністрування робочих просторів, зміна керівників, видалення/архівація.
  4. **Analytics & Velocity:** метрики залогованого часу, швидкість вирішення проблем, розподіл ролей у команді.

### 2.8. Підсистема обліку часу (Time Tracking & Dashboard)
- **Початковий стан:** Повна відсутність трекінгу трудовитрат.
- **Еволюційне рішення:**
  - База даних: сутність `Worklog` та поля `estimated_hours`, `logged_hours` у таблиці `issues`.
  - Інтерфейс: модальне вікно внесення виконаної роботи (`LogWorkModal`), візуальний двоколірний прогрес-бар (співвідношення оцінки та факту) на картках і сторінці задачі.
  - Окремий аналітичний екран `/time-tracking` із сумарними показниками та таблицею логів.

---

## 3. Зведена таблиця архітектурної еволюції

| Модуль / Компонент | Базові вимоги лабораторних | Фактично реалізоване еволюційне рішення |
| :--- | :--- | :--- |
| **Головний екран** | Статична сторінка | Розділення: Guest Landing ↔ Personal Dashboard |
| **Навігація** | Тільки верхній Navbar | Верхній Navbar + Collapsible Sidebar (Rail/Expanded) |
| **Перегляд тікетів** | Тільки вбудоване модальне вікно | Модальне вікно + Standalone Issue Page (`/issues/:id`) |
| **Призначення задач** | Ручний вибір зі списку | Ручний вибір + однокліковий «Assign to Me» |
| **Аватари** | Відсутні | Динамічні аватари, SVG-пресети, градієнтні ініціали |
| **Модель RBAC** | 2 ролі (`ADMIN`, `USER`) | 5 ролей (`ADMIN`, `PM`, `DEV`, `QA`, `USER`) з правами створення тікетів для всіх |
| **Облік часу** | Відсутній | Повноцінний Time Tracking (Worklog, Progress Bar, Dashboard) |
| **Панель адміна** | Проста таблиця користувачів | 4 модулі: Users, Security & Health, Projects, Analytics |
| **Управління спринтами**| Тільки Kanban-дошка | Kanban Board + Agile Backlog & Sprints |

---

## 11. 8-Hour Session Lifecycle, Background Token Refresh & Graceful Expired Modal

* **Problem & UX Diagnosis:** Previously, according to the SDSecurity academic lab spec, the JWT access token was configured with a 15-minute expiration (`15m`). When the access token expired without a dedicated refresh endpoint, API requests started failing with `401 Unauthorized`. The header still displayed the user's name because the client state was not synchronized, and no clear explanation was given to the user.
* **Architectural Enhancements:**
  1. **8-Hour Working Day Expiration:** Configured `JWT_EXPIRES_IN=8h` in the backend environment, ensuring seamless operation for full 8-hour working days without interruptions.
  2. **Automated Refresh Endpoint (`POST /api/v1/auth/refresh`):** Implemented a dedicated token renewal endpoint on the backend. The typed HTTP client (`api/client.ts`) now automatically intercepts `401` errors and uses the long-lived refresh token (`7d`) to obtain a fresh access token in the background and transparently retry failed requests.
  3. **Event-Driven Session Expiry (`bt:unauthorized`):** If the refresh token is also invalid or expired, the client dispatches a global window event, resets `user` to `null` (immediately updating the top bar), and presents a prominent Material 3 **Session Expired Dialog** prompting the engineer to sign in again.

---

## 12. Material 3 Expressive Top App Bar & Sidebar Layout Architecture

* **Problem & UX Diagnosis:** Previous iterations featured duplicate navigation links in both the top bar and sidebar, an awkward bottom-docked collapse button, and a restricted capsule header (`max-w-7xl`) that pushed the logo far from the left screen boundary.
* **Architectural Enhancements:**
  1. **Full-Width Flush Shell (`w-full`):** Removed artificial capsule constraints (`max-w-7xl mx-auto`). The top bar now spans 100% of the viewport width, aligning flush with the left sidebar and utilizing all available screen real estate.
  2. **Clean Separation of Concerns:** Removed duplicated navigation links from the top header. The left Navigation Sidebar is the single source of truth for section navigation (Dashboard, Projects, Kanban, Backlog, Time Tracking, Admin).
  3. **Header Sidebar Toggle:** Placed the sidebar collapse/expand toggle button at the top-left of the header next to the brand logo (plus a companion toggle in the sidebar header), completely eliminating the stranded bottom toggle button.
  4. **Material 3 Profile Dropdown Capsule:** Compact user identity pill in the top-right that expands on click to reveal user details, quick links to Profile & Security, Personal Achievements, Team Timesheet, Admin Center, and Sign Out.

---

## 13. Dual-View Time Tracking Architecture: Team Matrix & Personal Achievements

* **Problem & UX Diagnosis:** Time tracking was previously aggregated at a high level without daily visibility, making it impossible to audit which worker performed effort on which day.
* **Architectural Enhancements:**
  1. **Team Timesheet Matrix (`/time-tracking`):**
     - Powered by the new backend endpoint `GET /api/v1/issues/worklogs/matrix?startDate=...&endDate=...`.
     - Matrix layout: Rows represent team members (with avatars and roles); columns represent each day of the selected period (7d, 14d, current month, previous month).
     - Individual cells display daily hours with color coding (1–4h light green, 4–8h rich green, 8h+ vibrant filled).
     - Includes a `Daily Team Total` footer row and `Grand Total` counter.
  2. **Team Capacity Calendar (`/time-tracking`):**
     - Interactive monthly calendar showing aggregate team effort per day.
     - Clicking any day opens the **Worklog Inspector**, listing all tasks and tickets worked on during that specific date.
  3. **Personal Time & Achievements in User Profile (`/profile?tab=time`):**
     - Tailored specifically for the individual engineer.
     - Tracks **Active Day Streak** (consecutive logging days), monthly targets, and unlockable achievement badges:
       - 🥇 *Consistency Hero* (3+ day streak)
       - ⚡ *Daily 8h Sprinter* (8+ hours logged in one day)
       - 🎯 *Active Contributor* (5+ submitted worklogs)
     - Interactive personal calendar grid with day-by-day task details.

---

## 13. Decoupling Coworker Work Roles (Labels) from System Security RBAC

* **Problem & Domain Diagnosis:** In earlier iterations, coworker job titles (e.g. `QA_ENGINEER`, `DEVELOPER`) were conflated with system security permissions (`SystemRole`). This created two major limitations:
  1. QA Engineers were treated as passive defect reporters rather than active engineering contributors who work on test automation tasks, reproduce bugs, and log working effort against tickets.
  2. Modern engineering organizations require diverse coworker role labels (e.g. `DevOps Engineer`, `Security Engineer`, `Frontend Developer`, `Backend Developer`, `System Architect`, `UI/UX Designer`) that cannot be captured by static hardcoded permission enums.
* **Architectural Enhancements:**
  1. **Dual-Tier Identity Model:**
     - **Coworker Work Label / Job Title (`jobTitle`):** Identifies the coworker's professional domain across avatars, member cards, assignee pickers, and the team timesheet matrix (e.g. `Software Developer`, `DevOps Engineer`, `QA Engineer`, `Security Engineer`).
     - **Granular RBAC System Role (`SystemRole`):** Dictates security permissions and administrative privileges (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `QA_ENGINEER`, `DEVOPS_ENGINEER`, `SECURITY_ENGINEER`, `USER`).
  2. **Equal Task Assignment & Effort Logging:** All engineering roles, including QA and DevOps specialists, are fully eligible assignees across Kanban boards, deep-linked issue pages, and effort logging.
  3. **Visual Roles & Permissions Matrix (`Admin Center -> RBAC & Roles Matrix`):**
     - Transparent capability grid mapping permissions (`issues:create`, `issues:edit`, `issues:status`, `issues:assign`, `worklogs:log`, `worklogs:team`, `sprints:manage`, `projects:manage`, `security:audit`) across all roles.
     - **Custom Role Engine:** Enables administrators to register custom access profiles (e.g. `Release Engineer`, `Security Auditor`, `External Contractor`) and select the exact privileges they encompass.

---

## 14. Priority-First Triage & Advanced Search Capabilities

* **Problem & Domain Diagnosis:** Having both `Priority` and `Severity` caused decision paralysis and conflicting triage expectations between developers and QA teams. Furthermore, searching was fragmented across individual board columns.
* **Architectural Enhancements:**
  1. **Consolidated Priority Model:** Streamlined defect triage to a single actionable dimension: **Priority** (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`). Removed redundant severity fields from modals and attributes cards.
  2. **Advanced Search Screen (`/search`):** Full-text keyword matching across issue keys, titles, descriptions, and comments, with multi-select filters for projects, statuses, priorities, assignees, and sprints.
  3. **Saved Search Presets:** Persistent filter presets synced with the `SavedFilter` backend entity, featured directly on the Personal Dashboard and the search page.
  4. **One-Click Dataset Export:** Built-in CSV export for external reporting and sprint retrospectives.

---

## 15. SeaweedFS S3-Compatible Storage for Evidence & Attachments (Докази дефектів та сховище файлів)

* **Problem & Domain Diagnosis:** У попередніх версіях баг-трекера дефекти обмежувалися лише текстовим описом. У реальних умовах розробки (особливо для QA-інженерів та DevOps) критично важливо додавати докази: скріншоти помилок UI, системні логи (crash logs), дампи стек-трейсів, конфігураційні JSON/YAML файли та PDF-звіти. Зберігання бінарних файлів безпосередньо в реляційній базі даних призводить до швидкої деградації продуктивності I/O та роздуття бекапів PostgreSQL.
* **Architectural Enhancements:**
  1. **Інтеграція розподіленого об'єктного сховища SeaweedFS:**
     - Використано кластер SeaweedFS (`bugtracker-seaweedfs` в Docker): SeaweedFS Master на порту `9333` (ендпоінт призначення FID `/dir/assign`) та SeaweedFS Volume на порту `8080` (ендпоінт зберігання та стрімінгу `http://localhost:8080/${fid}`).
     - Створено бекенд-сервіс `SeaweedFsService` (`backend/src/modules/issues/services/seaweedfs.service.ts`), який інкапсулює виділення унікальних `fid`, multipart-upload бінарного контенту та видалення з кластера.
  2. **Сутність `Attachment` (`issue_attachments`):**
     - Зв'язує кожне вкладення з батьківським тікетом (`issue_id`), зберігає оригінальну назву файлу (`filename`), розмір (`fileSize`), MIME-тип (`mimeType`), SeaweedFS FID (`fid`), прямий URL (`url`) та автора завантаження (`uploader_id`).
  3. **RESTful API для вкладень:**
     - `POST /api/v1/issues/:id/attachments` з валідацією `FileInterceptor` та лімітом 25 МБ.
     - `GET /api/v1/issues/:id/attachments` для отримання списку доказів.
     - `DELETE /api/v1/issues/:id/attachments/:attachmentId` для видалення.
  4. **Material 3 Expressive UI для доказів на сторінці тікета (`/issues/:id`):**
     - **Зона Drag & Drop:** Інтерактивна зона завантаження файлів з анімацією перетягування та індикатором прогресу SeaweedFS.
     - **Адаптивна сітка файлів:** Прев'ю-мініатюри для графічних форматів (PNG, JPG, GIF, WebP), іконки документів для логів/PDF, відображення розміру (KB/MB) та імені автора.
     - **Full-Screen Lightbox Modal:** Модальне вікно перегляду скріншотів на весь екран із затемненням фону, кнопкою завантаження оригінального файлу та швидким закриттям.

---

## 16. WebSocket Real-Time Gateway & Live Collaboration (Співпраця в реальному часі)

* **Problem & Domain Diagnosis:** Традиційні баг-трекери вимагають ручного оновлення сторінки (F5) або неефективного короткого опитування (short polling), щоб побачити, що колега взяв задачу в роботу, змінив статус чи залишив коментар. Це спричиняє конфлікти одночасного редагування та затримку комунікації.
* **Architectural Enhancements:**
  1. **NestJS WebSocket Gateway (`EventsGateway`):**
     - Реалізовано шлюз Socket.IO на бекенді (`backend/src/modules/events/events.gateway.ts`) з ізольованим простором імен (`/events`).
     - Підтримка кімнат проєкту (`project_${projectId}`) та тікетів (`issue_${issueId}`).
  2. **Подійна синхронізація (Event Broadcasting):**
     - `issue:created` — автоматична поява нової картки на канбан-дошці всіх учасників проєкту.
     - `issue:updated` — миттєве оновлення статусу, спринту або призначеного розробника без перезавантаження.
     - `issue:deleted` — автоматичне видалення картки з UI.
     - `worklog:created` — синхронізація витраченого часу.
     - `comment:created` — оновлення треду обговорення в режимі реального часу.
     - `attachment:uploaded` — негайне відображення нових скріншотів та логів.
  3. **Live Presence Indicators (Присутність користувачів):**
     - Подія `presence:viewing` передає інформацію про те, хто з інженерів зараз переглядає даний тікет, відображаючи живий бейдж присутності на сторінці деталізації.

---

## 17. Agile Analytics, Sprint Burndown & Velocity Tracking (Agile-аналітика та графіки згоряння)

* **Problem & Domain Diagnosis:** Без візуальних аналітичних інструментів керівники проєктів, Scrum-майстри та інженери не мають змоги оцінити швидкість команди (velocity), ризик зриву дедлайну спринту або обсяг робіт, що залишилися.
* **Architectural Enhancements:**
  1. **Interactive SVG Sprint Burndown Curve (`SprintAnalyticsModal.tsx`):**
     - **Ideal Burndown Line:** Лінійна орієнтирна траєкторія від загальної оцінки спринту (`totalScopeHours`) до нуля на дату завершення ітерації.
     - **Actual Effort Burned Curve:** Жива крива фактичного залишку робіт на основі закритих завдань та зареєстрованих робочих годин.
     - Інтерактивні маркери точок, підказки часу та адаптивна координатна сітка SVG.
  2. **Team Velocity Comparison Chart:**
     - Стовпчаста діаграма швидкості команди, що порівнює заплановані та фактично виконані години за послідовними спринтами.
     - Автоматичний розрахунок середньої швидкості команди (`Avg. Velocity hrs/sprint`).
  3. **Експорт звітів для стейкхолдерів:**
     - Однокліковий експорт структурованого звіту спринту у форматі CSV (`Export CSV`).
     - Адаптований стиль для друку та збереження у PDF (`Print Summary`).
