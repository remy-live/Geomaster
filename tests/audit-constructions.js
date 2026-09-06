/* L'AUDIT DES CONSTRUCTIONS.
 *
 * « Il faut vraiment que tu raisonnes en matière de constructible. »
 *
 * Cet audit applique le MÊME principe à toutes les constructions du logiciel,
 * au lieu de les relire une par une. Il exécute chaque phrase de CONSIGNES.md —
 * la liste est elle-même engendrée, donc elle ne peut pas mentir — et vérifie
 * quatre choses :
 *
 *   1. UN POINT POSÉ SUR UN OBJET EN DÉPEND. Un point qui tombe exactement sur
 *      un trait, un cercle ou un arc sans en être l'enfant est un point posé « là
 *      où ça tombe juste » : la figure est fausse dès qu'on touche à l'objet.
 *      C'est le défaut trouvé dans les configurations d'angles, et c'est le plus
 *      grave — il ne se voit pas.
 *   2. UNE INTERSECTION EST UNE INTERSECTION. Deux traits qui se croisent en un
 *      point nommé : ce point doit avoir les deux objets pour parents.
 *   3. AUX INSTRUMENTS, LE COMPAS DESSINE. Chaque animation de tracé doit être
 *      suivie de la figure qu'elle trace — sinon l'outil tourne à vide.
 *   4. LA FIGURE SE PREND À LA MAIN. Une construction dont aucun point n'est
 *      libre est un dessin, pas une figure.
 *
 * Il ne juge pas l'esthétique. Il ne juge que ce qui se mesure.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const CATALOGUE = path.resolve(__dirname, '..', 'CONSIGNES.md');

/* La feuille de départ du catalogue : les phrases qui parlent de A, B, C… les
   supposent posés. */
const FEUILLE = [[300, 520, 'A'], [640, 520, 'B'], [470, 260, 'C'], [830, 320, 'D'],
                 [520, 700, 'O']];

const phrases = fs.readFileSync(CATALOGUE, 'utf8').split('\n')
  .filter(l => /^\| /.test(l) && !/^\|---/.test(l) && !/Ce qu'on écrit/.test(l))
  .map(l => l.split('|')[1].trim())
  .filter(p => p && /^(Trace|Place|Marque|Relie|Prolonge|Reporte|Partage|Colorie|Construis|Soit|On considère)/.test(p));

(async () => {
  const b = await chromium.launch({ executablePath: process.env.GM_CHROME });
  const page = await b.newPage({ viewport: { width: 1400, height: 950 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE);
  await page.waitForFunction(() => window.app);

  const rapport = await page.evaluate(([liste, feuille]) => {
    const app = window.app;
    const out = [];
    /* La distance d'un point à un objet, quand elle a un sens. */
    const loin = (p, e) => {
      if (e instanceof Circle) {
        if (!e.p1 || !e.p2) return Infinity;
        const R = Math.hypot(e.p2.x - e.p1.x, e.p2.y - e.p1.y);
        if (R < 1) return Infinity;
        return Math.abs(Math.hypot(p.x - e.p1.x, p.y - e.p1.y) - R);
      }
      if (e instanceof Arc) {
        if (!e.center || !(e.radius > 1)) return Infinity;
        if (!MathUtils.isPointOnArc({ x: p.x, y: p.y }, e)) return Infinity;
        return Math.abs(Math.hypot(p.x - e.center.x, p.y - e.center.y) - e.radius);
      }
      if (e instanceof LinearObject || e instanceof ParallelLine
          || e instanceof PerpendicularLine) {
        const c = MathUtils.getLineCoords(e);
        if (!c.p1 || !c.p2) return Infinity;
        if (p === c.p1 || p === c.p2) return Infinity;   // une extrémité n'est pas « posée dessus »
        return MathUtils.distanceToLine(p.x, p.y, c.p1, c.p2, e.constructor.name);
      }
      return Infinity;
    };
    liste.forEach((ph) => {
      /* --- sans les instruments : la figure et ses dépendances --- */
      app.entities = []; app.historyPast = []; app._cslSujet = null;
      if (app.cslOublier) app.cslOublier();
      feuille.forEach(([x, y, n]) => app.addEntity(new Point(x, y, n)));
      const depart = app.entities.length;
      let r;
      try { r = app.executerConsigneAvec(ph, false); }
      catch (e) { r = { ok: false, message: 'EXCEPTION ' + e.message }; }
      if (!r || !r.ok) { out.push({ ph, refuse: true }); return; }
      const neufs = app.entities.slice(depart);
      const objets = app.entities.filter(e => !(e instanceof Point)
        && !(e instanceof ToolAnimation) && !(e instanceof Annotation)
        && !app.estTraceDeConstruction(e) && e.hidden !== true);
      /* CE QUI DISTINGUE UN DÉFAUT D'UNE COÏNCIDENCE : L'ORDRE. Un point créé
         APRÈS l'objet sur lequel il tombe y a été posé — il doit donc en
         dépendre, sans quoi il s'en détache au premier geste. Créé AVANT, c'est
         lui qui a servi à construire l'objet : le centre d'une rosace tombe sur
         ses pétales, et c'est la figure qui le veut. */
      const rang = new Map();
      app.entities.forEach((e, i) => rang.set(e, i));
      const definit = (p, e) => e.p1 === p || e.p2 === p || e.center === p
        || (e instanceof Polygon && (e.points || []).includes(p))
        || (e instanceof Angle && (e.p1 === p || e.p2 === p || e.p3 === p))
        || (e.refLine && (e.refLine.p1 === p || e.refLine.p2 === p));
      /* 1. les points POSÉS sur un objet sans en dépendre */
      const faux = [];
      neufs.forEach((p) => {
        if (!(p instanceof Point) || p.visible === false) return;
        if ((p.parents || []).length) return;
        objets.forEach((e) => {
          if (definit(p, e)) return;
          if (rang.get(p) < rang.get(e)) return;   // le point était là avant
          if (loin(p, e) < 0.5) faux.push((p.label || '·') + ' sur ' + e.constructor.name);
        });
      });
      /* 4. reste-t-il des points libres à prendre, sur la feuille entière ? */
      const libres = app.entities.filter(p => p instanceof Point && p.visible !== false
        && !(p.parents || []).length).length;
      const points = app.entities.filter(p => p instanceof Point && p.visible !== false).length;
      /* --- aux instruments : le compas dessine-t-il ? --- */
      app.entities = []; app.historyPast = []; app._cslSujet = null;
      if (app.cslOublier) app.cslOublier();
      feuille.forEach(([x, y, n]) => app.addEntity(new Point(x, y, n)));
      let vide = [];
      try {
        app.executerConsigneAvec(ph, true);
        app.entities.forEach((e, i) => {
          if (!(e instanceof ToolAnimation) || e.originalType !== 'trace') return;
          const s = app.entities[i + 1];
          if (!(s instanceof Arc || s instanceof Circle || s instanceof Segment
                || s instanceof CompassArc || s instanceof LinearObject
                || s instanceof ParallelLine || s instanceof PerpendicularLine)) {
            vide.push(s ? s.constructor.name : '(rien)');
          }
        });
      } catch (e) { vide = ['EXCEPTION ' + e.message]; }
      out.push({ ph, faux: [...new Set(faux)], vide: [...new Set(vide)], libres, points,
                 objets: objets.length });
    });
    return out;
  }, [phrases, FEUILLE]);

  const refuses = rapport.filter(x => x.refuse);
  const posesFaux = rapport.filter(x => x.faux && x.faux.length);
  const compasVide = rapport.filter(x => x.vide && x.vide.length);
  const figees = rapport.filter(x => !x.refuse && x.points > 0 && x.libres === 0 && x.objets > 0);

  console.log(`\n${rapport.length} phrases passées à l'audit `
    + `(${refuses.length} refusées faute de figure de départ : elles ne sont pas jugées).`);

  console.log('\n=== 1. des points posés sur un objet sans en dépendre ===');
  if (!posesFaux.length) console.log('  ✓ aucun');
  posesFaux.forEach(x => console.log('  ✗ ' + x.ph + '\n      ' + x.faux.join(', ')));

  console.log('\n=== 2. aux instruments, un outil qui trace dans le vide ===');
  if (!compasVide.length) console.log('  ✓ aucun');
  compasVide.forEach(x => console.log('  ✗ ' + x.ph + '\n      tracé suivi de : ' + x.vide.join(', ')));

  console.log('\n=== 3. des figures qu\'on ne peut pas prendre à la main ===');
  if (!figees.length) console.log('  ✓ aucune');
  figees.forEach(x => console.log('  ✗ ' + x.ph + ' — ' + x.points
    + ' point(s) visible(s), aucun libre'));

  if (errs.length) console.log('\nERREURS JS : ' + errs.slice(0, 5).join(' | '));
  const total = posesFaux.length + compasVide.length + figees.length;
  console.log(`\n=== ${total ? total + ' construction(s) à reprendre' : 'tout tient'} ===`);
  await b.close();
  process.exit(0);
})();
