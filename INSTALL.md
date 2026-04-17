# Установка Sumsub Design Skills

Пошаговая инструкция для дизайнеров. Весь процесс — 5–10 минут.

## Что должно быть установлено заранее

1. **Claude Desktop** — https://claude.ai/download
2. **Figma Desktop** (не web-версия!) — https://www.figma.com/downloads/

> Web-версия Figma не поддерживает MCP-сервер. Нужен именно Desktop.

---

## Шаг 1. Включи Figma MCP-сервер

1. Открой **Figma Desktop**
2. В меню **Figma → Preferences** (на Mac) или **Edit → Preferences** (Windows)
3. Найди пункт **Enable Dev Mode MCP Server** и включи его
4. Figma покажет зелёное уведомление «MCP server is running on port 3845»

Figma должна оставаться открытой, пока ты пользуешься скиллами.

---

## Шаг 2. Подключи Figma к Claude Desktop

### На macOS

1. Открой **Claude Desktop**
2. **Claude → Settings** (или `⌘ ,`)
3. Вкладка **Developer** → **Edit Config**
4. Откроется файл `claude_desktop_config.json`. Вставь в него:

```json
{
  "mcpServers": {
    "figma": {
      "url": "http://127.0.0.1:3845/mcp"
    }
  }
}
```

5. Сохрани файл (`⌘ S`)
6. **Перезапусти Claude Desktop** полностью (`⌘ Q`, потом открой снова)

### На Windows

1. Открой **Claude Desktop**
2. **File → Settings** (шестерёнка слева внизу)
3. Вкладка **Developer** → **Edit Config**
4. Откроется `claude_desktop_config.json`. Вставь то же содержимое:

```json
{
  "mcpServers": {
    "figma": {
      "url": "http://127.0.0.1:3845/mcp"
    }
  }
}
```

5. Сохрани файл (`Ctrl S`)
6. **Перезапусти Claude Desktop** (правый клик на иконке в трее → Quit → открой снова)

### Проверка что MCP подключился

В Claude Desktop создай новый чат и спроси:
```
какие у тебя есть MCP-инструменты?
```

В списке должны быть инструменты с префиксом `figma_` (например `figma_use_figma`, `figma_get_design_context`). Если их нет — Figma Desktop не запущена или MCP-сервер не включён (Шаг 1).

---

## Шаг 3. Установи дизайн-скиллы

### macOS

1. Скачай **[install-macos.command](https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/install-macos.command)**:
   - Правый клик → **Save Link As…** → сохранить в Downloads
2. Двойной клик по скачанному файлу
3. Если macOS блокирует: правый клик → **Open** → подтвердить **Open**
4. Откроется Terminal, прогонит 3 шага и покажет «Done!»
5. Нажми любую клавишу чтобы закрыть

### Windows

1. Скачай **[install-windows.bat](https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/install-windows.bat)**:
   - Правый клик → **Save link as…** → сохранить в Downloads
2. Двойной клик по скачанному файлу
3. Если SmartScreen блокирует: **More info** → **Run anyway**
4. Откроется консоль, прогонит 3 шага и покажет «Done!»
5. Нажми любую клавишу чтобы закрыть

---

## Шаг 4. Перезапусти Claude Desktop

Чтобы Claude подхватил установленные скиллы — **полностью перезапусти приложение** (не просто закрой окно).

- **macOS:** `⌘ Q` → открой снова
- **Windows:** правый клик на иконке в трее → Quit → открой снова

---

## Шаг 5. Проверь что всё работает

1. В Claude Desktop открой **новый чат**
2. Напиши:
   ```
   /mockup создай страницу со списком заявителей
   ```
3. Claude должен начать работу со скиллом — откроется Figma, появится макет

> **Важно:** подсказка `/mockup` может не показываться в выпадающем списке — это нормально. Просто печатай команду и жми Enter.

Если ничего не происходит — попробуй без `/`:
```
Используй skill mockup и создай страницу со списком заявителей в Figma
```

---

## Что теперь доступно

После установки в Claude Desktop работают 4 команды:

| Команда | Что делает |
|---|---|
| `/mockup [описание]` | Создаёт макет в Figma из твоего описания |
| `/specs-docs [компонент]` | Генерирует страницу Specs с анатомией компонента |
| `/screen-annotations` | Расставляет Scenarios-аннотации над экранами на текущей странице |
| `/design-review` | Проверяет макеты на соответствие дизайн-системе |

---

## Обновление скиллов

Когда в репозиторий выкатывают новую версию — просто **запусти инсталлер ещё раз**. Он перезапишет старые версии свежими. Перезапускать Claude после обновления обязательно.

---

## Если что-то не работает

### Скиллы не находятся

1. Открой в проводнике:
   - macOS: `~/.claude/skills/` (в Finder: `⌘⇧G` → введи путь)
   - Windows: `%USERPROFILE%\.claude\skills\`
2. Должны быть 4 папки: `design-review`, `mockup`, `screen-annotations`, `specs-documentation`
3. Если папок нет — инсталлер не отработал. Запусти заново и смотри ошибки в консоли.

### MCP-инструменты Figma недоступны в Claude

1. Убедись что Figma Desktop открыта
2. В Figma: Preferences → **Enable Dev Mode MCP Server** должно быть включено
3. Перезапусти Claude Desktop
4. Проверь `claude_desktop_config.json` — URL должен быть `http://127.0.0.1:3845/mcp`

### Скилл запускается но падает с ошибкой

Скопируй точный текст ошибки и напиши в команду `#ux-claude-skills` (или кому-то из поддерживающих).

---

## Поддержка

Maintained by Sumsub UX Team. Issues и вопросы — в GitHub Issues репозитория или напрямую мейнтейнерам.
