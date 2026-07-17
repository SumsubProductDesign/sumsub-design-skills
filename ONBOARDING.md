# Onboarding — Sumsub Design Skills + Claude

Полная настройка с нуля для нового дизайнера: Claude CLI → плагин со скиллами → Figma MCP → проверка. Время: ~15 минут.

> **Главное правило всей инструкции:** команды `claude …` выполняются в **Terminal.app**, а не в чате Claude и не во вкладке Code. Чат работает в песочнице без твоего PATH — оттуда установить/обновить ничего нельзя.

---

## Часть 1 — Claude Code CLI (один раз)

Открой **Terminal.app** (`Cmd+Space` → «Terminal»).

**1.1. Проверь, вдруг уже установлен:**
```bash
claude --version
```
Показал версию → сразу в Часть 2.

**1.2. Установи:**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```
Закрой терминал полностью, открой заново, проверь `claude --version`.

**1.3. Если `command not found`** — каталог не попал в PATH:
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
claude --version
```

**1.4. Если curl-инсталлер заблокирован** (корпоративный Mac) — альтернативы:
```bash
brew install --cask claude-code            # есть Homebrew
npm install -g @anthropic-ai/claude-code   # есть Node 18+
```
или меню **Claude → Install "claude" command line tool** в Claude Desktop.

Полный troubleshooting: [INSTALL.md](https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/INSTALL.md).

---

## Часть 2 — Плагин sumsub-design (один раз)

```bash
claude plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
claude plugin install sumsub-design@sumsub-design
claude plugin list
```
В списке должен появиться `sumsub-design` со свежей версией.

Затем **полностью перезапусти Claude Desktop** (`Cmd+Q` → открыть заново).

---

## Часть 3 — Обновление плагина (регулярно)

Версии выходят часто. Когда просят обновиться (или скилл ведёт себя странно):

```bash
claude plugin marketplace update sumsub-design
claude plugin update sumsub-design@sumsub-design
claude plugin list
```
и перезапусти Claude Desktop (`Cmd+Q`).

⚠️ **Кнопка «Check for updates» в Claude Desktop плагин НЕ обновляет** — она смотрит в локальный кэш и показывает устаревшую версию. Только команды выше.

---

## Часть 4 — Figma MCP (один раз)

**4.1. Добавь сервер:**
```bash
claude mcp add --transport http --scope user figma https://mcp.figma.com/mcp
```

**4.2. Авторизуйся:** открой Claude Code (вкладка Code или `claude` в терминале), набери `/mcp` → выбери `figma` → **Authenticate** → в браузере войди в Figma через Sumsub SSO → **Approve**.

**4.3. Если авторизация отваливается** — это почти всегда не Claude, а доступ в Figma:
- Нужен **полноценный seat** в организации Sumsub (на Viewer-месте OAuth вернёт отказ).
- Если видишь «admin approval required» — интеграцию Claude должен одобрить **админ Figma-организации**. Напиши Косте.

---

## Часть 5 — Проверка, что всё работает

1. `claude plugin list` → `sumsub-design` свежей версии.
2. В новой сессии Claude Code попроси: `Build a WebSDK Welcome screen in file <URL твоего тест-файла>`.
3. Скилл должен: спросить/использовать правильный файл, собрать **пару Desktop + Mobile**, положить её в секцию `… (made by Claude)` на странице **🛠 Drafts** (создаст, если её нет), в конце отдать ссылку.

---

## Типовые грабли

| Симптом | Причина | Решение |
|---|---|---|
| «в шелле нет claude CLI / npm / node» в ответе Claude | Команды запущены в чате (песочница) | Выполнять в Terminal.app — Часть 1/3 |
| `command not found: claude` в терминале | CLI не установлен или не в PATH | Часть 1.2–1.4 |
| «Check for updates» показывает старую версию | Смотрит в локальный кэш | Команды из Части 3 |
| Figma MCP «отказывается авторизовать» | Seat/SSO в Figma, не Claude | Часть 4.3 |
| Скилл ведёт себя не по правилам после обновления | Claude Desktop не перезапущен | `Cmd+Q` → открыть заново |
| Правка файлов внутри `~/Library/Application Support/Claude/local-agent-mode-sessions/…` | Cowork-хак, перезатирается сервером | Никогда так не делать — только официальный путь выше |

---

## Ссылки

- Установка (полная, с Windows): [INSTALL.md](https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/INSTALL.md)
- Обновление: [UPDATE.md](https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/UPDATE.md)
- Что нового по версиям: [CHANGELOG.md](https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/CHANGELOG.md)
- Вопросы: Костя (@kanstantsin.ruskikh)
