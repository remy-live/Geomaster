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

  console.log('\n=== la fenêtre ===');
  const fen = await page.evaluate(async () => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    app.ouvrirConsigne();
    const champ = document.getElementById('consigneChamp');
    champ.value = 'Place 3 points A, B, C non alignés';
    app.validerConsigne();
    const apresOk = champ.value;
    champ.value = 'Trace la licorne';
    app.validerConsigne();
    const apresRate = champ.value;
    return { ouvert: document.getElementById('consigneModal').style.display,
             apresOk, apresRate,
             lignes: [...document.querySelectorAll('#consigneJournal .consigne-ligne')]
               .map(l => l.className.replace('consigne-ligne ', '')),
             exemples: document.querySelectorAll('.consigne-aide a').length,
             bouton: !!document.getElementById('btnConsigne') };
  });
  console.log('  ' + JSON.stringify(fen));
  ck('elle s\'ouvre et le bouton existe', fen.ouvert === 'flex' && fen.bouton);
  /* Comprise, la ligne s'efface — on enchaîne le programme. Incomprise, elle
     RESTE : on la corrige au lieu de la retaper. */
  ck('une consigne comprise vide le champ', fen.apresOk === '', fen.apresOk);
  ck('une consigne refusée reste pour être corrigée', fen.apresRate === 'Trace la licorne', fen.apresRate);
  ck('le journal dit ce qui est passé et ce qui a raté',
     JSON.stringify(fen.lignes) === '["ok","rate"]', JSON.stringify(fen.lignes));
  ck('la liste des formulations est là', fen.exemples >= 25, String(fen.exemples));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
