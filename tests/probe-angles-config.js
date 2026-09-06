// LES CONFIGURATIONS D'ANGLES SONT-ELLES CONSTRUITES, OU DESSINÉES ?
//
// « Le point apparaît sur l'objet sans être géométriquement correct. » C'était
// exact : dans toutes ces figures, chaque point était LIBRE, à des coordonnées
// calculées pour que ça ait l'air juste. Mesuré sur la version d'avant, en
// déplaçant une seule poignée de 37 px :
//
//     supplémentaires   111,87° + 79,85° = 191,7°   (au lieu de 180°)
//     complémentaires    42,15° + 62,61° = 104,8°   (au lieu de 90°)
//     opposés/sommet     86,47° et 60,24°           (ils n'étaient plus égaux)
//     correspondants     60,71° et 55,85°           (idem)
//
// Cette sonde ne regarde donc pas le dessin : elle vérifie les DÉPENDANCES
// (un point sur une droite a cette droite pour parent, un sommet est un vrai
// point d'intersection, une parallèle est une ParallelLine) — puis elle BOUGE
// la figure et redemande les angles. Une propriété qui ne survit pas au
// déplacement n'était pas une propriété.
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

  /* Une phrase, une feuille propre — puis on relève la structure de la figure,
     les angles, et les angles APRÈS avoir déplacé une poignée libre. */
  const faire = (phrase) => page.evaluate((ph) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._consignes = [];
    app._cslSujet = null;
    if (app.cslOublier) app.cslOublier();
    const rep = app.executerConsigneAvec(ph, false);
    const nomDe = (q) => q && (q.label || q.nomDroite || q.constructor.name);
    const desc = app.entities.map(e => ({
      c: e.constructor.name, l: e.label || '',
      par: (e.parents || []).map(nomDe).join('+'),
      nom: e.nomDroite || '', cache: e.hidden === true,
    }));
    const mesurer = () => app.entities.filter(e => e instanceof Angle && !e.isRightAngle)
      .map(g => Math.round(g.getAngleValue() * 100) / 100);
    const avant = mesurer();
    /* On bouge la PREMIÈRE poignée libre : sur une figure construite, tout
       suit ; sur une figure dessinée, tout se défait. */
    const libres = app.entities.filter(e => e instanceof Point
      && (!e.parents || !e.parents.length));
    if (libres.length) {
      libres[0].x += 37; libres[0].y -= 23;
      app.updateDependents(libres[0]);
    }
    const apres = mesurer();
    /* Les incidences déclarées tiennent-elles encore, au demi-pixel ? */
    const incidences = [];
    app.entities.filter(e => e instanceof Point && e.label).forEach((pt) => {
      app.entities.filter(L => L instanceof Line || L instanceof ParallelLine
        || L instanceof PerpendicularLine).forEach((L) => {
        const c = MathUtils.getLineCoords(L);
        if (!c.p1 || !c.p2) return;
        const vx = c.p2.x - c.p1.x, vy = c.p2.y - c.p1.y, n = Math.hypot(vx, vy) || 1;
        const d = Math.abs((pt.x - c.p1.x) * vy - (pt.y - c.p1.y) * vx) / n;
        if (d < 0.5) incidences.push(pt.label + '∈' + (L.nomDroite || L.constructor.name));
      });
    });
    return { ok: !!(rep && rep.ok), msg: (rep && rep.message) || '',
             desc, avant, apres, incidences, bouge: libres.length > 0 };
  }, phrase);

  const somme = (a) => Math.round(a.reduce((s, v) => s + v, 0) * 100) / 100;
  const aPourParent = (r, label, quoi) => {
    const e = r.desc.find(x => x.l === label);
    return !!e && new RegExp(quoi).test(e.par);
  };

  console.log('\n=== supplémentaires : (AB), C SUR (AB), puis [CD) ===');
  /* La construction dictée : une droite (AB) ; un point C qui APPARTIENT à
     (AB) ; une demi-droite [CD). Les deux angles sont alors supplémentaires
     par construction, et non par coïncidence de coordonnées. */
  const sup = await faire('Trace deux angles supplémentaires');
  console.log('  ' + sup.msg);
  ck('la phrase est comprise', sup.ok, sup.msg);
  ck('C a la droite (AB) pour PARENT : il y est, il n\'y a pas l\'air',
     aPourParent(sup, 'C', 'Line'), JSON.stringify(sup.desc.find(x => x.l === 'C')));
  ck('  le second côté est une DEMI-DROITE, comme le dit la définition',
     sup.desc.some(x => x.c === 'Ray'), sup.desc.map(x => x.c).join(' '));
  ck('  A, C et B sont alignés', ['A', 'C', 'B'].every(n =>
     sup.incidences.includes(n + '∈Line')), sup.incidences.join(' '));
  ck('les deux angles font 180°', somme(sup.avant) === 180, sup.avant.join(' + '));
  /* L'ÉPREUVE : on déplace A. Avant, la somme passait à 191,7°. */
  ck('  ET ILS FONT ENCORE 180° APRÈS AVOIR DÉPLACÉ A',
     sup.bouge && somme(sup.apres) === 180,
     sup.apres.join(' + ') + ' = ' + somme(sup.apres) + '°');

  console.log('\n=== complémentaires : l\'angle droit est CONSTRUIT ===');
  /* B était un point libre posé à la verticale de O, et le petit carré n'était
     qu'un dessin. B est sur la perpendiculaire à [OA) en O. */
  const comp = await faire('Trace deux angles complémentaires');
  console.log('  ' + comp.msg);
  ck('la phrase est comprise', comp.ok, comp.msg);
  ck('B est SUR la perpendiculaire à [OA) en O',
     aPourParent(comp, 'B', 'PerpendicularLine'),
     JSON.stringify(comp.desc.find(x => x.l === 'B')));
  ck('  la perpendiculaire reste dans la figure, cachée',
     comp.desc.some(x => x.c === 'PerpendicularLine' && x.cache),
     JSON.stringify(comp.desc.find(x => x.c === 'PerpendicularLine')));
  ck('les deux angles font 90°', somme(comp.avant) === 90, comp.avant.join(' + '));
  /* Avant, la somme passait à 104,8°. */
  ck('  ET ILS FONT ENCORE 90° APRÈS AVOIR DÉPLACÉ O',
     comp.bouge && somme(comp.apres) === 90,
     comp.apres.join(' + ') + ' = ' + somme(comp.apres) + '°');

  console.log('\n=== opposés par le sommet : le sommet EST l\'intersection ===');
  const opp = await faire('Trace deux angles opposés par le sommet');
  console.log('  ' + opp.msg);
  ck('la phrase est comprise', opp.ok, opp.msg);
  ck('O est le point d\'intersection des deux droites',
     aPourParent(opp, 'O', 'Line\\+Line'), JSON.stringify(opp.desc.find(x => x.l === 'O')));
  ck('les deux angles sont égaux', opp.avant[0] === opp.avant[1], opp.avant.join(' et '));
  /* Avant : 86,47° et 60,24°. */
  ck('  ET ILS LE RESTENT APRÈS AVOIR DÉPLACÉ A',
     opp.bouge && opp.apres.length === 2 && opp.apres[0] === opp.apres[1],
     opp.apres.join(' et '));

  console.log('\n=== deux parallèles coupées par une sécante ===');
  /* Les deux « parallèles » étaient deux Line indépendantes que rien ne rendait
     parallèles, et les intersections deux points libres posés là où ça tombait
     juste. Pire : LES SIX POINTS QUI DÉFINISSAIENT LA FIGURE ÉTAIENT CACHÉS.
     On ne voyait que les deux intersections — qui, elles, ne se déplacent pas.
     La figure du programme de 5e était un dessin qu'on ne pouvait pas bouger
     d'un millimètre. C'est maintenant (AB), (CD) parallèle à elle, la sécante
     (EF), et G et H les points d'intersection. */
  for (const [phrase, quoi] of [
    ['Trace des angles correspondants', 'correspondants'],
    ['Trace des angles alternes-internes', 'alternes-internes'],
    ['Trace des angles alternes-externes', 'alternes-externes'],
  ]) {
    const r = await faire(phrase);
    console.log('  « ' + phrase + ' » → ' + r.msg);
    const libres = r.desc.filter(x => x.c === 'Point' && x.l && !x.par).map(x => x.l).sort();
    ck('  cinq points se prennent à la main : A, B, C, E, F',
       libres.join('') === 'ABCEF', libres.join(' ') || '(aucun)');
    ck('  et D glisse le long de (CD)', aPourParent(r, 'D', 'ParallelLine'),
       JSON.stringify(r.desc.find(x => x.l === 'D')));
    ck('  (CD) est une VRAIE parallèle à (AB)',
       r.desc.some(x => x.c === 'ParallelLine'),
       r.desc.filter(x => /Line/.test(x.c)).map(x => x.c).join(' '));
    ck('  G est l\'intersection de (AB) et (EF)', aPourParent(r, 'G', 'Line\\+Line'),
       JSON.stringify(r.desc.find(x => x.l === 'G')));
    ck('  H est l\'intersection de (CD) et (EF)',
       aPourParent(r, 'H', 'ParallelLine\\+Line'),
       JSON.stringify(r.desc.find(x => x.l === 'H')));
    ck('  plus une seule poignée cachée',
       !r.desc.some(x => x.c === 'Point' && !x.l),
       r.desc.filter(x => x.c === 'Point' && !x.l).length + ' point(s) sans nom');
    ck(`  les deux angles ${quoi} sont égaux`, r.avant[0] === r.avant[1],
       r.avant.join(' et '));
    /* Avant : 60,71° et 55,85° dès qu'on tirait une poignée de (d). */
    ck('  ET ILS LE RESTENT quand on tire A',
       r.bouge && r.apres.length === 2 && r.apres[0] === r.apres[1], r.apres.join(' et '));
  }
  /* La parallèle doit rester parallèle : c'est toute la propriété. */
  const tire = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace des angles correspondants', false);
    const A = app.entities.find(e => e instanceof Point && e.label === 'A');
    A.x -= 90; A.y -= 60; app.updateDependents(A);
    const dAB = app.entities.find(e => e instanceof Line && e.p1 && e.p1.label === 'A');
    const dCD = app.entities.find(e => e instanceof ParallelLine);
    const dEF = app.entities.filter(e => e instanceof Line).find(e => e.p1 && e.p1.label === 'E');
    const c2 = MathUtils.getLineCoords(dCD);
    const a1 = Math.atan2(dAB.p2.y - dAB.p1.y, dAB.p2.x - dAB.p1.x);
    const a2 = Math.atan2(c2.p2.y - c2.p1.y, c2.p2.x - c2.p1.x);
    const G = app.entities.find(e => e instanceof Point && e.label === 'G');
    const loin = (P, L) => {
      const c = MathUtils.getLineCoords(L);
      const vx = c.p2.x - c.p1.x, vy = c.p2.y - c.p1.y, n = Math.hypot(vx, vy) || 1;
      return Math.round(Math.abs((P.x - c.p1.x) * vy - (P.y - c.p1.y) * vx) / n * 100) / 100;
    };
    return { ecart: Math.round(((a1 - a2) * 180 / Math.PI) * 1000) / 1000,
             G: [loin(G, dAB), loin(G, dEF)] };
  });
  ck('on tire A de 90 px : (CD) reste parallèle à (AB)',
     Math.abs(tire.ecart) < 0.01, tire.ecart + '° d\'écart');
  ck('  et G reste sur les deux droites', tire.G[0] < 0.05 && tire.G[1] < 0.05,
     'à ' + tire.G.join(' et ') + ' px');

  console.log('\n=== adjacents : rien n\'y est affirmé qu\'on ne construise ===');
  /* Deux angles adjacents n'ont qu'un sommet et un côté communs : c'est vrai par
     construction, aucun point n'a besoin d'appartenir à quoi que ce soit. */
  const adj = await faire('Trace deux angles adjacents');
  console.log('  ' + adj.msg);
  ck('la phrase est comprise', adj.ok, adj.msg);
  ck('trois demi-droites de même origine, et le côté commun est nommé',
     adj.desc.filter(x => x.c === 'Ray').length === 3 && /\[OB\)/.test(adj.msg),
     adj.desc.filter(x => x.c === 'Ray').length + ' demi-droites — ' + adj.msg);

  console.log('\n=== une droite nommée porte son nom, parallèle comprise ===');
  /* dessinerNomDroite vit sur LinearObject, dont ParallelLine n'hérite pas :
     une parallèle nommée était muette sur la figure. */
  const nom = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace un segment [AB] de 6 cm', false);
    app.executerConsigneAvec('Place un point C', false);
    app.executerConsigneAvec('Trace la parallèle à (AB) passant par C', false);
    const dp = app.entities.find(e => e instanceof ParallelLine);
    dp.nomDroite = "d'";
    const vus = [];
    const vrai = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t, x, y) {
      vus.push(String(t)); return vrai.call(this, t, x, y);
    };
    app.render();
    CanvasRenderingContext2D.prototype.fillText = vrai;
    return { nom: dp && dp.nomDroite, ecrits: vus };
  });
  ck('(d\') est bien une parallèle, et son nom est ÉCRIT sur la figure',
     nom.nom === "d'" && nom.ecrits.includes("d'"),
     nom.nom + ' — textes tracés : ' + nom.ecrits.join(' '));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
