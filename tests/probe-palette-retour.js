// La palette de style, escamotée par l'aide aux formules, revient-elle par
// tous les chemins de sortie ?
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;
(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  const scen = await page.evaluate(() => {
    const app = window.app, cont = app.canvas.parentElement;
    const pal = () => document.getElementById('stylePalettePanel');
    const vis = () => pal().offsetParent !== null;
    const ouvrirSaisie = () => {
      app.validerTexteFantome(); app.setTool('text');
      const rc = cont.getBoundingClientRect();
      const cx = Math.max(0, rc.left) + cont.clientWidth * 0.2;
      const cy = Math.max(0, rc.top) + cont.clientHeight * 0.4;
      const ev = (t, bt) => app.canvas.dispatchEvent(new PointerEvent(t, {
        pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
        clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
      ev('pointerdown', 1); ev('pointerup', 0);
      document.getElementById('ghostTextInput').focus();
    };
    const out = {};
    out.avant = vis();
    // 1) le bouton « ? » deux fois de suite
    ouvrirSaisie(); app.basculerAideFormule();
    out.pendant = vis();
    app.basculerAideFormule();
    out.apresBouton = vis();
    // 2) la croix du panneau
    app.basculerAideFormule(true); app.basculerAideFormule(false);
    out.apresCroix = vis();
    // 3) la validation du texte, aide encore ouverte
    app.basculerAideFormule(true);
    document.execCommand('insertText', false, '\\pi');
    app.validerTexteFantome();
    out.apresValidation = vis();
    out.aide = document.getElementById('aideFormule').style.display;
    out.entite = app.entities.some(e => e.constructor.name === 'TextLabel');
    return out;
  });
  console.log('  ' + JSON.stringify(scen));
  ck('la palette est visible au départ', scen.avant === true);
  ck('elle s\'escamote pendant l\'aide', scen.pendant === false);
  /* La règle a changé, volontairement : la palette reste escamotée tant qu'on
     ÉCRIT, et pas seulement tant que l'aide est ouverte. Elle est à z-index 5500
     contre 4001 pour la barre de texte, laquelle tient désormais sur deux rangées
     au téléphone — mesuré, la palette recouvrait trois de ses quatre boutons de
     style. Refermer l'aide ne doit donc pas la ramener par-dessus la barre. */
  ck('refermer l\'aide par « ? » ne la ramène pas sur la barre', scen.apresBouton === false);
  ck('refermer l\'aide par la croix non plus', scen.apresCroix === false);
  ck('elle revient quand la saisie est validée', scen.apresValidation === true);
  ck('l\'aide est bien refermée', scen.aide === 'none');
  ck('le texte a bien été créé', scen.entite === true);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
