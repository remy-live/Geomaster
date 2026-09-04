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
    const c = document.getElementById('consigneDetail');
    if (c) c.checked = !!det;
    const out = ph.map(p => { const r = app.executerConsigne(p); return { p, ok: r.ok, m: r.message, a: r.astuce }; });
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
    document.getElementById('consigneDetail').checked = false;
    const r = app.executerConsigne(p);
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
    document.getElementById('consigneDetail').checked = true;
    const r = app.executerConsigne(p);
    app.isPlaying = false; app.isLooping = false;
    document.getElementById('consigneDetail').checked = false;
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

  console.log('\n=== dans le panneau des consignes ===');
  /* La consigne intelligente vit DANS le panneau des consignes, pas dans une
     fenêtre à elle qui couvrirait la feuille : la phrase écrite est déjà celle
     de l'étape, et l'aperçu est la figure elle-même, autour. */
  const pan = await page.evaluate(async () => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    const boite = document.getElementById('instructionBox');
    if (boite.style.display === 'none' || !boite.style.display) app.toggleInstructions();
    app.consigneAuto = false; app.basculerConsigneAuto();
    const zone = document.getElementById('instrContent');
    zone.innerHTML = '<p>1. Place 3 points A, B, C non alignés</p>';
    const poser = (txt) => {
      const p = document.createElement('p'); p.textContent = txt; zone.appendChild(p);
      const sel = window.getSelection(), r = document.createRange();
      r.selectNodeContents(p); r.collapse(false); sel.removeAllRanges(); sel.addRange(r);
      return app.consigneDepuisPanneau();
    };
    // la première ligne, curseur dedans
    const sel = window.getSelection(), r0 = document.createRange();
    r0.selectNodeContents(zone.firstChild); r0.collapse(false);
    sel.removeAllRanges(); sel.addRange(r0);
    const un = app.consigneDepuisPanneau();
    const deux = poser('2. Trace [AB], [BC] et [CA]');
    const trois = poser('3. Trace la licorne');
    return { auto: app.consigneAuto,
             bouton: document.getElementById('btnConsigneAuto').className,
             un, deux, trois,
             etat: document.getElementById('consigneEtat').className,
             message: document.getElementById('consigneEtat').textContent,
             objets: app.entities.length,
             consignes: Object.values(app.stepInstructions),
             texteGarde: zone.innerText.includes('Trace la licorne'),
             sansFenetre: !document.getElementById('consigneModal'),
             exemples: document.querySelectorAll('#consigneAide a').length,
             aideCachee: document.getElementById('consigneAide').style.display };
  });
  console.log('  ' + JSON.stringify(pan));
  ck('il n\'y a plus de fenêtre séparée', pan.sansFenetre);
  ck('l\'exécution s\'arme d\'un bouton', pan.auto === true && /actif/.test(pan.bouton), pan.bouton);
  /* Le numéro d'un énoncé — « 1. » — ne fait pas partie de ce qu'il y a à faire. */
  ck('les lignes numérotées sont exécutées', pan.un === true && pan.deux === true,
     `${pan.un} / ${pan.deux}`);
  ck('la figure est construite', pan.objets === 6, String(pan.objets));
  ck('chaque ligne devient une consigne d\'étape', pan.consignes.length === 2,
     JSON.stringify(pan.consignes));
  ck('une ligne incomprise le dit', pan.trois === false && /rate/.test(pan.etat), pan.etat);
  /* Elle reste écrite : c'est un texte de consignes, on ne le retape pas. */
  ck('et reste écrite dans le panneau', pan.texteGarde);
  ck('l\'aide est là, repliée', pan.aideCachee === 'none' && pan.exemples >= 40,
     `${pan.exemples} exemples`);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
