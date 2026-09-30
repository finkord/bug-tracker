# [SPEC] План реалізації завдань UX-02, UX-03, UX-04 (Design System & UI Components)

> **Завдання:** 
> - **UX-02:** Єдина дизайн-система (M3 Expressive) — математична гармонія HCT, 5 рівнів поверхонь, правила $\Delta\text{Tone} \ge 60$.
> - **UX-03:** Уніфікований каталог палітр (Color Palettes Catalog & Theme Presets) — кураторські палітри, підтримка кольорових тем без випадкової генерації.
> - **UX-04:** Базова бібліотека спільних компонентів (UI Component Library) — створення відсутніх і стандартизація наявних компонентів (`Button`, `Input`, `Select`, `Badge`, `Card`, `Modal`, `DropdownMenu`, `Tabs`, `Tooltip`).

---

## 1. Поточний стан (Current State Assessment)

1. **UX-02 (M3 Tokens & CSS Variables):**
   - У `frontend/src/index.css` створено базові змінні для Light / Dark mode: `--md-sys-color-surface-container-*`, `--md-sys-color-primary`, `--md-sys-color-priority-*`.
   - Деякі компоненти все ще використовують сирі стилі або не мають єдиного імпорту через `@/components/ui`.

2. **UX-03 (Color Palettes Catalog):**
   - Теми перемикаються між `light` та `dark` у `ThemeContext.tsx`, проте відсутній задокументований каталог палітр з точними значеннями HCT/Hex для ролей та розширених кольорових пресетів (Default Google Blue, Emerald Green, Indigo Purple, Coral Amber).

3. **UX-04 (Shared Component Library):**
   - Наявні компоненти в `frontend/src/components/ui/`: `Button.tsx`, `Badge.tsx`, `Card.tsx`, `Dropdown.tsx`, `Input.tsx`, `Modal.tsx`, `Tooltip.tsx`.
   - **Прогалини:**
     - Відсутній компонент `Select.tsx` (вибір статусів, пріоритетів, виконавців реалізовувався через сирі `<select>` або кастомні фрагменти).
     - Відсутній компонент `Tabs.tsx` (для сторінок Profile, Admin Center, Sprint Analytics).
     - `index.ts` не експортує всі компоненти або експортує лише базову частину.

---

## 2. План реалізації (Action Steps)

### Крок 1: Каталог кольорових палітр (UX-03)
- Створити документ `info/design/color_palettes_catalog.md` з чітким описом усіх M3-тонів, HCT значень та формул контрастності.
- Забезпечити підтримку вибору акцентних палітр або кураторських кольорів для користувацьких налаштувань.

### Крок 2: Розширення та стандартизація компонентів `frontend/src/components/ui/` (UX-04)
1. **`Select.tsx`**: Створити доступний селект на базі Radix UI / Accessible primitives з підтримкою іконок, бейджів, пошуку та станів помилки/інвалідації.
2. **`Tabs.tsx`**: Створити компонент вкладок на базі Radix UI Tabs для уніфікації навігації у складних формах та панелях.
3. **`Button.tsx`**: Перевірити відповідність розмірів (`xs`, `sm`, `md`, `lg`, `icon-sm`, `icon-md`), підтримку фокусу, станів завантаження (`isLoading`) та `whitespace-nowrap`.
4. **`Badge.tsx`**: Перевірити відповідність усіх статусів тікетів (`open`, `in-progress`, `review`, `resolved`, `closed`) та пріоритетів (`low`, `medium`, `high`, `critical`).
5. **`Card.tsx` / `Modal.tsx` / `Tooltip.tsx` / `Dropdown.tsx`**: Переконатися у повній відповідності токенам `--md-sys-color-*`.
6. **`index.ts`**: Оновити публічний експорт усіх компонентів.

### Крок 3: Правила використання компонентів (UX-02 & UX-04)
- Оновити документацію в `info/instructions/design/component_usage_guidelines.md` з прикладами коду для розробників та AI-агентів.
- Додати валідацію через `npm run build` для підтвердження відсутності TypeScript помилок.

---

## 3. Очікуваний результат (Acceptance Criteria)
- [x] Повний каталог палітр у `info/design/color_palettes_catalog.md`.
- [x] Повний набір перевірених UI-компонентів у `frontend/src/components/ui/` (`Button`, `Input`, `Select`, `Badge`, `Card`, `Modal`, `Dropdown`, `Tabs`, `Tooltip`).
- [x] Всі UI компоненти строго споживають системні CSS-змінні M3 Expressive без локальних колірних «костилів».
- [x] `npm run build` проходить без жодних помилок.
