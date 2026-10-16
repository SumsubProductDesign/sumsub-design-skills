// the WebSDK fixture: one realistic page column out of assets/components/websdk/controls.js — the top
// bar, the Applicant data form in the widget box with the footer's button, the whitelabel line, the two
// dialogs hosted by the column, then a status screen and the rest of the library — rendered by lint at
// 720 (the widget at its full 718) and at 375 through --device, and compared with
// assets/components/websdk/reference/fixture-websdk-<width>.png. A function-by-function check passes
// while a page is broken (a footer over the last field, a ring drawn at the wrong size, a label in the
// system face), so this renders them together and looks at the result.
//
//   node assets/fixture-websdk.js <out.html>
const fs = require('fs'), path = require('path');
const W = require(path.join(__dirname, 'components', 'websdk', 'controls.js'));
const out = process.argv[2] || '/tmp/fixture-websdk.html';

const form = W.pageTitle({title: 'Applicant data'})
  + `<div class="fx-fields">`
  // the Welcome frames' Sumsub ID block (no kit story: the Figma "Welcome block"), the email variant, first so the recorded render shows it
  + W.sumsubIdBlock({id: 'fx-sid', toggleId: 'fx-sid-toggle', linkId: 'fx-sid-more', email: {id: 'fx-sid-email'}})
  + W.inputField({label: 'First name', required: true, placeholder: 'Legal name', id: 'fx-first'})
  + W.inputField({label: 'Last name', required: true, value: 'Papadopoulos', id: 'fx-last'})
  + W.selectField({label: 'Country', required: true, options: [{value: 'CYP', label: 'Cyprus', flag: 'CYP'}, {value: 'GRC', label: 'Greece', flag: 'GRC'}], value: 'CYP', id: 'fx-country'})
  + W.inputField({label: 'Search address', required: true, placeholder: 'Add state, city, address lines', error: 'This field is required', id: 'fx-addr'})
  + W.button({type: 'link', label: 'Enter address manually', id: 'fx-manual'})
  + W.dateField({label: 'Date of birth', id: 'fx-dob'})
  + W.phoneField({label: 'Phone number', country: {code: 'CYP', calling: '+357'}, value: '99 123456', id: 'fx-phone'})
  + W.textareaField({label: 'Comment', placeholder: 'Anything else', id: 'fx-comment'})
  + W.fieldset({legend: 'Document', required: true, inner: W.radio({label: 'ID card', name: 'fx-doc', checked: true, group: true, icon: 'id-card'}) + W.radio({label: 'Passport', name: 'fx-doc', group: true, icon: 'id-card'})})
  + W.checkbox({label: 'I confirm the data is correct', id: 'fx-agree'})
  + `<div class="fx-row">${W.toggle({checked: true, label: 'Remember'})}${W.toggle({label: 'Off'})}${W.toggle({disabled: true, label: 'Disabled'})}</div>`
  + W.tabs({items: ['Individual', 'Company', {label: 'Other', disabled: true}], active: 'Company'})
  + W.button({type: 'secondary', label: 'Why we ask', id: 'fx-why', attrs: 'data-sdk-open="#fx-modal"'})
  + W.button({type: 'secondary', label: 'Consent', id: 'fx-consent-open', attrs: 'data-sdk-open="#fx-sheet"'})
  + `</div>`;

// the page's column as the kit's full-layout story and the shell draw it: the top bar, then the widget box
// (SdkBaseContainer), then the whitelabel line — and the dialogs last, hosted by the column (position: relative),
// never inside container(): the kit's tint is absolute, inset 0, 8 in (0 at ≤ 726), and in the column it covers
// the bar, the box and the Powered-by line; in the box it stopped at the box's edges (eval run 17, 2026-10-14)
const logo = fs.readFileSync(path.join(__dirname, 'shell', 'websdk', 'icons', 'powered-by-sumsub.svg'), 'utf8').trim();
const widget = W.header({back: true, step: [2, 3], toPhone: true, toPhoneClass: 'fx-wide', lang: true, langClass: 'fx-wide', langIconClass: 'fx-narrow', steps: [{label: 'Identity verification', state: 'done'}, {label: 'Applicant data', state: 'active'}, {label: 'Liveness check'}]})
  + W.container(
    W.content(form, {bottom: 48})
    + W.footer({buttons: [W.button({label: 'Continue', id: 'fx-continue'})]}))
  + `<div class="fx-whitelabel">${logo}</div>`
  // the kit's two dialog shapes, the same component at every width: "Modal / Full" and "Modal / Bottom sheet"
  + W.modal({id: 'fx-modal', title: 'Why we ask', subtitle: 'Your data is safe', inner: W.text({text: 'We need it to verify your identity.'}), footer: [W.button({label: 'Got it', attrs: 'data-sdk-close=""'})]})
  + W.bottomSheet({id: 'fx-sheet', noHeader: true, inner: W.text({text: 'I agree to the processing of my personal data.'}), footer: [W.button({label: 'Agree and continue', id: 'fx-agree', attrs: 'data-sdk-close=""'})]});

const status = W.splashScreen({icon: 'check-circle', iconType: 'success', title: 'Verified', message: 'Your data has been checked. You can close this window.', buttons: [W.button({label: 'Close'})]});

const rest = `<div class="fx-rest">`
  + W.alert({type: 'warning', title: 'Two steps require resubmission', text: "Let's fix them to complete verification", action: W.button({type: 'secondary', small: true, label: 'Fix now'})})
  + W.alert({type: 'success', text: 'Document accepted'})
  + `<div class="fx-toast">${W.toast({type: 'info', title: 'This is a toast title', text: 'This is a toast message'})}</div>`
  + `<div class="fx-row">${W.tag({label: 'Accepted', type: 'success'})}${W.tag({label: 'Warning', type: 'warning'})}${W.tag({label: 'Rejected', type: 'error'})}${W.tag({label: 'Closable', closable: true})}</div>`
  + `<div class="fx-row">${W.button({type: 'secondary', label: 'Secondary', icon: 'plus', iconType: 'interactive'})}${W.button({type: 'plain', label: 'Plain'})}${W.button({label: 'Loading', loading: true})}${W.button({label: 'Add', iconOnly: true, icon: 'plus', small: true})}${W.button({label: 'Disabled', disabled: true, small: true})}</div>`
  + `<div class="fx-row">${W.iconBlock({icon: 'id-card'})}${W.iconBlock({icon: 'id-card', size: 'small', state: 'success'})}${W.iconBlock({icon: 'id-card', size: 'extraSmall', state: 'attention'})}${W.logoBlock({size: 'small'})}${W.dotsLoader({color: 'blue'})}</div>`
  + W.choiceList({items: [{title: 'ID card', caption: 'Government-issued identity document', icon: 'id-card'}, {title: 'Passport', caption: 'International travel document', icon: 'id-card'}], or: true})
  + W.card({title: 'Title name', inner: W.tips({items: [{text: 'Hold the document steady', iconType: 'success'}, {text: 'Avoid glare', iconType: 'danger'}, {text: 'See the guide', iconType: 'interactive', right: 'external-link'}]}), icon: 'id-card', counter: 3})
  + `<ul class="fx-steps">${W.validationStep({title: 'Identity verification', status: 'success', icon: 'check', tag: {label: 'Accepted', type: 'success'}})}${W.validationStep({title: 'Proof of address', icon: 'building', tag: {label: 'Required', type: 'warning'}})}</ul>`
  + W.separator({label: 'or'}) + W.link({href: '#', label: 'A kit link'})
  + `</div>`;

const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>websdk fixture</title>
<style>${W.css}
body{margin:0;background:#20252c}
#app{display:flex;flex-direction:column;gap:24px;padding:4px 8px}
/* the column: 68 of bar + the 1112 box + the 38 whitelabel line; position: relative hosts the dialogs */
.fx-widget{display:flex;flex-direction:column;align-items:center;height:1218px;width:100%;max-width:718px;margin:0 auto;position:relative}
.fx-widget > main{flex:1 1 0;width:100%;min-height:0}
.fx-whitelabel{display:flex;justify-content:center;padding:8px 0;width:100%;flex-shrink:0;color:var(--components-white-label-grey-background-normal)}
.fx-whitelabel svg{display:block}
.fx-status{height:420px;width:100%;max-width:718px;margin:0 auto;display:flex;flex-direction:column}
.fx-status > main{flex:1 1 0}
.fx-fields{display:flex;flex-direction:column;gap:16px}
.fx-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.fx-rest{width:100%;max-width:718px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px}
.fx-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
/* the toast's entry animation does not advance under shoot.js's virtual time: frozen at its start it sat over the alert above */
.fx-toast .sdk-toast{animation:none}
/* the frames of 2026-10-05: under 600 the top bar keeps only the icon-only language button */
.fx-narrow{display:none !important}
@media (max-width:600px){.fx-wide{display:none !important}.fx-narrow{display:inline-flex !important}}
</style></head>
<body class="sns-uikit sns-theme-light"><div id="app"><div class="fx-widget">${widget}</div><div class="fx-status">${status}</div>${rest}</div>
<script>${W.script}</script></body></html>`;
fs.writeFileSync(out, page);
console.log(out, page.length, 'chars');
