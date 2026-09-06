/* L'AUDIT DES CONSTRUCTIONS MAGIQUES.
 *
 * Les figures de la grille — carré, hexagone, médiatrice, bissectrice, rosace,
 * yin-yang, symétries, rotation… — ne passent par aucune phrase : on les prend
 * dans un tiroir et on clique. L'audit des consignes ne les voyait donc pas.
 * Elles subissent ici le MÊME examen, plus un quatrième point qui ne vaut que
 * pour elles : leur figure doit se relire en un énoncé.
 *
 *   1. UN POINT POSÉ SUR UN OBJET EN DÉPEND — un point créé après l'objet sur
 *      lequel il tombe y a été posé, il doit en être l'enfant. Créé avant, c'est
 *      lui qui a construit l'objet, et rien à redire.
 *   2. L'OUTIL NE TRACE PAS DANS LE VIDE — chaque animation de tracé doit être
 *      suivie de la figure qu'elle trace, sinon le compas tourne sur une feuille
 *      blanche.
 *   3. LA FIGURE SE PREND À LA MAIN — il reste des points libres.
 *   4. ET ELLE PASSE L'ÉNONCÉ — relue, elle donne un programme de construction ;
 *      une figure que le logiciel ne sait pas se raconter est une figure qu'il
 *      ne comprend pas.
 */
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

(async () => {
  const b = await chromium.launch({ executablePath: process.env.GM_CHROME });
  const page = await b.newPage({ viewport: { width: 1400, height: 950 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE);
  await page.waitForFunction(() => window.app);

  const rapport = await page.evaluate(() => {
    const app = window.app;
    /* Chaque construction avec ce qu'il lui faut : deux points pour celles qui
       partent d'un segment, un triangle pour les droites remarquables, une
       figure pour les transformations. */
    const MAGIQUES = [
      /* Ces bâtisseurs-là partent d'un SEGMENT, comme l'interface les appelle :
         leur signature ne prend pas deux points. Les appeler autrement, c'est
         mesurer autre chose qu'eux. */
      ['triangle équilatéral', 'segment', (P) => app.buildEquilateralTriangle(P.seg, 0, 0)],
      ['médiatrice', 'deux', (P) => app.buildMediatrice(null, 0, 0, P.A, P.B)],
      ['carré', 'segment', (P) => app.buildSquare(P.seg, 0, 0)],
      ['hexagone', 'segment', (P) => app.buildHexagon(P.seg, 0, 0)],
      ['pentagone régulier', 'segment', (P) => app.buildRegularPentagon(P.seg, 0, 0)],
      ['losange', 'segment', (P) => app.buildRhombus(P.seg, 0, 0)],
      ['hexagramme', 'segment', (P) => app.buildHexagram(P.seg, 0, 0)],
      ['rosace', 'deux', (P) => app.buildRosette(null, 0, 0, P.A, P.B)],
      ['graine de vie', 'deux', (P) => app.buildSeedOfLife(null, 0, 0, P.A, P.B)],
      ['yin-yang', 'deux', (P) => app.buildYinYang(null, 0, 0, P.A, P.B)],
      ['octogramme', 'deux', (P) => app.buildOctagram(null, 0, 0, P.A, P.B)],
      ['escargot de Pythagore', 'deux', (P) => app.buildPythagorasSnail(null, 0, 0, P.A, P.B)],
      ['parallélogramme', 'trois', (P) => app.buildParallelogram(P.A, P.B, P.C)],
      ['rectangle', 'trois', (P) => app.buildRectangle(P.A, P.B, P.C)],
      ['bissectrice', 'trois', (P) => app.buildBisector(P.A, P.B, P.C)],
      ['cercle circonscrit', 'trois', (P) => app.buildCircumscribedCircle(P.A, P.B, P.C)],
      ['symétrie centrale', 'figure', (P) => app.buildSymCentrale(P.A, P.O)],
      ['symétrie axiale', 'figure', (P) => app.buildSymAxiale([P.A, P.B, P.C], P.axe)],
      ['translation', 'figure', (P) => app.buildTranslation([P.A, P.B, P.C], P.D, P.O)],
      ['rotation', 'figure', (P) => app.buildRotation([P.A, P.B, P.C], P.O, 40, 1)],
      ['homothétie', 'figure', (P) => app.buildHomothetie([P.A, P.B, P.C], P.O, 1.6)],
    ];
    const poser = (quoi) => {
      /* Les bâtisseurs lancent un rejeu : on l'arrête AVANT de vider la feuille,
         sinon l'animation en cours travaille sur des objets disparus. */
      if (app.stopAnimation) app.stopAnimation();
      app.entities = []; app.historyPast = []; app._cslSujet = null;
      if (app.cslOublier) app.cslOublier();
      app.stepInstructions = {};
      const P = {};
      const mettre = (n, x, y) => { P[n] = new Point(x, y, n); app.addEntity(P[n]); return P[n]; };
      mettre('A', 480, 620); mettre('B', 720, 620);
      if (quoi === 'segment') {
        P.seg = new Segment(P.A, P.B, { color: '#000', width: 2 });
        app.addEntity(P.seg);
      }
      /* L'angle en B est DROIT : le rectangle le demande, et le refuse sinon. */
      if (quoi === 'trois' || quoi === 'figure') mettre('C', 720, 400);
      if (quoi === 'figure') {
        mettre('D', 500, 780); mettre('O', 900, 500);
        ['AB', 'BC', 'CA'].forEach(s =>
          app.addEntity(new Segment(P[s[0]], P[s[1]], { color: '#000', width: 2 })));
        const g = mettre('G', 980, 320), h = mettre('H', 980, 700);
        P.axe = new Segment(g, h, { color: '#000', width: 2 });
        app.addEntity(P.axe);
      }
      return P;
    };
    const loin = (p, e) => {
      if (e instanceof Circle) {
        if (!e.p1 || !e.p2) return Infinity;
        const R = Math.hypot(e.p2.x - e.p1.x, e.p2.y - e.p1.y);
        return R < 1 ? Infinity : Math.abs(Math.hypot(p.x - e.p1.x, p.y - e.p1.y) - R);
      }
      if (e instanceof Arc || e instanceof CompassArc) {
        if (!e.center || !(e.radius > 1)) return Infinity;
        if (!MathUtils.isPointOnArc({ x: p.x, y: p.y }, e)) return Infinity;
        return Math.abs(Math.hypot(p.x - e.center.x, p.y - e.center.y) - e.radius);
      }
      if (e instanceof LinearObject || e instanceof ParallelLine
          || e instanceof PerpendicularLine) {
        const c = MathUtils.getLineCoords(e);
        if (!c.p1 || !c.p2) return Infinity;
        return MathUtils.distanceToLine(p.x, p.y, c.p1, c.p2, e.constructor.name);
      }
      return Infinity;
    };
    return MAGIQUES.map(([nom, quoi, faire]) => {
      const P = poser(quoi);
      const depart = app.entities.length;
      let erreur = null;
      try { faire(P); } catch (e) { erreur = e.message; }
      if (erreur) return { nom, erreur };
      const neufs = app.entities.slice(depart);
      const rang = new Map(); app.entities.forEach((e, i) => rang.set(e, i));
      const definit = (p, e) => e.p1 === p || e.p2 === p || e.center === p
        || (e instanceof Polygon && (e.points || []).includes(p))
        || (e instanceof Angle && (e.p1 === p || e.p2 === p || e.p3 === p))
        || (e.refLine && (e.refLine.p1 === p || e.refLine.p2 === p));
      const objets = app.entities.filter(e => !(e instanceof Point)
        && !(e instanceof ToolAnimation) && !(e instanceof Annotation) && e.hidden !== true);
      const faux = [];
      neufs.forEach((p) => {
        if (!(p instanceof Point) || p.visible === false) return;
        if ((p.parents || []).length) return;
        objets.forEach((e) => {
          if (definit(p, e)) return;
          if (rang.get(p) < rang.get(e)) return;
          if (loin(p, e) < 0.5) faux.push((p.label || '·') + ' sur ' + e.constructor.name);
        });
      });
      const vide = [];
      app.entities.forEach((e, i) => {
        if (!(e instanceof ToolAnimation) || e.originalType !== 'trace') return;
        const s = app.entities[i + 1];
        if (!(s instanceof Arc || s instanceof Circle || s instanceof Segment
              || s instanceof CompassArc || s instanceof LinearObject
              || s instanceof ParallelLine || s instanceof PerpendicularLine)) {
          vide.push(s ? s.constructor.name : '(rien)');
        }
      });
      const libres = app.entities.filter(p => p instanceof Point && p.visible !== false
        && !(p.parents || []).length).length;
      let enonce = [];
      try { enonce = app.programmeDeConstruction(false) || []; } catch (e) { enonce = ['EX ' + e.message]; }
      return { nom, faux: [...new Set(faux)], vide: [...new Set(vide)], libres,
               objets: objets.length, enonce };
    });
  });

  let fail = 0;
  const dit = (ok, l, d) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${l}${d ? ' — ' + d : ''}`);
    if (!ok) fail++;
  };
  console.log('\n=== les ' + rapport.length + ' constructions magiques ===');
  rapport.forEach((x) => {
    if (x.erreur) { dit(false, x.nom, 'EXCEPTION ' + x.erreur); return; }
    const soucis = [];
    if (x.faux.length) soucis.push('posé sans dépendre : ' + x.faux.join(', '));
    if (x.vide.length) soucis.push('outil dans le vide, suivi de : ' + x.vide.join(', '));
    if (!x.libres && x.objets) soucis.push('aucun point libre');
    if (!x.enonce.length) soucis.push('AUCUN ÉNONCÉ : la figure ne se raconte pas');
    dit(!soucis.length, x.nom.padEnd(24), soucis.join(' · ')
      || (x.enonce.length + ' ligne(s) d\'énoncé : ' + x.enonce[0].slice(0, 52)));
  });
  if (errs.length) console.log('\nERREURS JS : ' + errs.slice(0, 5).join(' | '));
  console.log(`\n=== ${fail ? fail + ' construction(s) à reprendre' : 'tout tient'} ===`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
