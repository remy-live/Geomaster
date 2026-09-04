// Le codage d'un milieu : deux traits, un sur chaque moitié — portés par le
// milieu lui-même, et ne disant que ce qu'ils doivent dire.
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
  const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  /* A et B posés à la main, horizontalement : les marques doivent alors tomber
     exactement au quart et aux trois quarts, et cela se lit en pixels. */
  const figure = (phrases, instruments) => page.evaluate(([ph, ins]) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app._cslSujet = null;
    app.view = { x: 0, y: 0, zoom: 1 }; app.saveState();
    ph.forEach(p => app.executerConsigneAvec(p, !!ins));
    app.isPlaying = false; app.isLooping = false; app.isToolAnimating = false;
    app.render();
    const nom = (p) => (p && p.label) ? p.label : '·';
    return {
      segs: app.entities.filter(e => e.constructor.name === 'Segment').map(s => ({
        n: '[' + nom(s.p1) + nom(s.p2) + ']',
        L: +(Math.hypot(s.p1.x - s.p2.x, s.p1.y - s.p2.y) / 50).toFixed(2),
        c: s.coding || null })),
      milieux: app.entities.filter(e => e.constructor.name === 'Point' && e.codageMilieu)
        .map(p => ({ n: nom(p), c: p.codageMilieu,
                     entre: (p.parents || []).map(nom).join('') })),
      angles: app.entities.filter(e => e.constructor.name === 'Angle')
        .map(a => Math.round(a.getAngleValue())),
      objets: app.entities.length,
    };
  }, [phrases, instruments]);

  const poser = () => page.evaluate(() => {
    const app = window.app;
    const pt = (n) => app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
    const A = pt('A'), B = pt('B');
    A.x = 300; A.y = 400; B.x = 700; B.y = 400;
  });

  console.log('\n=== « Place le milieu I de [AB] » : le milieu est codé ===');
  await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.saveState(); app.view = { x: 0, y: 0, zoom: 1 };
    app.executerConsigne('Place les points A, B');
  });
  await poser();
  const mil = await page.evaluate(() => {
    const app = window.app;
    app.executerConsigne('Trace [AB]');
    app.executerConsigne('Place le milieu I de [AB]');
    app.render();
    const I = app.entities.find(e => e.constructor.name === 'Point' && e.label === 'I');
    return { code: I.codageMilieu || null,
             segs: app.entities.filter(e => e.constructor.name === 'Segment').length };
  });
  console.log('  ' + JSON.stringify(mil));
  ck('le milieu porte le codage', mil.code === 'mark-1', String(mil.code));
  /* ON NE COUPE PAS LE SEGMENT EN DEUX. Au tableau, le professeur trace [AB]
     une fois et pose un trait sur chaque moitié. Deux segments posés l'un
     contre l'autre, c'est l'encre tracée deux fois et trois objets à
     sélectionner là où il y en a un. */
  ck('et [AB] reste UN seul segment', mil.segs === 1, `${mil.segs} segments`);

  console.log('\n=== les deux traits tombent au quart et aux trois quarts ===');
  const px = await page.evaluate(() => {
    const x = document.getElementById('geoCanvas').getContext('2d');
    // combien de pixels encrés sur la verticale, autour du trait
    const colonne = (px) => {
      let n = 0;
      for (let y = 390; y <= 410; y++) {
        const d = x.getImageData(px, y, 1, 1).data;
        if (d[3] > 0 && d[0] < 200) n++;
      }
      return n;
    };
    return { quart: colonne(400), troisQuarts: colonne(600),
             ailleurs1: colonne(350), ailleurs2: colonne(650) };
  });
  console.log('  pixels encrés sur 21 lignes : ' + JSON.stringify(px));
  ck('un trait au quart', px.quart >= 10, String(px.quart));
  ck('un trait aux trois quarts', px.troisQuarts >= 10, String(px.troisQuarts));
  ck('et rien entre les deux', px.ailleurs1 <= 3 && px.ailleurs2 <= 3,
     `${px.ailleurs1} / ${px.ailleurs2}`);

  console.log('\n=== l\'OUTIL milieu code aussi ===');
  /* Le codage n'appartient pas au chemin qu'on a pris pour le demander : deux
     clics avec l'outil milieu doivent donner les mêmes deux traits que la
     phrase « Place le milieu I de [AB] ». */
  await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.saveState(); app.view = { x: 0, y: 0, zoom: 1 };
    app.executerConsigne('Place les points A, B');
  });
  await poser();
  await page.evaluate(() => {
    const app = window.app;
    app.executerConsigne('Trace [AB]');
    app.setTool('midpoint'); app.creationStartPoint = null; app.render();
  });
  const rc = await page.evaluate(() => {
    const r = window.app.canvas.getBoundingClientRect(); return { x: r.left, y: r.top };
  });
  await page.mouse.move(rc.x + 500, rc.y + 400);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(200);
  const outil = await page.evaluate(() => {
    const app = window.app; app.render();
    const m = app.entities.filter(e => e.constructor.name === 'Point' && (e.parents || []).length === 2);
    const x = document.getElementById('geoCanvas').getContext('2d');
    const col = (px) => { let n = 0; for (let y = 390; y <= 410; y++) {
      const d = x.getImageData(px, y, 1, 1).data; if (d[3] > 0 && d[0] < 200) n++; } return n; };
    return { milieux: m.map(p => ({ n: p.label, c: p.codageMilieu || null })),
             quart: col(400), troisQuarts: col(600) };
  });
  console.log('  ' + JSON.stringify(outil));
  ck('un clic sur le segment pose un milieu codé',
     outil.milieux.length === 1 && outil.milieux[0].c === 'mark-1', JSON.stringify(outil.milieux));
  ck('et ses deux traits sont tracés',
     outil.quart >= 10 && outil.troisQuarts >= 10, `${outil.quart} / ${outil.troisQuarts}`);
  await page.evaluate(() => window.app.setTool('select'));

  console.log('\n=== sans trait tracé, rien à coder ===');
  /* Deux marques flottant dans le vide ne voudraient rien dire. */
  const sansTrait = await figure(['Place les points A, B', 'Place le milieu I de [AB]']);
  console.log('  ' + JSON.stringify(sansTrait));
  ck('le milieu existe mais n\'est pas codé', sansTrait.milieux.length === 0);

  console.log('\n=== la médiatrice dit ce qu\'elle est ===');
  /* Une médiatrice DIT deux choses : elle coupe [AB] en son milieu, et elle lui
     est perpendiculaire. Sans les marques ni l'angle droit, la figure ne montre
     qu'une droite qui passe par là. */
  const med = await figure(['Place les points A, B', 'Trace [AB]', 'Trace la médiatrice de [AB]']);
  console.log('  ' + JSON.stringify(med));
  ck('elle code le milieu', med.milieux.length === 1 && med.milieux[0].c === 'mark-1',
     JSON.stringify(med.milieux));
  ck('et pose l\'angle droit', med.angles.filter(a => a === 90).length === 1,
     JSON.stringify(med.angles));
  ck('sans couper [AB]', med.segs.length === 1, JSON.stringify(med.segs));

  console.log('\n=== aux instruments non plus, [AB] n\'est pas doublé ===');
  const medi = await figure(['Place les points A, B', 'Trace [AB]', 'Trace la médiatrice de [AB]'], true);
  console.log('  ' + JSON.stringify(medi.segs) + ' — ' + JSON.stringify(medi.milieux));
  ck('un seul segment, pas trois', medi.segs.length === 1, JSON.stringify(medi.segs));
  ck('et le milieu porte les marques', medi.milieux.length === 1, JSON.stringify(medi.milieux));

  console.log('\n=== trois médiatrices : une marque par côté ===');
  /* Coder les trois milieux d'un même trait dirait que les six moitiés sont
     égales entre elles : c'est faux dès que le triangle n'est pas équilatéral. */
  const trois = await figure(['Trace un triangle ABC', 'Trace les médiatrices du triangle ABC']);
  console.log('  ' + JSON.stringify(trois.milieux));
  ck('les trois côtés sont codés', trois.milieux.length === 3, String(trois.milieux.length));
  ck('chacun avec SA marque',
     new Set(trois.milieux.map(m => m.c)).size === 3, trois.milieux.map(m => m.c).join(' '));

  console.log('\n=== et les milieux des côtés, de même ===');
  const mils = await figure(['Trace un triangle ABC', 'Place les milieux des côtés du triangle ABC']);
  console.log('  ' + JSON.stringify(mils.milieux));
  ck('trois milieux nommés et codés',
     mils.milieux.length === 3 && new Set(mils.milieux.map(m => m.c)).size === 3,
     JSON.stringify(mils.milieux.map(m => m.n + ':' + m.c)));

  console.log('\n=== LE CODAGE NE PARLE QUE DE CE QU\'ON VIENT DE CONSTRUIRE ===');
  /* La règle « même longueur ⇒ même marque » est vraie d'une figure qu'on vient
     de bâtir. Appliquée à toute la feuille, elle affirmait l'égalité de deux
     traits sans rapport : un [CD] posé ailleurs recevait la marque des moitiés
     d'un segment coupé par sa médiatrice. */
  const etranger = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.saveState(); app.view = { x: 0, y: 0, zoom: 1 };
    app.executerConsigne('Place les points A, B');
    const pt = (n) => app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
    const A = pt('A'), B = pt('B'); A.x = 100; A.y = 400; B.x = 310; B.y = 400;
    app.executerConsigne('Trace [AB]');
    app.executerConsigne('Place les points C, D');
    const C = pt('C'), D = pt('D');
    // [CD] fait exactement la moitié de [AB] — et n'a aucun rapport avec elle
    C.x = 700; C.y = 700; D.x = 805; D.y = 700;
    app.executerConsigne('Trace [CD]');
    app.executerConsigneAvec('Trace la médiatrice de [AB]', true);
    app.isPlaying = false; app.isLooping = false;
    return app.entities.filter(e => e.constructor.name === 'Segment').map(s => ({
      n: '[' + (s.p1.label || '·') + (s.p2.label || '·') + ']',
      L: +(Math.hypot(s.p1.x - s.p2.x, s.p1.y - s.p2.y) / 50).toFixed(2),
      c: s.coding || null }));
  });
  console.log('  ' + JSON.stringify(etranger));
  const cd = etranger.find(s => s.n === '[CD]');
  ck('un segment étranger de même longueur n\'est pas codé', cd && cd.c === null,
     JSON.stringify(cd));

  console.log('\n=== mais ce qu\'une construction affirme reste codé ===');
  /* Les côtés d'un carré sont égaux PAR CONSTRUCTION : là, le codage est vrai. */
  const carre = await figure(['Trace un carré ABCD de 3 cm de côté']);
  console.log('  ' + JSON.stringify(carre.segs));
  ck('les quatre côtés du carré portent la même marque',
     carre.segs.length === 4 && carre.segs.every(s => s.c === 'mark-1'),
     JSON.stringify(carre.segs.map(s => s.c)));

  console.log('\n=== ce qui est caché le reste ===');
  /* Un point de construction caché — celui d'une médiatrice, le centre d'un
     cercle de diamètre — se rallumait dès qu'on déplaçait une extrémité, et à
     chaque relecture d'un fichier : une croix parasite apparaissait sur la
     figure au premier geste de l'élève. Un milieu existe toujours ; sa mise à
     jour n'a rien à rétablir. */
  const cache = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.saveState();
    app.executerConsigne('Place les points A, B');
    app.executerConsigne('Trace [AB]');
    app.executerConsigne('Trace la médiatrice de [AB]');
    const m = app.entities.find(e => e.constructor.name === 'Point' && !e.label);
    const avant = m.visible;
    const A = app.entities.find(e => e.constructor.name === 'Point' && e.label === 'A');
    A.x += 40; A.y += 15;
    app.entities.forEach(e => { if (e.update) e.update(); });
    const apresGlisser = m.visible;
    const relu = app.deserialize(app.serialize());
    const m2 = relu.find(e => e.constructor.name === 'Point' && !e.label);
    return { avant, apresGlisser, apresRelecture: m2 ? m2.visible : null };
  });
  console.log('  ' + JSON.stringify(cache));
  ck('le milieu d\'une médiatrice est caché', cache.avant === false, String(cache.avant));
  ck('déplacer une extrémité ne le rallume pas', cache.apresGlisser === false,
     String(cache.apresGlisser));
  ck('relire le fichier non plus', cache.apresRelecture === false, String(cache.apresRelecture));

  console.log('\n=== le codage voyage : sauvegarde, export, fichier d\'avant ===');
  const voyage = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.saveState(); app.view = { x: 0, y: 0, zoom: 1 };
    app.executerConsigne('Place les points A, B');
    const pt = (n) => app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
    const A = pt('A'), B = pt('B'); A.x = 300; A.y = 400; B.x = 700; B.y = 400;
    app.executerConsigne('Trace [AB]');
    app.executerConsigne('Trace la médiatrice de [AB]');
    const code = app.serialize();
    const relu = app.deserialize(code);
    const m = relu.find(e => e.constructor.name === 'Point' && e.codageMilieu);
    const svg = app.generateSVGString(false, 'none');
    /* Un fichier écrit AVANT ce codage n'a pas le champ : il doit s'ouvrir
       sans rien casser, et sans marque. */
    const vieux = JSON.parse(code).map(o => { delete o.codageMilieu; return o; });
    const ancien = app.deserialize(JSON.stringify(vieux));
    return { relu: m ? m.codageMilieu : null,
             parents: m ? (m.parents || []).length : 0,
             marquesSVG: (svg.match(/M 0 -6 L 0 6/g) || []).length,
             posesSVG: [...svg.matchAll(/translate\((\d+(?:\.\d+)?),\d/g)].map(x => x[1]),
             ancienOK: ancien.length === relu.length,
             ancienCode: ancien.some(e => e.codageMilieu) };
  });
  console.log('  ' + JSON.stringify(voyage));
  ck('la sauvegarde garde le codage et ses deux parents',
     voyage.relu === 'mark-1' && voyage.parents === 2, JSON.stringify(voyage.relu));
  ck('l\'export SVG porte les deux traits', voyage.marquesSVG === 2, String(voyage.marquesSVG));
  ck('posés au quart et aux trois quarts',
     voyage.posesSVG.includes('400') && voyage.posesSVG.includes('600'),
     JSON.stringify(voyage.posesSVG));
  ck('un fichier d\'avant s\'ouvre, simplement sans marque',
     voyage.ancienOK && voyage.ancienCode === false,
     `${voyage.ancienOK} / ${voyage.ancienCode}`);

  /* LE CODAGE DU MILIEU ET CELUI DU SEGMENT COEXISTENT. Le premier dit
     AI = IB, le second dit que [AB] égale un autre trait : ce sont deux
     affirmations, et la rangée de marques doit s'ouvrir pour l'un comme pour
     l'autre. Elle ne s'ouvrait que pour les segments. */
  console.log('\n=== le milieu ET le segment, chacun sa marque ===');
  const duo = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    app.view = { x: 0, y: 0, zoom: 1 };
    const A = new Point(200, 200, 'A'), B = new Point(500, 200, 'B');
    app.addEntity(A); app.addEntity(B);
    const s = new Segment(A, B); app.addEntity(s);
    const I = app.poserMilieu(A, B);
    // un second trait de même longueur, pour que le segment ait de quoi parler
    const C = new Point(200, 320, 'C'), D = new Point(500, 320, 'D');
    app.addEntity(C); app.addEntity(D);
    app.addEntity(new Segment(C, D));

    // le milieu est-il reconnu comme porteur, et la rangée s'ouvre-t-elle ?
    app.selectedObject = I; app.updateContextMenuUI();
    const rangee = getComputedStyle(document.getElementById('rowCoding')).display;
    const actifAvant = document.querySelector('#rowCoding .mark-btn.active');
    app.styleObject('mark-3');
    const milApres = I.codageMilieu;

    // et le segment garde la sienne, choisie séparément
    app.selectedObject = s; app.updateContextMenuUI();
    app.styleObject('mark-o');
    app.selectedObject = null; app.render();

    // effacer la marque du milieu ne doit pas toucher celle du segment
    app.selectedObject = I; app.styleObject('mark-none');
    const milVide = I.codageMilieu, segRestant = s.coding;
    I.codageMilieu = 'mark-3'; app.selectedObject = null;

    // où tombent les trois marques dans l'export ?
    const svg = app.generateSVGString(false, 'none');
    const cercles = [...svg.matchAll(/<circle[^>]*translate\(([-\d.]+),/g)].map(m => +m[1]);
    const traits = [...svg.matchAll(/<path[^>]*translate\(([-\d.]+),/g)].map(m => +m[1]);
    return { rangee, actifAvant: actifAvant && actifAvant.getAttribute('onclick'),
             milApres, seg: s.coding, milVide, segRestant, cercles, traits,
             estMilieu: app.estMilieu(I), estPoint: app.estMilieu(A) };
  });
  console.log('  ' + JSON.stringify(duo));
  ck('un point construit sur deux points est un milieu',
     duo.estMilieu === true && duo.estPoint === false,
     `${duo.estMilieu} / ${duo.estPoint}`);
  ck('la rangée de marques s\'ouvre pour un milieu', duo.rangee === 'grid', duo.rangee);
  ck('elle montre la marque qu\'il porte déjà',
     /mark-1/.test(duo.actifAvant || ''), String(duo.actifAvant));
  ck('on lui en choisit une autre', duo.milApres === 'mark-3', String(duo.milApres));
  ck('et le segment garde la sienne', duo.seg === 'mark-o', String(duo.seg));
  ck('effacer celle du milieu laisse celle du segment',
     duo.milVide === null && duo.segRestant === 'mark-o',
     `${duo.milVide} / ${duo.segRestant}`);
  /* Les deux moitiés au quart (275) et aux trois quarts (425) ; la marque du
     segment décalée du centre (350) pour ne pas se cacher sous le point. */
  ck('les moitiés restent au quart et aux trois quarts',
     duo.traits.includes(275) && duo.traits.includes(425), JSON.stringify(duo.traits));
  ck('la marque du segment s\'écarte du milieu',
     duo.cercles.length === 1 && Math.abs(duo.cercles[0] - 350) >= 12,
     JSON.stringify(duo.cercles));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
