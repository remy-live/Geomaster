// UN ÉNONCÉ ENTIER, COLLÉ D'UN MANUEL, ET LE VOCABULAIRE QUI VA AVEC.
//
// Cette sonde ne demande pas seulement « la phrase passe-t-elle ? » : elle
// MESURE la figure obtenue. Une consigne qui répond « oui » en traçant autre
// chose est plus dangereuse qu'une consigne refusée — c'est ainsi que « les
// médiatrices de [AB] et [AC] » en traçait trois, et le disait comme si de
// rien n'était.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d !== undefined ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  /* Une feuille neuve, les phrases exécutées dans l'ordre, et ce qu'on peut
     mesurer dessus : les points, les cercles, le compte par classe. */
  const fig = (phrases, instruments) => page.evaluate(([ph, ins]) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    app._cslSujet = null; if (app.cslOublier) app.cslOublier();
    app.view = { x: 0, y: 0, zoom: 1 }; app.saveState();
    const res = ph.map(s => {
      try { return app.executerConsigneAvec(s, !!ins); }
      catch (e) { return { ok: false, message: 'EXCEPTION ' + e.message }; }
    });
    app.isPlaying = false; app.isLooping = false; app.isToolAnimating = false;
    app.render();
    return {
      res: res.map(r => ({ ok: r.ok, m: r.message, a: r.astuce || '' })),
      pts: Object.fromEntries(app.entities
        .filter(e => e.constructor.name === 'Point' && e.label)
        .map(e => [e.label, { x: e.x, y: e.y }])),
      cercles: app.entities.filter(e => e.constructor.name === 'Circle')
        .map(e => ({ r: +(Math.hypot(e.p1.x - e.p2.x, e.p1.y - e.p2.y) / 50).toFixed(3),
                     c: e.p1.label || null })),
      droites: app.entities.filter(e => e.nomDroite).map(e => e.nomDroite),
      objets: app.entities.reduce((o, e) => (o[e.constructor.name] = (o[e.constructor.name] || 0) + 1, o), {}),
    };
  }, [phrases, instruments]);

  // mesures, côté Node, à partir des coordonnées lues
  const cm = (P, a, b) => +(Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y) / 50).toFixed(2);
  const ang = (P, a, b, c) => {
    const u = Math.atan2(P[a].y - P[b].y, P[a].x - P[b].x);
    const v = Math.atan2(P[c].y - P[b].y, P[c].x - P[b].x);
    let d = Math.abs(v - u) * 180 / Math.PI; while (d > 180) d = 360 - d;
    return Math.round(d * 10) / 10;
  };
  const pente = (P, a, b) => { const t = Math.atan2(P[b].y - P[a].y, P[b].x - P[a].x) * 180 / Math.PI; return ((t % 180) + 180) % 180; };

  /* ================================================================
     1. UNE DROITE PORTE UN NOM, ET C'EST UNE MINUSCULE.
     « Trace une droite d » inventait deux points A et B et appelait la
     droite (AB) : le nom écrit dans l'énoncé disparaissait, et « la
     perpendiculaire à d » ne trouvait plus rien.
     ================================================================ */
  console.log('\n=== une droite se nomme d, pas (AB) ===');
  let r = await fig(['Trace une droite d']);
  ck('la droite porte le nom écrit', r.droites.join(',') === 'd', r.droites.join(','));
  ck('et la réponse le dit', /\(d\)/.test(r.res[0].m), r.res[0].m);
  ck('aucun point nommé n\'a été inventé', Object.keys(r.pts).length === 0, Object.keys(r.pts).join(''));

  r = await fig(['Trace deux droites d et d\'']);
  ck('« deux droites d et d\' » en donne deux', r.droites.sort().join(',') === "d,d'", r.droites.join(','));
  r = await fig(['Trace deux droites (d) et (d\')']);
  ck('avec ou sans parenthèses', r.droites.sort().join(',') === "d,d'", r.droites.join(','));

  console.log('\n=== et l\'on s\'en sert dans les phrases suivantes ===');
  r = await fig(['Trace une droite d', 'Place un point A sur d']);
  ck('« un point A SUR d » ne crée pas un point D',
     r.res[1].ok && !r.pts.D && !!r.pts.A, r.res[1].m);
  r = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._cslSujet = null; app.cslOublier();
    app.view = { x: 0, y: 0, zoom: 1 };
    ['Trace une droite d', 'Place un point A', 'Trace la perpendiculaire à d passant par A']
      .forEach(x => app.executerConsigneAvec(x, false));
    const dr = app.entities.find(e => e.nomDroite === 'd');
    const pe = app.entities.find(e => e.constructor.name === 'PerpendicularLine');
    if (!dr || !pe || !pe.refLine) return { ok: false };
    const u = Math.atan2(dr.p2.y - dr.p1.y, dr.p2.x - dr.p1.x);
    const v = Math.atan2(pe.refLine.p2.y - pe.refLine.p1.y, pe.refLine.p2.x - pe.refLine.p1.x);
    let d = Math.abs(v - u) * 180 / Math.PI; while (d > 180) d = 360 - d;
    const A = app.entities.find(e => e.constructor.name === 'Point' && e.label === 'A');
    return { ok: true, ecart: Math.round(d * 100) / 100, parA: pe.p1 === A };
  });
  ck('la perpendiculaire à d s\'appuie bien sur d', r.ok && r.ecart < 0.01, JSON.stringify(r));
  ck('et passe par A', r.parA === true);

  /* ================================================================
     2. ON DEMANDE DEUX MÉDIATRICES, ON EN A DEUX.
     ================================================================ */
  console.log('\n=== le pluriel ne veut pas dire « toutes celles du triangle » ===');
  r = await fig(['Place les points A, B et C', 'Trace les médiatrices de [AB] et [AC]']);
  ck('deux médiatrices, pas trois', r.objets.PerpendicularLine === 2,
     `${r.objets.PerpendicularLine} — ${r.res[1].m}`);
  r = await fig(['Trace un triangle ABC tel que AB = 6 cm, AC = 5 cm et BC = 4 cm',
                 'Trace les hauteurs issues de A et de B']);
  ck('deux hauteurs, pas trois', r.objets.PerpendicularLine === 2,
     `${r.objets.PerpendicularLine} — ${r.res[1].m}`);
  r = await fig(['Trace un triangle ABC tel que AB = 6 cm, AC = 5 cm et BC = 4 cm',
                 'Trace les médiatrices']);
  ck('mais « les médiatrices » tout court en donne trois',
     r.objets.PerpendicularLine === 3, String(r.objets.PerpendicularLine));

  console.log('\n=== deux droites nommées se tracent toutes les deux ===');
  r = await fig(['Place les points A, B et C', 'Trace les droites (AB) et (BC)']);
  ck('« les droites (AB) et (BC) » en trace deux', r.objets.Line === 2,
     `${r.objets.Line} — ${r.res[1].m}`);

  /* ================================================================
     3. LE TRIANGLE DE LA PHRASE PRÉCÉDENTE.
     ================================================================ */
  console.log('\n=== on ne redit pas le triangle à chaque ligne ===');
  const T = 'Trace un triangle ABC tel que AB = 6 cm, AC = 5 cm et BC = 4 cm';
  r = await fig([T, 'Trace la hauteur issue de A']);
  ck('« la hauteur issue de A » trouve son triangle', r.res[1].ok, r.res[1].m);
  r = await fig([T, 'Trace le cercle circonscrit']);
  ck('« le cercle circonscrit » aussi', r.res[1].ok, r.res[1].m);

  /* ================================================================
     4. LES POSSESSIFS D'UN ÉNONCÉ.
     ================================================================ */
  console.log('\n=== « son milieu », « leur point d\'intersection » ===');
  r = await fig(['Trace un segment [AB] de 6 cm', 'Place son milieu I']);
  ck('« place son milieu I » place le milieu de [AB]',
     r.res[1].ok && Math.abs(cm(r.pts, 'A', 'I') - cm(r.pts, 'I', 'B')) < 0.02,
     r.res[1].m);
  ck('et la reformulation est dite', /le milieu I de \[AB\]/.test(r.res[1].a), r.res[1].a);
  r = await fig(['Trace un carré ABCD de côté 4 cm', 'Trace ses diagonales',
                 'Appelle O leur point d\'intersection']);
  ck('« leur point d\'intersection » sur SA ligne', r.res[2].ok, r.res[2].m);
  ck('O est bien au centre du carré',
     Math.abs(cm(r.pts, 'O', 'A') - cm(r.pts, 'O', 'C')) < 0.02
     && Math.abs(cm(r.pts, 'O', 'B') - cm(r.pts, 'O', 'D')) < 0.02,
     `${cm(r.pts, 'O', 'A')} / ${cm(r.pts, 'O', 'C')}`);

  /* ================================================================
     5. LE TRAPÈZE N'EST PAS UN RECTANGLE.
     « Trace un trapèze ABCD » traçait un RECTANGLE : la figure affirmait
     quatre angles droits que personne n'avait demandés.
     ================================================================ */
  console.log('\n=== le trapèze a deux côtés parallèles, et c\'est tout ===');
  r = await fig(['Trace un trapèze ABCD']);
  ck('[AB] et [DC] sont parallèles',
     Math.abs(pente(r.pts, 'A', 'B') - pente(r.pts, 'D', 'C')) < 0.5,
     `${pente(r.pts, 'A', 'B').toFixed(1)}° / ${pente(r.pts, 'D', 'C').toFixed(1)}°`);
  ck('les obliques ne le sont pas',
     Math.abs(pente(r.pts, 'A', 'D') - pente(r.pts, 'B', 'C')) > 5);
  ck('ce n\'est pas un rectangle', Math.abs(ang(r.pts, 'D', 'A', 'B') - 90) > 3,
     ang(r.pts, 'D', 'A', 'B') + '°');
  r = await fig(['Trace un trapèze rectangle ABCD']);
  ck('le trapèze rectangle a son angle droit', Math.abs(ang(r.pts, 'D', 'A', 'B') - 90) < 0.5,
     ang(r.pts, 'D', 'A', 'B') + '°');
  ck('mais pas quatre', Math.abs(ang(r.pts, 'A', 'B', 'C') - 90) > 3, ang(r.pts, 'A', 'B', 'C') + '°');
  r = await fig(['Trace un trapèze isocèle ABCD']);
  ck('le trapèze isocèle a ses obliques égales',
     Math.abs(cm(r.pts, 'A', 'D') - cm(r.pts, 'B', 'C')) < 0.02,
     `${cm(r.pts, 'A', 'D')} / ${cm(r.pts, 'B', 'C')}`);

  /* ================================================================
     6. LE LOSANGE ET SA DIAGONALE.
     ================================================================ */
  console.log('\n=== « de côté 4 cm et de diagonale AC = 6 cm » ===');
  r = await fig(['Trace un losange ABCD de côté 4 cm et de diagonale AC = 6 cm']);
  ck('la phrase passe', r.res[0].ok, r.res[0].m);
  ck('AC mesure 6 cm', Math.abs(cm(r.pts, 'A', 'C') - 6) < 0.05, cm(r.pts, 'A', 'C') + ' cm');
  ck('les quatre côtés font 4 cm',
     ['AB', 'BC', 'CD', 'DA'].every(s => Math.abs(cm(r.pts, s[0], s[1]) - 4) < 0.05),
     ['AB', 'BC', 'CD', 'DA'].map(s => cm(r.pts, s[0], s[1])).join(' / '));

  /* ================================================================
     7. LES ANGLES DONNÉS PAR LEUR MESURE, ET L'ANGLE DROIT CODÉ.
     ================================================================ */
  console.log('\n=== un angle de 60° de sommet A ===');
  r = await fig(['Place un point A', 'Trace un angle de 60° de sommet A']);
  const cotes = Object.keys(r.pts).filter(n => n !== 'A');
  ck('deux côtés partent de A', cotes.length === 2, cotes.join(''));
  ck('et l\'angle mesure 60°', Math.abs(ang(r.pts, cotes[0], 'A', cotes[1]) - 60) < 0.5,
     ang(r.pts, cotes[0], 'A', cotes[1]) + '°');
  r = await fig(['Trace un carré ABCD de côté 4 cm', 'Code l\'angle droit en A']);
  ck('« Code l\'angle droit en A » pose l\'angle', r.res[1].ok && r.objets.Angle === 1,
     `${r.res[1].m} / ${r.objets.Angle}`);
  r = await fig(['Place les points A, B et C', 'Code l\'angle droit en A']);
  ck('sans deux traits en A, il le dit', r.res[1].ok === false, r.res[1].m);
  r = await fig(['Trace un triangle ABC tel que AB = 6 cm, AC = 5 cm et BC = 4 cm',
                 'Code l\'angle droit en A']);
  ck('et si l\'angle n\'est pas droit, il le dit aussi',
     /n'est pas un angle droit/.test(r.res[1].a), r.res[1].a);

  /* ================================================================
     8. LE POLYGONE QUELCONQUE, LE CERCLE DANS TOUS LES SENS.
     ================================================================ */
  console.log('\n=== « Trace un polygone ABCDE » ===');
  r = await fig(['Trace un polygone ABCDE']);
  ck('cinq sommets et cinq côtés',
     Object.keys(r.pts).length === 5 && r.objets.Segment === 5,
     `${Object.keys(r.pts).join('')} / ${r.objets.Segment}`);

  console.log('\n=== le cercle, dans tous les sens ===');
  for (const [phrase, rayon] of [
    ['Trace un cercle de 6 cm de diamètre', 3],
    ['Trace un cercle de diamètre 6 cm', 3],
    ['Trace un cercle de 3 cm de rayon', 3],
    ['Trace un cercle de rayon 3 cm', 3],
  ]) {
    r = await fig([phrase]);
    ck(`« ${phrase} » → rayon ${rayon} cm`,
       r.cercles.length === 1 && Math.abs(r.cercles[0].r - rayon) < 0.01,
       JSON.stringify(r.cercles));
  }
  r = await fig(['Place un point O', 'Trace un cercle de rayon 2,5 cm de centre O']);
  ck('la réponse ne redit pas deux fois le centre',
     (r.res[1].m.match(/de centre/g) || []).length === 1, r.res[1].m);
  r = await fig(['Place les points A et B', 'Trace le cercle de diamètre [AB]']);
  ck('un cercle de diamètre [AB] n\'a pas de centre « · »',
     !/·/.test(r.res[1].m), r.res[1].m);

  /* ================================================================
     9. UN ÉNONCÉ NE CONTIENT PAS QUE DES CONSTRUCTIONS.
     ================================================================ */
  console.log('\n=== les phrases qui ne demandent rien à tracer ===');
  for (const phrase of ['Que remarques-tu ?', 'Justifie ta réponse',
                        'Vérifie que les trois droites sont concourantes']) {
    r = await fig([phrase]);
    ck(`« ${phrase} » passe sans rien tracer`,
       r.res[0].ok && Object.keys(r.objets).length === 0, r.res[0].m);
  }

  /* ================================================================
     10. L'ÉNONCÉ ENTIER, COLLÉ D'UN MANUEL.
     ================================================================ */
  console.log('\n=== douze lignes d\'affilée, et la figure mesurée ===');
  const enonce = [
    'Étape 1',
    'Trace un cercle de centre O et de rayon 4 cm',
    'Place deux points A et B sur ce cercle',
    'Trace le segment [AB]',
    'Place son milieu I',
    'Trace la médiatrice de [AB]',
    'Elle passe par O',
    'Étape 2',
    'Place un point C sur le cercle',
    'Trace le triangle ABC',
    'Trace les hauteurs issues de A et de B',
    'Que remarques-tu ?',
  ];
  r = await fig(enonce);
  r.res.forEach((x, i) => console.log(`  ${x.ok ? '·' : '✗'} ${enonce[i]} → ${x.m}`));
  ck('les douze lignes passent', r.res.every(x => x.ok),
     r.res.map((x, i) => x.ok ? '' : enonce[i]).filter(Boolean).join(' | '));
  ck('« deux points A et B sur ce cercle » en pose bien DEUX',
     !!r.pts.A && !!r.pts.B, Object.keys(r.pts).join(''));
  ck('A, B et C sont sur le cercle de 4 cm',
     ['A', 'B', 'C'].every(n => Math.abs(cm(r.pts, 'O', n) - 4) < 0.05),
     ['A', 'B', 'C'].map(n => cm(r.pts, 'O', n)).join(' / '));
  ck('I est le milieu de [AB]',
     Math.abs(cm(r.pts, 'A', 'I') - cm(r.pts, 'I', 'B')) < 0.02,
     `${cm(r.pts, 'A', 'I')} / ${cm(r.pts, 'I', 'B')}`);

  /* ================================================================
     11. CE QU'ON TRACE DANS UN CERCLE N'EST PAS UN CERCLE.
     « Trace la tangente au cercle en A » fabriquait un SECOND CERCLE
     centré sur A : le mot « cercle » suffisait à envoyer la phrase au
     bâtisseur de cercles.
     ================================================================ */
  console.log('\n=== tangente, rayon, diamètre, corde ===');
  const C3 = ['Place un point O', 'Trace le cercle de centre O et de rayon 3 cm'];
  r = await fig([...C3, 'Trace la tangente au cercle en A']);
  ck('la tangente passe', r.res[2].ok, r.res[2].m);
  ck('et ne fabrique pas un second cercle', r.cercles.length === 1, JSON.stringify(r.cercles));
  ck('A est posé sur le cercle', !!r.pts.A && Math.abs(cm(r.pts, 'O', 'A') - 3) < 0.02,
     r.pts.A ? cm(r.pts, 'O', 'A') + ' cm' : 'absent');
  r = await fig([...C3, 'Trace un diamètre de ce cercle']);
  const bouts = Object.keys(r.pts).filter(n => n !== 'O');
  ck('le diamètre mesure deux rayons',
     bouts.length === 2 && Math.abs(cm(r.pts, bouts[0], bouts[1]) - 6) < 0.05,
     bouts.length === 2 ? cm(r.pts, bouts[0], bouts[1]) + ' cm' : bouts.join(''));
  r = await fig([...C3, 'Trace une corde de ce cercle']);
  const cd = Object.keys(r.pts).filter(n => n !== 'O');
  ck('les deux bouts de la corde sont sur le cercle',
     cd.length === 2 && cd.every(n => Math.abs(cm(r.pts, 'O', n) - 3) < 0.02),
     cd.map(n => cm(r.pts, 'O', n)).join(' / '));

  console.log('\n=== le cercle passant par trois points ===');
  r = await fig([T, 'Trace le cercle passant par A, B et C']);
  ck('c\'est le cercle circonscrit, pas un cercle inventé',
     r.res[1].ok && r.cercles.length === 1, `${r.res[1].m} / ${r.cercles.length}`);
  r = await fig([T, 'Trace le cercle circonscrit']);
  ck('sans les instruments, c\'est un vrai cercle', r.cercles.length === 1,
     JSON.stringify(r.objets));
  r = await fig([T, 'Trace le cercle circonscrit'], true);
  ck('avec les instruments, c\'est la construction au compas',
     !r.objets.Circle && r.objets.CompassArc > 0, JSON.stringify(r.objets));

  /* ================================================================
     12. MARQUER LES ANGLES, ET NON RETRACER LA FIGURE.
     ================================================================ */
  console.log('\n=== « Marque les angles du triangle ABC » ===');
  r = await fig([T, 'Marque les angles du triangle ABC']);
  ck('trois angles, un seul triangle', r.objets.Angle === 3 && r.objets.Polygon === 1,
     `${r.objets.Angle} angles / ${r.objets.Polygon} polygone(s)`);
  r = await fig(['Trace un carré ABCD de côté 4 cm', 'Marque les angles droits']);
  ck('quatre angles droits sur un carré', r.objets.Angle === 4 && r.objets.Polygon === 1,
     `${r.objets.Angle} / ${r.objets.Polygon}`);
  r = await fig([T, 'Marque les angles droits']);
  ck('et rien sur un triangle quelconque, avec un mot', r.res[1].ok === false, r.res[1].m);

  /* ================================================================
     13. UN CÔTÉ NOMMÉ DÉSIGNE LE SOMMET OPPOSÉ.
     ================================================================ */
  console.log('\n=== « la médiane de [BC] », « la hauteur relative à [BC] » ===');
  r = await fig([T, 'Trace la médiane de [BC]']);
  ck('UNE médiane, pas trois', r.objets.Segment === 4,
     `${r.objets.Segment} segments (3 côtés + 1)`);
  r = await fig([T, 'Trace la hauteur relative à [BC]']);
  ck('UNE hauteur, celle issue de A', r.res[1].ok && r.objets.PerpendicularLine === 1,
     r.res[1].m);
  r = await fig([T, 'Trace la hauteur issue du sommet A']);
  ck('« issue du sommet A » se dit aussi', r.res[1].ok, r.res[1].m);

  console.log('\n=== plusieurs milieux nommés ===');
  r = await fig([T, 'Place les milieux I de [AB] et J de [AC]']);
  ck('les DEUX milieux sont posés', !!r.pts.I && !!r.pts.J, Object.keys(r.pts).join(''));
  ck('I au milieu de [AB], J au milieu de [AC]',
     Math.abs(cm(r.pts, 'A', 'I') - cm(r.pts, 'I', 'B')) < 0.02
     && Math.abs(cm(r.pts, 'A', 'J') - cm(r.pts, 'J', 'C')) < 0.02);

  /* ================================================================
     14. CE QU'ON NE SAIT PAS FAIRE SE DIT.
     « Trace la translation du triangle ABC » retraçait le triangle
     par-dessus lui-même et répondait « Triangle ABC ».
     ================================================================ */
  console.log('\n=== une transformation inconnue ne fait pas semblant ===');
  r = await fig(['Trace un triangle ABC', 'Trace la translation du triangle ABC']);
  ck('elle est refusée, et expliquée',
     r.res[1].ok === false && /translations/.test(r.res[1].m), r.res[1].m);
  ck('et le triangle n\'a pas été retracé', r.objets.Polygon === 1, String(r.objets.Polygon));
  r = await fig([T, 'Trace l\'image du triangle ABC par la symétrie de centre A']);
  ck('« l\'image DU triangle » est bien une symétrie',
     r.res[1].ok && r.objets.Polygon === 1, `${r.res[1].m} / ${r.objets.Polygon}`);

  console.log('\n=== un complément n\'est pas une consigne ===');
  r = await fig(['De centre O et de rayon 3 cm, trace un cercle']);
  ck('la phrase se comprend d\'un bloc', r.res[0].ok && r.cercles.length === 1, r.res[0].m);

  /* ================================================================
     15. LES VERBES D'ÉNONCÉ QUI NE CONSTRUISAIENT RIEN.
     « Colorie le triangle ABC » retraçait le triangle par-dessus
     lui-même ; « Prolonge [AB] » et « Partage [AB] en trois parts
     égales » ne faisaient rien tout en répondant « Segment [AB] ».
     ================================================================ */
  console.log('\n=== colorier, prolonger, partager ===');
  r = await fig([T, 'Colorie le triangle ABC']);
  ck('colorier remplit, sans retracer', r.res[1].ok && r.objets.Polygon === 1,
     `${r.res[1].m} / ${r.objets.Polygon} polygone(s)`);
  r = await fig([T, 'Hachure le triangle ABC']);
  ck('hachurer aussi', /Hachures/.test(r.res[1].m) && r.objets.Polygon === 1, r.res[1].m);
  r = await fig([T, 'Prolonge [AB]']);
  ck('prolonger fait une droite', r.res[1].ok && r.objets.Line === 1, r.res[1].m);
  r = await fig(['Trace un segment [AB] de 6 cm', 'Partage [AB] en trois parts égales']);
  ck('partager pose les points de partage',
     r.res[1].ok && Object.keys(r.pts).length === 4, `${r.res[1].m}`);
  if (Object.keys(r.pts).length === 4) {
    const suite = ['A', ...Object.keys(r.pts).filter(n => n !== 'A' && n !== 'B'), 'B'];
    const parts = [];
    for (let i = 0; i < suite.length - 1; i++) parts.push(cm(r.pts, suite[i], suite[i + 1]));
    ck('et les trois parts sont égales',
       parts.every(x => Math.abs(x - parts[0]) < 0.02), parts.join(' / '));
  }
  r = await fig(['Trace un segment [AB] de 6 cm', 'Partage [AB] en deux parts égales']);
  ck('en deux, c\'est le milieu', r.res[1].ok && /milieu/.test(r.res[1].m), r.res[1].m);

  console.log('\n=== deux figures dans une phrase ===');
  r = await fig(['Trace un triangle ABC et un triangle DEF']);
  ck('les deux triangles sont tracés', r.objets.Polygon === 2 && Object.keys(r.pts).length === 6,
     `${r.objets.Polygon} polygones / ${Object.keys(r.pts).join('')}`);

  console.log('\n=== effacer n\'est pas construire ===');
  r = await fig(['Place les points A, B et C', 'Efface le point C']);
  ck('la consigne le dit clairement',
     r.res[1].ok === false && /n'efface pas/.test(r.res[1].m), r.res[1].m);

  console.log('\n=== « la médiatrice de chaque côté » ===');
  r = await fig([T, 'Trace la médiatrice de chaque côté']);
  ck('trois médiatrices', r.objets.PerpendicularLine === 3, String(r.objets.PerpendicularLine));
  r = await fig([T, 'Affiche les mesures des angles']);
  ck('les trois angles sont marqués et chiffrés', r.res[1].ok && r.objets.Angle === 3,
     `${r.res[1].m} / ${r.objets.Angle}`);

  /* ================================================================
     16. L'ANGLE ÉCRIT PAR SON SEUL SOMMET.
     « Trace un triangle ABC tel que AB = 5 cm, A = 30° et B = 40° » —
     le raccourci qu'on écrit en classe quand le triangle est déjà
     nommé — était refusé pour « manque de mesures » alors que les
     trois y étaient. Et Â, avec son chapeau, ne valait pas mieux.
     ================================================================ */
  console.log('\n=== « A = 30° » : l\'angle par son sommet ===');
  for (const phrase of [
    'Trace un triangle ABC tel que AB = 5 cm, A = 30° et B = 40°',
    'trace un triangle ABC tel que AB = 5 cm, A = 30° et B =40°',
    // le chapeau, sous ses trois écritures : Â, A avec accent combinant, A°
    'Trace un triangle ABC tel que AB = 5 cm, Â = 30° et B̂ = 40°',
    'Trace un triangle ABC tel que AB = 5 cm, A° = 30° et B° = 40°',
    'Trace un triangle ABC tel que AB = 5 cm, A^ = 30° et B^ = 40°',
    // sans la virgule, et le ° collé au = : la phrase telle qu'on la tape
    'trace un triangle ABC tel que AB = 5 cm A = 30° et B°=40°.',
    'Trace un triangle ABC tel que AB = 5 cm, BAC = 30° et ABC = 40°',
    'Trace un triangle ABC tel que AB = 5 cm, l\'angle A = 30° et l\'angle B = 40°',
  ]) {
    r = await fig([phrase]);
    const ok = r.res[0].ok
      && Math.abs(cm(r.pts, 'A', 'B') - 5) < 0.05
      && Math.abs(ang(r.pts, 'B', 'A', 'C') - 30) < 0.5
      && Math.abs(ang(r.pts, 'A', 'B', 'C') - 40) < 0.5;
    ck(`« ${phrase.slice(30)} »`, ok,
       r.res[0].ok ? `AB=${cm(r.pts, 'A', 'B')} A=${ang(r.pts, 'B', 'A', 'C')}° B=${ang(r.pts, 'A', 'B', 'C')}°`
                   : r.res[0].m);
  }
  r = await fig(['Trace un triangle ABC tel que AB = 5 cm, A = 30° et B = 40°']);
  ck('et la notation juste est rappelée', /s\'écrit/.test(r.res[0].a), r.res[0].a);

  /* Le nom d'une droite survit à la sauvegarde : sans cela, rouvrir le
     fichier rendrait la droite anonyme et « la perpendiculaire à d »
     ne trouverait plus rien. */
  console.log('\n=== le nom de la droite survit au fichier ===');
  const voyage = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._cslSujet = null; app.cslOublier();
    app.view = { x: 0, y: 0, zoom: 1 };
    app.executerConsigneAvec('Trace une droite d', false);
    const code = app.serialize();
    const relu = app.deserialize(code);
    const vieux = JSON.parse(code).map(o => { delete o.nomDroite; return o; });
    const ancien = app.deserialize(JSON.stringify(vieux));
    return { relu: relu.filter(e => e.nomDroite).map(e => e.nomDroite),
             ancienOK: ancien.length === relu.length,
             ancienNom: ancien.some(e => e.nomDroite) };
  });
  ck('la droite relue porte encore son nom', voyage.relu.join(',') === 'd', JSON.stringify(voyage.relu));
  ck('un fichier d\'avant s\'ouvre, simplement sans nom',
     voyage.ancienOK && voyage.ancienNom === false, JSON.stringify(voyage));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
