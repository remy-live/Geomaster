// Partager sans adresse : le CODE de la figure. Un lien contient l'adresse du
// programme, inutile chez le destinataire quand GéoMaster tourne depuis un
// fichier. Le code, lui, s'ouvre dans n'importe quel GéoMaster, sans réseau.
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
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);

  const figure = () => page.evaluate(() => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const cl = (s) => ({ X: s.x*app.view.zoom+app.view.x+rc.left, Y: s.y*app.view.zoom+app.view.y+rc.top });
    const ev = (t, s, bt) => { const c = cl(s); (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{
      pointerId:3, pointerType:'mouse', isPrimary:true, button:0, buttons:bt, clientX:c.X, clientY:c.Y,
      bubbles:true, cancelable:true })); };
    const gl = (a,c) => { ev('pointerdown',a,1);
      for (let i=1;i<=8;i++) ev('pointermove',{x:a.x+(c.x-a.x)*i/8, y:a.y+(c.y-a.y)*i/8},1); ev('pointerup',c,0); };
    app.entities = []; app.historyPast = []; app.saveState(); app.setTool('segment');
    gl({x:200,y:250},{x:600,y:250}); gl({x:200,y:400},{x:600,y:400});
    app.setTool('select');
    return { n: app.entities.length, code: app.getCompressedString(), lien: app.lienDePartage('complet') };
  });
  const rouvrir = (texte) => page.evaluate((t) => {
    const app = window.app;
    app.entities = []; app.render();
    const ok = app.ouvrirDepuisCode(t);
    return { ok, n: app.entities.length,
             segs: app.entities.filter(e => e.constructor.name === 'Segment').length };
  }, texte);

  const f = await figure();
  console.log(`  figure de ${f.n} objets · code ${f.code.length} car. · lien ${f.lien.length} car.`);
  ck('la page tourne bien depuis un fichier (c\'est le cas gênant)', /^file:/.test(f.lien), f.lien.slice(0, 24));

  console.log('\n=== le code seul rouvre la figure ===');
  const parCode = await rouvrir(f.code);
  console.log('  ' + JSON.stringify(parCode));
  ck('la figure revient entière', parCode.ok && parCode.n === f.n && parCode.segs === 2, JSON.stringify(parCode));

  console.log('\n=== un lien collé marche aussi, même venu d\'ailleurs ===');
  const parLien = await rouvrir(f.lien);
  ck('le lien de cette machine', parLien.ok && parLien.n === f.n, JSON.stringify(parLien));
  /* Le cas qui motivait tout : un lien fabriqué sur l'ordinateur de quelqu'un
     d'autre. Le chemin n'existe pas ici, et l'ouvrir tel quel ne donnerait rien.
     Collé dans la boîte, il rend pourtant la figure. */
  const etranger = 'file:///Users/quelquun/Bureau/index_offline.html?fig=' + f.code;
  const parEtranger = await rouvrir(etranger);
  ck('un lien d\'une AUTRE machine, chemin inexistant ici', parEtranger.ok && parEtranger.n === f.n,
     JSON.stringify(parEtranger));
  const enLecture = await rouvrir('https://exemple.org/geo/?mode=lecture&fig=' + f.code + '&autre=1');
  ck('un lien web avec d\'autres paramètres', enLecture.ok && enLecture.n === f.n, JSON.stringify(enLecture));

  console.log('\n=== un code abîmé ne casse rien ===');
  const abime = await page.evaluate((code) => {
    const app = window.app;
    const avant = app.entities.length;
    const ok = app.ouvrirDepuisCode(code.slice(0, Math.floor(code.length / 2)));
    return { ok, avant, apres: app.entities.length, bulle: document.getElementById('toast-notification').innerText };
  }, f.code);
  console.log('  ' + JSON.stringify(abime));
  ck('il est refusé', abime.ok === false);
  ck('et la figure en cours est intacte', abime.apres === abime.avant, `${abime.avant} → ${abime.apres}`);
  ck('on dit pourquoi', /illisible|entier/i.test(abime.bulle), abime.bulle);
  const vide = await page.evaluate(() => window.app.ouvrirDepuisCode('   '));
  ck('un collage vide est refusé aussi', vide === false);

  console.log('\n=== la modale et les boutons ===');
  const ui = await page.evaluate(async () => {
    const app = window.app;
    app.ouvrirModaleCode();
    const ouverte = getComputedStyle(document.getElementById('codeModal')).display;
    const vide = document.getElementById('codeSaisie').value;
    document.getElementById('codeModal').style.display = 'none';
    let presse = null;
    try { app.copierCodeFigure(); await new Promise(r => setTimeout(r, 200));
          presse = await navigator.clipboard.readText(); } catch (e) { presse = 'refus:' + e.name; }
    return { ouverte, vide, presse: (presse || '').slice(0, 40), longueur: (presse || '').length };
  });
  console.log('  ' + JSON.stringify(ui));
  ck('la modale s\'ouvre, champ vide', ui.ouverte === 'flex' && ui.vide === '');
  ck('« Copier le code » met le code nu dans le presse-papiers',
     ui.presse.indexOf('file:') !== 0 && ui.longueur > 40, `${ui.longueur} car.`);

  const boucle = await page.evaluate(async () => {
    const app = window.app;
    const code = await navigator.clipboard.readText();
    app.entities = []; app.render();
    app.ouvrirModaleCode();
    document.getElementById('codeSaisie').value = code;
    document.getElementById('btnCodeOuvrir').click();
    await new Promise(r => setTimeout(r, 150));
    return { n: app.entities.length, modale: getComputedStyle(document.getElementById('codeModal')).display };
  });
  console.log('  ' + JSON.stringify(boucle));
  ck('copié puis collé dans la modale : la figure revient', boucle.n === f.n, JSON.stringify(boucle));
  ck('et la modale se referme', boucle.modale === 'none');

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
