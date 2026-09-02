// Ce dont on se sert AU TABLEAU : avancer la construction à la main (et à la
// télécommande), et grossir le trait pour le fond de la salle.
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
  await page.goto(PAGE); await page.waitForTimeout(1500);

  // un carré construit aux instruments : il porte des consignes d'étape
  await page.evaluate(async () => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.saveState();
    app.buildSquare(null, 400, 400);
    await new Promise(r => setTimeout(r, 500));
    app.stopAnimation();
  });
  await page.waitForTimeout(400);
  const etat = () => page.evaluate(() => {
    const a = window.app;
    const lim = (a.replayIndex !== null && a.replayIndex < a.entities.length) ? a.replayIndex : a.entities.length;
    return { idx: a.replayIndex, n: a.entities.length, bornes: a.bornesEtapes(),
             visibles: a.entities.slice(0, lim).filter(e => e.constructor.name !== 'ToolAnimation').length };
  });

  console.log('\n=== avancer la construction à la main ===');
  const dep = await etat();
  console.log('  ' + JSON.stringify(dep));
  ck('la construction est découpée en étapes', dep.bornes.length >= 4, JSON.stringify(dep.bornes));
  ck('la figure est entière au départ', dep.idx === dep.n);

  /* Une télécommande de présentation n'envoie rien d'autre que Page suivante /
     Page précédente : c'est le seul branchement qui compte pour tenir la
     construction depuis le fond de la salle. */
  const vus = [];
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('PageDown'); await page.waitForTimeout(110);
    vus.push((await etat()).visibles);
  }
  console.log('  objets visibles après 4 « page suivante » : ' + JSON.stringify(vus));
  ck('le premier appui repart du début, pas de la fin', vus[0] < dep.visibles, `${vus[0]} < ${dep.visibles}`);
  ck('chaque appui découvre la suite', vus.every((v, i) => i === 0 || v > vus[i - 1]), JSON.stringify(vus));
  ck('la dernière étape rend la figure entière', vus[vus.length - 1] === dep.visibles);

  await page.keyboard.press('PageUp'); await page.waitForTimeout(110);
  const recul = await etat();
  ck('« page précédente » revient en arrière', recul.visibles === vus[vus.length - 2], String(recul.visibles));

  await page.keyboard.press('Space'); await page.waitForTimeout(110);
  ck('Espace avance aussi', (await etat()).visibles === vus[vus.length - 1]);

  console.log('\n=== les flèches ne volent pas le déplacement d\'un objet ===');
  const flechesLibres = await page.evaluate(() => window.app.replayIndex);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(110);
  ck('sans sélection, ← pilote le rejeu', (await page.evaluate(() => window.app.replayIndex)) !== flechesLibres);
  const bouge = await page.evaluate(async () => {
    const app = window.app;
    const p = app.entities.find(e => e.constructor.name === 'Point');
    app.selectedObject = p;
    return { x: p.x, idx: app.replayIndex };
  });
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(110);
  const apres = await page.evaluate(() => ({ x: window.app.selectedObject.x, idx: window.app.replayIndex }));
  console.log('  ' + JSON.stringify({ avant: bouge, apres }));
  ck('un objet sélectionné : → le déplace', apres.x === bouge.x + 1, `${bouge.x} → ${apres.x}`);
  ck('et ne touche pas au rejeu', apres.idx === bouge.idx);
  await page.evaluate(() => { window.app.selectedObject = null; });

  console.log('\n=== une figure sans consignes se dévoile objet par objet ===');
  const libre = await page.evaluate(() => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const cl = (s) => ({ X: s.x*app.view.zoom+app.view.x+rc.left, Y: s.y*app.view.zoom+app.view.y+rc.top });
    const ev = (t, s, bt) => { const c = cl(s); (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{
      pointerId:3, pointerType:'mouse', isPrimary:true, button:0, buttons:bt, clientX:c.X, clientY:c.Y,
      bubbles:true, cancelable:true })); };
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    app.setTool('segment');
    for (let i = 0; i < 3; i++) { ev('pointerdown', {x:200,y:200+i*80}, 1);
      for (let k=1;k<=6;k++) ev('pointermove',{x:200+300*k/6,y:200+i*80},1); ev('pointerup',{x:500,y:200+i*80},0); }
    app.setTool('select');
    return { n: app.entities.length, bornes: app.bornesEtapes().length };
  });
  console.log('  ' + JSON.stringify(libre));
  ck('autant de bornes que d\'objets, plus le départ', libre.bornes === libre.n + 1, JSON.stringify(libre));

  console.log('\n=== mode projection ===');
  const mesure = () => page.evaluate(() => {
    const app = window.app, c = app.canvas, ctx = c.getContext('2d');
    const dpr = c.width / c.getBoundingClientRect().width;
    const X = Math.round((350 * app.view.zoom + app.view.x) * dpr);
    const Y0 = Math.round((200 * app.view.zoom + app.view.y - 20) * dpr);
    const d = ctx.getImageData(X, Y0, 1, Math.round(40 * dpr)).data;
    let enc = 0; for (let i = 0; i < d.length; i += 4) if (d[i+3] > 40 && d[i] < 150) enc++;
    return +(enc / dpr).toFixed(1);
  });
  await page.evaluate(() => window.app.render()); await page.waitForTimeout(150);
  const fin = await mesure();
  await page.evaluate(() => window.app.basculerProjection()); await page.waitForTimeout(150);
  const gros = await mesure();
  console.log(`  épaisseur du trait : ${fin} px → ${gros} px`);
  ck('le trait s\'épaissit', gros > fin * 1.5, `${fin} → ${gros}`);

  /* Le grossissement ne doit toucher QUE l'écran : ni les objets, ni le lien,
     ni le SVG exporté n'ont à en garder trace. */
  const propre = await page.evaluate(() => {
    const app = window.app;
    const seg = app.entities.find(e => e.constructor.name === 'Segment');
    const svg = app.generateSVGString(false, 'text') || '';
    const larg = [...svg.matchAll(/stroke-width="([\d.]+)"/g)].map(m => +m[1]);
    return { epaisseurObjet: seg ? (seg.lineWidth || 2) : null, maxSVG: larg.length ? Math.max(...larg) : null };
  });
  console.log('  ' + JSON.stringify(propre));
  ck('l\'objet garde son épaisseur', propre.epaisseurObjet <= 3, String(propre.epaisseurObjet));
  ck('le SVG exporté n\'est pas grossi', propre.maxSVG === null || propre.maxSVG <= 3, String(propre.maxSVG));

  await page.evaluate(() => window.app.basculerProjection()); await page.waitForTimeout(150);
  ck('on revient exactement à l\'épaisseur d\'avant', (await mesure()) === fin, `${await mesure()} vs ${fin}`);

  console.log('\n=== la lettre ne vient pas se coller sur la croix ===');
  /* La loupe grossit les traits et les polices à l'écriture, mais elle ne peut
     rien pour les distances calculées à l'avance : l'écart d'un nom à son point
     restait celui d'une lettre de 14 px alors qu'on en dessinait une de 31. */
  await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.saveState();
    const p = app.createPointAt(500, 400);
    p.label = 'A'; p.labelAngle = -Math.PI / 2;
    app.render();
  });
  const ecart = () => page.evaluate(() => {
    const app = window.app, c = app.canvas, ctx = c.getContext('2d');
    const dpr = c.width / c.getBoundingClientRect().width;
    const p = app.entities.find(e => e.constructor.name === 'Point');
    const X = Math.round((p.x * app.view.zoom + app.view.x - 40) * dpr);
    const Y0 = Math.round(((p.y - 90) * app.view.zoom + app.view.y) * dpr);
    const W = Math.round(80 * app.view.zoom * dpr), H = Math.round(120 * app.view.zoom * dpr);
    const d = ctx.getImageData(X, Y0, W, H).data;
    // profil de lignes : la lettre forme un paquet, la croix un autre
    const lignes = [];
    for (let y = 0; y < H; y++) {
      let plein = false;
      for (let x = 0; x < W; x++) { const k = (y * W + x) * 4; if (d[k+3] > 40 && d[k] < 150) { plein = true; break; } }
      if (plein) lignes.push(y / dpr);
    }
    const paquets = []; let cur = null;
    lignes.forEach(v => { if (cur && v - cur.fin <= 2) cur.fin = v; else { cur = { deb: v, fin: v }; paquets.push(cur); } });
    if (paquets.length < 2) return null;
    return { lettre: +(paquets[0].fin - paquets[0].deb).toFixed(1),
             blanc: +(paquets[1].deb - paquets[0].fin).toFixed(1) };
  });
  await page.waitForTimeout(120);
  const av = await ecart();
  await page.evaluate(() => window.app.basculerProjection()); await page.waitForTimeout(200);
  const ap = await ecart();
  console.log(`  normal : lettre ${av.lettre} px, blanc ${av.blanc} px`);
  console.log(`  projeté : lettre ${ap.lettre} px, blanc ${ap.blanc} px`);
  ck('la lettre grossit bien', ap.lettre > av.lettre * 1.8, `${av.lettre} → ${ap.lettre}`);
  ck('et le blanc qui la sépare de la croix grossit AUSSI',
     ap.blanc >= av.blanc * (ap.lettre / av.lettre) * 0.8, `${av.blanc} → ${ap.blanc}`);
  ck('la lettre reste cliquable là où elle est dessinée', await page.evaluate(() => {
    const app = window.app, p = app.entities.find(e => e.constructor.name === 'Point');
    const d = (p.padding + (p.fontSize || 14) / 2) * app.facteurProjection;
    return p.isLabelHit(app.ctx, p.x, p.y - d);
  }));
  await page.evaluate(() => window.app.basculerProjection()); await page.waitForTimeout(200);
  const retour = await ecart();
  ck('et le mode normal n\'a pas bougé d\'un pixel',
     retour.lettre === av.lettre && retour.blanc === av.blanc, JSON.stringify(retour));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
