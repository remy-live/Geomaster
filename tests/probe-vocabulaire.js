// CE QUE LE LECTEUR DE CONSIGNES COMPREND EN PLUS — et deux figures qui ne sont
// dans aucune liste.
//
// Quarante phrases de manuel passées au banc : seize échouaient. Cette sonde
// garde les onze qui ont été gagnées, en MESURANT la figure obtenue et non en se
// contentant d'un « ok » : une phrase comprise qui trace autre chose est pire
// qu'une phrase refusée.
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
  await page.goto(PAGE); await page.waitForTimeout(1500);

  /* Une phrase sur une feuille propre, et tout ce qu'on peut en mesurer. */
  const faire = (phrases, outils = false) => page.evaluate(([ph, ou]) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._consignes = []; app._cslSujet = null;
    if (app.cslOublier) app.cslOublier();
    let r = null;
    for (const x of ph) { try { r = app.executerConsigneAvec(x, ou); } catch (e) { return { crash: e.message }; } }
    const pt = {};
    app.entities.forEach(e => { if (e.constructor.name === 'Point' && e.label) pt[e.label] = e; });
    const U = 50 / (app.cmScale || 1);
    const cm = (x, y) => (pt[x] && pt[y])
      ? +(Math.hypot(pt[x].x - pt[y].x, pt[x].y - pt[y].y) / U).toFixed(2) : null;
    const deg = (x, s, y) => {
      if (!pt[x] || !pt[s] || !pt[y]) return null;
      const a = Math.atan2(pt[x].y - pt[s].y, pt[x].x - pt[s].x)
              - Math.atan2(pt[y].y - pt[s].y, pt[y].x - pt[s].x);
      const v = Math.abs(a * 180 / Math.PI) % 360;
      return +(v > 180 ? 360 - v : v).toFixed(1);
    };
    const cpt = {};
    app.entities.forEach(e => { cpt[e.constructor.name] = (cpt[e.constructor.name] || 0) + 1; });
    /* La direction de chaque objet linéaire, pour mesurer parallélisme et
       perpendicularité sans se fier au mot employé dans la réponse. */
    const dirs = app.entities
      .filter(e => /^(Line|Ray|Segment|ParallelLine|PerpendicularLine)$/.test(e.constructor.name))
      .map(e => { const c = MathUtils.getLineCoords(e);
        return (c && c.p1 && c.p2) ? Math.atan2(c.p2.y - c.p1.y, c.p2.x - c.p1.x) : null; })
      .filter(v => v !== null);
    /* Le rayon se MESURE sur la figure : un cercle est défini par son centre et
       un point, et se fier à getRadius() rendait 0 sur ce chemin-là. */
    const cercles = app.entities.filter(e => /Circle/.test(e.constructor.name))
      .map(e => {
        const c = e.p1 || e.center;
        const q = e.p2;
        if (c && q) return +(Math.hypot(q.x - c.x, q.y - c.y) / U).toFixed(2);
        return +((e.radius || 0) / U).toFixed(2);
      });
    return { ok: !!(r && r.ok), msg: (r && r.message) || '', astuce: (r && r.astuce) || '',
             cpt, dirs, cercles, pts: Object.keys(pt).sort().join(''),
             grille: app.gridMode,
             AB: cm('A', 'B'), AC: cm('A', 'C'), BC: cm('B', 'C'), BD: cm('B', 'D'),
             A: deg('B', 'A', 'C'), B: deg('A', 'B', 'C'), C: deg('A', 'C', 'B') };
  }, [phrases, outils]);
  /* L'angle entre les deux premiers objets linéaires, en degrés. */
  const entre = (r) => {
    if (!r.dirs || r.dirs.length < 2) return null;
    const v = Math.abs((r.dirs[0] - r.dirs[1]) * 180 / Math.PI) % 180;
    return +(v > 90 ? 180 - v : v).toFixed(1);
  };

  console.log('\n=== la phrase nomme ses points : on les pose ===');
  /* « Trace la parallèle à (AB) passant par C » sur une feuille vide répondait
     « Je ne connais pas A. » — alors que la ligne d'en dessous CRÉAIT déjà C sans
     rien dire. Le logiciel se contredisait au sein d'une même phrase. */
  for (const [ph, mot] of [['Trace la parallèle à (AB) passant par C', 0],
                           ['Trace la perpendiculaire à (AB) passant par C', 90]]) {
    const r = await faire([ph]);
    ck(`« ${ph} » sur une feuille vide`, r.ok && /ABC/.test(r.pts), `${r.msg} / ${r.pts}`);
    ck('  et l\'angle obtenu est le bon', entre(r) === mot, `${entre(r)}° attendu ${mot}°`);
    ck('  et le logiciel DIT qu\'il a placé les points',
       /n'existaient pas|n'existait pas/.test(r.astuce), r.astuce);
  }
  let r = await faire(['Place le symétrique de A par rapport à B']);
  ck('« Place le symétrique de A par rapport à B »', r.ok && !!r.pts.match(/A/), r.msg);
  /* B est le MILIEU de [AA'] : c'est la définition, et c'est mesurable. */
  const symC = await page.evaluate(() => {
    const app = window.app; const pt = {};
    app.entities.forEach(e => { if (e.constructor.name === 'Point' && e.label) pt[e.label] = e; });
    if (!pt.A || !pt.B || !pt["A'"]) return null;
    return [Math.round((pt.A.x + pt["A'"].x) / 2 - pt.B.x), Math.round((pt.A.y + pt["A'"].y) / 2 - pt.B.y)];
  });
  ck('  et B est bien le milieu de [AA\']', symC && symC[0] === 0 && symC[1] === 0, JSON.stringify(symC));
  /* La limite reste : compléter une figure à moitié construite reviendrait à
     inventer un point au milieu du travail de quelqu'un. */
  r = await faire(['Place le point A', 'Trace le symétrique de A par rapport à la droite (BC)']);
  ck('mais un axe à moitié connu ne s\'invente pas', r.ok || /placez-le|Je ne connais/.test(r.msg), r.msg);

  console.log('\n=== deux droites qui se répondent ===');
  /* « Trace deux droites perpendiculaires » était REFUSÉE — « à quelle droite ? » —
     alors que la phrase ne parle d'aucune droite existante : elle demande les
     deux. Et « parallèles » passait en traçant deux droites de pentes
     DIFFÉRENTES : la réponse disait une chose, le dessin une autre. */
  for (const [ph, attendu] of [['Trace deux droites parallèles', 0],
                               ['Trace deux droites perpendiculaires', 90]]) {
    const q = await faire([ph]);
    ck(`« ${ph} »`, q.ok && q.dirs.length >= 2, q.msg);
    ck(`  l'angle mesuré vaut ${attendu}°`, entre(q) === attendu, `${entre(q)}°`);
  }
  const perp = await faire(['Trace deux droites perpendiculaires']);
  ck('  et l\'angle droit est CODÉ sur la figure', (perp.cpt.Angle || 0) >= 1,
     JSON.stringify(perp.cpt));
  const sec = await faire(['Trace deux droites sécantes']);
  ck('« sécantes » : elles se croisent sans être perpendiculaires',
     sec.ok && entre(sec) > 5 && entre(sec) < 85, `${entre(sec)}°`);

  console.log('\n=== un triangle décrit par ses trois angles ===');
  /* Les angles fixent la FORME, pas la taille : l'énoncé ne donne pas de
     longueur parce qu'elle n'a pas d'importance. Ils étaient lus PUIS JETÉS —
     on retombait sur le triangle quelconque, et la figure démentait l'énoncé. */
  r = await faire(['Trace un triangle dont les angles mesurent 40°, 60° et 80°']);
  console.log('  ' + JSON.stringify([r.A, r.B, r.C]));
  ck('les trois angles sont ceux de l\'énoncé',
     r.A === 40 && r.B === 60 && r.C === 80, JSON.stringify([r.A, r.B, r.C]));
  /* Et une somme qui ne fait pas 180° se dit, elle ne s'arrondit pas en silence. */
  r = await faire(['Trace un triangle dont les angles mesurent 40°, 60° et 90°']);
  ck('une somme fausse est refusée, avec le total',
     !r.ok && /190/.test(r.msg) && /180/.test(r.msg), r.msg);

  console.log('\n=== un losange décrit par ses deux diagonales ===');
  /* C'est la façon dont un manuel le décrit le plus souvent : elles se coupent
     en leur milieu et à angle droit. Le côté n'est plus une donnée, il se
     déduit — c'est Pythagore, et c'est l'exercice. */
  r = await faire(['Trace un losange dont les diagonales mesurent 6 cm et 4 cm']);
  const diag = [r.AC, r.BD].sort((a, c) => c - a);
  ck('les deux diagonales mesurent 6 cm et 4 cm', diag[0] === 6 && diag[1] === 4,
     JSON.stringify(diag));
  /* Un losange a quatre côtés ÉGAUX : ici √(3²+2²) = 3,61 cm. */
  const cotes = await page.evaluate(() => {
    const app = window.app; const U = 50 / (app.cmScale || 1);
    const L = app.entities.filter(e => e.constructor.name === 'Segment')
      .map(e => +(Math.hypot(e.p1.x - e.p2.x, e.p1.y - e.p2.y) / U).toFixed(2));
    return { min: Math.min(...L), max: Math.max(...L), n: L.length };
  });
  ck('  et les quatre côtés sont égaux, à √13 = 3,61 cm',
     Math.abs(cotes.min - 3.61) < 0.02 && cotes.min === cotes.max, JSON.stringify(cotes));

  console.log('\n=== un cercle donné par sa circonférence ===');
  r = await faire(['Trace un cercle de circonférence 12 cm']);
  ck('la phrase passe', r.ok, r.msg);
  /* r = C / 2π = 12 / 6,283 = 1,91 cm. */
  ck('  et le rayon vaut C ÷ 2π = 1,91 cm',
     r.cercles.length && Math.abs(r.cercles[0] - 1.91) < 0.02, JSON.stringify(r.cercles));
  ck('  le calcul est montré, pas seulement fait', /2π/.test(r.astuce), r.astuce);

  console.log('\n=== le papier se choisit à la phrase ===');
  /* « Efface le quadrillage » tombait sur la gomme — « je sais effacer TOUT » —
     ce qui n'a aucun rapport : le quadrillage n'est pas un objet de la figure,
     c'est le papier sur lequel on la trace. */
  for (const [ph, mode] of [['Efface le quadrillage', 3], ['Mets le papier à points', 1],
                            ['Mets le papier triangulé', 2], ['Mets le papier de cahier', 4],
                            ['Mets le papier à carreaux', 0]]) {
    const q = await faire([ph]);
    ck(`« ${ph} »`, q.ok && q.grille === mode, `${q.msg} / mode ${q.grille}`);
  }

  console.log('\n=== ce qu\'on DICTE, et ce qu\'on écrit ===');
  /* « Trace un triangle APC tel que P égal 5 cm assez égal 6 cm et PC égal
     7 cm » : personne ne TAPE cela. C'est de la dictée vocale, et le logiciel la
     recevait comme une phrase écrite — il n'y lisait aucune mesure et traçait un
     triangle quelconque EN RÉPONDANT « Triangle APC », comme si tout allait
     bien. Mesuré alors : 3 / 3,6 / 4,2 cm au lieu de 5 / 6 / 7. Un refus aurait
     été moins grave qu'une figure fausse qu'on croit juste. */
  const dictee = await faire(['Trace un triangle APC tel que P égal 5 cm assez égal 6 cm '
    + 'et PC égal 7 cm. Trace aussi les médiatrices.']);
  const cotesD = await page.evaluate(() => {
    const app = window.app; const pt = {}; const U = 50 / (app.cmScale || 1);
    app.entities.forEach(e => { if (e.constructor.name === 'Point' && e.label) pt[e.label] = e; });
    const d = (x, y) => (pt[x] && pt[y])
      ? +(Math.hypot(pt[x].x - pt[y].x, pt[x].y - pt[y].y) / U).toFixed(2) : null;
    return { AP: d('A', 'P'), AC: d('A', 'C'), PC: d('P', 'C') };
  });
  console.log('  ' + JSON.stringify(cotesD));
  ck('la phrase dictée passe entière', dictee.ok, dictee.msg);
  ck('  et les TROIS mesures dictées sont respectées',
     cotesD.AP === 5 && cotesD.AC === 6 && cotesD.PC === 7, JSON.stringify(cotesD));
  ck('  « Trace aussi les médiatrices » suit', (dictee.cpt.PerpendicularLine || 0) === 3,
     String(dictee.cpt.PerpendicularLine));
  /* Trois traductions, et rien de plus — on transcrit ce que la dictée écrit
     toujours de la même façon, on ne devine pas. */
  for (const [ph, attendu] of [
      ['Trace un triangle ABC tel que AB égal 5 cm, AC égal 6 cm et BC égal 7 cm', [5, 6, 7]],
      ['Trace un triangle ABC tel que AB vaut 5 cm, AC vaut 6 cm et BC vaut 7 cm', [5, 6, 7]],
      ['Trace un triangle ABC tel que AB fait 5 cm, AC fait 6 cm et BC fait 7 cm', [5, 6, 7]],
      ['Trace un triangle ABC tel que A C = 6 cm et AB = 5 cm et BC = 7 cm', [5, 6, 7]]]) {
    const q = await faire([ph]);
    ck(`« ${ph.slice(28, 52)}… »`,
       q.AB === attendu[0] && q.AC === attendu[1] && q.BC === attendu[2],
       JSON.stringify([q.AB, q.AC, q.BC]));
  }
  /* ET ON NE TRADUIT PAS LE RESTE. Le garde-fou est le nombre qui suit : sans
     lui, « des côtés égaux » et « il vaut mieux » deviendraient des équations. */
  for (const ph of ['Trace un triangle ABC équilatéral', 'Trace un segment assez grand']) {
    const q = await faire([ph]);
    ck(`  « ${ph} » n'est pas touché par la traduction`, q.ok, q.msg);
  }

  console.log('\n=== il donnait des mesures, on n\'en a lu aucune ===');
  /* LE PIRE DES CAS, et celui que la dictée révélait : le logiciel traçait un
     triangle quelconque en répondant « Triangle ABC ». Une figure fausse qu'on
     croit juste coûte plus cher qu'un refus. */
  r = await faire(['Trace un triangle ABC tel que XY = 5 cm']);
  ck('une phrase qui donne des mesures illisibles est REFUSÉE', !r.ok, r.msg);
  ck('  et le refus rappelle comment on nomme un côté et un angle',
     /deux extrémités/.test(r.msg) && /sommet/.test(r.msg), r.msg);
  /* Mais un triangle sans AUCUNE mesure reste un triangle quelconque, honnête. */
  r = await faire(['Trace un triangle ABC']);
  ck('un triangle sans mesure reste tracé', r.ok && r.AB > 0, r.msg);

  console.log('\n=== deux figures qui ne sont dans aucune liste ===');
  /* Elles ne servent aucun programme, et c'est bien pour cela qu'elles sont là.
     Toutes deux sont de VRAIES mathématiques, pas des dessins décoratifs — et
     c'est ce que cette section vérifie. */
  const koch = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = [];
    const r = app.executerConsigneAvec('Trace un flocon de Koch', false);
    const L = app.entities.filter(e => e.constructor.name === 'Segment')
      .map(e => Math.hypot(e.p1.x - e.p2.x, e.p1.y - e.p2.y));
    return { ok: r.ok, msg: r.message, astuce: r.astuce, n: L.length,
             min: +Math.min(...L).toFixed(2), max: +Math.max(...L).toFixed(2) };
  });
  console.log('  ' + JSON.stringify(koch));
  ck('le flocon de Koch se trace', koch.ok, koch.msg);
  /* LA propriété du flocon : à chaque ordre, TOUS les côtés sont égaux, et il y
     en a 3 × 4ⁿ. Ordre 3 : 192. */
  ck('  il a 3 × 4³ = 192 côtés', koch.n === 192, String(koch.n));
  ck('  et ils sont TOUS de la même longueur', koch.min === koch.max,
     `${koch.min} … ${koch.max}`);
  const koch2 = await faire(['Trace un flocon de Koch d\'ordre 2']);
  ck('  l\'ordre se demande : 3 × 4² = 48 côtés', (koch2.cpt.Segment || 0) === 48,
     String(koch2.cpt.Segment));

  const spirale = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = [];
    const r = app.executerConsigneAvec('Trace une spirale', false);
    const O = app.entities.find(e => e.label === 'O');
    if (!O) return { ok: r.ok, msg: r.message, rayons: null };
    const d = app.entities.filter(e => e.constructor.name === 'Segment' && (e.p1 === O || e.p2 === O))
      .map(e => { const q = (e.p1 === O) ? e.p2 : e.p1; return Math.hypot(q.x - O.x, q.y - O.y); });
    const u = d[0] || 1;
    return { ok: r.ok, msg: r.message, astuce: r.astuce,
             rayons: d.slice(0, 6).map(v => +(v / u).toFixed(3)) };
  });
  console.log('  ' + JSON.stringify(spirale.rayons));
  ck('la spirale de Théodore se trace', spirale.ok, spirale.msg);
  /* LA propriété : les rayons successifs valent 1, √2, √3, √4, √5 — les racines
     carrées construites à la règle et au compas, l'une après l'autre. */
  const attendus = [1, 2, 3, 4, 5, 6].map(k => +Math.sqrt(k).toFixed(3));
  ck('  ses rayons valent 1, √2, √3, √4, √5, √6',
     spirale.rayons && spirale.rayons.every((v, i) => Math.abs(v - attendus[i]) < 0.002),
     JSON.stringify(spirale.rayons));
  const sp20 = await faire(['Trace la spirale de Théodore avec 20 triangles']);
  ck('  le nombre de triangles se demande', /20 triangles/.test(sp20.msg), sp20.msg);
  /* Ce sont des surprises : elles ne figurent PAS dans la liste de l'aide. */
  const cachees = await page.evaluate(() => {
    const t = (document.getElementById('helpModal') || document.body).innerText;
    return { koch: /Koch|flocon/i.test(t), spirale: /Théodore|spirale/i.test(t) };
  });
  ck('  et elles restent hors de la liste de l\'aide : ce sont des surprises',
     !cachees.koch && !cachees.spirale, JSON.stringify(cachees));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
