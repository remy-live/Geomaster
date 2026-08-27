// Ce que l'audit a trouvé, et qui ne doit pas revenir.
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
  const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1800);

  console.log('\n=== plus aucune commande ne pointe dans le vide ===');
  const mortes = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('[onclick], [onpointerdown]').forEach((e) => {
      const code = (e.getAttribute('onclick') || '') + ';' + (e.getAttribute('onpointerdown') || '');
      const noms = [...code.matchAll(/\bapp\.([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]);
      noms.forEach((n) => { if (typeof window.app[n] !== 'function')
        out.push({ nom: n, sur: e.id || (e.innerText || '').trim().slice(0, 20) }); });
    });
    return out;
  });
  ck('aucun appel vers une méthode inexistante', mortes.length === 0, JSON.stringify(mortes));

  console.log('\n=== identifiants uniques ===');
  const dup = await page.evaluate(() => {
    const vus = {}, dup = [];
    document.querySelectorAll('[id]').forEach(e => { vus[e.id] = (vus[e.id] || 0) + 1; });
    Object.keys(vus).forEach(k => { if (vus[k] > 1) dup.push(k + ' ×' + vus[k]); });
    return dup;
  });
  ck('aucun identifiant en double', dup.length === 0, JSON.stringify(dup));

  console.log('\n=== un lien dont le masque annonce des instruments sans leurs positions ===');
  const inst = await page.evaluate(() => {
    const a = window.app;
    const u = LZString.compressToEncodedURIComponent("Essai;15;0¦1;200;200;A¦1;500;200;B¦2;0;1");
    a.loadFromCompressedString(u);
    const etat = { drapeaux: { ...a.activeWidgets },
                   objets: { r: !!a.rulerWidget, c: !!a.compassWidget, e: !!a.setSquareWidget, p: !!a.protractorWidget } };
    try { a.generateSVGString(true, 'text'); etat.export = 'ok'; }
    catch (e) { etat.export = 'ERREUR ' + e.message; }
    try { a.render(); etat.rendu = 'ok'; } catch (e) { etat.rendu = 'ERREUR ' + e.message; }
    return etat;
  });
  console.log('  ' + JSON.stringify(inst));
  ck('les quatre instruments sont instanciés', Object.values(inst.objets).every(Boolean), JSON.stringify(inst.objets));
  ck('l\'export avec instruments ne casse plus', inst.export === 'ok', inst.export);
  ck('le rendu non plus', inst.rendu === 'ok', inst.rendu);

  console.log('\n=== le bouton « 💡 Étape » attache bien une consigne ===');
  const etape = await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    a.addEntity(new Point(100, 100, 'A')); a.addEntity(new Point(200, 200, 'B'));
    a.stepInstructions = {};
    const zone = document.getElementById('instrContent');
    zone.innerHTML = 'Trace le segment [AB].';
    a.replayIndex = 0;
    a.toggleStepInstruction();
    const pose = JSON.parse(JSON.stringify(a.stepInstructions));
    a.toggleStepInstruction();              // le même texte : on retire
    const retire = JSON.parse(JSON.stringify(a.stepInstructions));
    zone.innerHTML = '';
    a.toggleStepInstruction();              // rien à poser
    return { pose, retire, vide: JSON.parse(JSON.stringify(a.stepInstructions)),
             bulle: document.getElementById('toast-notification').innerText };
  });
  console.log('  ' + JSON.stringify(etape));
  ck('la consigne est posée à l\'index courant', etape.pose['2'] === 'Trace le segment [AB].', JSON.stringify(etape.pose));
  ck('rappuyer la retire', Object.keys(etape.retire).length === 0);
  ck('sans texte, il le dit au lieu de rien faire', /consigne/i.test(etape.bulle), etape.bulle);

  console.log('\n=== le verrou de l\'image montre son état ===');
  const verrou = await page.evaluate(() => {
    const a = window.app;
    const faux = { isLocked: false, opacity: 1, constructor: { name: 'BackgroundImage' } };
    Object.setPrototypeOf(faux, BackgroundImage.prototype);
    a.selectedObject = faux;
    const lire = () => { const b = document.getElementById('btnImgLock');
      return { fond: b.style.background, bulle: b.getAttribute('data-tooltip'), presse: b.getAttribute('aria-pressed') }; };
    a.updateContextMenuUI();
    const ouvert = lire();
    faux.isLocked = true;
    a.updateContextMenuUI();
    const ferme = lire();
    a.selectedObject = null;
    return { ouvert, ferme };
  });
  console.log('  ' + JSON.stringify(verrou));
  ck('le fond change avec l\'état', verrou.ouvert.fond !== verrou.ferme.fond,
     `${verrou.ouvert.fond} → ${verrou.ferme.fond}`);
  ck('l\'infobulle aussi', verrou.ouvert.bulle !== verrou.ferme.bulle,
     `${verrou.ouvert.bulle} → ${verrou.ferme.bulle}`);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
