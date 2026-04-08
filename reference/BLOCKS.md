# Figma Blocks — Sumsub Dashboard UI Kit

Библиотека готовых экранных шаблонов. Каждый блок — самодостаточный Plugin API JS,
использующий компоненты и переменные из нашей дизайн-системы.

## Как использовать

1. Прочитать `blocks/helpers.js`
2. Прочитать нужный блок из `blocks/*.js`
3. Подставить параметры в верхней секции блока
4. Запустить через `mcp__figma__use_figma` — код `helpers.js` + код блока (конкатенация)

## Доступные блоки

| Блок | Файл | Когда использовать |
|---|---|---|
| **Table Page** | `blocks/table-page.js` | Список сущностей: applicants, transactions, cases |
| **Detail Drawer** | `blocks/detail-drawer.js` | Детальная панель справа поверх таблицы |
| **Form Modal** | `blocks/form-modal.js` | Создание/редактирование через модальное окно |

## Параметры блоков

### table-page.js
```
PAGE_TITLE    — заголовок страницы (h4-xl semibold)
PAGE_SUBTITLE — подзаголовок (body-m regular), "" = скрыть
CTA_LABEL     — текст кнопки CTA, "" = скрыть
TAB_LABELS    — массив табов, [] = скрыть
FRAME_NAME    — имя фрейма в Figma
```

### detail-drawer.js
```
PAGE_TITLE      — заголовок страницы позади
DRAWER_TITLE    — заголовок drawer
DRAWER_SUBTITLE — подзаголовок drawer
DRAWER_SIZE     — "Narrow" | "Wide"
FRAME_NAME      — имя фрейма в Figma
```

### form-modal.js
```
PAGE_TITLE  — заголовок страницы позади
MODAL_TITLE — заголовок модала
MODAL_SIZE  — "Small" | "Medium" | "Large"
FRAME_NAME  — имя фрейма в Figma
```

## Структура экрана (все блоки)

```
[1440 × 900]
├── Sidebar (Organisms DS, *Sidebar*)
└── Main
    ├── Header (Organisms DS, *Header*)
    └── Content
        ├── Title Row
        │   ├── Page Title (semibold/h4-xl + semantic/text/neutral/strong)
        │   └── CTA Button (*Button*, Primary, Medium)
        ├── Tabs (*Tab Basic* Redesign)
        └── Table (*Table Starter* Redesign) / Drawer / Modal
```

## Переменные и стили

Все кастомные TEXT и FRAME ноды используют **semantic переменные**:
- `VARS.*` → `figma.variables.importVariableByKeyAsync(key)`
- `TEXT_STYLES.*` → `figma.importStyleByKeyAsync(key)` + `setTextStyleIdAsync`
- Никогда не хардкодить hex!

## Известные gotchas (Plugin API)

- **Всегда `appendChild` перед `layoutSizingHorizontal/Vertical`** — эти свойства требуют, чтобы нода уже была внутри auto-layout родителя.
- **Не оборачивать код в IIFE** — `mcp__figma__use_figma` не awaits Promise, возвращённый из `(async () => {...})()`. Код должен быть на верхнем уровне с `await` напрямую.
- **`primaryAxisSizingMode` / `counterAxisSizingMode`** принимают `"FIXED"` | `"AUTO"`, не `"HUG"`.
- **Tab Basic** — это single component (`importComponentByKeyAsync`), не component set.
- **Текст кнопки** — устанавливать через `setInstanceText(btn, "Button", label)` после `appendChild`.
- **Абсолютное позиционирование** (scrim, modal, drawer) — после `appendChild` в auto-layout фрейм установить `node.layoutPositioning = "ABSOLUTE"`, иначе нода встанет в поток.
- **Тинт/scrim всегда на полную ширину main** — `resize(SCREEN_W - SIDEBAR_W, SCREEN_H)`, x=SIDEBAR_W. Не обрезать по ширине drawer или modal.
- **Не использовать Redesign components** (`MDOnxIRFpmo1PApWWULLiH`) — только Base components и Organisms.

## Добавить новый блок

1. Создать `blocks/my-block.js`
2. Параметры — в верхней секции `// ─── Parameters`
3. Код — `(async () => { ... })();`
4. Использовать только функции из `helpers.js`: `makeFrame`, `makeText`, `makeInstance`, `bindFill`, `bindStroke`
5. Добавить строку в эту таблицу

## Roadmap

- [ ] `stats-overview.js` — карточки с метриками + графики
- [ ] `settings-page.js` — страница настроек с секциями
- [ ] `onboarding-flow.js` — многошаговый онбординг
- [ ] `empty-state-page.js` — страница с empty state
- [ ] `confirmation-modal.js` — диалог подтверждения деструктивного действия
