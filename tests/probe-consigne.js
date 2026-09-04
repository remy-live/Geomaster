// La consigne intelligente : on tape la phrase du manuel, le logiciel la fait —
// et la phrase reste comme consigne de l'étape.
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

  // une suite de consignes sur une feuille neuve ; renvoie ce que chacune a dit
  const suite = (phrases, detail) => page.evaluate(([ph, det]) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    app.view = { x: 0, y: 0, zoom: 1 };
    /* « Avec les instruments » se demande maintenant ligne par ligne : chaque
       consigne du panneau porte sa case, il n'y a plus de réglage global. */
    const out = ph.map(p => {
      const r = app.executerConsigneAvec(p, !!det);
      return { p, ok: r.ok, m: r.message, a: r.astuce };
    });
    app.isPlaying = false; app.isLooping = false; app.isToolAnimating = false;
    return { out,
             points: app.entities.filter(e => e.constructor.name === 'Point' && e.label).map(e => e.label),
             objets: app.entities.length,
             anims: app.entities.filter(e => e.constructor.name === 'ToolAnimation').length,
             consignes: Object.values(app.stepInstructions) };
  }, [phrases, detail]);

  const tous = (r, titre) => {
    r.out.forEach(o => console.log(`  ${o.ok ? '✓' : '✗'} ${o.p} → ${o.m}`));
    ck(titre, r.out.every(o => o.ok), r.out.filter(o => !o.ok).map(o => o.p).join(' | '));
  };

  console.log('\n=== les phrases telles qu\'on les écrit ===');
  const base = await suite([
    'Place 3 points A, B, C non alignés',
    'Place le point O',
    'Trace [AB)',
    'Trace le cercle de centre A passant par B',
    'Trace le cercle de centre A de rayon [AC]',
    'Trace le cercle de centre B et de rayon 3 cm',
    'Trace un carré DEFG de 3 cm de côté',
    'Trace une droite',
    "Trace A', B', C' symétriques de A, B, C par rapport à O",
  ]);
  tous(base, 'les neuf consignes sont comprises');
  ck('les points demandés portent leur nom',
     ['A', 'B', 'C', 'O', 'D', 'E', 'F', 'G', "A'", "B'", "C'"].every(n => base.points.includes(n)),
     base.points.join(','));
  /* Ce qui fait la valeur du dispositif : la phrase tapée DEVIENT la consigne de
     l'étape. Le programme de construction saisi ici se rejoue avec les mots du
     professeur, et s'imprime tel quel en fiche « texte seul ». */
  ck('chaque consigne comprise devient une consigne d\'étape',
     base.consignes.length === 9 && base.consignes[0] === 'Place 3 points A, B, C non alignés',
     `${base.consignes.length} étapes`);

  console.log('\n=== traits ===');
  tous(await suite([
    'Place les points A, B, C alignés',
    'Trace [AB]', 'Trace (AC)', 'Trace le segment [BC]', 'Trace la demi-droite [CA)',
    'Trace le segment [DE] de 5 cm', 'Relie A à C', 'Trace [AB], [BC] et [CA]',
  ]), 'segment, droite, demi-droite, longueur imposée, plusieurs d\'un coup');

  console.log('\n=== figures ===');
  tous(await suite([
    'Trace un rectangle ABCD de 5 cm sur 3 cm',
    'Trace un losange EFGH de 4 cm de côté',
    'Trace un parallélogramme IJKL',
    'Trace un hexagone MNOPQR de 2 cm de côté',
    'Trace un triangle STU tel que ST = 5 cm, SU = 4 cm et TU = 3 cm',
    'Trace un triangle équilatéral VWX de 4 cm de côté',
    'Trace un triangle YZA rectangle en Y',
  ]), 'quadrilatères, polygones réguliers, triangles');

  console.log('\n=== droites remarquables ===');
  tous(await suite([
    'Place 3 points A, B, C non alignés',
    'Trace la médiatrice de [AB]',
    'Trace la perpendiculaire à (AB) passant par C',
    'Trace la parallèle à (AB) passant par C',
    "Trace la bissectrice de l'angle ABC",
    'Trace la hauteur issue de A dans le triangle ABC',
    'Place le milieu I de [AB]',
    'Trace le cercle circonscrit au triangle ABC',
  ]), 'médiatrice, perpendiculaire, parallèle, bissectrice, hauteur, milieu, circonscrit');

  console.log('\n=== mesures et codages ===');
  const mes = await suite([
    'Place les points A, B', 'Trace [AB]', 'AB = 6 cm', 'Affiche la longueur de [AB]',
    'Place le point C', "Marque l'angle ABC", "L'angle ABC mesure 60°",
    'Code les longueurs égales',
  ]);
  tous(mes, 'longueur imposée, angle marqué puis mesuré, codage');
  const valeurs = await page.evaluate(() => {
    const app = window.app;
    const s = app.entities.find(e => e.constructor.name === 'Segment');
    const a = app.entities.find(e => e.constructor.name === 'Angle');
    return { longueur: s ? s.texteLongueur() : null, affichee: s ? !!s.showLength : false,
             angle: a ? +a.getAngleValue().toFixed(1) : null };
  });
  console.log('  ' + JSON.stringify(valeurs));
  ck('le segment mesure vraiment 6 cm', valeurs.longueur === '6.0', String(valeurs.longueur));
  ck('sa longueur est affichée', valeurs.affichee);
  ck('l\'angle vaut vraiment 60°', Math.abs(valeurs.angle - 60) < 0.1, String(valeurs.angle));

  console.log('\n=== plusieurs façons de dire la même chose ===');
  tous(await suite([
    'Trace un cercle', 'Construis un carré', 'Dessine un triangle',
    'Place les points P, Q', 'Soit I le milieu de [PQ]',
    "Place les points C', D'", "Trace [C'D']",
  ]), 'trace / construis / dessine / place / soit, et les noms à primes');

  console.log('\n=== dans un triangle : les trois d\'un coup, ou celle qu\'on nomme ===');
  tous(await suite([
    'Place 3 points A, B, C non alignés',
    'Trace les médiatrices du triangle ABC',
    'Trace les bissectrices du triangle ABC',
    'Trace les hauteurs du triangle ABC',
    'Trace les médianes du triangle ABC',
    'Trace la médiane issue de A dans le triangle ABC',
    'Trace la hauteur issue de B dans le triangle ABC',
  ]), 'médiatrices, bissectrices, hauteurs, médianes — au pluriel et au singulier');

  console.log('\n=== les points remarquables ===');
  const rem = await suite([
    'Place 3 points A, B, C non alignés',
    'Place le centre de gravité G du triangle ABC',
    "Place l'orthocentre H du triangle ABC",
    'Place le centre du cercle circonscrit O au triangle ABC',
    'Trace le cercle inscrit dans le triangle ABC',
  ]);
  tous(rem, 'centre de gravité, orthocentre, centre circonscrit, cercle inscrit');
  /* Le nom voulu est celui de la phrase qui n'existe pas encore, qu'il soit écrit
     avant les sommets ou après. */
  ck('les points remarquables portent le nom demandé',
     ['G', 'H', 'O'].every(n => rem.points.includes(n)), rem.points.join(','));
  const centres = await page.evaluate(() => {
    const app = window.app, p = (n) => app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
    const [A, B, C, G, H, O] = ['A', 'B', 'C', 'G', 'H', 'O'].map(p);
    return { g: [Math.round(G.x - (A.x + B.x + C.x) / 3), Math.round(G.y - (A.y + B.y + C.y) / 3)],
             // O est à égale distance des trois sommets
             o: ['A', 'B', 'C'].map(n => Math.round(Math.hypot(p(n).x - O.x, p(n).y - O.y))),
             // Euler : O, G et H sont alignés, et OH = 3·OG
             euler: Math.round(Math.hypot(H.x - O.x, H.y - O.y) / Math.hypot(G.x - O.x, G.y - O.y) * 100) / 100 };
  });
  console.log('  ' + JSON.stringify(centres));
  ck('G est bien l\'isobarycentre', Math.abs(centres.g[0]) + Math.abs(centres.g[1]) === 0, JSON.stringify(centres.g));
  ck('O est à égale distance des trois sommets',
     Math.max(...centres.o) - Math.min(...centres.o) <= 1, centres.o.join('/'));
  /* La droite d'Euler : dans tout triangle, OH = 3·OG. Si ce rapport tombe juste,
     l'orthocentre est au bon endroit. */
  ck('H vérifie la droite d\'Euler (OH = 3·OG)', Math.abs(centres.euler - 3) < 0.02, String(centres.euler));

  console.log('\n=== poser un point sur un objet, ou à un croisement ===');
  tous(await suite([
    'Place 3 points A, B, C non alignés', 'Place le point D',
    'Trace (AB)', 'Trace (CD)',
    'Place le point I intersection de (AB) et (CD)',
    'Place un point M sur [AB]', 'Place un point N sur (CD)',
    'Trace le cercle de centre A passant par B',
    'Place un point P sur le cercle de centre A',
  ]), 'intersection de deux droites, point sur un segment, une droite, un cercle');

  console.log('\n=== la notation : il la corrige et il l\'explique ===');
  /* Oublier les crochets n'est pas une faute de frappe, c'est le point qu'on
     travaille en classe. La consigne est FAITE — on ne bloque personne — et la
     notation juste est rappelée à côté. */
  const nota = await suite([
    'Place 3 points A, B, C non alignés',
    'Trace la médiatrice de AB',
    'Trace la médiatrice de (AB)',
    'Trace la perpendiculaire à [AB] passant par C',
    'Trace la droite AB',
    'Trace le segment (BC)',
    'Place le milieu I de (AB)',
  ]);
  nota.out.forEach(o => console.log(`  ${o.ok ? '✓' : '✗'} ${o.p} → ${o.m}${o.a ? '\n      ✎ ' + o.a : ''}`));
  ck('malgré la notation, tout est fait', nota.out.every(o => o.ok));
  ck('et chaque écart est expliqué',
     nota.out.slice(1).every(o => /Notation/.test(o.a || '')),
     nota.out.slice(1).map(o => o.a || '(rien)').join(' | '));
  ck('les crochets oubliés sont nommés',
     /crochets/.test(nota.out[1].a), nota.out[1].a);
  ck('la droite mise pour le segment est nommée',
     /est la droite/.test(nota.out[2].a), nota.out[2].a);
  ck('les parenthèses oubliées sont nommées',
     /parenth[èe]ses/.test(nota.out[4].a), nota.out[4].a);

  console.log('\n=== le verbe : on fait, et on rappelle le mot du cours ===');
  /* « Trace 3 points » vaut « Place 3 points » : c'est le mot POINT qui décide,
     pas le verbe. Et « Dessine » est exécuté, avec le mot juste rappelé —
     comme les crochets oubliés, on ne bloque personne. */
  const verbe = await suite([
    'Trace 3 points A, B, C non alignés',
    'Trace le point O',
    'Dessine [AB]',
    'Dessine un carré DEFG de 3 cm de côté',
  ]);
  verbe.out.forEach(o => console.log(`  ${o.ok ? '✓' : '✗'} ${o.p} → ${o.m}${o.a ? '\n      ✎ ' + o.a : ''}`));
  ck('« Trace » place les points comme « Place »', verbe.out[0].ok && verbe.out[1].ok,
     verbe.out.slice(0, 2).map(o => o.m).join(' | '));
  ck('les trois points portent leur nom',
     ['A', 'B', 'C', 'O'].every(n => verbe.points.includes(n)), verbe.points.join(','));
  ck('« Dessine » est fait quand même', verbe.out[2].ok && verbe.out[3].ok,
     verbe.out.slice(2).map(o => o.m).join(' | '));
  ck('et « Trace » est proposé à chaque fois',
     verbe.out.slice(2).every(o => /Trace/.test(o.a || '') && /Dessine/.test(o.a || '')),
     verbe.out.slice(2).map(o => o.a || '(rien)').join(' | '));
  /* Le mot « point » ne doit pas voler les consignes qui le contiennent pour
     dire autre chose : le croisement de deux droites reste un croisement. */
  const pasVole = await suite([
    'Trace un carré ABCD de 4 cm de côté',
    'Place le point I intersection de (AC) et (BD)',
    'Place un point M sur [AB]',
  ]);
  ck('« le point d\'intersection » n\'est pas volé au passage',
     pasVole.out.every(o => o.ok) && pasVole.points.includes('I') && pasVole.points.includes('M'),
     pasVole.out.map(o => (o.ok ? '' : '✗ ') + o.m).join(' | '));

  console.log('\n=== chaque ligne choisit ses instruments ===');
  /* Chaque ligne décide seule : la figure de départ sans instruments, la
     médiatrice au compas — dans le même énoncé. */
  const parLigne = await page.evaluate(() => {
    const app = window.app;
    const compte = () => app.entities.filter(e => e.constructor.name === 'ToolAnimation').length;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    app.executerConsigneAvec('Place 2 points A et B', false);
    app.executerConsigneAvec('Trace la médiatrice de [AB]', false);
    const sans = compte();
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    app.executerConsigneAvec('Place 2 points A et B', false);
    app.executerConsigneAvec('Trace la médiatrice de [AB]', true);
    return { sans, avec: compte() };
  });
  console.log('  ' + JSON.stringify(parLigne));
  ck('sans instruments : aucun geste', parLigne.sans === 0, String(parLigne.sans));
  ck('avec instruments sur la seule ligne voulue : les gestes sont là',
     parLigne.avec > 0, String(parLigne.avec));

  console.log('\n=== encore d\'autres façons de le dire ===');
  tous(await suite([
    'Place 3 points A, B, O',
    'Trace le cercle centré en O qui passe par A',
    'Trace le cercle de centre le point O et de rayon 2 cm',
    'Trace un rectangle DEFG de longueur 6 cm et de largeur 3 cm',
    "Trace l'image de A par la symétrie de centre O",
  ]), 'centré en, qui passe par, de centre le point, longueur/largeur, par la symétrie de centre');

  console.log('\n=== ce qu\'il refuse, et comment il le dit ===');
  /* Un analyseur qui devine de travers est pire qu'un qui refuse : chaque échec
     doit nommer ce qui manque. */
  const refus = await suite([
    'Trace la licorne',
    'Trace la médiatrice',
    'Trace un triangle ABC tel que AB = 1 cm, AC = 1 cm et BC = 9 cm',
    'AB = 5 cm',
  ]);
  refus.out.forEach(o => console.log(`  ${o.ok ? '✓' : '✗'} ${o.p} → ${o.m}`));
  ck('les quatre sont refusées', refus.out.every(o => !o.ok));
  ck('rien n\'est fabriqué au passage', refus.objets === 0, String(refus.objets));
  ck('l\'inégalité triangulaire est vérifiée avant de tracer',
     /n'existe pas/.test(refus.out[2].m), refus.out[2].m);
  ck('un point inconnu est nommé', /A/.test(refus.out[3].m), refus.out[3].m);

  console.log('\n=== la case « construction détaillée » ===');
  const simple = await suite(['Trace un carré ABCD de 3 cm de côté'], false);
  const detail = await suite(['Trace un carré ABCD de 3 cm de côté'], true);
  console.log(`  figure seule : ${simple.objets} objets, ${simple.anims} animations`);
  console.log(`  détaillée    : ${detail.objets} objets, ${detail.anims} animations`);
  ck('sans la case, la figure seule', simple.anims === 0 && simple.objets < 15,
     `${simple.objets} objets`);
  /* Avec la case, c'est la construction des « constructions magiques » : arcs de
     compas et instruments qui se posent. Bâtie d'un coup — ▶ la rejoue quand on
     veut — pour ne pas bloquer la consigne suivante. */
  ck('avec la case, la construction au compas', detail.anims > 10 && detail.objets > 25,
     `${detail.objets} objets, ${detail.anims} animations`);
  ck('elle ne se met pas à jouer toute seule',
     await page.evaluate(() => app.isPlaying === false));

  console.log('\n=== deux consignes dans une phrase ===');
  /* « Trace un triangle ABC ET ses médiatrices » est une phrase qu'on écrit
     naturellement : on la fait, et l'on dit comment on l'écrirait sans
     ambiguïté. Comprendre d'abord, enseigner ensuite. */
  const comp = await suite([
    'Trace un triangle ABC et ses médiatrices',
    'Trace un carré DEFG et ses diagonales',
    'Trace un triangle HIJ et son cercle circonscrit',
  ]);
  comp.out.forEach(o => console.log(`  ${o.ok ? '✓' : '✗'} ${o.p} → ${o.m}${o.a ? '\n      ✎ ' + o.a : ''}`));
  ck('les trois phrases composées sont faites', comp.out.every(o => o.ok));
  ck('chacune dit les deux choses faites',
     comp.out.every(o => (o.m || '').includes(' · ')), comp.out.map(o => o.m).join(' | '));
  ck('et la formulation sans ambiguïté est donnée',
     /médiatrices des côtés du triangle ABC/.test(comp.out[0].a || ''), comp.out[0].a);
  /* Une phrase du genre « AB = 5 cm et AC = 4 cm » décrit UNE figure : elle ne
     doit surtout pas être coupée en deux. */
  const uneSeule = await suite(['Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm']);
  ck('« … et BC = 3 cm » n\'est pas coupé en deux consignes',
     uneSeule.out[0].ok && !(uneSeule.out[0].m || '').includes(' · '), uneSeule.out[0].m);

  console.log('\n=== le triangle, de toutes les façons qu\'un énoncé le donne ===');
  const tri = (phrase) => page.evaluate((p) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    app.view = { x: 0, y: 0, zoom: 1 };
    const r = app.executerConsigneAvec(p, false);
    const pt = (n) => app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
    const d = (x, y) => { const P = pt(x), Q = pt(y); return P && Q ? +(Math.hypot(P.x - Q.x, P.y - Q.y) / 50).toFixed(2) : null; };
    const ang = (x, y, z) => { const P = pt(x), Q = pt(y), R = pt(z); if (!P || !Q || !R) return null;
      const a1 = Math.atan2(P.y - Q.y, P.x - Q.x), a2 = Math.atan2(R.y - Q.y, R.x - Q.x);
      let dd = a2 - a1; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI;
      return +(Math.abs(dd) * 180 / Math.PI).toFixed(1); };
    return { ok: r.ok, m: r.message, AB: d('A', 'B'), AC: d('A', 'C'), BC: d('B', 'C'),
             A: ang('B', 'A', 'C'), B: ang('A', 'B', 'C') };
  }, phrase);

  const cas = [
    ['3 longueurs', 'Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm',
      (r) => r.AB === 5 && r.AC === 4 && r.BC === 3],
    ['2 longueurs et l\'angle entre elles', "Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et l'angle BAC = 60°",
      // al-Kashi : BC² = 25 + 16 − 2·5·4·cos60 = 21
      (r) => r.AB === 5 && r.AC === 4 && Math.abs(r.A - 60) < 0.2 && Math.abs(r.BC - Math.sqrt(21)) < 0.02],
    ['1 longueur et 2 angles', "Trace un triangle ABC tel que AB = 6 cm, l'angle BAC = 40° et l'angle ABC = 60°",
      (r) => r.AB === 6 && Math.abs(r.A - 40) < 0.2 && Math.abs(r.B - 60) < 0.2],
    ['équilatéral', 'Trace un triangle équilatéral ABC de 4 cm de côté',
      (r) => r.AB === 4 && r.AC === 4 && r.BC === 4 && Math.abs(r.A - 60) < 0.2],
    ['isocèle en A, côté et base', 'Trace un triangle ABC isocèle en A de côté 5 cm et de base 3 cm',
      (r) => r.AB === 5 && r.AC === 5 && r.BC === 3],
    ['isocèle sans mesure', 'Trace un triangle ABC isocèle en B',
      (r) => Math.abs(r.AB - r.BC) < 0.02],
    ['rectangle en A', 'Trace un triangle ABC rectangle en A tel que AB = 4 cm et AC = 3 cm',
      // Pythagore : l'hypoténuse vaut 5
      (r) => Math.abs(r.A - 90) < 0.2 && Math.abs(r.BC - 5) < 0.02],
    ['isocèle rectangle en A', 'Trace un triangle ABC isocèle rectangle en A de côté 4 cm',
      (r) => Math.abs(r.A - 90) < 0.2 && r.AB === 4 && r.AC === 4 && Math.abs(r.BC - 4 * Math.SQRT2) < 0.02],
  ];
  for (const [nom, phrase, verifie] of cas) {
    const r = await tri(phrase);
    console.log(`  ${r.ok ? '✓' : '✗'} ${nom} — AB=${r.AB} AC=${r.AC} BC=${r.BC} Â=${r.A} B̂=${r.B}`);
    ck(`triangle : ${nom}`, r.ok && verifie(r), JSON.stringify(r));
  }

  console.log('\n=== tout est constructible aux instruments ===');
  /* Tous les cas se ramènent aux TROIS LONGUEURS, et trois longueurs se
     construisent à la règle et au compas : [AB] à la règle, un arc de chaque
     extrémité, leur croisement est le sommet. La case le fait pour n'importe
     quel énoncé — même « une longueur et deux angles », qui n'a pourtant aucune
     longueur donnée pour les deux autres côtés. */
  const auCompas = (phrase) => page.evaluate((p) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    const r = app.executerConsigneAvec(p, true);
    app.isPlaying = false; app.isLooping = false;
    const c = (n) => app.entities.filter(e => e.constructor.name === n).length;
    return { ok: r.ok, anims: c('ToolAnimation'), arcs: c('CompassArc'), objets: app.entities.length };
  }, phrase);
  for (const [nom, phrase] of [
    ['trois longueurs', 'Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm'],
    ['une longueur et deux angles', "Trace un triangle ABC tel que AB = 6 cm, l'angle BAC = 40° et l'angle ABC = 60°"],
    ['rectangle', 'Trace un rectangle ABCD de 5 cm sur 3 cm'],
    ['parallélogramme', 'Trace un parallélogramme ABCD'],
  ]) {
    const r = await auCompas(phrase);
    console.log(`  ${nom} : ${r.objets} objets, ${r.anims} animations, ${r.arcs} arcs`);
    ck(`aux instruments : ${nom}`, r.ok && r.anims >= 8 && r.arcs >= 2, JSON.stringify(r));
  }

  console.log('\n=== on écrit vite, et en minuscules ===');
  /* Personne n'appuie sur Majuscule six fois en tapant au tableau. Les points
     sont remis en majuscules là où la phrase désigne un point — et la notation
     de cours est rappelée, comme pour les crochets oubliés. */
  const mini = await suite([
    'trace un triangle abc puis la médiatrice de [ab]',
  ]);
  mini.out.forEach(o => console.log(`  ${o.ok ? '✓' : '✗'} ${o.p} → ${o.m}${o.a ? '\n      ✎ ' + o.a : ''}`));
  ck('« abc » en minuscules donne bien le triangle ABC',
     mini.out[0].ok && ['A', 'B', 'C'].every(n => mini.points.includes(n)), mini.points.join(','));
  /* « PUIS » lie deux consignes aussi bien que « et ». */
  ck('« puis » enchaîne les deux consignes',
     (mini.out[0].m || '').includes(' · '), mini.out[0].m);
  ck('et la majuscule est enseignée', /MAJUSCULE/.test(mini.out[0].a || ''), mini.out[0].a);
  const mini2 = await suite(['place 3 points a, b, c non alignés', 'trace le segment [ab]']);
  mini2.out.forEach(o => console.log(`  ${o.ok ? '✓' : '✗'} ${o.p} → ${o.m}`));
  ck('l\'énumération entière passe en majuscules', mini2.out.every(o => o.ok)
     && ['A', 'B', 'C'].every(n => mini2.points.includes(n)), mini2.points.join(','));

  console.log('\n=== la consigne dit aussi de quelle couleur, et dans quel style ===');
  const style = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    const avantCouleur = app.globalStyle.color;
    const r1 = app.executerConsigne('Place 2 points A et B');
    const r2 = app.executerConsigne('Trace [AB] en bleu');
    const r3 = app.executerConsigne('Trace la médiatrice de [AB] en rouge et en pointillés');
    const r4 = app.executerConsigne('Trace le cercle de centre A et de rayon 3 cm en vert');
    const seg = app.entities.find(e => e.constructor.name === 'Segment');
    const perp = app.entities.find(e => e.constructor.name === 'PerpendicularLine');
    const cer = app.entities.find(e => e.constructor.name === 'Circle');
    return { m2: r2.message, m3: r3.message, m4: r4.message,
             seg: seg && { c: seg.color, d: seg.dash.length },
             perp: perp && { c: perp.color, d: perp.dash.length },
             cer: cer && { c: cer.color },
             avantCouleur, apresCouleur: app.globalStyle.color };
  });
  console.log('  ' + JSON.stringify(style));
  ck('« en bleu » colore le segment', style.seg && style.seg.c === '#1e88e5', JSON.stringify(style.seg));
  ck('« en rouge et en pointillés » fait les deux',
     style.perp && style.perp.c === '#e53935' && style.perp.d > 0, JSON.stringify(style.perp));
  ck('le cercle aussi', style.cer && style.cer.c === '#43a047', JSON.stringify(style.cer));
  ck('la réponse dit ce qui a été appliqué',
     / en bleu/.test(style.m2) && /rouge/.test(style.m3) && /pointill/.test(style.m3),
     `${style.m2} | ${style.m3}`);
  /* Le style est retiré de la phrase ANALYSÉE : le cercle ne se décrit pas
     lui-même comme « … de rayon 3 cm en vert — en vert ». */
  ck('et ne se répète pas dans la description de l\'objet',
     (style.m4.match(/en vert/g) || []).length === 1, style.m4);
  /* Le style demandé vaut pour CETTE ligne : la palette du professeur n'a pas
     bougé, et la consigne suivante repart de sa couleur. */
  ck('la palette du professeur n\'est pas touchée',
     style.apresCouleur === style.avantCouleur, `${style.avantCouleur} → ${style.apresCouleur}`);

  console.log('\n=== « Appelle O le point d\'intersection des médiatrices » ===');
  /* Ce croisement porte un nom, et c'est ce nom qu'on apprend : on pose le
     point, et l'on dit lequel c'est. */
  const croise = await suite([
    'Trace un triangle ABC',
    "Appelle O le point d'intersection des médiatrices",
    "Appelle H le point d'intersection des hauteurs",
    "Appelle G le point d'intersection des médianes",
  ]);
  croise.out.forEach(o => console.log(`  ${o.ok ? '✓' : '✗'} ${o.p} → ${o.m}${o.a ? '\n      ✎ ' + o.a : ''}`));
  ck('les trois croisements sont compris', croise.out.every(o => o.ok),
     croise.out.filter(o => !o.ok).map(o => o.m).join(' | '));
  ck('ils portent le nom demandé', ['O', 'H', 'G'].every(n => croise.points.includes(n)),
     croise.points.join(','));
  ck('et le vocabulaire est donné',
     /centre du cercle circonscrit/.test(croise.out[1].a || '')
     && /orthocentre/.test(croise.out[2].a || '')
     && /centre de gravité/.test(croise.out[3].a || ''),
     [croise.out[1].a, croise.out[2].a].join(' | '));
  /* Le triangle n'est pas nommé dans la phrase : c'est celui qu'on vient de
     tracer. Et la géométrie doit être juste — Euler : OH = 3·OG. */
  const euler = await page.evaluate(() => {
    const p = (n) => window.app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
    const [O, G, H] = ['O', 'G', 'H'].map(p);
    if (!O || !G || !H) return null;
    return { og: Math.round(Math.hypot(G.x - O.x, G.y - O.y)),
             oh: Math.round(Math.hypot(H.x - O.x, H.y - O.y)) };
  });
  console.log('  ' + JSON.stringify(euler));
  ck('la droite d\'Euler est respectée : OH = 3·OG',
     euler && Math.abs(euler.oh - 3 * euler.og) <= 2, JSON.stringify(euler));

  console.log('\n=== le bandeau dit ce que le logiciel reconnaît ===');
  const band = await page.evaluate(() => ({
    carre: app.cslModeles('trace un carré de 3 cm'),
    mediatrice: app.cslModeles('trace la médiatrice'),
    rien: app.cslModeles('tr'),
    dejaJuste: app.cslModeles('Trace la médiatrice de [AB]'),
  }));
  console.log('  ' + JSON.stringify(band, null, 1));
  /* « Trace un carré de 3 cm » ne dit pas quels sommets : le logiciel en
     inventait en silence. Le modèle est montré sous la ligne. */
  ck('« un carré de 3 cm » appelle le modèle nommé',
     band.carre.length === 1 && /ABCD/.test(band.carre[0]), JSON.stringify(band.carre));
  ck('« la médiatrice » propose les deux écritures',
     band.mediatrice.length === 2 && /\[AB\]/.test(band.mediatrice[0]), JSON.stringify(band.mediatrice));
  ck('trois lettres ne suffisent pas à proposer quoi que ce soit', band.rien.length === 0);
  ck('une phrase déjà juste ne se voit pas proposer elle-même',
     !band.dejaJuste.includes('Trace la médiatrice de [AB]'), JSON.stringify(band.dejaJuste));

  console.log('\n=== une phrase, un point, une autre phrase ===');
  /* Un énoncé collé d'un traitement de texte n'a pas ses phrases sur des lignes
     séparées : le point les sépare comme la virgule sépare deux propositions.
     Il ne coupe ni « 6,5 cm » ni un nom de point. */
  const phrases = await suite([
    'Trace un segment vertical [OQ] de 6 cm de longueur. Place le milieu P du segment [OQ]',
  ]);
  phrases.out.forEach(o => console.log(`  ${o.ok ? '✓' : '✗'} ${o.p}\n      → ${o.m}`));
  ck('les deux phrases sont faites',
     phrases.out[0].ok && (phrases.out[0].m || '').includes(' · '), phrases.out[0].m);
  /* « vertical » n'est pas un mot décoratif : l'énoncé dit comment poser le
     segment, et une figure penchée ne serait pas celle qu'il décrit. */
  const pose = await page.evaluate(() => {
    const app = window.app;
    const s = app.entities.find(e => e.constructor.name === 'Segment');
    return s ? { pente: Math.round(Math.atan2(s.p2.y - s.p1.y, s.p2.x - s.p1.x) * 180 / Math.PI),
                 L: +(Math.hypot(s.p1.x - s.p2.x, s.p1.y - s.p2.y) / 50).toFixed(2) } : null;
  });
  console.log('  ' + JSON.stringify(pose));
  ck('le segment est vraiment vertical, et de 6 cm',
     pose && Math.abs(Math.abs(pose.pente) - 90) < 0.5 && pose.L === 6, JSON.stringify(pose));
  const horiz = await suite(['Trace un segment horizontal [CD] de 4 cm']);
  const poseH = await page.evaluate(() => {
    const s = window.app.entities.find(e => e.constructor.name === 'Segment');
    return s ? Math.round(Math.atan2(s.p2.y - s.p1.y, s.p2.x - s.p1.x) * 180 / Math.PI) : null;
  });
  ck('et « horizontal » de même', horiz.out[0].ok && Math.abs(poseH) < 0.5, String(poseH));
  /* Le point d'un nombre décimal ne sépare rien. */
  const decimal = await suite(['Place les points A, B', 'Trace le cercle de centre A et de rayon 6.5 cm']);
  ck('« 6.5 cm » n\'est pas coupé en deux',
     decimal.out[1].ok && !(decimal.out[1].m || '').includes(' · '), decimal.out[1].m);

  console.log('\n=== le panneau : une ligne, une consigne ===');
  /* Un titre, puis des lignes numérotées. Chacune porte sa case « avec les
     instruments », son bouton Valider, sa réponse en dessous — trois consignes
     écrites, trois réponses lisibles en même temps. */
  const pan = await page.evaluate(async () => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    app._consignes = []; app.saveState();
    const boite = document.getElementById('instructionBox');
    if (boite.style.display === 'none' || !boite.style.display) app.toggleInstructions();
    app.majConsignes();
    const ecrire = (i, txt, outils) => {
      const l = app.consignesListe();
      while (l.length <= i) l.push(app.consigneNeuve());
      l[i].texte = txt; l[i].instruments = !!outils;
      app.majConsignes();
      return app.validerConsigne(i);
    };
    const un = ecrire(0, '1. Place 3 points A, B, C non alignés');
    const deux = ecrire(1, '2. Trace [AB], [BC] et [CA]');
    const trois = ecrire(2, '3. Trace la licorne');
    const lignes = [...document.querySelectorAll('.csl-ligne')].map(l => ({
      num: l.querySelector('.csl-num').textContent,
      txt: l.querySelector('.csl-champ').value,
      faite: l.classList.contains('faite'),
      rep: (l.querySelector('.csl-reponse').textContent || ''),
      etat: l.querySelector('.csl-reponse').className,
      bandeau: getComputedStyle(l.querySelector('.csl-modeles')).display !== 'none',
      bandeauTxt: (l.querySelector('.csl-modeles').textContent || ''),
    }));
    return { un, deux, trois, lignes,
             objets: app.entities.length,
             consignes: Object.values(app.stepInstructions),
             sansFenetre: !document.getElementById('consigneModal'),
             sansCaseGlobale: !document.getElementById('consigneDetail'),
             exemples: document.querySelectorAll('#consigneAide a').length,
             aideCachee: document.getElementById('consigneAide').style.display,
             enonceReplie: document.getElementById('enonceLibre').style.display };
  });
  console.log('  ' + JSON.stringify(pan.lignes, null, 1));
  ck('il n\'y a plus de fenêtre séparée', pan.sansFenetre);
  ck('ni de case globale : chaque ligne décide', pan.sansCaseGlobale);
  /* Le numéro d'un énoncé — « 1. » — ne fait pas partie de ce qu'il y a à faire. */
  ck('les lignes numérotées sont exécutées', pan.un === true && pan.deux === true,
     `${pan.un} / ${pan.deux}`);
  ck('la figure est construite', pan.objets === 6, String(pan.objets));
  ck('chaque ligne devient une consigne d\'étape', pan.consignes.length === 2,
     JSON.stringify(pan.consignes));
  /* NUMÉROTÉES : on sait où l'on en est. Faite, la ligne porte un ✓ à la place
     de son numéro — c'est ce qui empêche de la rejouer sans y penser. */
  ck('une ligne faite porte un ✓, une ligne en attente son numéro',
     pan.lignes[0].num === '✓' && pan.lignes[1].num === '✓' && pan.lignes[2].num === '3',
     pan.lignes.map(l => l.num).join(' '));
  ck('une ligne incomprise le dit, sur sa propre ligne',
     pan.trois === false && /rate/.test(pan.lignes[2].etat), pan.lignes[2].etat);
  /* Chaque réponse est SOUS SA LIGNE : trois consignes, trois réponses. */
  ck('chaque réponse est sous sa ligne',
     /points? plac/i.test(pan.lignes[0].rep) && /trac/i.test(pan.lignes[1].rep)
     && /pas compris/.test(pan.lignes[2].rep),
     pan.lignes.map(l => l.rep.slice(0, 30)).join(' | '));
  /* Elle reste écrite : c'est un texte de consignes, on ne le retape pas. */
  ck('et reste écrite dans le panneau', pan.lignes[2].txt.includes('licorne'));
  /* LE BANDEAU : ce que le logiciel reconnaît. Il parle tant qu'on cherche ses
     mots, et se tait quand la ligne est faite. */
  ck('le bandeau se tait sur une ligne faite', !pan.lignes[0].bandeau && !pan.lignes[1].bandeau,
     JSON.stringify([pan.lignes[0].bandeau, pan.lignes[1].bandeau]));
  ck('l\'aide est là, repliée', pan.aideCachee === 'none' && pan.exemples >= 40,
     `${pan.exemples} exemples`);
  ck('le texte libre de l\'énoncé est replié, pas supprimé',
     pan.enonceReplie === 'none' && !!(await page.$('#instrContent')), pan.enonceReplie);

  console.log('\n=== on ne rejoue pas deux fois la même ligne ===');
  const rejeu = await page.evaluate(() => {
    const app = window.app;
    const avant = app.entities.length;
    const r = app.validerConsigne(0);
    return { avant, apres: app.entities.length, r,
             dit: document.querySelector('.csl-ligne .csl-reponse').textContent };
  });
  console.log('  ' + JSON.stringify(rejeu));
  ck('revalider une ligne inchangée ne refait rien',
     rejeu.apres === rejeu.avant && rejeu.r === false, `${rejeu.avant} → ${rejeu.apres}`);
  ck('et le dit', /déjà faite/.test(rejeu.dit), rejeu.dit);

  console.log('\n=== « Tout effacer » efface aussi l\'énoncé ===');
  const efface = await page.evaluate(async () => {
    const app = window.app;
    app.clearAll();
    await new Promise(r => setTimeout(r, 120));
    const b = [...document.querySelectorAll('.modal-box button, .modal button')]
      .find(x => /oui|confirmer|valider|ok/i.test(x.textContent));
    if (b) b.click();
    await new Promise(r => setTimeout(r, 250));
    return { objets: app.entities.length,
             lignes: [...document.querySelectorAll('.csl-champ')].map(c => c.value),
             enonce: (document.getElementById('instrContent').innerText || '').trim() };
  });
  console.log('  ' + JSON.stringify(efface));
  ck('la figure est vide', efface.objets === 0, String(efface.objets));
  /* Des consignes cochées « faites » devant une feuille vide, c'est un
     compte-rendu faux : elles décrivaient des objets qui n'existent plus. */
  ck('et les consignes sont parties avec elle',
     efface.lignes.length === 1 && efface.lignes[0] === '' && efface.enonce === '',
     JSON.stringify(efface.lignes));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
