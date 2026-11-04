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

  /* ================================================================
     UN PETIT SIGNE GROSSIT TOUT ENTIER, OU IL SE REMPLIT.
     « Peut-être que ça fait gros quand même, la projection — pas pour le
       rapporteur mais pour le reste. »
     Épaissir le trait est exactement ce qu'il faut sur une droite : elle n'a
     pas de voisin à toucher. Sur un signe de six pixels, le trait mange le
     dessin. La sonde d'au-dessus mesurait l'ÉPAISSEUR et ne pouvait donc rien
     voir — elle vérifiait même que ça grossissait. Ce qu'il faut mesurer,
     c'est la FORME : la boîte du signe et son TAUX DE REMPLISSAGE. Une croix
     à 37 % d'encre est une croix ; à 59 %, c'est un carré.
     Relevé avant correction, en projection : la croix d'un point passait de
     14×14 à 16×16 — elle ne grandissait pas — pendant que son encre passait
     de 72 à 150 px ; le carré de l'angle droit de 22 % à 52 % ; deux arcs
     distants de 5 px traçés à 4,4 px n'en faisaient plus qu'un.
     On mesure le signe SEUL : la scène est rendue sans lui, puis avec, et
     l'on ne garde que les pixels qui ont changé — le trait qui le porte ne
     compte donc jamais.
     ================================================================ */
  console.log('\n=== un petit signe grossit tout entier ===');
  const signes = await page.evaluate(() => {
    const a = window.app;
    a.checkAutoSave = () => {};
    const encreDe = (poser, cx, cy, demi) => {
      a.render();
      const v = a.view, c = a.canvas.getContext('2d');
      const x0 = Math.round(v.x + (cx - demi) * v.zoom), y0 = Math.round(v.y + (cy - demi) * v.zoom);
      const L = 2 * demi;
      const avant = c.getImageData(x0, y0, L, L).data;
      poser();
      a.render();
      const apres = c.getImageData(x0, y0, L, L).data;
      let n = 0, xmin = 1e9, xmax = -1, ymin = 1e9, ymax = -1;
      for (let j = 0; j < L; j++) for (let i = 0; i < L; i++) {
        const k = (j * L + i) * 4;
        const d = Math.abs(apres[k] - avant[k]) + Math.abs(apres[k + 1] - avant[k + 1])
                + Math.abs(apres[k + 2] - avant[k + 2]) + Math.abs(apres[k + 3] - avant[k + 3]);
        if (d > 60) { n++; if (i < xmin) xmin = i; if (i > xmax) xmax = i;
                      if (j < ymin) ymin = j; if (j > ymax) ymax = j; }
      }
      if (!n) return null;
      const bl = xmax - xmin + 1, bh = ymax - ymin + 1;
      return { l: bl, h: bh, encre: n, plein: Math.round(100 * n / (bl * bh)) };
    };
    const un = (projo) => {
      a.facteurProjection = projo ? 2.2 : 1;
      const out = {};
      a.entities = [];
      const A = new Point(300, 400); A.showLabel = false;
      out.croix = encreDe(() => a.entities.push(A), 300, 400, 30);
      a.entities = [];
      const B = new Point(300, 400), C = new Point(700, 400);
      B.showLabel = false; C.showLabel = false;
      const sg = new Segment(B, C); a.entities.push(B, C, sg);
      out.codage = encreDe(() => { sg.coding = 'mark-2'; }, 500, 400, 30);
      /* DEUX BARRES DOIVENT RESTER DEUX. « mark-2 » pose ses barres à ±2 px :
         tracées à 4,4 px d'épaisseur elles se recouvrent, et le codage « ‖ »
         devient un « | » épais — c'est-à-dire un AUTRE codage. On balaie en
         travers, 4 px au-dessus du trait : assez haut pour ne pas compter le
         trait lui-même (épais de 2 px, 4,4 en projection), assez bas pour
         rester dans la marque, qui ne monte qu'à 6 px sans projection. */
      {
        const v = a.view, c = a.canvas.getContext('2d');
        let bandes = 0, dedans = false;
        for (let dx = -14; dx <= 14; dx += 0.5) {
          const x = Math.round(v.x + (500 + dx) * v.zoom);
          const y = Math.round(v.y + (400 - 4) * v.zoom);
          const d = c.getImageData(x, y, 1, 1).data;
          const encre = d[3] > 60 && (d[0] + d[1] + d[2]) < 560;
          if (encre && !dedans) bandes++;
          dedans = encre;
        }
        out.barres = bandes;
      }
      a.entities = [];
      const O = new Point(400, 500), P = new Point(600, 500), Q = new Point(400, 300);
      [O, P, Q].forEach(p => p.showLabel = false);
      a.entities.push(O, P, Q);
      out.droit = encreDe(() => a.entities.push(new Angle(P, O, Q)), 420, 480, 45);
      a.entities = [];
      const O2 = new Point(400, 500), P2 = new Point(650, 500), Q2 = new Point(560, 300);
      [O2, P2, Q2].forEach(p => p.showLabel = false);
      a.entities.push(O2, P2, Q2);
      const ang2 = new Angle(P2, O2, Q2); ang2.arcCount = 2; ang2.showValue = false;
      out.arcs = encreDe(() => a.entities.push(ang2), 425, 480, 50);
      /* DEUX ARCS DOIVENT RESTER DEUX. On part du sommet et l'on avance le
         long de la bissectrice en comptant les bandes d'encre traversées :
         il doit y en avoir DEUX. À 5 px d'écart et 4,4 px d'épaisseur, il
         n'en restait qu'une, épaisse — et la mesure du remplissage, elle,
         ne l'aurait pas dit. */
      {
        /* On ôte les points : en projection leur croix mesure 30 px et le rayon
           la traverserait — une troisième bande d'encre qui n'est pas un arc. */
        [O2, P2, Q2].forEach(p => { p.visible = false; });
        a.render();
        const v = a.view, c = a.canvas.getContext('2d');
        const a1 = Math.atan2(P2.y - O2.y, P2.x - O2.x);
        const a2 = Math.atan2(Q2.y - O2.y, Q2.x - O2.x);
        const mid = (a1 + a2) / 2;
        let bandes = 0, dedans = false;
        /* On part à 14 px du sommet : les deux rayons qui ferment le secteur
           s'y rejoignent, et leur encre — épaisse en projection — compterait
           pour une bande qui n'est pas un arc. Relevé : sans projection, les
           arcs sont à 24-26 et 29-31 px ; avec, à 22-27 et 34-38. */
        for (let t = 14; t < 90; t += 0.5) {
          const x = Math.round(v.x + (O2.x + Math.cos(mid) * t) * v.zoom);
          const y = Math.round(v.y + (O2.y + Math.sin(mid) * t) * v.zoom);
          const d = c.getImageData(x, y, 1, 1).data;
          const encre = d[3] > 60 && (d[0] + d[1] + d[2]) < 560;
          if (encre && !dedans) bandes++;
          dedans = encre;
        }
        out.arcsSepares = bandes;
        [O2, P2, Q2].forEach(p => { p.visible = true; });
      }
      return out;
    };
    const normal = un(false), projection = un(true);
    a.facteurProjection = 1; a.entities = []; a.render();
    return { normal, projection };
  });
  const NOMS = { croix: 'la croix d\'un point', codage: 'le codage ‖ d\'un segment',
                 droit: 'le carré de l\'angle droit', arcs: 'deux arcs d\'angle' };
  Object.keys(NOMS).forEach(k => {
    const a = signes.normal[k], b = signes.projection[k];
    if (!a || !b) { ck(NOMS[k], false, 'rien mesuré'); return; }
    /* L'arc d'angle, LUI, garde son rayon : un codage d'angle qui doublerait
       de taille irait se poser sur la figure. C'est son ÉCART qui grandit,
       et c'est la séparation des arcs qu'on vérifie juste après. */
    if (k !== 'arcs') {
      ck(NOMS[k] + ' grandit vraiment', b.l >= a.l * 1.3 || b.h >= a.h * 1.3,
         `${a.l}×${a.h} → ${b.l}×${b.h}`);
    }
    ck((k === 'arcs' ? NOMS[k] + ' :' : ' ') + ' il garde sa forme, il ne se remplit pas',
       b.plein - a.plein <= 10,
       `${a.plein} % d'encre sans projection, ${b.plein} % avec`);
  });
  ck('et le codage ‖ garde SES DEUX barres, projeté ou non',
     signes.normal.barres === 2 && signes.projection.barres === 2,
     `${signes.normal.barres} barre(s) sans projection, ${signes.projection.barres} avec`);
  ck('et deux arcs restent DEUX arcs, projetés ou non',
     signes.normal.arcs && signes.projection.arcsSepares === 2
       && signes.normal.arcsSepares === 2,
     `${signes.normal.arcsSepares} bande(s) d'encre sans projection, `
       + `${signes.projection.arcsSepares} avec`);

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

  console.log('\n=== l\'écartement du compas se lit pendant le rejeu ===');
  /* On ne l'affichait qu'en tirant la pastille à la main : la construction
     jouée devant la classe montrait le compas s'ouvrir SANS DIRE DE COMBIEN,
     alors que c'est justement la mesure qu'on est en train de prendre. On
     espionne fillText : c'est le seul moyen sûr de dire si l'étiquette est
     peinte, plutôt que de compter des pixels sur le corps de l'instrument. */
  await page.evaluate(() => {
    const proto = CanvasRenderingContext2D.prototype;
    const vrai = proto.fillText;
    window.__cm = [];
    proto.fillText = function (t, ...r) { window.__cm.push(String(t)); return vrai.call(this, t, ...r); };
  });
  const mesures = () => page.evaluate(() => {
    window.__cm = []; window.app.render();
    return window.__cm.filter(t => /\d\s*cm$/.test(t));
  });
  await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm', true);
    app.isPlaying = false; app.isLooping = false;
    // on se pose juste après l'animation qui OUVRE le compas
    const i = app.entities.findIndex(e => e.constructor.name === 'ToolAnimation'
      && e.widgetType === 'compass' && e.startState && e.endState
      && Math.abs((e.endState.radius || 0) - (e.startState.radius || 0)) > 20);
    app.replayIndex = i + 1; app.fastForward(i + 1);
  });
  const pendant = await mesures();
  ck('pendant le rejeu, l\'écartement est écrit', pendant.length === 1 && /^4\s*cm$/.test(pendant[0]),
     JSON.stringify(pendant));
  /* Et il ne traîne pas après : le rejeu fini, le compas repris à la main est
     un instrument libre, comme avant. */
  await page.evaluate(() => {
    const app = window.app;
    app.replayIndex = app.entities.length; app.fastForward(app.entities.length);
    app.activeWidgets.compass = true;
    app.compassWidget.x = 600; app.compassWidget.y = 500;
    app.compassWidget.angle = 0; app.compassWidget.radius = 200;
  });
  ck('le rejeu fini, le compas à la main n\'écrit rien', (await mesures()).length === 0);
  await page.evaluate(() => { window.app.replayIndex = null; });
  ck('hors de tout rejeu non plus', (await mesures()).length === 0);
  await page.evaluate(() => { window.app.isExporting = true; window.app.replayIndex = 3; });
  ck('et l\'étiquette ne part pas à l\'export', (await mesures()).length === 0);
  await page.evaluate(() => { window.app.isExporting = false; });

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
