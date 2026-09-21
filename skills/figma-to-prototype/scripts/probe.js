/* Browser-side measurement toolkit for a pixel-exact prototype.
 *
 * Paste the whole file into the page (javascript_tool / devtools console). It
 * defines window.P and returns a summary. Everything here exists because
 * looking at a screenshot cannot tell you whether a value is right: the panel
 * screenshot is downscaled, and a 0.4px error is invisible and still wrong.
 *
 *   await P.ready()                      -> WAIT FOR FONTS FIRST (see below)
 *   P.baselines(['g14-400','g16-600'])   -> baseline offset per type class
 *   P.ink('#20252B', '400 14px Geist')   -> real glyph ink metrics
 *   P.box('.pkCard')                     -> box in CANVAS coordinates
 *   P.textAt('.cpHex')                    -> pen origin + baseline in canvas coords
 *   P.check([...])                        -> run assertions, print a table
 *   P.hoverRule('.mi:hover')             -> read a :hover rule you cannot trigger
 *
 * Always `await P.ready()` before measuring anything with text in it. Until a
 * web font finishes loading the browser lays text out with the fallback face,
 * whose metrics differ - a 21.4237px Manrope run measured 17.5 mid-load and
 * 18.5 once loaded. Same probe, same page, one pixel of silent error.
 */
window.P = (function () {
  const APP = () => document.getElementById('app') || document.body;

  /* Box in canvas coordinates: getBoundingClientRect is viewport-relative and
     shifts the moment the page scrolls, which silently corrupts a whole run.
     Note `sel` takes the FIRST match - pass an element for anything that
     repeats, or an assertion quietly measures the wrong instance. */
  function box(sel, el) {
    el = el || document.querySelector(sel);
    if (!el) return null;
    const a = APP().getBoundingClientRect(), r = el.getBoundingClientRect();
    return {x: r.left - a.left, y: r.top - a.top, w: r.width, h: r.height,
            right: r.right - a.left, bottom: r.bottom - a.top};
  }

  /* Real ink, not the layout box. getBBox/getBoundingClientRect return the line
     box - taller and wider than the glyphs - so comparing either against an
     export's ink extents is comparing two different things. */
  function ink(text, font) {
    const c = document.createElement('canvas').getContext('2d');
    c.font = font;
    const m = c.measureText(text);
    return {left: m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight,
            ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent,
            width: m.width,
            inkWidth: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
            lsb: -m.actualBoundingBoxLeft};   // pen origin -> ink left
  }

  /* Baseline offset inside a line box, per type class.
     Do not compute this from font metrics: browsers round it (Chrome gives
     whole and half pixels at line-height:1), so the only trustworthy number is
     the one measured in the browser that will render the prototype.
     An inline-block of zero size sits on the baseline - that is the probe. */
  function baselines(classes) {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden';
    document.body.appendChild(host);
    const out = {};
    if (document.fonts && document.fonts.status !== 'loaded') {
      // Measuring now returns the fallback face's metrics, which are wrong and
      // look plausible. Loud, because a silent 1px error here propagates into
      // every text position in the build.
      out.FONTS_NOT_READY = 'await P.ready() and measure again - these numbers ' +
                            'are the fallback face, not the real one';
      console.warn('P.baselines: fonts still loading (' + document.fonts.status +
                   '). await P.ready() first.');
    }
    for (const cls of classes) {
      host.innerHTML = '<div class="' + cls + '" style="position:static">' +
        '<span style="display:inline-block;width:0;height:0"></span>Hxg</div>';
      const d = host.firstChild, s = d.firstChild;
      const cs = getComputedStyle(d);
      out[cls] = {offset: +(s.getBoundingClientRect().bottom -
                            d.getBoundingClientRect().top).toFixed(4),
                  font: cs.fontWeight + ' ' + cs.fontSize + '/' + cs.lineHeight +
                        ' ' + cs.fontFamily.split(',')[0]};
    }
    host.remove();
    return out;
  }

  /* Pen origin and baseline of a rendered run, in canvas coordinates - the two
     numbers an export actually gives you, so the two you should compare. */
  function textAt(sel, el) {
    el = el || document.querySelector(sel);
    if (!el) return null;
    const b = box(null, el), cs = getComputedStyle(el);
    // key the lookup by the exact class string, not by position: baselines()
    // can add a FONTS_NOT_READY key, and reading keys[0] then silently yields
    // undefined and an NaN baseline that looks like a layout bug
    const cls = [...el.classList].filter(c => c !== 't').join(' ');
    const off = baselines([cls])[cls];
    if (!off) return {pen: b.x, baseline: null, top: b.y, text: el.textContent,
                      error: 'could not measure the baseline offset for ' + cls};
    return {pen: b.x, baseline: +(b.y + off.offset).toFixed(4),
            top: b.y, text: el.textContent, color: cs.color,
            font: off.font, offset: off.offset};
  }

  /* A :hover rule cannot be triggered from automation - the pseudo-class never
     activates, so reading the declaration is the only honest check. Whatever
     this returns, the live hover still needs one human look. */
  function hoverRule(selector) {
    const out = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      for (const r of rules || []) {
        if (r.selectorText && r.selectorText.split(',').some(
              s => s.trim() === selector)) out.push(r.cssText);
      }
    }
    return out;
  }

  /* Assertions, each carrying its expected value FROM THE EXPORT. The point is
     not that the run passes - it is that a failure names the number it wanted.
     A failing assertion is a suspect, not a verdict: more than half of them
     turn out to be bugs in the assertion. Check the export before the code. */
  function check(list, tol) {
    tol = tol === undefined ? 0.05 : tol;
    const rows = list.map(a => {
      let got, ok, note = '';
      try {
        got = a.get();
      } catch (e) {
        return {name: a.name, ok: false, want: a.want, got: 'THREW ' + e.message};
      }
      if (typeof a.want === 'number' && typeof got === 'number') {
        ok = Math.abs(got - a.want) <= (a.tol === undefined ? tol : a.tol);
        note = ok ? '' : 'd=' + (got - a.want).toFixed(4);
      } else if (Array.isArray(a.want) && Array.isArray(got)) {
        ok = a.want.length === got.length && a.want.every((w, i) =>
          typeof w === 'number' ? Math.abs(got[i] - w) <= (a.tol === undefined ? tol : a.tol)
                                : String(got[i]) === String(w));
      } else {
        ok = String(got) === String(a.want);
      }
      return {name: a.name, ok: ok, want: a.want, got: got, note: note};
    });
    const bad = rows.filter(r => !r.ok);
    console.table(rows);
    return {total: rows.length, passed: rows.length - bad.length, failed: bad};
  }

  /* Resolves when every declared web font has loaded. Await this before any
     measurement involving text - see the header note. */
  function ready() {
    return document.fonts ? document.fonts.ready : Promise.resolve();
  }

  return {box, ink, baselines, textAt, hoverRule, check, ready,
          /* colours come back normalised - '#1873DF' reads as 'rgb(24, 115, 223)',
             so compare normalised to normalised or the run fails on nothing */
          rgb: hex => { const d = document.createElement('div');
                        d.style.color = hex; document.body.appendChild(d);
                        const v = getComputedStyle(d).color; d.remove(); return v; }};
})();
'P ready: ' + Object.keys(window.P).join(', ');
