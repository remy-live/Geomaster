/* LES FIGURES DES FICHES « DESSINS GÉOMÉTRIQUES »
 *
 * Trois familles, toutes tirées des fiches de M. Devoddere :
 *
 *   — l'ÉTOILE À N BRANCHES : un cercle, N points reportés dessus, et l'on relie
 *     de k en k. Les cordes se croisent, l'étoile paraît. Le pas décide de tout :
 *     à six branches de deux en deux, le chemin se referme après trois sommets et
 *     il faut DEUX tracés — c'est ce qui donne les deux triangles de l'étoile de
 *     David. À huit branches, de trois en trois se trace d'un seul trait, de deux
 *     en deux donne deux carrés croisés.
 *   — la SPIRALE DU CARRÉ : on pique le compas sur les sommets en tournant, et le
 *     rayon grandit du côté à chaque quart de tour. Rien ne se mesure : chaque arc
 *     doit partir EXACTEMENT où le précédent s'arrête, et c'est vérifié ici.
 *   — le PAPIER POLAIRE : la cible sur laquelle les fiches font poser un pavage.
 */
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
  console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
  if (!ok) fail++;
};

(async () => {
  const b = await chromium.launch({ executablePath: process.env.GM_CHROME });
  const page = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE);
  await page.waitForFunction(() => window.app);

  console.log('\n=== l\'étoile à N branches ===');
  const etoiles = await page.evaluate(() => {
    const app = window.app;
    const un = (ph) => {
      app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
      let r;
      try { r = app.executerConsigneAvec(ph, false); }
      catch (e) { r = { ok: false, message: 'EXCEPTION ' + e.message }; }
      const c = app.entities.find(e => e instanceof Circle);
      const R = c ? Math.hypot(c.p2.x - c.p1.x, c.p2.y - c.p1.y) : 0;
      const sommets = app.entities.filter(e => e instanceof Point && e.label
                                            && e.parents && e.parents.length === 1);
      const cordes = app.entities.filter(e => e instanceof Segment);
      /* Tous les sommets sont-ils SUR le cercle, et régulièrement répartis ? */
      const surCercle = sommets.every(p =>
        Math.abs(Math.hypot(p.x - c.p1.x, p.y - c.p1.y) - R) < 0.5);
      const angles = sommets.map(p => Math.atan2(p.y - c.p1.y, p.x - c.p1.x))
        .map(a => (a + Math.PI * 4) % (Math.PI * 2)).sort((u, v) => u - v);
      let regulier = true;
      const pas = Math.PI * 2 / Math.max(1, sommets.length);
      for (let i = 1; i < angles.length; i++) {
        if (Math.abs((angles[i] - angles[i - 1]) - pas) > 0.01) regulier = false;
      }
      /* Toutes les cordes ont-elles la même longueur ? C'est ce qui distingue
         une étoile régulière d'un gribouillis. */
      const L = cordes.map(e => Math.round(
        Math.hypot(e.p1.x - e.p2.x, e.p1.y - e.p2.y)));
      const memeLongueur = L.length > 0 && L.every(x => Math.abs(x - L[0]) <= 1);
      /* Aucun codage : sur une figure décorative, coder douze cordes égales
         poserait cent quarante marques. */
      const marques = cordes.filter(e => e.coding || e.codage).length;
      return { ok: !!(r && r.ok), msg: (r && r.message) || '',
               astuce: (r && r.astuce) || '',
               sommets: sommets.length, cordes: cordes.length,
               surCercle, regulier, memeLongueur, marques,
               rayon: Math.round(R / 50 * 10) / 10 };
    };
    return {
      cinq: un('Trace une étoile à 5 branches'),
      six: un('Trace une étoile à 6 branches'),
      huit: un('Trace une étoile à 8 branches'),
      huitDeux: un('Trace une étoile à 8 branches de 2 en 2'),
      douze: un('Trace une étoile à 12 branches'),
      contour: un("Trace le contour d'une étoile à 5 branches"),
      grande: un('Trace une étoile à 5 branches de 5 cm'),
      trop: un('Trace une étoile à 3 branches'),
    };
  });
  console.log('  ' + etoiles.cinq.msg);
  ck('cinq branches : cinq sommets et cinq cordes',
     etoiles.cinq.ok && etoiles.cinq.sommets === 5 && etoiles.cinq.cordes === 5,
     etoiles.cinq.sommets + ' sommets, ' + etoiles.cinq.cordes + ' cordes');
  /* La leçon de toute la semaine : un point posé sur un objet doit en DÉPENDRE. */
  ck('  les sommets sont SUR le cercle, et régulièrement répartis',
     etoiles.cinq.surCercle && etoiles.cinq.regulier,
     'sur le cercle : ' + etoiles.cinq.surCercle + ', réguliers : ' + etoiles.cinq.regulier);
  ck('  et les cinq cordes sont de même longueur', etoiles.cinq.memeLongueur);
  /* Six et deux ont deux en commun : le chemin se referme après trois sommets,
     et il faut deux tracés — les deux triangles de l'étoile de David. */
  ck('six branches de deux en deux : SIX cordes, deux triangles',
     etoiles.six.ok && etoiles.six.cordes === 6, etoiles.six.cordes + ' cordes');
  ck('  et la bulle explique pourquoi il faut deux tracés',
     /6 et 2 ont 2 en commun/.test(etoiles.six.astuce), etoiles.six.astuce.slice(0, 90));
  ck('huit branches, de trois en trois par défaut : un seul trait',
     etoiles.huit.ok && etoiles.huit.cordes === 8
     && /de 3 en 3/.test(etoiles.huit.msg) && /un seul trait/.test(etoiles.huit.astuce),
     etoiles.huit.msg);
  ck('  « de 2 en 2 » se demande, et donne deux carrés croisés',
     etoiles.huitDeux.ok && /de 2 en 2/.test(etoiles.huitDeux.msg)
     && /8 et 2 ont 2 en commun/.test(etoiles.huitDeux.astuce), etoiles.huitDeux.msg);
  ck('douze branches tiennent aussi', etoiles.douze.ok && etoiles.douze.sommets === 12,
     etoiles.douze.sommets + ' sommets');
  /* Le contour de la fiche : ses creux sont les croisements des cordes, calculés
     et non devinés. Dix côtés pour une étoile à cinq branches. */
  ck('le CONTOUR se demande : dix côtés pour cinq branches',
     etoiles.contour.ok && etoiles.contour.cordes === 10,
     etoiles.contour.cordes + ' côtés');
  ck('la taille se donne', etoiles.grande.ok && etoiles.grande.rayon === 5,
     etoiles.grande.rayon + ' cm');
  ck('  et trois branches sont REFUSÉES, en disant pourquoi',
     !etoiles.trop.ok && /cinq branches/.test(etoiles.trop.msg), etoiles.trop.msg);
  /* Coder douze cordes égales sur une figure décorative, c'est cent quarante
     marques pour rien : le codage dit ce qu'un énoncé impose, pas ce qu'un joli
     tracé produit. */
  ck('aucun codage d\'égalité sur une figure décorative',
     etoiles.douze.marques === 0 && etoiles.cinq.marques === 0,
     etoiles.douze.marques + ' marque(s)');

  console.log('\n=== la spirale du carré ===');
  const spirale = await page.evaluate(() => {
    const app = window.app;
    const un = (ph, outils) => {
      app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
      const r = app.executerConsigneAvec(ph, !!outils);
      const arcs = app.entities.filter(e => e instanceof Arc);
      const carre = app.entities.filter(e => e instanceof Segment);
      /* CHAQUE ARC DOIT PARTIR OÙ LE PRÉCÉDENT S'ARRÊTE : c'est toute la
         construction. Un écart d'un pixel se verrait comme une marche. */
      let saut = 0;
      for (let i = 1; i < arcs.length; i++) {
        const a = arcs[i - 1], b = arcs[i];
        const fin = { x: a.center.x + Math.cos(a.endAngle) * a.radius,
                      y: a.center.y + Math.sin(a.endAngle) * a.radius };
        const deb = { x: b.center.x + Math.cos(b.startAngle) * b.radius,
                      y: b.center.y + Math.sin(b.startAngle) * b.radius };
        saut = Math.max(saut, Math.hypot(fin.x - deb.x, fin.y - deb.y));
      }
      /* Et le rayon grandit du côté à chaque quart de tour. */
      const rayons = arcs.map(a => Math.round(a.radius));
      const cote = carre.length ? Math.round(Math.hypot(
        carre[0].p1.x - carre[0].p2.x, carre[0].p1.y - carre[0].p2.y)) : 0;
      let croissant = true;
      for (let i = 1; i < rayons.length; i++) {
        if (Math.abs((rayons[i] - rayons[i - 1]) - cote) > 1) croissant = false;
      }
      return { ok: !!(r && r.ok), msg: (r && r.message) || '',
               arcs: arcs.length, cotes: carre.length,
               saut: Math.round(saut * 100) / 100, croissant, cote,
               anim: app.entities.filter(e => e instanceof ToolAnimation).length };
    };
    return { simple: un('Trace une spirale du carré'),
             douze: un('Trace une spirale du carré de 12 quarts'),
             outils: un('Trace une spirale du carré', true) };
  });
  console.log('  ' + spirale.simple.msg);
  ck('« une spirale du carré » est comprise', spirale.simple.ok, spirale.simple.msg);
  ck('  le carré est là, et huit quarts de tour par défaut',
     spirale.simple.cotes === 4 && spirale.simple.arcs === 8,
     spirale.simple.cotes + ' côtés, ' + spirale.simple.arcs + ' arcs');
  ck('  CHAQUE ARC PART OÙ LE PRÉCÉDENT S\'ARRÊTE', spirale.simple.saut < 0.01,
     'plus grand saut : ' + spirale.simple.saut + ' px');
  ck('  et le rayon grandit du côté à chaque quart de tour',
     spirale.simple.croissant, 'côté ' + spirale.simple.cote + ' px');
  ck('« de 12 quarts » se demande', spirale.douze.ok && spirale.douze.arcs === 12,
     spirale.douze.arcs + ' arcs');
  ck('  et aux instruments, le compas tourne', spirale.outils.anim > 8,
     spirale.outils.anim + ' gestes');
  /* L'autre spirale du logiciel — l'escargot de Pythagore — attrapait le mot. */
  const autre = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    const r = app.executerConsigneAvec('Trace la spirale de Théodore', false);
    return (r && r.message) || '';
  });
  ck('  et l\'escargot de Pythagore reste joignable', /Th[ée]odore/.test(autre), autre);

  console.log('\n=== le papier polaire ===');
  const polaire = await page.evaluate(() => {
    const app = window.app;
    const un = (ph) => {
      app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
      const r = app.executerConsigneAvec(ph, false);
      const c = app.entities.filter(e => e instanceof Circle);
      const s = app.entities.filter(e => e instanceof Segment);
      const O = app.entities.find(e => e instanceof Point && e.label);
      /* Les cercles sont concentriques et régulièrement espacés ; les rayons
         partent tous du centre. */
      const rr = c.map(e => Math.hypot(e.p2.x - e.p1.x, e.p2.y - e.p1.y)).sort((a, b) => a - b);
      let regulier = true;
      for (let i = 1; i < rr.length; i++) {
        if (Math.abs((rr[i] - rr[i - 1]) - rr[0]) > 0.5) regulier = false;
      }
      const duCentre = s.every(e => e.p1 === O || e.p2 === O);
      return { ok: !!(r && r.ok), msg: (r && r.message) || '',
               cercles: c.length, rayons: s.length, regulier, duCentre,
               astuce: (r && r.astuce) || '' };
    };
    return { defaut: un('Trace un papier polaire'),
             cible: un('Trace une cible à 16 rayons et 4 cercles') };
  });
  console.log('  ' + polaire.defaut.msg);
  ck('« un papier polaire » donne 5 cercles et 12 rayons',
     polaire.defaut.ok && polaire.defaut.cercles === 5 && polaire.defaut.rayons === 12,
     polaire.defaut.cercles + ' cercles, ' + polaire.defaut.rayons + ' rayons');
  ck('  les cercles sont régulièrement espacés, les rayons partent du centre',
     polaire.defaut.regulier && polaire.defaut.duCentre,
     'réguliers : ' + polaire.defaut.regulier + ', du centre : ' + polaire.defaut.duCentre);
  ck('  et la bulle donne l\'angle des secteurs, en français',
     /secteurs de 30° /.test(polaire.defaut.astuce), polaire.defaut.astuce.slice(0, 60));
  ck('les nombres se demandent : 16 rayons et 4 cercles',
     polaire.cible.ok && polaire.cible.cercles === 4 && polaire.cible.rayons === 16,
     polaire.cible.cercles + ' cercles, ' + polaire.cible.rayons + ' rayons');
  ck('  et l\'angle suit : 22,5°', /22,5°/.test(polaire.cible.astuce),
     polaire.cible.astuce.slice(0, 60));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
