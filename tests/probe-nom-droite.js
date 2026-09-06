// LE NOM D'UNE DROITE, ET LE TREMBLEMENT DE LA SÉLECTION.
//
// Deux choses signalées ensemble, et qui tiennent toutes deux au geste :
//
// 1. « Quand on trace une droite on peut l'appeler par une lettre minuscule, et
//    on peut déplacer le nom le long de la droite. » On ne pouvait nommer une
//    droite que par la consigne (« Trace une droite d ») ; une droite tracée à
//    la main restait anonyme, et le nom, cloué au second point, tombait parfois
//    sur un autre trait sans qu'on puisse l'écarter.
//
// 2. « Quand on sélectionne plusieurs points et qu'on déplace, la figure
//    tremble. » Mesuré : le déplacement suivait la position AIMANTÉE du
//    curseur. Dès qu'on passait à moins de 12 px d'un point de la feuille, le
//    curseur sautait dessus et la figure entière avec lui — au lieu de 3 px par
//    image, +14 px puis +13 px, trois fois de suite.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1400, height: 950 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(2200);
  /* La fenêtre « une sauvegarde a été trouvée » s'ouvre après coup : si elle
     arrive au milieu d'un glissé, elle couvre le canevas et le geste s'arrête. */
  await page.evaluate(() => {
    const m = document.getElementById('customModal');
    if (m && getComputedStyle(m).display !== 'none') window.app.closeModal();
  });

  const repere = await page.evaluate(() => {
    const r = window.app.canvas.getBoundingClientRect();
    return { cl: r.left, ct: r.top, view: window.app.view };
  });
  const S = (x, y) => ({ x: repere.cl + (x * repere.view.zoom + repere.view.x),
                         y: repere.ct + (y * repere.view.zoom + repere.view.y) });

  console.log('\n=== la figure ne tremble plus quand on la déplace ===');
  /* On tire une sélection le long d'une rangée de points fixes, POSÉS HORS du
     cadre et exactement sur la trajectoire du curseur : c'est le cas qui
     déclenchait l'aimant. */
  await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    const P = {};
    [['A', 560, 430], ['B', 760, 430], ['C', 660, 300]].forEach(([n, x, y]) => {
      P[n] = new Point(x, y, n); app.addEntity(P[n]);
    });
    ['AB', 'BC', 'CA'].forEach(s =>
      app.addEntity(new Segment(P[s[0]], P[s[1]], { color: '#000', width: 2 })));
    [[800, 447], [830, 457], [860, 467], [890, 477]].forEach(([x, y], i) =>
      app.addEntity(new Point(x, y, 'PQRS'[i])));
    app.setTool('move'); app.render();
    app.JOURNAL = [];
    const vrai = app.deplacerSelection.bind(app);
    app.deplacerSelection = function (dx, dy) {
      vrai(dx, dy);
      const A = app.entities.find(e => e instanceof Point && e.label === 'A');
      app.JOURNAL.push({ aim: !!app.mousePos.snapped, x: Math.round(A.x * 100) / 100 });
    };
  });
  const a = S(540, 280), z = S(778, 448);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(a.x + (z.x - a.x) * i / 6, a.y + (z.y - a.y) * i / 6);
    await page.waitForTimeout(14);
  }
  await page.mouse.up(); await page.waitForTimeout(40);
  const sel = await page.evaluate(() => window.app.selection.length);
  ck('le cadre prend le triangle entier, et lui seul', sel === 6, sel + ' objets');
  await page.evaluate(() => { window.app.JOURNAL = []; });
  const c = S(660, 400);
  await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.waitForTimeout(30);
  for (let i = 1; i <= 80; i++) {
    await page.mouse.move(c.x + i * 3, c.y + i * 1); await page.waitForTimeout(13);
  }
  await page.mouse.up();
  const j = await page.evaluate(() => window.app.JOURNAL);
  const pas = [];
  for (let i = 1; i < j.length; i++) pas.push(Math.round((j[i].x - j[i - 1].x) * 100) / 100);
  const aimantes = j.filter(e => e.aim).length;
  const horsClous = pas.filter(d => d < 2.5 || d > 3.5);
  console.log('  ' + j.length + ' images, dont ' + aimantes + ' où le curseur était aimanté ;'
    + ' pas mesurés : min ' + Math.min(...pas) + ', max ' + Math.max(...pas));
  /* Sans le passage devant les points fixes, la sonde ne prouverait rien. */
  ck('le curseur passe bien devant des points qui l\'aimantent', aimantes >= 5,
     aimantes + ' images aimantées');
  ck('ET LA FIGURE AVANCE DE 3 PX PAR IMAGE, sans un seul soubresaut',
     horsClous.length === 0, horsClous.length + ' pas hors de [2,5 ; 3,5] : '
     + horsClous.slice(0, 6).join(' '));

  console.log('\n=== le nom d\'une droite se déplace comme le nom d\'un point ===');
  /* « On peut toujours bouger le nom d'un point, il faut qu'il en soit de même
     pour la droite. » Donc : librement — le long du trait ET de part et d'autre,
     et avec n'importe quel outil en main, pas seulement le curseur. */
  const depart = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    const A = new Point(450, 400, 'A'), B = new Point(900, 520, 'B');
    app.addEntity(A); app.addEntity(B);
    const d = new Line(A, B, { color: '#000', width: 2 });
    d.nomDroite = 'd'; app.addEntity(d);
    app.setTool('move'); app.render();
    const anc = d.ancreNomDroite(d.p2);
    return { nomT: d.nomT, nomD: d.nomD, ancre: [anc.x, anc.y],
             p1: [d.p1.x, d.p1.y], p2: [d.p2.x, d.p2.y] };
  });
  /* nomT = 1 et nomD = 14 par défaut : le nom se pose exactement là où il se
     posait avant qu'on puisse le déplacer. */
  ck('par défaut, le nom est au bout de la droite, comme avant',
     depart.nomT === undefined && depart.nomD === undefined,
     'nomT = ' + depart.nomT + ', nomD = ' + depart.nomD);
  const cote = (p1, p2, x, y) => {
    const vx = p2[0] - p1[0], vy = p2[1] - p1[1], n = Math.hypot(vx, vy) || 1;
    return ((x - p1[0]) * vy - (y - p1[1]) * vx) / n;   // signé : de quel côté
  };
  const coteAvant = cote(depart.p1, depart.p2, depart.ancre[0], depart.ancre[1]);
  const A0 = S(depart.ancre[0], depart.ancre[1]);
  /* On le tire vers le début du trait ET de l'autre côté. */
  const ux = (depart.p2[0] - depart.p1[0]), uy = (depart.p2[1] - depart.p1[1]);
  const L = Math.hypot(ux, uy);
  const vise = { x: depart.p1[0] + ux * 0.35 + (uy / L) * 40,
                 y: depart.p1[1] + uy * 0.35 - (ux / L) * 40 };
  const V = S(vise.x, vise.y);
  await page.mouse.move(A0.x, A0.y); await page.mouse.down(); await page.waitForTimeout(20);
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(A0.x + (V.x - A0.x) * i / 8, A0.y + (V.y - A0.y) * i / 8);
    await page.waitForTimeout(14);
  }
  await page.mouse.up(); await page.waitForTimeout(40);
  const glisse = await page.evaluate(() => {
    const d = window.app.entities.find(e => e.nomDroite === 'd');
    const anc = d.ancreNomDroite(d.p2);
    return { nomT: Math.round(d.nomT * 100) / 100, nomD: Math.round(d.nomD),
             ancre: [anc.x, anc.y] };
  });
  const coteApres = cote(depart.p1, depart.p2, glisse.ancre[0], glisse.ancre[1]);
  ck('on l\'attrape et il GLISSE le long de la droite',
     Math.abs(glisse.nomT - 0.35) < 0.08, 'nomT = ' + glisse.nomT);
  ck('  et il passe DE L\'AUTRE CÔTÉ du trait, comme la lettre d\'un point',
     coteAvant * coteApres < 0 && Math.abs(coteApres) > 25,
     'de ' + Math.round(coteAvant) + ' px à ' + Math.round(coteApres) + ' px');
  /* Une lettre de point se déplace avec n'importe quel outil en main. */
  const autreOutil = await page.evaluate(() => {
    const app = window.app; app.setTool('segment');
    const d = app.entities.find(e => e.nomDroite === 'd');
    const anc = d.ancreNomDroite(d.p2);
    return { ancre: [anc.x, anc.y], avant: Math.round(d.nomD) };
  });
  const P0 = S(autreOutil.ancre[0], autreOutil.ancre[1]);
  await page.mouse.move(P0.x, P0.y); await page.mouse.down(); await page.waitForTimeout(25);
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(P0.x - i * 8, P0.y - i * 5); await page.waitForTimeout(14);
  }
  await page.mouse.up(); await page.waitForTimeout(40);
  const apresOutil = await page.evaluate(() => {
    const app = window.app;
    const d = app.entities.find(e => e.nomDroite === 'd');
    return { nomD: Math.round(d.nomD), objets: app.entities.length };
  });
  ck('  et le geste marche avec un AUTRE outil que le curseur',
     apresOutil.nomD !== autreOutil.avant,
     'outil segment : nomD ' + autreOutil.avant + ' → ' + apresOutil.nomD);
  ck('  sans que cet outil ne trace quoi que ce soit au passage',
     apresOutil.objets === 3, apresOutil.objets + ' objets sur la feuille');

  console.log('\n=== la police du nom ===');
  const police = await page.evaluate(() => {
    const vues = [];
    const vrai = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', {
      set(v) { vues.push(v); vrai.set.call(this, v); },
      get() { return vrai.get.call(this); }, configurable: true,
    });
    window.app.render();
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', vrai);
    return vues.filter(f => /italic/.test(f));
  });
  ck('en italique comme au cours, et PAS en gras',
     police.length > 0 && police.every(f => !/bold/.test(f)), police.join(' | '));

  console.log('\n=== nommer une droite tracée à la main ===');
  /* Une droite tracée sans consigne restait anonyme pour toujours. */
  await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    const A = new Point(500, 400, 'A'), B = new Point(800, 500, 'B');
    app.addEntity(A); app.addEntity(B);
    app.addEntity(new Line(A, B, { color: '#000', width: 2 }));
    app.setTool('move'); app.render();
  });
  const M = S(650, 450);
  await page.mouse.dblclick(M.x, M.y); await page.waitForTimeout(150);
  const champ = await page.evaluate(() => {
    const i = window.app.activeRenameInput;
    return i ? { ph: i.placeholder, val: i.value } : null;
  });
  ck('un double-clic sur la droite ouvre de quoi la nommer',
     !!champ && champ.ph === 'd', JSON.stringify(champ));
  if (champ) { await page.keyboard.type("d'"); await page.keyboard.press('Enter'); }
  await page.waitForTimeout(80);
  const ecrit = await page.evaluate(() => {
    const d = window.app.entities.find(e => e instanceof Line);
    const vus = []; const vrai = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t, x, y) {
      vus.push(String(t)); return vrai.call(this, t, x, y);
    };
    window.app.render();
    CanvasRenderingContext2D.prototype.fillText = vrai;
    return { nom: d.nomDroite, vus };
  });
  ck('  la minuscule est acceptée et ÉCRITE sur la figure',
     ecrit.nom === "d'" && ecrit.vus.includes("d'"), ecrit.nom + ' — ' + ecrit.vus.join(' '));
  /* Deux droites du même nom, et « la perpendiculaire à d » ne désigne plus rien. */
  const refus = await page.evaluate(() => {
    const app = window.app;
    const C = new Point(500, 700, 'C'), D = new Point(800, 750, 'D');
    app.addEntity(C); app.addEntity(D);
    const d2 = new Line(C, D, { color: '#000', width: 2 }); app.addEntity(d2);
    app.nommerDroite(d2, 400, 400);
    const i = app.activeRenameInput; i.value = "d'"; i.onblur = null;
    i.onkeydown({ key: 'Enter', preventDefault() {}, stopPropagation() {} });
    return d2.nomDroite || null;
  });
  ck('  un nom déjà pris est refusé, pas attribué deux fois', refus === null,
     String(refus));

  console.log('\n=== le nom et sa place voyagent avec la figure ===');
  const voyage = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace une droite d', false);
    const d = app.entities.find(e => e.nomDroite === 'd');
    d.nomT = 0.3; d.nomD = -38;
    const code = app.codeDocument();
    app.entities = []; app.render();
    app.loadFromCompressedString(code);
    const apresCode = app.entities.find(e => e.nomDroite === 'd');
    return apresCode ? { nom: apresCode.nomDroite,
                         nomT: Math.round(apresCode.nomT * 100) / 100,
                         nomD: Math.round(apresCode.nomD) } : null;
  });
  ck('par le code compact : le nom ET sa place reviennent',
     voyage && voyage.nom === 'd' && voyage.nomT === 0.3 && voyage.nomD === -38,
     JSON.stringify(voyage));

  console.log('\n=== un cercle de 3 cm reste un cercle de 3 cm ===');
  /* Un cercle se retient par son centre et un point du bord qui règle le rayon.
     Ce second point est libre et caché : en tirant le CENTRE, il restait sur
     place et le rayon changeait. Mesuré : « le cercle de centre A et de rayon
     3 cm » passait à 4,7 cm après 80 px. Ce n'est pas un déplacement, c'est une
     déformation. */
  const av = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace le cercle de centre A et de rayon 3 cm', false);
    app.setTool('move'); app.render();
    const A = app.entities.find(e => e instanceof Point && e.label === 'A');
    const c = app.entities.find(e => e instanceof Circle);
    return { x: A.x, y: A.y,
             r: Math.round(Math.hypot(c.p2.x - c.p1.x, c.p2.y - c.p1.y)) };
  });
  const D0 = S(av.x, av.y);
  await page.mouse.move(D0.x, D0.y); await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(D0.x - i * 10, D0.y - i * 6); await page.waitForTimeout(15);
  }
  await page.mouse.up(); await page.waitForTimeout(60);
  const ap = await page.evaluate(() => {
    const app = window.app;
    const A = app.entities.find(e => e instanceof Point && e.label === 'A');
    const c = app.entities.find(e => e instanceof Circle);
    return { bouge: Math.round(Math.hypot(c.p1.x - c.p2.x, c.p1.y - c.p2.y)),
             x: A.x, y: A.y };
  });
  const parcouru = Math.round(Math.hypot(ap.x - av.x, ap.y - av.y));
  ck('on tire le centre : le cercle SUIT sans changer de rayon',
     parcouru > 60 && ap.bouge === av.r,
     'tiré de ' + parcouru + ' px — rayon ' + av.r + ' px → ' + ap.bouge + ' px');

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
