/* Les patrons, les configurations d'angles, et « montre-moi la méthode ».
 *
 * Trois familles ajoutées d'un coup, et une seule règle pour les trois : on ne
 * croit pas le message, on MESURE la figure. Un patron qui annonce « 6 faces »
 * doit avoir des arêtes qui se correspondent deux à deux ; deux angles dits
 * correspondants doivent être égaux au dixième de degré ; une phrase qui demande
 * la méthode doit produire des animations d'instrument, pas seulement le
 * résultat.
 */
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

  /* Exécute une phrase sur une feuille vide et rend de quoi mesurer. */
  const faire = (phrase, outils, points) => page.evaluate(([x, o, pts]) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._consignes = []; app._cslSujet = null;
    if (app.cslOublier) app.cslOublier();
    (pts || []).forEach(p => app.addEntity(new Point(p[0], p[1], p[2])));
    let r;
    try { r = app.executerConsigneAvec(x, o); }
    catch (e) { return { ok: false, message: 'EXCEPTION ' + e.message }; }
    const U = 50;
    const cm = v => Math.round(v / U * 100) / 100;
    const seg = app.entities.filter(e => e.constructor.name === 'Segment');
    const anim = app.entities.filter(e => e.constructor.name === 'ToolAnimation');
    const lg = s => cm(Math.hypot(s.p2.x - s.p1.x, s.p2.y - s.p1.y));
    return {
      ok: r.ok, message: r.message, astuce: r.astuce || '',
      segments: seg.length,
      plis: seg.filter(s => s.dash && s.dash.length).length,
      decoupes: seg.filter(s => !(s.dash && s.dash.length)).length,
      longueurs: seg.map(lg),
      /* Chaque arête, par ses deux bouts arrondis : c'est avec ça qu'on vérifie
         qu'un patron se replie — les bords qui se rejoignent sont égaux. */
      aretes: seg.map(s => [Math.round(s.p1.x), Math.round(s.p1.y),
                            Math.round(s.p2.x), Math.round(s.p2.y)]),
      cercles: app.entities.filter(e => e.constructor.name === 'Circle')
        .map(c => cm(app.cslRayon(c))),
      arcs: app.entities.filter(e => e.constructor.name === 'Arc')
        .map(a => ({ r: cm(a.radius),
                     deg: Math.round((a.endAngle - a.startAngle) * 180 / Math.PI * 10) / 10 })),
      angles: app.entities.filter(e => e.constructor.name === 'Angle')
        .map(a => ({ v: Math.round(a.getAngleValue() * 10) / 10, plein: !!a.isFilled,
                     couleur: a.color, code: a.coding })),
      anims: anim.length,
      outils: [...new Set(anim.map(a => a.widgetType))],
      arcsCompas: app.entities.filter(e => e.constructor.name === 'CompassArc').length,
      /* Un pli reste-t-il dans la figure quand on demande « sans les outils » ? */
      construction: seg.filter(s => app.estTraceDeConstruction(s)).length,
    };
  }, [phrase, outils, points]);

  const presque = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 0.02 : tol);

  console.log('\n=== le patron d\'un cube : six carrés, cinq plis ===');
  const cube = await faire("Trace le patron d'un cube de 3 cm", false);
  console.log('  ' + JSON.stringify({ msg: cube.message, plis: cube.plis,
    decoupes: cube.decoupes, longueurs: [...new Set(cube.longueurs)] }));
  ck('le mot « patron » ne donne plus une perspective',
     /patron/i.test(cube.message) && !/perspective/i.test(cube.message), cube.message);
  ck('  les 19 arêtes du patron mesurent TOUTES 3 cm',
     cube.longueurs.length === 19 && cube.longueurs.every(l => presque(l, 3)),
     cube.longueurs.length + ' arêtes, ' + JSON.stringify([...new Set(cube.longueurs)]));
  /* Six faces posées à plat se tiennent par cinq plis : c'est un arbre, pas un
     choix de mise en page. Une de plus et le patron se recouvre. */
  ck('  cinq plis, ni plus ni moins — six faces tiennent par cinq charnières',
     cube.plis === 5, String(cube.plis));
  ck('  et quatorze découpes', cube.decoupes === 14, String(cube.decoupes));
  ck('  le pli est en pointillés MAIS reste la figure (pas un trait de construction)',
     cube.construction === 0, cube.construction + ' arêtes prises pour de la construction');
  ck('  la bulle dit ce qui se découpe et ce qui se plie',
     /d[ée]coupe/i.test(cube.astuce) && /pli/i.test(cube.astuce), cube.astuce.slice(0, 70));
  ck('  et l\'encombrement, 9 cm sur 12 cm — la croix latine',
     /9\s*cm\s*sur\s*12\s*cm/.test(cube.astuce), cube.astuce.slice(0, 90));
  const dev = await faire("Trace le développement d'un cube de 3 cm", false);
  ck('« développement » est le même mot que « patron »',
     dev.message === cube.message, dev.message);

  console.log('\n=== le patron d\'un pavé droit : trois paires ===');
  const pave = await faire("Trace le patron d'un pavé droit de 5 cm sur 3 cm sur 2 cm", false);
  console.log('  ' + JSON.stringify({ msg: pave.message,
    longueurs: [...new Set(pave.longueurs)].sort((a, b) => a - b) }));
  ck('les trois dimensions sont lues dans l\'ordre',
     /5 × 3 × 2/.test(pave.message), pave.message);
  ck('  et l\'on ne trouve QUE ces trois longueurs sur la figure',
     [...new Set(pave.longueurs.map(l => Math.round(l * 100) / 100))]
       .sort((a, b) => a - b).join(',') === '2,3,5',
     JSON.stringify([...new Set(pave.longueurs)].sort((a, b) => a - b)));
  ck('  cinq plis, là aussi', pave.plis === 5, String(pave.plis));
  const ppr = await faire("Trace le patron d'un parallélépipède rectangle de 5 cm, 3 cm et 2 cm", false);
  ck('« parallélépipède rectangle » est le même solide',
     ppr.message === pave.message, ppr.message);
  const dim = await faire("Trace le patron d'un pavé droit de dimensions 6 cm, 4 cm et 3 cm", false);
  ck('« de dimensions … , … et … » se lit aussi', /6 × 4 × 3/.test(dim.message), dim.message);
  const nomme = await faire("Trace le patron d'un pavé droit de longueur 5 cm, "
    + "de largeur 3 cm et de hauteur 2 cm", false);
  ck('  et les mesures nommées donnent le même pavé',
     /5 × 3 × 2/.test(nomme.message), nomme.message);

  console.log('\n=== la pyramide : l\'apothème, pas l\'arête latérale ===');
  /* C'est LA faute du patron de pyramide : prendre l'arête latérale pour la
     hauteur du triangle. Pour c = 4 et h = 6, l'apothème vaut √(6² + 2²) =
     6,3246 et l'arête latérale √(6² + 8) = 6,6332. Un patron bâti sur la
     seconde ne se referme pas. */
  const pyr = await faire("Trace le patron d'une pyramide à base carrée de côté 4 cm "
    + "et de hauteur 6 cm", false);
  console.log('  ' + JSON.stringify({ msg: pyr.message,
    longueurs: [...new Set(pyr.longueurs)].sort((a, b) => a - b) }));
  ck('cinq faces, quatre plis', pyr.plis === 4 && pyr.decoupes === 8,
     pyr.plis + ' plis, ' + pyr.decoupes + ' découpes');
  const cotesPyr = [...new Set(pyr.longueurs.map(l => Math.round(l * 100) / 100))].sort((a, b) => a - b);
  ck('  les côtés de base font 4 cm', cotesPyr.some(l => presque(l, 4)), JSON.stringify(cotesPyr));
  ck('  et les côtés des triangles 6,63 cm — l\'ARÊTE latérale √(h² + c²/2)',
     cotesPyr.some(l => presque(l, 6.63, 0.01)), JSON.stringify(cotesPyr));
  ck('  la bulle donne l\'apothème 6,32 cm et le distingue de l\'arête',
     /6,32/.test(pyr.astuce) && /6,63/.test(pyr.astuce) && /apoth/i.test(pyr.astuce),
     pyr.astuce.slice(0, 120));

  console.log('\n=== le cylindre : la longueur du rectangle est 2πr ===');
  const cyl = await faire("Trace le patron d'un cylindre de rayon 2 cm et de hauteur 5 cm", false);
  console.log('  ' + JSON.stringify({ msg: cyl.message, cercles: cyl.cercles,
    longueurs: [...new Set(cyl.longueurs)] }));
  ck('deux disques de 2 cm de rayon',
     cyl.cercles.length === 2 && cyl.cercles.every(r => presque(r, 2)), JSON.stringify(cyl.cercles));
  ck('  et un rectangle dont la longueur vaut 2πr = 12,57 cm',
     cyl.longueurs.some(l => presque(l, 12.57, 0.01)), JSON.stringify(cyl.longueurs));
  ck('  sa largeur est la hauteur du cylindre, 5 cm',
     cyl.longueurs.some(l => presque(l, 5)), JSON.stringify(cyl.longueurs));
  ck('  la bulle explique POURQUOI c\'est le périmètre du disque',
     /p[ée]rim[èe]tre/i.test(cyl.astuce) && /12,57/.test(cyl.astuce), cyl.astuce.slice(0, 120));
  const cylD = await faire("Trace le patron d'un cylindre de diamètre 4 cm et de hauteur 5 cm", false);
  ck('« de diamètre 4 cm » vaut « de rayon 2 cm »',
     /rayon 2 cm/.test(cylD.message), cylD.message);

  console.log('\n=== le cône : l\'angle du secteur, démontré ===');
  /* g = √(3² + 5²) = 5,8310 ; l'arc doit valoir le tour du disque, donc
     g × θ = 2πr et θ = 360 × 3 / 5,831 = 185,2°. */
  const cone = await faire("Trace le patron d'un cône de rayon 3 cm et de hauteur 5 cm", false);
  console.log('  ' + JSON.stringify({ msg: cone.message, arcs: cone.arcs, cercles: cone.cercles }));
  ck('un disque de 3 cm de rayon',
     cone.cercles.length === 1 && presque(cone.cercles[0], 3), JSON.stringify(cone.cercles));
  ck('  un secteur de génératrice √(r²+h²) = 5,83 cm',
     cone.arcs.length === 1 && presque(cone.arcs[0].r, 5.83, 0.01), JSON.stringify(cone.arcs));
  ck('  d\'angle 360° × r ÷ g = 185,2° — sinon le cône ne se referme pas',
     presque(cone.arcs[0].deg, 185.2, 0.15), String(cone.arcs[0].deg));
  ck('  et ses deux rayons sont tracés, égaux à la génératrice',
     cone.longueurs.length === 2 && cone.longueurs.every(l => presque(l, 5.83, 0.01)),
     JSON.stringify(cone.longueurs));
  const coneG = await faire("Trace le patron d'un cône de rayon 3 cm et de génératrice 5 cm", false);
  console.log('  ' + coneG.message);
  ck('« de génératrice 5 cm » donne un secteur de 216° (360 × 3 ÷ 5)',
     presque(coneG.arcs[0].deg, 216, 0.15), String(coneG.arcs[0].deg));
  ck('  et la hauteur en est DÉDUITE : √(5² − 3²) = 4 cm, pas inventée',
     /hauteur 4 cm/.test(coneG.message), coneG.message);

  console.log('\n=== prisme, tétraèdre, et la sphère qui n\'en a pas ===');
  const pri = await faire("Trace le patron d'un prisme droit à base triangulaire "
    + "de 3 cm de côté et de 5 cm de hauteur", false);
  ck('le prisme droit : cinq faces, quatre plis',
     pri.ok && pri.plis === 4, pri.message + ' — ' + pri.plis + ' plis');
  ck('  et deux longueurs seulement, 3 cm et 5 cm',
     [...new Set(pri.longueurs.map(l => Math.round(l * 100) / 100))].sort((a, b) => a - b)
       .join(',') === '3,5', JSON.stringify([...new Set(pri.longueurs)]));
  const tet = await faire("Trace le patron d'un tétraèdre régulier de 4 cm d'arête", false);
  ck('le tétraèdre : quatre triangles, trois plis',
     tet.ok && tet.plis === 3 && tet.decoupes === 6,
     tet.plis + ' plis, ' + tet.decoupes + ' découpes');
  ck('  toutes ses arêtes font 4 cm',
     tet.longueurs.every(l => presque(l, 4)), JSON.stringify([...new Set(tet.longueurs)]));
  const sph = await faire("Trace le patron d'une sphère de rayon 3 cm", false);
  ck('la sphère n\'a pas de patron, et on dit pourquoi',
     !sph.ok && /courbe|aplatir|d[ée]chirer/i.test(sph.message), sph.message);
  ck('  la raison donnée est mathématique, pas un « je ne sais pas faire »',
     /carte du monde|d[ée]forme/i.test(sph.message), sph.message);

  console.log('\n=== la pyramide à base triangulaire n\'est pas à base carrée ===');
  /* « pyramide à base triangulaire » contient le mot « pyramide » et donnait un
     patron à base CARRÉE — cinq faces au lieu de quatre — en l'annonçant dans la
     réponse. Sans hauteur, c'est le tétraèdre RÉGULIER : toutes les arêtes égales. */
  const pt3 = await faire("Trace le patron d'une pyramide à base triangulaire de 4 cm", false);
  console.log('  ' + pt3.message + ' — ' + JSON.stringify([...new Set(pt3.longueurs)]));
  ck('quatre faces, trois plis — pas cinq',
     pt3.plis === 3 && /base triangulaire/.test(pt3.message),
     pt3.message + ' — ' + pt3.plis + ' plis');
  ck('  sans hauteur donnée, c\'est le tétraèdre régulier : TOUTES les arêtes à 4 cm',
     pt3.longueurs.every(l => presque(l, 4)), JSON.stringify([...new Set(pt3.longueurs)]));
  const pt7 = await faire("Trace le patron d'une pyramide à base triangulaire de côté 4 cm "
    + "et de hauteur 7 cm", false);
  /* Vérification indépendante : l'arête latérale vaut √(h² + (c/√3)²) = 7,371. */
  ck('avec h = 7 cm, l\'arête latérale vaut √(h² + (c/√3)²) = 7,37 cm',
     pt7.longueurs.some(l => presque(l, 7.371, 0.01)),
     JSON.stringify([...new Set(pt7.longueurs)]));

  console.log('\n=== un demi-cercle n\'est pas un cercle, un disque non plus ===');
  const demi = await faire('Trace un demi-cercle de diamètre [AB]', false,
    [[300, 520, 'A'], [640, 520, 'B']]);
  ck('le demi-cercle est un ARC de 180°, pas un cercle entier',
     demi.arcs.length === 1 && Math.abs(demi.arcs[0].deg - 180) < 0.5
     && demi.cercles.length === 0,
     demi.message + ' — ' + JSON.stringify(demi.arcs));
  const disque = await faire('Trace un disque de rayon 3 cm', false);
  ck('le disque est plein, et la réponse dit « Disque »',
     /^Disque/.test(disque.message), disque.message);

  console.log('\n=== agrandir et réduire, c\'est une homothétie ===');
  const agr = await page.evaluate(() => {
    const app = window.app;
    const essai = (x) => {
      app.entities = []; app.historyPast = []; app._cslSujet = null;
      if (app.cslOublier) app.cslOublier();
      app.executerConsigneAvec('Trace un triangle ABC tel que AB = 4 cm, AC = 3 cm et BC = 3 cm', false);
      const r = app.executerConsigneAvec(x, false);
      const P = {}; app.entities.forEach(e => { if (e instanceof Point && e.label) P[e.label] = e; });
      const d = (a, b) => (P[a] && P[b])
        ? Math.round(Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y) / 50 * 100) / 100 : null;
      return { msg: r.message, AB: d('A', 'B'), img: d("A'", "B'") };
    };
    return { deux: essai('Trace un agrandissement du triangle ABC de rapport 2'),
             demi: essai('Trace une réduction du triangle ABC de rapport 1/2') };
  });
  console.log('  ' + JSON.stringify(agr));
  ck('« agrandissement de rapport 2 » double vraiment : AB 4 cm → A\'B\' 8 cm',
     agr.deux.AB === 4 && agr.deux.img === 8, JSON.stringify(agr.deux));
  ck('« réduction de rapport 1/2 » divise par deux : 4 cm → 2 cm',
     agr.demi.AB === 4 && agr.demi.img === 2, JSON.stringify(agr.demi));

  console.log('\n=== la droite des milieux, et son théorème ===');
  const dm = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._cslSujet = null;
    if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace un triangle ABC tel que AB = 6 cm, AC = 5 cm et BC = 4 cm', false);
    const r = app.executerConsigneAvec('Trace la droite des milieux du triangle ABC', false);
    return { msg: r.message, astuce: r.astuce || '' };
  });
  console.log('  ' + dm.msg);
  ck('la droite des milieux se trace et se dit parallèle au troisième côté',
     /Droite des milieux/.test(dm.msg) && /parall[èe]le à \(BC\)/.test(dm.msg), dm.msg);
  ck('  et la bulle MESURE la moitié : 2 cm pour BC = 4 cm',
     /2 cm/.test(dm.astuce) && /4 cm/.test(dm.astuce) && /MOITI/.test(dm.astuce),
     dm.astuce.slice(0, 120));

  console.log('\n=== le patron ne vole pas le solide, et réciproquement ===');
  const solide = await faire("Trace un cube de 4 cm", false);
  ck('« Trace un cube » donne toujours la perspective cavalière',
     /perspective cavali/i.test(solide.message), solide.message);
  ck('  avec ses douze arêtes', solide.segments === 12, String(solide.segments));

  console.log('\n=== les configurations d\'angles ===');
  const corr = await faire('Trace des angles correspondants', false);
  console.log('  ' + JSON.stringify(corr.angles));
  ck('deux angles correspondants sont peints en plein',
     corr.angles.length === 2 && corr.angles.every(a => a.plein), JSON.stringify(corr.angles));
  ck('  et ils sont ÉGAUX — c\'est la propriété',
     presque(corr.angles[0].v, corr.angles[1].v, 0.1),
     corr.angles[0].v + '° vs ' + corr.angles[1].v + '°');
  ck('  même couleur et même codage : la figure dit qu\'ils sont égaux',
     corr.angles[0].couleur === corr.angles[1].couleur
     && corr.angles[0].code === corr.angles[1].code && corr.angles[0].code !== 'mark-none',
     JSON.stringify(corr.angles.map(a => [a.couleur, a.code])));
  ck('  la bulle donne la réciproque, qui est ce qui SERT',
     /r[ée]ciproque|s[’\']ils sont [ée]gaux/i.test(corr.astuce), corr.astuce.slice(0, 110));
  const ai = await faire('Trace des angles alternes-internes', false);
  ck('alternes-internes : égaux aussi',
     ai.angles.length === 2 && presque(ai.angles[0].v, ai.angles[1].v, 0.1),
     JSON.stringify(ai.angles.map(a => a.v)));
  ck('  et ils ne sont PAS placés comme les correspondants',
     ai.message !== corr.message, ai.message);
  const ae = await faire('Trace des angles alternes-externes', false);
  ck('alternes-externes : égaux',
     ae.angles.length === 2 && presque(ae.angles[0].v, ae.angles[1].v, 0.1),
     JSON.stringify(ae.angles.map(a => a.v)));
  const sansTiret = await faire('Trace deux angles alternes internes', false);
  ck('« alternes internes » sans tiret se comprend',
     sansTiret.ok && /alternes-internes/.test(sansTiret.message), sansTiret.message);
  const opp = await faire('Trace deux angles opposés par le sommet', false);
  ck('opposés par le sommet : égaux',
     opp.angles.length === 2 && presque(opp.angles[0].v, opp.angles[1].v, 0.1),
     JSON.stringify(opp.angles.map(a => a.v)));
  const sup = await faire('Trace deux angles supplémentaires', false);
  console.log('  ' + sup.message);
  ck('supplémentaires : la somme fait 180°',
     Math.abs(sup.angles[0].v + sup.angles[1].v - 180) < 0.2,
     JSON.stringify(sup.angles.map(a => a.v)));
  ck('  deux couleurs DIFFÉRENTES : ils s\'ajoutent, ils ne sont pas égaux',
     sup.angles[0].couleur !== sup.angles[1].couleur,
     JSON.stringify(sup.angles.map(a => a.couleur)));
  ck('  et la somme est écrite dans la réponse', /= 180°/.test(sup.message), sup.message);
  const comp = await faire('Trace deux angles complémentaires', false);
  ck('complémentaires : la somme fait 90°',
     Math.abs(comp.angles[0].v + comp.angles[1].v - 90) < 0.2,
     JSON.stringify(comp.angles.slice(0, 2).map(a => a.v)));
  ck('  et l\'angle droit qu\'ils remplissent est codé',
     comp.angles.some(a => presque(a.v, 90, 0.1)), JSON.stringify(comp.angles.map(a => a.v)));
  const adj = await faire('Trace deux angles adjacents', false);
  ck('adjacents : deux angles, un côté commun nommé',
     adj.angles.length === 2 && /c[ôo]t[ée] commun \[OB\)/.test(adj.message), adj.message);
  const conf = await faire('Trace deux droites parallèles coupées par une sécante', false);
  ck('la configuration seule se trace, sans rien peindre',
     conf.ok && conf.angles.length === 0, conf.message + ' / ' + conf.angles.length + ' angles');

  console.log('\n=== « montre-moi comment » demande la MÉTHODE ===');
  /* La case des instruments est DÉCOCHÉE dans tous ces appels : c'est la phrase
     qui doit la forcer. Sans quoi « montre-moi comment » ne montre rien. */
  const para = await faire('Montre moi comment on trace deux droites parallèles', false);
  console.log('  ' + JSON.stringify({ anims: para.anims, outils: para.outils }));
  ck('« montre-moi comment on trace deux droites parallèles » SORT LES INSTRUMENTS',
     para.anims > 0, para.anims + ' animations');
  ck('  la règle ET l\'équerre — c\'est le geste du cours',
     para.outils.includes('ruler') && para.outils.includes('setsquare'),
     JSON.stringify(para.outils));
  const med = await faire('Explique comment on trace la médiatrice de [AB]', false,
    [[300, 500, 'A'], [700, 500, 'B']]);
  ck('« explique comment on trace la médiatrice » ne répond plus « rien à tracer »',
     /m[ée]diatrice/i.test(med.message) && !/rien à tracer/i.test(med.message), med.message);
  ck('  et elle est construite au compas', med.arcsCompas > 0, med.arcsCompas + ' arcs');
  const carre = await faire('Montre-moi la méthode pour tracer un carré', false);
  ck('« la méthode pour tracer un carré » construit aux instruments',
     carre.anims > 0 && /construction d[ée]taill/i.test(carre.message),
     carre.message + ' — ' + carre.anims + ' animations');
  ck('  et la bulle prévient que c\'est la méthode qu\'on montre',
     /M[ÉE]THODE/.test(carre.astuce), carre.astuce.slice(0, 90));
  const pourquoi = await faire('Explique pourquoi ABC est isocèle', false);
  ck('« explique POURQUOI » reste une remarque : rien ne se trace',
     /rien à tracer/i.test(pourquoi.message), pourquoi.message);
  const nomPoint = await faire("Comment s'appelle ce point ?", false, [[300, 500, 'A']]);
  ck('une question qui n\'est pas une construction ne PLACE plus un point',
     /rien à tracer/i.test(nomPoint.message), nomPoint.message);

  console.log('\n=== une méthode se montre sur un exemple, même sans données ===');
  const bis = await faire('Rappelle-moi comment tracer la bissectrice', false);
  ck('sans angle donné, on en pose un et l\'on montre dessus',
     bis.ok && /bissectrice/i.test(bis.message), bis.message);
  ck('  et on le dit', /pose un/i.test(bis.astuce), bis.astuce.slice(0, 90));
  const mil = await faire("Comment place-t-on le milieu d'un segment ?", false);
  ck('sans segment donné, on en trace un',
     mil.ok && /milieu/i.test(mil.message), mil.message);
  ck('  et le milieu se construit au compas', mil.arcsCompas > 0, mil.arcsCompas + ' arcs');
  const rep = await faire('Comment reporter une longueur au compas ?', false);
  ck('« comment reporter une longueur au compas » se montre',
     rep.ok && /report/i.test(rep.message), rep.message);
  ck('  et les deux longueurs sont ÉGALES — c\'est tout le sens du report',
     rep.longueurs.length === 2 && presque(rep.longueurs[0], rep.longueurs[1], 0.01),
     JSON.stringify(rep.longueurs));

  console.log('\n=== reporter une longueur, sur des points donnés ===');
  const rep2 = await faire('Reporte la longueur AB à partir de C', false,
    [[300, 500, 'A'], [700, 500, 'B'], [350, 250, 'C']]);
  console.log('  ' + rep2.message);
  ck('AB fait 8 cm, et le report aussi', /= 8 cm/.test(rep2.message), rep2.message);
  const rep3 = await faire('Reporte la longueur AB à partir de C', true,
    [[300, 500, 'A'], [700, 500, 'B'], [350, 250, 'C']]);
  ck('aux instruments, le compas prend l\'écartement et trace son arc',
     rep3.arcsCompas === 1 && rep3.outils.includes('compass'),
     rep3.arcsCompas + ' arcs, ' + JSON.stringify(rep3.outils));

  console.log('\n=== la parallèle et la perpendiculaire, au geste ===');
  const p1 = await faire('Trace la parallèle à (AB) passant par C', true,
    [[300, 500, 'A'], [700, 500, 'B'], [450, 300, 'C']]);
  ck('la parallèle se trace à la règle et à l\'équerre',
     p1.outils.includes('ruler') && p1.outils.includes('setsquare'), JSON.stringify(p1.outils));
  const p0 = await faire('Trace la parallèle à (AB) passant par C', false,
    [[300, 500, 'A'], [700, 500, 'B'], [450, 300, 'C']]);
  ck('  et sans les instruments, aucun outil ne sort', p0.anims === 0, String(p0.anims));
  const perpG = await faire('Trace la perpendiculaire à (AB) passant par C', true,
    [[300, 500, 'A'], [700, 500, 'B'], [450, 300, 'C']]);
  ck('la perpendiculaire : l\'équerre descend, PUIS la règle prolonge',
     perpG.outils.indexOf('setsquare') < perpG.outils.indexOf('ruler')
     && perpG.outils.includes('ruler'), JSON.stringify(perpG.outils));
  /* La vraie vérification : les droites obtenues sont-elles parallèles, et
     perpendiculaires ? Le geste ne sert à rien si la figure est fausse. */
  const angles = await page.evaluate(() => {
    const app = window.app;
    const mesure = (phrase) => {
      app.entities = []; app.historyPast = [];
      app.addEntity(new Point(300, 500, 'A')); app.addEntity(new Point(700, 500, 'B'));
      app.addEntity(new Point(450, 300, 'C'));
      app.executerConsigneAvec(phrase, true);
      const d = app.entities.find(e => e.constructor.name === 'ParallelLine'
        || e.constructor.name === 'PerpendicularLine');
      if (!d) return null;
      const q = d.getDynamicP2();
      const a = Math.atan2(q.y - d.p1.y, q.x - d.p1.x) * 180 / Math.PI;
      return Math.round((((a % 180) + 180) % 180) * 10) / 10;
    };
    return { para: mesure('Trace la parallèle à (AB) passant par C'),
             perp: mesure('Trace la perpendiculaire à (AB) passant par C') };
  });
  console.log('  ' + JSON.stringify(angles));
  ck('la parallèle à une horizontale est horizontale : 0°', angles.para === 0, String(angles.para));
  ck('la perpendiculaire fait bien 90°', angles.perp === 90, String(angles.perp));
  const deuxP = await faire('Trace deux droites parallèles', true);
  ck('« deux droites parallèles » aussi sort les instruments',
     deuxP.anims > 0, String(deuxP.anims));

  console.log('\n=== ce qui répondait « oui » en faisant autre chose ===');
  /* Quatre phrases qui affirmaient avoir fait quelque chose sans le faire.
     Rien à l'écran ne prévenait : c'est pire qu'un refus. */
  const euler = await page.evaluate(() => {
    const app = window.app;
    const essai = (prep, x) => {
      app.entities = []; app.historyPast = []; app._cslSujet = null;
      if (app.cslOublier) app.cslOublier();
      app.executerConsigneAvec(prep, false);
      const r = app.executerConsigneAvec(x, false);
      const P = app.entities.filter(e => e instanceof Point && e.label && e.visible !== false);
      const trois = P.slice(-3);
      let det = null;
      if (trois.length === 3) {
        const [a, b, c] = trois;
        det = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
      }
      return { msg: r.message, ok: r.ok, astuce: r.astuce || '',
               alignement: det === null ? null : Math.round(det * 100) / 100,
               droites: app.entities.filter(e => e.constructor.name === 'Line').length };
    };
    return {
      normal: essai('Trace un triangle ABC tel que AB = 6 cm, AC = 5 cm et BC = 4 cm',
                    "Trace la droite d'Euler du triangle ABC"),
      equi: essai('Trace un triangle équilatéral ABC de 4 cm de côté',
                  "Trace la droite d'Euler du triangle ABC"),
    };
  });
  console.log('  ' + JSON.stringify(euler.normal));
  ck("« la droite d'Euler » ne fabrique plus une droite au hasard",
     /Euler/.test(euler.normal.msg) && euler.normal.droites === 1, euler.normal.msg);
  ck('  ses trois centres sont ALIGNÉS — déterminant nul, mesuré',
     euler.normal.alignement === 0, String(euler.normal.alignement));
  ck('  et le rapport OH ÷ OG vaut 3', /=\s*3\b/.test(euler.normal.astuce),
     euler.normal.astuce.slice(-40));
  ck('  sur un triangle équilatéral, elle est REFUSÉE : les centres sont confondus',
     !euler.equi.ok && /confondus/i.test(euler.equi.msg), euler.equi.msg.slice(0, 80));

  const sec = await faire('Trace deux cercles sécants', false);
  console.log('  ' + sec.message);
  ck('« deux cercles sécants » en trace DEUX, pas un',
     sec.cercles.length === 2, sec.cercles.length + ' cercle(s)');
  ck('  et leurs deux points d\'intersection sont posés',
     /se coupent en/.test(sec.message), sec.message);
  const tan = await faire('Trace deux cercles tangents', false);
  ck('« tangents » : deux cercles et UN point de contact',
     tan.cercles.length === 2 && /se touchent en/.test(tan.message), tan.message);
  const un = await faire('Trace le cercle de centre A et de rayon 3 cm', false,
    [[400, 500, 'A']]);
  ck('  et un cercle tout seul reste un cercle tout seul',
     un.cercles.length === 1, String(un.cercles.length));

  const part = await faire("Partage l'angle ABC en quatre angles égaux", false,
    [[300, 600, 'A'], [520, 620, 'B'], [700, 300, 'C']]);
  console.log('  ' + part.message);
  ck('« partage l\'angle en quatre » partage vraiment',
     part.angles.length === 4, part.angles.length + ' angles');
  ck('  et les quatre sont ÉGAUX, mesurés',
     part.angles.length === 4
     && new Set(part.angles.map(a => a.v)).size === 1, JSON.stringify(part.angles.map(a => a.v)));
  const tri = await faire("Partage l'angle ABC en trois angles égaux", false,
    [[300, 600, 'A'], [520, 620, 'B'], [700, 300, 'C']]);
  ck('en TROIS, c\'est refusé — et le refus cite le théorème',
     !tri.ok && /IMPOSSIBLE/.test(tri.message) && /Wantzel/.test(tri.message),
     tri.message.slice(0, 90));

  console.log('\n=== qui est inscrit dans qui ===');
  /* « le CERCLE inscrit dans le triangle » et « un HEXAGONE inscrit dans un
     cercle » emploient le même mot pour deux figures opposées. La seconde
     partait réclamer un triangle. Et le rayon donné était pris pour un CÔTÉ :
     juste par accident pour l'hexagone, faux pour tous les autres. */
  for (const [figure, n, attendu] of [['hexagone régulier', 6, 3],
                                      ['octogone régulier', 8, 2.3],
                                      ['carré', 4, 4.24],
                                      ['triangle équilatéral', 3, 5.2]]) {
    const r = await faire(`Trace un ${figure} inscrit dans un cercle de rayon 3 cm`, false);
    const cotes = [...new Set(r.longueurs.map(l => Math.round(l * 100) / 100))];
    ck(`« un ${figure} inscrit dans un cercle de rayon 3 cm »`,
       r.ok && r.cercles.length === 1 && presque(r.cercles[0], 3)
       && r.longueurs.length === n, r.message);
    /* Le côté d'un polygone régulier inscrit vaut 2 R sin(180°/n). */
    ck(`  son côté vaut 2 × 3 × sin(180°/${n}) = ${attendu} cm`,
       cotes.length === 1 && presque(cotes[0], attendu, 0.01), JSON.stringify(cotes));
  }
  const cInscrit = await faire('Trace le cercle inscrit dans le triangle ABC', false,
    [[300, 520, 'A'], [640, 520, 'B'], [470, 260, 'C']]);
  ck('mais « le cercle inscrit dans le triangle ABC » reste un cercle inscrit',
     /Cercle inscrit/.test(cInscrit.message), cInscrit.message);
  const cCirc = await faire('Trace le cercle circonscrit au triangle ABC', false,
    [[300, 520, 'A'], [640, 520, 'B'], [470, 260, 'C']]);
  ck('  et le cercle circonscrit aussi', /Cercle circonscrit/.test(cCirc.message), cCirc.message);

  console.log('\n=== le prisme droit, et les trois solides qu\'on ne sait pas dessiner ===');
  const pri3 = await faire("Trace un prisme droit à base triangulaire de 3 cm de côté "
    + "et de 5 cm de hauteur", false);
  console.log('  ' + pri3.message);
  ck('le prisme droit se dessine en perspective : 9 arêtes',
     pri3.segments === 9 && /perspective/.test(pri3.message), pri3.message);
  ck('  dont 3 cachées, et la fuyante est réduite de moitié (2,5 cm pour 5 cm)',
     pri3.plis === 3 && pri3.longueurs.some(l => presque(l, 2.5)),
     pri3.plis + ' cachées, ' + JSON.stringify([...new Set(pri3.longueurs)]));
  const pri6 = await faire("Représente un prisme droit à base hexagonale de 2 cm de côté "
    + "et de 5 cm de hauteur", false);
  ck('à base hexagonale : 18 arêtes, 6 cachées — le calcul suit la forme',
     pri6.segments === 18 && pri6.plis === 6,
     pri6.segments + ' arêtes, ' + pri6.plis + ' cachées');
  /* Le cylindre, le cône et la sphère : on ne sait pas. Ce qui compte est de le
     DIRE — avant, le mot « hauteur » partait vers les droites remarquables et la
     réponse conseillait « Trace la hauteur issue de A dans le triangle ABC ». */
  const cyl3 = await faire('Trace un cylindre de rayon 2 cm et de hauteur 5 cm', false);
  ck('un cylindre en perspective est refusé, et le refus dit POURQUOI',
     !cyl3.ok && /ellipses/.test(cyl3.message) && !/hauteur issue/.test(cyl3.message),
     cyl3.message.slice(0, 80));
  ck('  et il indique ce qu\'on sait faire : le patron',
     /PATRON/.test(cyl3.message), cyl3.message.slice(-70));
  const sph3 = await faire('Trace une sphère de rayon 3 cm', false);
  ck('la sphère aussi, et l\'on rappelle qu\'elle n\'a pas de patron non plus',
     !sph3.ok && /courbe dans toutes les directions/.test(sph3.message),
     sph3.message.slice(0, 70));

  console.log('\n=== une phrase de raisonnement ne construit rien, quel que soit son sujet ===');
  const raison = await faire("Explique pourquoi les médiatrices d'un triangle sont concourantes",
    false, [[300, 520, 'A'], [640, 520, 'B'], [470, 260, 'C']]);
  ck('« Explique pourquoi les médiatrices sont concourantes » ne construit rien',
     /rien à tracer/.test(raison.message), raison.message);
  const deduis = await faire("Qu'en déduis-tu ?", false);
  ck('« Qu\'en déduis-tu ? » non plus', /rien à tracer/.test(deduis.message), deduis.message);
  const inter = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._cslSujet = null;
    if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace un triangle ABC', false);
    const r = app.executerConsigneAvec("Appelle O le point d'intersection des médiatrices", false);
    return { ok: r.ok, msg: r.message };
  });
  ck('  mais « Appelle O le point d\'intersection des médiatrices » construit encore',
     inter.ok && !/rien à tracer/.test(inter.msg), inter.msg);

  console.log('\n=== remplir ne retrace pas ===');
  const rempl = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._cslSujet = null;
    if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace le cercle de centre A et de rayon 3 cm', false);
    const n0 = app.entities.filter(e => e.constructor.name === 'Circle').length;
    const r = app.executerConsigneAvec('Colorie le disque de centre A en rouge', false);
    return { msg: r.message, avant: n0,
             apres: app.entities.filter(e => e.constructor.name === 'Circle').length };
  });
  ck('« Colorie le disque » ne fabrique pas un SECOND cercle',
     rempl.avant === rempl.apres && !/Quel rayon/.test(rempl.msg),
     rempl.avant + ' → ' + rempl.apres + ' cercle(s) — ' + rempl.msg);
  ck('  et il est vraiment rempli — le disque colorié, c\'est la 6e',
     /disque de centre A/.test(rempl.msg), rempl.msg);

  console.log('\n=== plus de façons de demander la méthode ===');
  for (const phrase of ['Explique-moi la construction de la médiatrice de [AB]',
                        'Quelles sont les étapes de la construction du milieu de [AB] ?',
                        "C'est quoi la méthode pour tracer une bissectrice",
                        "Tu peux m'expliquer comment on reporte une longueur au compas"]) {
    const r = await faire(phrase, false, [[300, 520, 'A'], [640, 520, 'B']]);
    ck(`« ${phrase.slice(0, 46)}${phrase.length > 46 ? '…' : ''} »`,
       r.ok && r.arcsCompas > 0, r.message + ' — ' + r.arcsCompas + ' arcs');
  }

  console.log('\n=== ce qui marchait doit marcher pareil ===');
  const nonReg = [
    ['Trace un carré ABCD de 3 cm de côté', /Carr[ée] ABCD/],
    ['Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm', /Triangle ABC/],
    ['Trace le cercle de centre A et de rayon 3 cm', /Cercle/],
    ['Trace un hexagone ABCDEF de 3 cm de côté', /Hexagone/],
    ['Trace la médiatrice de [AB]', /M[ée]diatrice/],
    ['Place le milieu I de [AB]', /milieu/],
    ['Trace un cube de 4 cm', /Cube/],
    ['Trace une pyramide à base carrée de côté 3 cm et de hauteur 5 cm', /Pyramide/],
    ['Marque l\'angle ABC', /[Aa]ngle/],
    ['Que remarques-tu ?', /rien à tracer/],
    ['Justifie ta réponse', /rien à tracer/],
  ];
  for (const [phrase, attendu] of nonReg) {
    const r = await faire(phrase, false, [[300, 500, 'A'], [640, 500, 'B'], [450, 250, 'C']]);
    ck(`« ${phrase.slice(0, 44)}${phrase.length > 44 ? '…' : ''} »`,
       r.ok && attendu.test(r.message), r.message);
  }

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
