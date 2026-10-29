// CM case pages (v3.275.0) — run AFTER build.js + migrateOne and BEFORE finish.js, in its own use_figma call: case.js + `return JSON.stringify(await caseLayout(pageId))`.
// On a case page the tabs are not in the *Header*: they sit under it over the left column only, up to the right panel (designers' sample
// New Layout 16:20783). The CM kit has a component for exactly this — `Case page tab content` (Case management Components, set
// f66a91fa…): one variant per tab, the tab strip + the content column with its own paddings. So on a case page the left column is that
// instance, whole: the header's tab strip goes off, its tabs (labels, selected, counters) move onto the instance's strip, the blocks
// the build put into Main content are replaced by the instance of the selected tab, and the body padding goes to 0 (the instance
// brings its own). The right column stays in the Aside. Not a case page (no `Case page right column`) → { skipped } and nothing changes.
const CASE_SET = "f66a91fa671a0aabdf930c446356016780ddd4a0";
const isI = n => n.type === "INSTANCE", isS = n => n.type === "SLOT", CP = n => n.componentProperties;
const mName = n => { try { const m = n.mainComponent; return m ? (m.parent && m.parent.type === "COMPONENT_SET" ? m.parent.name : m.name) : ""; } catch (e) { return ""; } };
const prop = (x, k) => { try { const p = CP(x); return p && p[k] ? p[k].value : null; } catch (e) { return null; } };   // an instance whose main component is gone throws on componentProperties (Case Overview run)
const isEmpty = n => !!n.findOne(x => x.visible !== false && isI(x) && (/\*Empty State\*/.test(x.name + " " + mName(x)) || prop(x, "Is empty") === "Yes" || prop(x, "Empty") === "Yes"));
const tabItems = r => r.findAll(n => isI(n) && /Tab Basic \/ Item/i.test(n.name));
async function caseLayout(pageId) {
  const page = await figma.getNodeByIdAsync(pageId); if (!page) return { pageId, missing: true };
  let pg = page; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync(); await figma.setCurrentPageAsync(pg);
  if (!page.findOne(n => n.name === "Case page right column")) return { pageId, skipped: "not a case page (no Case page right column)" };
  const notes = [], ms = page.findOne(n => isS(n) && n.name === "Main content"); if (!ms) return { pageId, stopped: "no Main content slot" };
  const hdr = page.findOne(n => isI(n) && /^\*Header\*/.test(n.name));
  // 1. the tabs as the build carried them into the header
  const tabs = (hdr ? tabItems(hdr) : []).filter(t => t.visible).map(t => { const p = CP(t), ck = Object.keys(p).find(k => /^Counter/.test(k)), lk = Object.keys(p).find(k => /^Label text/.test(k));
    const nt = ck && p[ck].value === true ? t.findOne(y => y.type === "TEXT" && y.visible && y.name === "Number") : null;
    return { label: lk ? String(p[lk].value) : "", sel: String((p.Selected || {}).value) === "true", cnt: nt ? nt.characters : null }; }).filter(t => t.label);
  const sel = tabs.find(t => t.sel) || tabs[0];
  // 2. the variant of the selected tab; "Is empty" from what the build placed (an Empty State, a table with Empty=Yes)
  const set = await figma.importComponentSetByKeyAsync(CASE_SET);
  const types = set.componentPropertyDefinitions.Type.variantOptions;
  const type = sel ? types.find(t => t.toLowerCase() === sel.label.trim().toLowerCase()) : null;
  if (!type) return { pageId, stopped: "selected tab «" + (sel ? sel.label : "—") + "» has no Case page tab content variant", variants: types };
  const empty = ms.children.some(c => c.visible !== false && "findOne" in c && (isEmpty(c) || /\*Empty State\*/.test(c.name)));
  const v = set.children.find(c => c.name === "Type=" + type + ", Is empty=" + (empty ? "Yes" : "No")) || set.children.find(c => c.name === "Type=" + type + ", Is empty=No");
  // 3. the instance replaces the built blocks; an instance already moved whole by the build is reused
  const old = ms.children.slice(); let inst = old.find(c => isI(c) && mName(c) === "Case page tab content");
  const replaced = old.filter(c => c !== inst).map(c => c.name), reused = !!inst;
  if (!inst) { inst = v.createInstance(); ms.insertChild(0, inst); }
  for (const c of old) if (c !== inst) { try { c.remove(); } catch (e) { notes.push("remove " + c.name + ": " + e.message); } }
  try { inst.layoutSizingHorizontal = "FILL"; inst.layoutSizingVertical = "HUG"; } catch (e) { notes.push("sizing: " + e.message); }
  // the strip spans the column up to the right panel (in the kit `.Case page tab header` hugs its 964 — 12 px short on a 976 column)
  for (const s of inst.findAll(n => isI(n) && /Case page tab header|Header \/ Subheader/.test(n.name))) { try { if (s.layoutSizingHorizontal !== "FILL") s.layoutSizingHorizontal = "FILL"; } catch (e) { notes.push("strip width: " + e.message); } }
  const shown = inst.findAll(n => n.name === "Container" && n.type === "FRAME").flatMap(c => c.children.filter(k => k.visible !== false).map(k => k.name));
  // 4. the original's tabs on the instance's strip — labels, order, selected, counters; spare items hidden
  const its = tabItems(inst);
  for (let i = 0; i < its.length; i++) { const it = its[i], t = tabs[i]; try { if (!t) { it.visible = false; continue; } it.visible = true;
    const p = CP(it), lk = Object.keys(p).find(k => /^Label text/.test(k)), ck = Object.keys(p).find(k => /^Counter/.test(k));
    const set1 = { Selected: t === sel ? "true" : "false" }; if (lk) set1[lk] = t.label; if (ck) set1[ck] = !!t.cnt; it.setProperties(set1);
    const nt = t.cnt && it.findOne(y => y.type === "TEXT" && y.name === "Number"); if (nt && nt.characters !== t.cnt) { await figma.loadFontAsync(nt.fontName); nt.characters = t.cnt; }
  } catch (e) { notes.push("tab " + i + ": " + e.message); } }
  if (tabs.length > its.length) notes.push("the strip has " + its.length + " items for " + tabs.length + " tabs");
  // 5. no tab strip in the header; the body padding is the instance's
  if (hdr) { const k = Object.keys(CP(hdr)).find(x => /^Subheader#/.test(x)); if (k) { try { hdr.setProperties({ [k]: false }); } catch (e) { notes.push("header subheader: " + e.message); } } }
  const d = page.findOne(n => isI(n) && n.name === "Page / Body / Default");
  if (d) for (const k of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) { try { if (d.boundVariables && d.boundVariables[k]) d.setBoundVariable(k, null); d[k] = 0; } catch (e) { notes.push("body " + k + ": " + e.message); } }
  return { pageId, variant: v.name, reused, tabs: tabs.map(t => (t === sel ? "▸" : "") + t.label + (t.cnt ? " " + t.cnt : "")),
    replaced, instanceShows: shown, notes,
    check: "the instance shows the library's content of this tab — compare `replaced` (the original's blocks) with `instanceShows`; a block the original has and the instance lacks is reported to the designer, not rebuilt" };
}
