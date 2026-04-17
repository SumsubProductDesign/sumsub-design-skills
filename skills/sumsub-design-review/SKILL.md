---
name: sumsub-design-review
description: "Audit a Figma mockup for design system compliance — checks variables, text styles, spacing, components, base-to-semantic token usage. Use before handoff or during reviews."
argument-hint: "[figma-node-url]"
---

# Figma Skill: Design Review & Audit

> Audit Figma mockups for compliance with the Sumsub Dashboard design system.
> Check variables, text styles, spacing, components, and tokens.

## Before running (silent update check)

Do this before starting the main task below:

1. Read local version from `~/.claude/skills/.sumsub-design-skills-version`. If the file is missing, treat as `0.0.0`.
2. Fetch remote version: `curl -sfL --max-time 3 https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/package.json` and parse the `"version"` field.
3. **If versions match** or the fetch fails → say nothing, proceed silently.
4. **If remote is newer** → add ONE short note at the top of your reply:
   > A newer version of **sumsub-design-skills** is available (`{local}` → `{remote}`). Update anytime with: `npx --prefer-online github:SumsubProductDesign/sumsub-design-skills` — proceeding with the installed version.

   Then continue with the main task. Never block, never ask for confirmation.

---

## When to Use

- Before handoff to developers
- After creating or modifying screens
- When reviewing another designer's work
- Periodic quality checks on existing files

---

## Audit Checklist

### 1. Variables — No Hardcoded Values

| Check | Rule |
|---|---|
| Text fills | Must use `semantic/text/*` variables, never hex |
| Frame/rectangle fills | Must use `semantic/background/*` variables |
| Strokes | Must use `semantic/border/*` variables |
| Padding & itemSpacing | Must bind `spacing/*` variables |
| Corner radius | Must bind `border-radius/*` variables |
| Icon fills | Must use `semantic/icon/*` variables |

**Exception:** Components apply their own `components/*` variables internally — don't touch those.

### 2. Token Layer — Semantic Only

| Check | Rule |
|---|---|
| `base/*` tokens on custom nodes | ❌ Replace with `semantic/*` equivalent |
| `semantic/*` tokens on custom nodes | ✅ Correct |
| `components/*` tokens on instances | ✅ Don't modify — managed by component |

**Automatic replacement map:**
- `base/neutral/90` for text → `semantic/text/neutral/default`
- `base/neutral/100` for text → `semantic/text/neutral/strong`
- `base/blue/50` for text → `semantic/text/blue/normal`
- `base/neutral/10` for bg → `semantic/background/neutral/subtlest/normal`
- `base/neutral/0` for bg → `semantic/background/neutral/inverse/normal`
- `base/neutral/30` for border → `semantic/border/neutral/subtler/normal`

### 3. Text Styles

| Check | Rule |
|---|---|
| Manual font properties | ❌ Must use text styles via `setTextStyleIdAsync` |
| Correct font family | Must be `Geist` (not Inter, SF Pro, etc.) |
| `SemiBold` spelling | One word, no space (Geist `SemiBold`, not `Semi Bold`) |

### 4. Components — Correct Libraries

| Check | Rule |
|---|---|
| From Base components [Dashboard UI Kit] | ✅ Correct |
| From Organisms [Dashboard UI Kit] | ✅ Correct |
| From WebSDK UI Kit | ✅ For SDK flows only |
| From Redesign components (`MDOnxIRFpmo1PApWWULLiH`) | ❌ Replace with Base equivalent |

### 5. Layout Patterns

| Check | Rule |
|---|---|
| Page title | Must be inside `*Header*` component, not standalone text |
| Sidebar | Must have active section matching current page |
| Content padding (list pages) | 24px top/bottom, 32px left/right |
| Toolbar | Must be `Top Toolbar` component, not manual build |

---

## Skip List

These elements are excluded from audit:

| Skip | Reason |
|---|---|
| Frames named `Cover`, `Overview`, `.Cover`, `_Cover` | Decorative |
| Pages named `Overview` | Decorative |
| Instances named `Task context` | Internal tooling |
| Children inside component instances | Variables managed by component |

---

## Audit Script (Plugin API)

```js
// Run via mcp__figma__use_figma
const TARGET_NODE_ID = "NODE_ID_HERE"; // frame to audit
const node = figma.getNodeById(TARGET_NODE_ID);
const issues = [];

function shouldSkip(n) {
  if (!n) return true;
  const name = n.name;
  if (["Cover", "Overview", ".Cover", "_Cover", "Task context"].includes(name)) return true;
  if (n.type === "INSTANCE") return true; // don't audit inside instances
  return false;
}

function toHex(c) {
  if (!c) return null;
  return "#" + [c.r, c.g, c.b].map(v => Math.round(v*255).toString(16).padStart(2,"0")).join("");
}

function auditNode(n, path) {
  if (shouldSkip(n)) return;
  const fullPath = path + "/" + n.name;

  // Check fills for unbound variables
  if (n.fills && n.fills.length > 0 && n.type !== "INSTANCE") {
    for (const fill of n.fills) {
      if (fill.type === "SOLID" && fill.visible !== false) {
        const bound = n.boundVariables?.fills;
        if (!bound || bound.length === 0) {
          issues.push({
            type: "UNBOUND_FILL",
            node: fullPath,
            id: n.id,
            value: toHex(fill.color),
            nodeType: n.type,
          });
        }
      }
    }
  }

  // Check strokes
  if (n.strokes && n.strokes.length > 0 && n.type !== "INSTANCE") {
    const bound = n.boundVariables?.strokes;
    if (!bound || bound.length === 0) {
      issues.push({
        type: "UNBOUND_STROKE",
        node: fullPath,
        id: n.id,
        value: toHex(n.strokes[0]?.color),
      });
    }
  }

  // Check spacing (padding, itemSpacing)
  if (n.layoutMode && n.type === "FRAME") {
    const spacingProps = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"];
    for (const prop of spacingProps) {
      if (n[prop] > 0 && (!n.boundVariables || !n.boundVariables[prop])) {
        issues.push({
          type: "UNBOUND_SPACING",
          node: fullPath,
          id: n.id,
          prop,
          value: n[prop],
        });
      }
    }
  }

  // Check corner radius
  if (n.cornerRadius && n.cornerRadius > 0 && n.type === "FRAME") {
    const radiusProps = ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"];
    const anyBound = radiusProps.some(p => n.boundVariables?.[p]);
    if (!anyBound) {
      issues.push({
        type: "UNBOUND_RADIUS",
        node: fullPath,
        id: n.id,
        value: n.cornerRadius,
      });
    }
  }

  // Check text for base/* variables instead of semantic/*
  if (n.type === "TEXT") {
    const bound = n.boundVariables?.fills;
    if (bound && bound.length > 0) {
      for (const b of bound) {
        const v = figma.variables.getVariableById(b.id);
        if (v && v.name.startsWith("base/")) {
          issues.push({
            type: "BASE_TOKEN_ON_TEXT",
            node: fullPath,
            id: n.id,
            variable: v.name,
          });
        }
      }
    }
  }

  // Recurse into children (but not into instances)
  if (n.children) {
    for (const child of n.children) {
      if (child.type !== "INSTANCE") {
        auditNode(child, fullPath);
      }
    }
  }
}

auditNode(node, "");

// Format report
const summary = {};
for (const issue of issues) {
  summary[issue.type] = (summary[issue.type] || 0) + 1;
}

return JSON.stringify({
  totalIssues: issues.length,
  summary,
  issues: issues.slice(0, 50), // first 50 for readability
}, null, 2);
```

---

## Report Format

Present findings as a structured summary:

```
## Design Review: [Frame Name]

### Summary
- ❌ 12 unbound fills (hardcoded hex colors)
- ❌ 5 unbound spacing values
- ❌ 2 base/* tokens (should be semantic/*)
- ✅ All text styles applied correctly
- ✅ No Redesign components found

### Issues

| # | Type | Node | Value | Fix |
|---|---|---|---|---|
| 1 | Unbound fill | Main/Card/Title | #373d4d | Bind to semantic/text/neutral/default |
| 2 | Base token | Main/Label | base/neutral/90 | Replace with semantic/text/neutral/default |
| ... | | | | |

### Auto-fixable
[List of issues that can be fixed automatically with a follow-up script]
```

---

## Variable Keys for Auto-Fix

### Spacing
| Token | Value | Key |
|---|---|---|
| `spacing/2xs` | 4px | `3d3cc3a15da0b893bf326da6053d7a1c37f1d836` |
| `spacing/xs` | 6px | `a4dad7f0e560345e844697b529325a2eca2ff23a` |
| `spacing/s` | 8px | `5a8e4573770ee8f921f141c1ab6c96835c3125a0` |
| `spacing/m` | 12px | `de89b1cae49981816929db80a4e795842e7baf77` |
| `spacing/lg` | 16px | `2b3382099953af94f32cb6ffe5c7f44c74d5fed7` |
| `spacing/xl` | 24px | `7dc2647090da988c17327693bc2224e2308047a2` |
| `spacing/2xl` | 28px | `fceb37ce155723145d25d273574c665a8d7d30e6` |
| `spacing/3xl` | 32px | `a2e089548b83ff33c8ee5e914fa24e67b889b38c` |

### Border Radius
| Token | Value | Key |
|---|---|---|
| `border-radius/s` | 2px | `885152d55a536fb853461592cc3eff926e94858d` |
| `border-radius/m` | 4px | `311dc09093e9474a8b582c8fb7ccc7a628065a20` |
| `border-radius/lg` | 8px | `95839af397884cd7f8fadb34a62d4763f88d68dd` |
| `border-radius/xl` | 12px | `03884e014085a48cf26670632be200a02b5a160c` |

### Binding Example
```js
const spacingVar = await figma.variables.importVariableByKeyAsync("7dc2647090da988c17327693bc2224e2308047a2");
frame.setBoundVariable("paddingLeft", spacingVar);
frame.setBoundVariable("paddingRight", spacingVar);

const radiusVar = await figma.variables.importVariableByKeyAsync("95839af397884cd7f8fadb34a62d4763f88d68dd");
frame.setBoundVariable("topLeftRadius", radiusVar);
frame.setBoundVariable("topRightRadius", radiusVar);
frame.setBoundVariable("bottomLeftRadius", radiusVar);
frame.setBoundVariable("bottomRightRadius", radiusVar);
```

---

## Gotchas

- **Don't audit inside component instances** — their variables are managed by the component set
- **`boundVariables` can be undefined** — always check with optional chaining
- **Some nodes have `fills = []`** (intentionally transparent) — not an issue
- **Cover/Overview frames** — skip entirely, they're decorative
- **Geist vs Inter** — Geist is the correct font; Inter appears in documentation/specs only
