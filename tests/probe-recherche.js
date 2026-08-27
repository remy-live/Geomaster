// La recherche de commandes : trouver, lancer, et ne rien voler au clavier.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;
(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1800);

  console.log('\n=== elle s\'ouvre au clavier et au bouton ===');
  await page.keyboard.press('Control+k'); await page.waitForTimeout(300);
  const ouvert = await page.evaluate(() => ({
    ouvert: document.getElementById('rechercheOverlay').classList.contains('ouvert'),
    focus: document.activeElement.id,
    n: (window.app.commandesTrouvees || []).length,
  }));
  console.log('  ' + JSON.stringify(ouvert));
  ck('Ctrl+K ouvre la recherche', ouvert.ouvert === true);
  ck('le curseur est dans le champ', ouvert.focus === 'rechercheChamp', ouvert.focus);
  ck('l\'index est récolté', ouvert.n > 100 && ouvert.n < 260, ouvert.n + ' commandes');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ck('Échap la referme', !(await page.evaluate(() =>
     document.getElementById('rechercheOverlay').classList.contains('ouvert'))));
  await page.click('#btnRecherche'); await page.waitForTimeout(300);
  ck('le bouton de la barre l\'ouvre aussi', await page.evaluate(() =>
     document.getElementById('rechercheOverlay').classList.contains('ouvert')));

  console.log('\n=== on trouve ce qu\'on cherche, accents ou pas ===');
  const essais = [
    ['mediatrice', /Médiatrice/],
    ['MÉDIATRICE', /Médiatrice/],
    ['compas', /Compas/],
    ['exporter pdf', /PDF/],
    ['annuler', /Ctrl\+Z/],
    ['losange', /Losange/],
    ['stylo', /[Ss]tylo/],
  ];
  for (const [q, attendu] of essais) {
    await page.fill('#rechercheChamp', q); await page.waitForTimeout(120);
    const premier = await page.evaluate(() => {
      const r = (window.app.rechercheResultats || [])[0];
      return r ? r.nom : null;
    });
    ck(`« ${q} » trouve la bonne commande en tête`, premier && attendu.test(premier), String(premier));
  }

  console.log('\n=== les réponses de boîtes de dialogue ne sont pas proposées ===');
  const parasites = await page.evaluate(() => {
    window.app.ouvrirRecherche();
    return (window.app.commandesTrouvees || [])
      .filter(c => /Boîte de dialogue|Options d'exportation|Menu de l'objet/.test(c.ou))
      .map(c => c.nom + ' [' + c.ou + ']');
  });
  ck('aucune commande de boîte fermée dans l\'index', parasites.length === 0, parasites.slice(0, 4).join(', '));

  console.log('\n=== la commande choisie s\'exécute vraiment ===');
  await page.evaluate(() => { window.app.ouvrirRecherche(); });
  await page.fill('#rechercheChamp', 'segment'); await page.waitForTimeout(150);
  await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  const apres = await page.evaluate(() => ({
    outil: window.app.currentTool,
    ferme: !document.getElementById('rechercheOverlay').classList.contains('ouvert'),
    bulle: document.getElementById('toast-notification').innerText,
  }));
  console.log('  ' + JSON.stringify(apres));
  ck('l\'outil segment est armé', apres.outil === 'segment', apres.outil);
  ck('la recherche s\'est refermée', apres.ferme === true);
  ck('elle dit où se trouve la commande', /Barre des outils/.test(apres.bulle), apres.bulle);

  console.log('\n=== les flèches parcourent la liste ===');
  await page.evaluate(() => window.app.ouvrirRecherche());
  await page.fill('#rechercheChamp', 'cercle'); await page.waitForTimeout(150);
  const avant = await page.evaluate(() => window.app.rechercheIndex);
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80);
  const apresBas = await page.evaluate(() => ({ i: window.app.rechercheIndex,
    actif: document.querySelectorAll('.rech-item.actif').length }));
  await page.keyboard.press('ArrowUp'); await page.waitForTimeout(80);
  const retour = await page.evaluate(() => window.app.rechercheIndex);
  console.log('  ' + JSON.stringify({ avant, apresBas, retour }));
  ck('la flèche du bas descend', apresBas.i === avant + 1, `${avant} → ${apresBas.i}`);
  ck('une seule ligne est active', apresBas.actif === 1, apresBas.actif + '');
  ck('la flèche du haut remonte', retour === avant);
  await page.keyboard.press('Escape');

  console.log('\n=== elle ne vole rien au reste du clavier ===');
  const clavier = await page.evaluate(async () => {
    const a = window.app; a.clearCanvas();
    a.setTool('text');
    const g = document.getElementById('ghostTextInput');
    a.pendingTextCoords = { x: 200, y: 200 };
    g.style.display = 'block'; g.focus();
    return { ouvertAvant: document.getElementById('rechercheOverlay').classList.contains('ouvert') };
  });
  await page.keyboard.type('kkk');           // « k » sans Ctrl : c'est du texte
  const texte = await page.evaluate(() => ({
    contenu: document.getElementById('ghostTextInput').innerText,
    recherche: document.getElementById('rechercheOverlay').classList.contains('ouvert'),
  }));
  console.log('  ' + JSON.stringify({ ...clavier, ...texte }));
  ck('taper « k » écrit du texte', texte.contenu.includes('kkk'), texte.contenu);
  ck('et n\'ouvre pas la recherche', texte.recherche === false);
  await page.evaluate(() => window.app.validerTexteFantome());

  console.log('\n=== au doigt, sur un téléphone ===');
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p2 = await ctx2.newPage();
  const errs2 = []; p2.on('pageerror', e => errs2.push(e.message));
  await p2.goto(PAGE); await p2.waitForTimeout(1800);
  const bouton = await p2.evaluate(() => {
    const b = document.getElementById('btnRecherche').getBoundingClientRect();
    return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height),
             dansEcran: b.left >= 0 && b.right <= innerWidth };
  });
  console.log('  bouton : ' + JSON.stringify(bouton));
  ck('le bouton est visible sans défiler la barre', bouton.dansEcran === true, JSON.stringify(bouton));
  ck('il est tapable au doigt', bouton.w >= 34 && bouton.h >= 34, `${bouton.w}x${bouton.h}`);
  await p2.tap('#btnRecherche'); await p2.waitForTimeout(400);
  const boite = await p2.evaluate(() => {
    const b = document.getElementById('rechercheBoite').getBoundingClientRect();
    const champ = getComputedStyle(document.getElementById('rechercheChamp')).fontSize;
    const item = document.querySelector('.rech-item');
    const ri = item ? item.getBoundingClientRect() : null;
    return { x: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height),
             dansEcran: b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight,
             champ, ligne: ri ? Math.round(ri.height) : 0 };
  });
  console.log('  boîte : ' + JSON.stringify(boite));
  ck('la boîte tient dans l\'écran', boite.dansEcran === true, JSON.stringify(boite));
  ck('le champ ne déclenche pas le zoom iOS (16px)', parseFloat(boite.champ) >= 16, boite.champ);
  ck('les lignes sont tapables', boite.ligne >= 40, boite.ligne + 'px');
  ck('aucune erreur JS au doigt', errs2.length === 0, errs2.slice(0, 3).join(' | '));
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
