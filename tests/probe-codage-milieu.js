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

  /* UN TRAIT NE PORTE QU'UN CODAGE. Quand le milieu de [AB] est codé, ce
     sont ses deux moitiés qui parlent : le trait est déjà marqué, et lui
     poser en plus une marque de longueur ferait dire deux choses au même
     dessin — la seconde tombant d'ailleurs pile sous la croix du milieu.
     Mettre le codage du milieu à Ø rend la longueur codable. */
  console.log('\n=== un trait ne porte qu\'un codage ===');
  const duo = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    app.view = { x: 0, y: 0, zoom: 1 };
    const A = new Point(200, 200, 'A'), B = new Point(500, 200, 'B');
    app.addEntity(A); app.addEntity(B);
    const s = new Segment(A, B); app.addEntity(s);
    // un second trait de même longueur : [AB] a de quoi être codé
    const C = new Point(200, 320, 'C'), D = new Point(500, 320, 'D');
    app.addEntity(C); app.addEntity(D);
    const s2 = new Segment(C, D); app.addEntity(s2);
    app.autoCodeAll();
    const avant = { AB: s.coding, CD: s2.coding };

    // on pose le milieu : il prend la parole, le trait rend la sienne
    const I = app.poserMilieu(A, B);
    const apresMilieu = { AB: s.coding, milieu: I.codageMilieu, CD: s2.coding };

    // la rangée s'ouvre pour le milieu et montre sa marque
    app.selectedObject = I; app.updateContextMenuUI();
    const rangee = getComputedStyle(document.getElementById('rowCoding')).display;
    const actifAvant = document.querySelector('#rowCoding .mark-btn.active');
    app.styleObject('mark-3');
    const milApres = I.codageMilieu;

    // sur le segment, tout est en veilleuse SAUF le Ø
    app.selectedObject = s; app.updateContextMenuUI();
    const veille = [...document.querySelectorAll('#rowCoding .mark-btn')].map(x => ({
      n: ((x.getAttribute('onclick') || '').match(/mark-[a-z0-9]+/) || [''])[0],
      op: x.style.opacity }));
    app.styleObject('mark-o');
    const refus = s.coding;

    // le milieu à Ø : la longueur redevient codable
    app.selectedObject = I; app.styleObject('mark-none');
    app.selectedObject = s; app.updateContextMenuUI();
    const veille2 = [...document.querySelectorAll('#rowCoding .mark-btn')]
      .filter(x => x.style.opacity && x.style.opacity !== '1').length;
    app.styleObject('mark-o');
    const libre = { AB: s.coding, milieu: I.codageMilieu };

    // l'export ne montre jamais les deux à la fois
    I.codageMilieu = 'mark-1'; s.coding = 'mark-3';
    const svg = app.generateSVGString(false, 'none');
    // x ET y : [CD], parallèle et de même longueur, a sa marque au même x
    const traits = [...svg.matchAll(/<path[^>]*translate\(([-\d.]+),([-\d.]+)\)/g)]
      .map(m => [+m[1], +m[2]]);
    app.selectedObject = null;
    return { avant, apresMilieu, rangee, actifAvant: actifAvant && actifAvant.getAttribute('onclick'),
             milApres, veille, refus, veille2, libre, traits,
             estMilieu: app.estMilieu(I), estPoint: app.estMilieu(A) };
  });
  console.log('  ' + JSON.stringify(duo));
  ck('un point construit sur deux points est un milieu',
     duo.estMilieu === true && duo.estPoint === false,
     `${duo.estMilieu} / ${duo.estPoint}`);
  ck('avant le milieu, [AB] et [CD] portent la même marque',
     duo.avant.AB === 'mark-1' && duo.avant.CD === 'mark-1', JSON.stringify(duo.avant));
  ck('poser le milieu rend sa marque au trait',
     duo.apresMilieu.AB === null && !!duo.apresMilieu.milieu, JSON.stringify(duo.apresMilieu));
  ck('et ne touche pas au trait d\'à côté', duo.apresMilieu.CD === 'mark-1');
  ck('la rangée de marques s\'ouvre pour un milieu', duo.rangee === 'grid', duo.rangee);
  ck('elle montre la marque qu\'il porte déjà',
     /mark-/.test(duo.actifAvant || ''), String(duo.actifAvant));
  ck('on lui en choisit une autre', duo.milApres === 'mark-3', String(duo.milApres));
  ck('sur le segment, seul le Ø reste vif',
     duo.veille.filter(x => x.n !== 'mark-none').every(x => x.op === '0.35')
     && duo.veille.find(x => x.n === 'mark-none').op !== '0.35',
     JSON.stringify(duo.veille.map(x => x.n + ':' + (x.op || '1'))));
  ck('et cliquer une marque ne fait rien', duo.refus === null, String(duo.refus));
  ck('le milieu à Ø, les marques redeviennent vives', duo.veille2 === 0, String(duo.veille2));
  ck('et la longueur se code alors', duo.libre.AB === 'mark-o' && duo.libre.milieu === null,
     JSON.stringify(duo.libre));
  /* Les deux moitiés au quart (275) et aux trois quarts (425), et RIEN au
     centre (350) : le trait n'a pas de marque à lui tant que son milieu parle. */
  const surAB = duo.traits.filter(q => Math.abs(q[1] - duo.traits[0][1]) < 40
      || Math.abs(q[1] - 200) < 40);
  ck('à l\'export, les deux moitiés de [AB] sont marquées',
     duo.traits.some(q => Math.abs(q[0] - 275) < 2) && duo.traits.some(q => Math.abs(q[0] - 425) < 2),
     JSON.stringify(duo.traits));
  ck('et rien au centre de [AB] — la marque à x=350 est celle de [CD]',
     !duo.traits.some(q => Math.abs(q[0] - 350) < 12 && Math.abs(q[1] - 200) < 40),
     JSON.stringify(duo.traits));
  void surAB;

  console.log('\n=== un milieu déjà là ne se double pas ===');
  /* « J'ai tracé une médiatrice, j'ai donc obtenu le milieu du segment, le point
     s'est appelé O. Lorsque j'ai cliqué sur l'icône milieu puis sur O, le logiciel
     a créé un point D puis a codé. Je ne veux pas de création de point si un point
     est déjà le milieu, par contre je veux bien le codage. »

     Et c'est ce qui se passait : deux points superposés au même endroit, deux fois
     le même codage. Le clic tombait d'ailleurs sur le SEGMENT — O est dessus —, si
     bien qu'on ne pouvait même pas s'en sortir en visant mieux. */
  const doublons = await page.evaluate(() => {
    const a = window.app;
    const monter = (quoi) => {
      a.entities = []; a.historyPast = [];
      const A = new Point(450, 500, 'A'), B = new Point(850, 500, 'B');
      a.addEntity(A); a.addEntity(B);
      a.addEntity(new Segment(A, B, { color: '#000', width: 2 }));
      if (quoi === 'nomme') { const O = new Point(0, 0, 'O', [A, B]); O.update(); a.addEntity(O); }
      if (quoi === 'cache') { const O = new Point(0, 0, '', [A, B]); O.update(); O.visible = false; a.addEntity(O); }
      if (quoi === 'libre') a.addEntity(new Point(653, 502, 'Z'));
      const s = a.entities.find(e => e instanceof Segment);
      a.poserMilieu(s.p1, s.p2);
      const auMilieu = a.entities.filter(e => e instanceof Point
        && Math.abs(e.x - 650) < 13 && Math.abs(e.y - 500) < 13);
      return { combien: auMilieu.length,
               nom: auMilieu.map(p => p.label || '?').join(','),
               visible: auMilieu.every(p => p.visible !== false),
               code: auMilieu.every(p => !!p.codageMilieu),
               parents: auMilieu.map(p => (p.parents || []).map(q => q.label).join('')).join(',') };
    };
    return { nomme: monter('nomme'), cache: monter('cache'),
             libre: monter('libre'), vide: monter('vide') };
  });
  ck('sur un milieu déjà nommé, aucun point de plus — et le codage est posé',
     doublons.nomme.combien === 1 && doublons.nomme.nom === 'O' && doublons.nomme.code,
     JSON.stringify(doublons.nomme));
  /* Une médiatrice laisse son milieu en point de CONSTRUCTION, caché : empiler
     dessus un point visible ne fait pas disparaître le premier. */
  ck('  sur un milieu caché, on le montre au lieu d\'en empiler un second',
     doublons.cache.combien === 1 && doublons.cache.visible && doublons.cache.code,
     JSON.stringify(doublons.cache));
  ck('  un point libre posé là devient le vrai milieu, sans doublon',
     doublons.libre.combien === 1 && doublons.libre.parents === 'AB',
     JSON.stringify(doublons.libre));
  ck('  et sans milieu, il s\'en crée bien un',
     doublons.vide.combien === 1 && doublons.vide.code,
     JSON.stringify(doublons.vide));

  console.log('\n=== et le menu contextuel propose le codage ===');
  /* « Quand on a un point et que celui-ci est le milieu d'un segment, on pourrait
     proposer le codage du milieu dans le menu contextuel. » Il ne le proposait
     qu'aux points CONSTRUITS comme milieux. */
  const menu = await page.evaluate(() => {
    const a = window.app;
    const poser = (quoi) => {
      a.entities = []; a.historyPast = [];
      const A = new Point(450, 500, 'A'), B = new Point(850, 500, 'B');
      a.addEntity(A); a.addEntity(B);
      a.addEntity(new Segment(A, B, { color: '#000', width: 2 }));
      let P;
      if (quoi === 'construit') { P = new Point(0, 0, 'O', [A, B]); P.update(); }
      if (quoi === 'libre') P = new Point(652, 501, 'Z');
      if (quoi === 'ailleurs') P = new Point(760, 500, 'Z');
      a.addEntity(P);
      a.selectedObject = P;
      a.updateContextMenuUI();
      const rC = document.getElementById('rowCoding');
      return rC ? (rC.style.display || getComputedStyle(rC).display) : 'absente';
    };
    const res = { construit: poser('construit'), libre: poser('libre'),
                  ailleurs: poser('ailleurs') };
    /* Et poser la marque fait du point un VRAI milieu : sans parents, le codage
       ne se dessinerait même pas — et le point ne suivrait pas le segment. */
    poser('libre');
    a.styleObject('mark-1');
    const Z = a.entities.find(e => e instanceof Point && e.label === 'Z');
    res.applique = { code: Z.codageMilieu, parents: (Z.parents || []).map(q => q.label).join('') };
    a.entities[0].x -= 120; a.updateDependents();
    res.suit = { z: Math.round(Z.x), attendu: Math.round((a.entities[0].x + 850) / 2) };
    return res;
  });
  ck('un milieu construit se voit proposer le codage',
     menu.construit === 'grid', menu.construit);
  ck('  un point simplement POSÉ au milieu aussi',
     menu.libre === 'grid', menu.libre);
  ck('  mais pas un point qui n\'est pas au milieu',
     menu.ailleurs === 'none', menu.ailleurs);
  ck('  et le coder fait de lui un vrai milieu, qui suit le segment',
     menu.applique.parents === 'AB' && menu.suit.z === menu.suit.attendu,
     JSON.stringify(menu.applique) + ' ' + JSON.stringify(menu.suit));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
