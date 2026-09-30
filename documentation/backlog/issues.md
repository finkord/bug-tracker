this vibecoded project grown big as hell
на цей момент багато які функції мені не подобаються як реалізовані
агенти провели погану роботу 

Потрібно зрозуміти які елементи системи дійсно робочі а які зовсім не функціональні

Наприклад система автентифікації
система доступів через ролі (rbac)
я не можу зрозуміти чи дійсно добре реалізовані ці системи
про системи канбан, аджай, створення груп, профіль користувача, адмін панель, тайм менеджмент, пошук я взагалі мовчу
зовсім не зрозуміло чи ці системи можуть витримати навантаження більше декількох користувачів і взагалі бути корисними 

[troubleshooting](slashCommand;troubleshooting) 


Проведено технічний аудит кодової бази BugTracker (як NestJS бекенду, так і React фронтенду).

Основний висновок: проєкт візуально виглядає готовим і багатим на фічі (Material Design 3, Swagger, тести), але архітектурно в ньому є серйозні проблеми «вайбкодингу» — імітація складних ентерпрайз-патернів, виконання важких операцій у браузері замість сервера, N+1 SQL-каскади та небезпечні дірки в ізоляції даних.

Нижче наведено детальний аналіз кожної підсистеми з класифікацією: що дійсно працює, що є фасадом або зламано, і чому система не витримає реального навантаження більше 2–5 користувачів.

1. Система автентифікації та сесій (Auth)
Поточний стан: Працює на рівні одного інстансу та локального тестування, але не витримає горизонтального масштабування і навантаження.

Що реально працює:

Базовий цикл реєстрації та активації користувача через пошту (

local-auth.service.ts
).
Хешування паролів через Argon2id (

local-auth.service.ts
).
Двоетапна автентифікація (TOTP 2FA) з перевіркою секретів через speakeasy (

two-factor-auth.service.ts
).
Збереження токенів у httpOnly куках (

auth.controller.ts
) та інвалідація сесій через tokenVersion.
Критичні проблеми та вузькі місця:

Відсутність кешування користувача у JWT-стратегії: У файлі 

jwt.strategy.ts
 на кожен вхідний HTTP-запит викликається this.usersService.findById(payload.sub) до бази даних PostgreSQL. Замість швидкої перевірки підпису токена або зчитування користувача з Redis, база бомбардується запитами SELECT FROM users. 50 паралельних запитів від користувачів означають 50 окремих SQL-запитів лише для перевірки сесії.
In-Memory сховища замість Redis: У документації заявлено використання Redis, проте одноразові коди обміну OAuth зберігаються у звичайному new Map() у процесі Node.js (

oauth-code-store.service.ts
). Якщо бекенд запустити у кількох репліках (контейнерах), OAuth просто перестане працювати (404 Not Found на /auth/oauth/exchange).
Argon2id блокує Event Loop при навантаженні: Параметри хешування встановлені на memoryCost: 65536 (64 МБ) та timeCost: 3. При одночасному вході декількох десятків користувачів пул потоків libuv буде перевантажений, що призведе до затримки обробки решти HTTP-запитів.
Блокування акаунтів через базу даних: Фіксація невдалих спроб входу (failedLoginAttempts) і блокування пишуться напряму в таблицю users (

local-auth.service.ts
). При розподіленій атаці перебору паролів це призведе до блокування рядків у базі даних (Row Lock contention) замість швидкого sliding window rate limit у Redis.
Витік JWT через URL: У 

jwt.strategy.ts
 дозволено ExtractJwt.fromUrlQueryParameter('token'), що дозволяє передавати чутливі токени в URL, звідки вони потрапляють у логи Nginx/проксі та історію браузера.
2. Система контролю доступу (RBAC)
Поточний стан: Концептуально спроєктована правильно (Jira-подібна схема з проектними ролями, схемами прав та групами), але технічно реалізована неефективно і містить критичні дірки в безпеці.

Що реально працює:

Базові системні ролі (ADMIN, USER) контролюються через 

roles.guard.ts
.
Створення груп, проектних ролей, схем дозволів та грантів у базі даних.
Початкова ініціалізація стандартних прав через 

system-init.service.ts
.
Критичні проблеми та вузькі місця:

Катастрофічний каскад N+1 запитів у 

permission-evaluator.service.ts
: Метод getEffectivePermissions(userId, projectId) проходить циклом по всьому масиву ProjectPermission (15–20 прав) і для кожного окремого права викликає this.hasPermission(). Кожен такий виклик окремо робить запити до User, UserGroup, Project, PermissionScheme, PermissionGrant та ProjectRoleActor. У результаті один виклик сторінки виконує понад 100 послідовних SQL-запитів до PostgreSQL, не використовуючи жодного кешу чи JOIN-агрегації.
Помилковий доступ за замовчуванням (Fail-Open): У 

project-permission.guard.ts
 є код:
typescript
if (!projectId) {
  return true;
}
Якщо гарду не вдалося розпарсити projectId (наприклад, змінено ім'я параметра або шлях), запит пропускається без перевірки прав.
Відсутність ізоляції проектів у списку: Ендпоінт GET /projects (

projects.service.ts
) повертає абсолютно всі проекти системи будь-якому автентифікованому користувачу. Немає фільтрації за наявністю права BROWSE_PROJECTS або членством у проекті.
Незв'язаність створення проекту з RBAC: При створенні проекту через 

projects.service.ts
 новому проекту не призначається схема прав за замовчуванням (permissionSchemeId залишається null), і творець проекту не додається автоматично як Project Role Actor.
3. Канбан та Agile (Спринти та Задачі)
Поточний стан: Інтерфейс канбану придатний для використання, але зв'язок зі спринтами та реальним часом (WebSockets) містить критичні архітектурні дефекти.

Що реально працює:

Перетягування карток (Drag-and-Drop) на дошці (

KanbanBoardPage.tsx
).
Зміна статусів задач через FSM-переходи (

issue-core.service.ts
).
Створення коментарів, зв'язків (blocks, duplicates) та файлових вкладень через SeaweedFS.
Критичні дефекти:

Відсутність реляційного зв'язку між Issue та Sprint: В сутності 

Issue
 поле sprint — це простий рядок varchar(100):
typescript
@Column({ type: 'varchar', length: 100, nullable: true })
sprint: string | null;
Замість зовнішнього ключа sprintId сутність посилається на ім'я спринту. Якщо в модулі спринтів перейменувати спринт з «Sprint 1» на «Sprint 1 - Release», модуль оновлює тільки таблицю sprints. Усі задачі цього спринту залишаються зі старим текстом і безповоротно випадають з беклогу спринту.
Глобальний витік даних через WebSocket (

events.gateway.ts
):
WebSocket шлюз не має жодної автентифікації (cors: { origin: '*' }, немає JWT-гарда при підключенні). Будь-хто може підключитися ззовні до /events.
При оновленні задачі викликається:
typescript
this.server.to(`project_${issue.projectId}`).emit('issue:updated', issue);
this.server.emit('issue:updated', issue); // <-- Відправка ВСІМ підключеним клієнтам у світі!
Усі події задач транслюються взагалі всім клієнтам без огляду на права проекту чи IssueSecurityLevel. Конфіденційні задачі миттєво витікають на будь-який відкритий браузер.
Відсутність розподіленого WebSocket: Використовується вбудований memory-adapter Socket.IO замість @socket.io/redis-adapter. При запуску більше 1 інстансу синхронізація в реальному часі працювати не буде.
4. Пошук та збережені фільтри (Search & JQL)
Поточний стан: Найбільш показовий приклад «вайбкодингу». Повноцінного пошуку на бекенді немає.

Що реально відбувається:
Клієнтський парсинг замість серверного: На сторінці 

AdvancedSearchPage.tsx
 фронтенд робить виклик useIssuesQuery() без фільтрів, тобто завантажує всі існуючі задачі системи в оперативну пам'ять браузера. Далі JQL парситься і фільтрується в браузері через функцію evaluateJql(issues, parsed) (

AdvancedSearchPage.tsx
). Якщо в системі буде 5,000 або 50,000 задач:
Браузер зависне або вилетить через нестачу пам'яті.
Повністю нівелюються перевірки прав доступу на бекенді.
Ігнорування бекенд-сутності SavedFilter: На бекенді створено таблицю saved_filters і контролер у модулі users, але фронтенд 

AdvancedSearchPage.tsx
 зберігає фільтри в localStorage браузера.
Full Table Scan у базі: Пошук у 

issue-core.service.ts
 використовує to_tsvector(...) @@ plainto_tsquery(...), але в PostgreSQL не створено відповідного GIN-індексу. Кожен пошуковий запит змушує базу сканувати всю таблицю цілком.
5. Облік часу (Time Management & Worklogs)
Поточний стан: Базовий функціонал працює для одного розробника, але містить потенційне падіння сервера через OOM (Out Of Memory) і стан гонитви.

Що реально працює:

Додавання запису про витрачений час до задачі (

issue-worklog.service.ts
).
Відображення тижневого таймшиту на фронтенді (

TimeTrackingPage.tsx
).
Критичні проблеми:

Out-of-Memory у getWorklogStats: У 

issue-worklog.service.ts
 для підрахунку статистики виконується:
typescript
const allLogs = await this.worklogRepository
  .createQueryBuilder('worklog')
  .leftJoinAndSelect('worklog.issue', 'issue')
  .leftJoinAndSelect('issue.project', 'project')
  .leftJoinAndSelect('worklog.user', 'user')
  .getMany();
Запит затягує всі ворклогі в історії системи в пам'ять Node.js і рахує їх циклом for (const log of allLogs). При 20,000–50,000 записів процес Node.js впаде з JavaScript heap out of memory. Замість цього мають використовуватись звичайні SQL-агрегації SUM(timeSpentHours) та GROUP BY.
Стан гонитви (Race Condition): Поле issue.loggedHours перераховується через читання старого значення в JS та виклик issueRepository.save(issue). При паралельному записі двома розробниками один запис перезапише інший без урахування попереднього додавання. Потрібен атомарний SQL: UPDATE issues SET logged_hours = logged_hours + :val.
6. Створення груп, Профіль користувача, Адмін-панель
Групи: Працюють виключно як глобальні списки доступу (LDAP-style groups). Концепції «Scrum-команд» (з визначенням місткості спринту, ролей всередині команди та прив'язки до дощок) у системі немає.
Профіль користувача: Зміна імені та посади працює. Завантаження аватара частково фіктивне (приймає зовнішній URL або фіксовані пресети, хоча SeaweedFS підключений для вкладень задач).
Налаштування користувача (

PreferencesPage.tsx
): Працюють виключно в localStorage клієнта, не синхронізуються між пристроями.
Адмін-панель: Вкладка аудиту безпеки (

AdminSecurityLogsTab.tsx
) і керування користувачами повністю функціональні, але статистика дашборду страждає тими самими неоптимізованими підрахунками без кешування.
Підсумкова таблиця надійності підсистем
Підсистема	Робочий стан	Масштабованість (>5 користувачів)	Головний дефект / загроза
Auth (Логін, 2FA, Куки)	Працює	Середня	Запит до бази на кожен HTTP-запит у JWT Guard; in-memory OAuth коди
RBAC (Схеми прав, Ролі)	Частково	Дуже низька	N+1 каскад (~100 SQL-запитів на сторінку); відсутність перевірки в GET /projects
Канбан-дошка	Працює	Середня	Немає оптимістичного блокування при паралельному русі карток
Agile (Спринти)	Зламано концептуально	Низька	Issue.sprint — це string замість foreign key до таблиці sprints
Real-time (WebSockets)	Працює (локально)	Непридатний до продакшну	Немає автентифікації; витік усіх задач усім підключеним клієнтам
Пошук (Search & JQL)	Імітація (фасад)	Впаде при >1000 задач	Всі задачі вантажаться в браузер, фільтрація через клієнтський JS
Тайм-менеджмент	Працює з багами	Впаде по OOM	getWorklogStats завантажує всю таблицю в оперативну пам'ять; race condition
Групи користувачів	Працює	Добра	Це системні directory-групи, а не Agile-команди
Адмін-панель	Працює	Середня	Статистика рахується «в лоб» без кешу














кожну з наведених проблеми виведи списком як задачу - опиши яка виникла проблема, так як це роблять для програміста коли дають завдання



Нижче наведено технічний беклог задач (engineering tickets), оформлений за стандартами розробки для передачі програмістам. Кожна задача містить опис поточної дефектної поведінки, технічні деталі проблеми, файли для змін та критерії готовності (Acceptance Criteria).

TASK-01: Fix Issue-Sprint Association — міграція з вільного текстового поля на реляційний Foreign Key
Тип: Bug / Architecture Refactoring
Пріоритет: Blocker / Critical
Компонент: Backend (issues, sprints), Frontend (kanban, agile)
Файли:


issue.entity.ts


sprint.entity.ts


sprints.service.ts


issue-core.service.ts
Опис проблеми
У сутності 

Issue
 зв'язок зі спринтом реалізовано як простий рядок sprint: string | null (varchar(100)), тоді як у модулі спринтів існує окрема таблиця sprints з автоінкрементним id. У 

sprint.entity.ts
 оголошено псевдо-зв'язок @OneToMany('Issue', 'sprint'), який не підтримується зовнішнім ключем у БД. Це призводить до наступних наслідків:

Якщо перейменувати спринт (через updateSprint), оновлюється лише поле name в таблиці sprints. Усі задачі зберігають старе текстове значення і безповоротно зникають з канбан-дошки спринту.
При видаленні або завершенні спринту запити оновлюють задачі за sprint = :sprintName, що є вразливим до збігу назв або пробілів.
Вимоги до реалізації (Acceptance Criteria)
Додати в таблицю issues колонку sprint_id: number | null з зовнішнім ключем @ManyToOne(() => Sprint, { nullable: true, onDelete: 'SET NULL' }) та індексом.
Створити міграцію бази даних TypeORM: перенести існуючі зв'язки за назвою спринту у sprint_id, після чого видалити або зробити deprecated текстову колонку sprint.
Оновити 

sprints.service.ts
 та 

issue-core.service.ts
 для роботи виключно через sprintId.
Зберегти зворотну сумісність DTO при видачі об'єкта задачі (повертати вкладений об'єкт sprint: { id, name, status }).
TASK-02: Secure EventsGateway — автентифікація WebSocket та усунення витоку даних
Тип: Security Vulnerability / Bug
Пріоритет: Blocker / Critical
Компонент: Backend (events), Frontend (api/socket.ts)
Файли:


events.gateway.ts


socket.ts
Опис проблеми
Шлюз 

EventsGateway
 сконфігуровано з cors: { origin: '*' } і не має перевірки автентифікації клієнта при підключенні (handleConnection). Будь-який клієнт з мережі може підключитися до сокетів.
У методах трансляції подій (

events.gateway.ts:101
, 

109
, 

117
, 

127
) після відправки повідомлення в кімнату проекту викликається глобальний еміт this.server.emit(...). Це транслює всі створені, змінені та видалені задачі, коментарі та ворклогі всім підключеним клієнтам глобально, нівелюючи проектну ізоляцію та IssueSecurityLevel.
Використовується локальний in-memory адаптер Socket.IO, через що горизонтальне масштабування бекенду неможливе.
Вимоги до реалізації (Acceptance Criteria)
Реалізувати перевірку JWT у handleConnection (витягувати токен з handshake.auth.token або cookies). Якщо токен недійсний чи відсутній — примусово виконувати client.disconnect(true).
Усунути всі виклики this.server.emit(...) без вказання кімнати. Події повинні надсилатися виключно в this.server.to('project_' + projectId).
При виклику handleJoinProject перевіряти наявність у користувача права BROWSE_PROJECTS через 

PermissionEvaluatorService
.
Підключити @socket.io/redis-adapter через існуючий інстанс Redis.
TASK-03: Eliminate N+1 Query Cascade in RBAC Permission Evaluation & Add Caching
Тип: Performance / Architecture
Пріоритет: High
Компонент: Backend (rbac)
Файли:


permission-evaluator.service.ts


project-permission.guard.ts
Опис проблеми
Метод getEffectivePermissions(userId, projectId) у 

permission-evaluator.service.ts
 виконує циклічний виклик this.hasPermission() для кожного елемента з переліку ProjectPermission:

typescript
for (const perm of allPermissions) {
  result[perm] = await this.hasPermission({ userId, projectId, permission: perm });
}
Кожен виклик hasPermission незалежно робить від 5 до 7 запитів до БД (пошук користувача, перевірка адмін-групи, пошук проекту, пошук груп користувача, схеми прав, грантів та проектних ролей). Сумарно на кожен запит сторінки виконується 100–120 послідовних SQL-запитів. При 10 одночасних користувачах база даних стає пляшковим горлом.

Вимоги до реалізації (Acceptance Criteria)
Переписати getEffectivePermissions на одноразову вибірку контексту:
Одним запитом завантажити: системну роль користувача, список його groupIds, дані проекту (leadId, permissionSchemeId), список його projectRoleIds у даному проекті та всі гранти схеми проекту.
Обчислювати булеві прапорці для всіх дозволів у пам'яті за $O(1)$ без повторних звернень до БД.
Додати кешування результату в Redis з ключем rbac:user:${userId}:project:${projectId} і TTL 5–10 хвилин.
Додати інвалідацію кешу при зміні схеми прав проекту або призначенні акторів у ролі (

rbac.service.ts
).
TASK-04: Fix Fail-Open Guard & Enforce Multi-Tenant Project Isolation
Тип: Security Bug / Authorization
Пріоритет: High
Компонент: Backend (projects, rbac)
Файли:


project-permission.guard.ts


projects.controller.ts


projects.service.ts
Опис проблеми
У 

project-permission.guard.ts
 реалізовано логіку Fail-Open: якщо projectId не вдалося зчитати з body чи route params, гард повертає return true. Це відкриває доступ до ресурсів у разі зміни маршрутизації або некоректних параметрів.
Ендпоінт GET /projects викликає projectsService.findAll(), який повертає повний список проектів у системі без фільтрації прав. Будь-який звичайний користувач бачить усі проекти, їх ключі та статистику, навіть якщо він не має права BROWSE_PROJECTS або не є учасником проекту.
Вимоги до реалізації (Acceptance Criteria)
У 

project-permission.guard.ts
 замінити return true на викидання ForbiddenException('Unable to resolve project context for permission check'), якщо для маршруту задано обов'язкове право через @RequireProjectPermission().
Оновити метод findAll() у 

projects.service.ts
: приймати об'єкт поточного користувача currentUser: User.
Додати у запит projects.service.ts фільтрацію: якщо користувач не є SystemRole.ADMIN, повертати лише ті проекти, де користувач є лідом або призначений на проектну роль / глобальну групу з грантом BROWSE_PROJECTS.
TASK-05: Remove DB Query from JWT Strategy & Migrate OAuth Store to Redis
Тип: Performance & Scalability
Пріоритет: High
Компонент: Backend (auth)
Файли:


jwt.strategy.ts


oauth-code-store.service.ts


local-auth.service.ts
Опис проблеми
Метод JwtStrategy.validate() (

jwt.strategy.ts:48
) виконує await this.usersService.findById(payload.sub) на кожен HTTP-запит з токеном. Це створює непотрібне навантаження на PostgreSQL.


OAuthCodeStoreService
 зберігає коди обміну в оперативній пам'яті екземпляра програми (Map<string, StoredCode>). При горизонтальному масштабуванні бекенду (2+ контейнери) клієнт отримує 404 помилку при спробі обміну коду, якщо запит потрапляє на сусідній інстанс.


ExtractJwt.fromUrlQueryParameter('token')
 дозволяє передачу JWT у query-параметрах, що порушує OWASP standards.
Вимоги до реалізації (Acceptance Criteria)
Кешувати профіль користувача та його tokenVersion у Redis на час життя токена (з інвалідацією при блокуванні користувача чи зміні пароля/ролі). Звертатися до БД у JwtStrategy лише у разі Cache Miss.
Перевести 

OAuthCodeStoreService
 на Redis команду SETEX oauth_code:<hash> 60 <json> та GETDEL (атомарне отримання з видаленням).
Видалити ExtractJwt.fromUrlQueryParameter('token') з конфігурації JwtStrategy. Токени приймати виключно через cookie або заголовок Authorization: Bearer.
TASK-06: Move JQL Search & Filtering to Backend and Connect Saved Filters
Тип: Bug / Architecture Refactoring
Пріоритет: High
Компонент: Full-Stack (search, users, issues)
Файли:


AdvancedSearchPage.tsx


issue-core.service.ts


saved-filter.entity.ts
Опис проблеми
На сторінці 

AdvancedSearchPage.tsx
 викликається useIssuesQuery() без параметрів фільтрації. Фронтенд затягує повний масив усіх задач у пам'ять браузера, після чого викликає клієнтський AST-парсер evaluateJql(issues, parsed). Це призводить до OOM та зависання сторінки при зростанні бази задач і повністю ігнорує RBAC.
На бекенді вже створено сутність SavedFilter і контролери збереження фільтрів, проте фронтенд записує збережені фільтри в localStorage браузера (

AdvancedSearchPage.tsx:94
).
Пошук по title та description у 

issue-core.service.ts
 виконує операцію to_tsvector без наявності GIN-індексу в базі даних.
Вимоги до реалізації (Acceptance Criteria)
Реалізувати серверний ендпоінт GET /issues/search (або розширити GET /issues), який приймає критерії фільтрації та параметри пагінації (page, limit).
Перевести пошук на формування умов Where у TypeORM QueryBuilder з обов'язковим LIMIT 50.
Додати в базу даних міграцію зі створенням GIN-індексу для повнотекстового пошуку:
sql
CREATE INDEX idx_issues_fulltext ON issues USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));
Переписати 

AdvancedSearchPage.tsx
 для надсилання пошукових запитів на сервер із Debounce (300 мс) та підключити роботу зі збереженими фільтрами через API GET /users/me/filters та POST /users/me/filters.
TASK-07: Fix Worklog Stats OOM & Concurrency Race Condition
Тип: Bug / Performance
Пріоритет: Medium / High
Компонент: Backend (issues/worklogs)
Файли:


issue-worklog.service.ts


issue-worklog.service.ts (Stats)
Опис проблеми
Метод getWorklogStats() (

issue-worklog.service.ts:213
) завантажує всю історію ворклогів компанії в пам'ять Node.js через .getMany() і підраховує години циклом for (const log of allLogs). Це гарантований Out-of-Memory краш процесу в продакшні при великій кількості записів.
При логуванні часу у методі logWork():
typescript
const currentLogged = issue.loggedHours || 0;
issue.loggedHours = Number((currentLogged + dto.timeSpentHours).toFixed(2));
await this.issueRepository.save(issue);
Операція читання і запису не є атомарною і не обгорнута у транзакцію з блокуванням (Pessimistic Lock). Одночасне внесення годин двома користувачами призводить до втрати даних одного з них.
Вимоги до реалізації (Acceptance Criteria)
Переписати getWorklogStats() на чисті SQL-агрегації в базі даних:
Використати SUM(worklog.time_spent_hours) з фільтрами дат date_logged = CURRENT_DATE та created_at >= NOW() - INTERVAL '7 days'.
Використати GROUP BY project.id та GROUP BY user.id на стороні СУБД.
Оновлення issue.loggedHours у logWork виконувати атомарним SQL-запитом у межах транзакції створення запису ворклогу:
typescript
await queryRunner.manager
  .createQueryBuilder()
  .update(Issue)
  .set({ loggedHours: () => 'logged_hours + :hours' })
  .setParameter('hours', dto.timeSpentHours)
  .where('id = :id', { id: issueId })
  .execute();
