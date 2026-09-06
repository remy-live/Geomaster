/* LES DESSINS AU COMPAS : un chat, un panda, une chouette…
 *
 * Le répertoire vient des fiches « Dessins géométriques » de M. Devoddere et du
 * livre « Dessiner avec un compas » de Laurent Stéfano. L'intérêt n'est pas
 * décoratif : ce sont des CERCLES et des ARCS, rien d'autre. L'élève reporte des
 * écartements pendant une heure sans s'apercevoir qu'il travaille.
 *
 * La sonde vérifie ce qui compte : que chaque bête se trace, qu'elle est faite
 * de vraies figures (des Circle et des Arc, que la feuille sait relire,
 * enregistrer et rejouer) et non de traces de construction, que le compas
 * dessine vraiment au rejeu, et que la taille se donne.
 */
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

const BETES = ['chat', 'panda', 'souris', 'chouette', 'ourson', 'tigre', 'coccinelle',
               'poisson', 'tortue', 'escargot', 'écureuil', 'lapin', 'cœur'];

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

  console.log('\n=== treize dessins, et tous se tracent ===');
  const tout = await page.evaluate((betes) => {
    const app = window.app;
    return betes.map((n) => {
      app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
      let r;
      try { r = app.executerConsigneAvec('Trace un ' + n, false); }
      catch (e) { r = { ok: false, message: 'EXCEPTION ' + e.message }; }
      const pieces = app.entities.filter(e => e instanceof Circle || e instanceof Arc
                                           || e instanceof Segment);
      /* Des VRAIES figures : ni CompassArc ni animation quand on n'a pas demandé
         les instruments — sinon la feuille ne saurait ni les relire ni les
         rejouer. */
      const traces = app.entities.filter(e => e instanceof CompassArc
                                           || e instanceof ToolAnimation).length;
      /* La figure tient-elle dans un cadre raisonnable ? Une pièce égarée à
         mille pixels du reste se verrait ici. */
      const xs = [], ys = [];
      app.entities.forEach((e) => {
        if (e instanceof Point) { xs.push(e.x); ys.push(e.y); }
      });
      const larg = Math.round(Math.max(...xs) - Math.min(...xs));
      const haut = Math.round(Math.max(...ys) - Math.min(...ys));
      return { n, ok: !!(r && r.ok), msg: (r && r.message) || '',
               pieces: pieces.length, traces, larg, haut,
               astuce: (r && r.astuce) || '' };
    });
  }, BETES);
  tout.forEach((x) => {
    console.log('  ' + ('« Trace un ' + x.n + ' »').padEnd(28) + ' → ' + x.msg);
  });
  ck('les treize sont comprises', tout.every(x => x.ok),
     tout.filter(x => !x.ok).map(x => x.n).join(', ') || 'toutes');
  ck('  chacune a au moins quatre pièces', tout.every(x => x.pieces >= 4),
     tout.map(x => x.n + ':' + x.pieces).join(' '));
  ck('  ce sont de VRAIES figures : aucune trace de compas, aucune animation',
     tout.every(x => x.traces === 0),
     tout.filter(x => x.traces).map(x => x.n + ':' + x.traces).join(' ') || 'aucune');
  /* Un dessin qui déborde de la feuille ou dont une pièce part au loin se
     repère à sa boîte : elles font toutes entre une et six fois le rayon. */
  ck('  et chacune tient dans un cadre raisonnable',
     tout.every(x => x.larg > 60 && x.larg < 1200 && x.haut > 60 && x.haut < 1200),
     tout.map(x => x.n + ' ' + x.larg + '×' + x.haut).join(' · '));
  ck('  la bulle dit avec quoi on la trace',
     tout.every(x => /compas et la règle/.test(x.astuce)), tout[0].astuce.slice(0, 80));

  console.log('\n=== la taille se donne, et tout suit ===');
  const taille = await page.evaluate(() => {
    const app = window.app;
    const mesurer = (ph) => {
      app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
      app.executerConsigneAvec(ph, false);
      const c = app.entities.filter(e => e instanceof Circle);
      const gros = Math.max(...c.map(e => Math.hypot(e.p2.x - e.p1.x, e.p2.y - e.p1.y)));
      return Math.round(gros / 50 * 10) / 10;
    };
    return { defaut: mesurer('Trace un chat'), demande: mesurer('Trace un chat de 5 cm') };
  });
  ck('« un chat de 5 cm » : son plus grand cercle fait 5 cm de rayon',
     taille.demande === 5, taille.demande + ' cm (par défaut ' + taille.defaut + ' cm)');

  console.log('\n=== aux instruments, le compas dessine ===');
  const rejeu = await page.evaluate(async () => {
    const app = window.app;
    const suivi = [];
    const vraiRender = app.render.bind(app);
    app.render = function () {
      vraiRender();
      if (app.isToolAnimating) suivi.push(!!app.ArcTracing);
    };
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace un chat', true);
    /* Chaque animation de tracé doit être suivie de la figure qu'elle trace :
       c'est là que le rejeu va chercher quoi dessiner sous le compas. */
    const mal = [];
    app.entities.forEach((e, i) => {
      if (!(e instanceof ToolAnimation) || e.originalType !== 'trace') return;
      const s = app.entities[i + 1];
      if (!(s instanceof Arc || s instanceof Circle || s instanceof Segment)) {
        mal.push(s ? s.constructor.name : '(rien)');
      }
    });
    const anims = app.entities.filter(e => e instanceof ToolAnimation).length;
    app.replayIndex = 0; app.fastForward(0);
    app.playStepLoop(0, app.entities.length);
    await new Promise(r => setTimeout(r, 9000));
    app.render = vraiRender;
    return { anims, mal, images: suivi.length, dessinantes: suivi.filter(Boolean).length };
  });
  ck('la construction aux instruments existe', rejeu.anims > 10,
     rejeu.anims + ' gestes d\'outil');
  ck('  chaque tracé est suivi de la figure qu\'il trace', rejeu.mal.length === 0,
     rejeu.mal.length ? 'suivi de : ' + rejeu.mal.join(', ') : 'tous');
  ck('  et le compas DESSINE pendant qu\'il tourne', rejeu.dessinantes > 30,
     rejeu.dessinantes + ' images sur ' + rejeu.images);

  console.log('\n=== l\'énoncé relu, et le voyage ===');
  const relu = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace un chat de 4 cm', false);
    const avant = app.entities.filter(e => e instanceof Circle || e instanceof Arc).length;
    const prog = app.programmeDeConstruction(false) || [];
    const avecOutils = app.programmeDeConstruction(true) || [];
    /* L'énoncé relu doit se REJOUER : c'est la même phrase que celle qui trace. */
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    const refus = [];
    prog.forEach((l) => {
      const r = app.executerConsigneAvec(l, false);
      if (!r || !r.ok) refus.push(l + ' → ' + ((r && r.message) || 'rien'));
    });
    const rejoue = app.entities.filter(e => e instanceof Circle || e instanceof Arc).length;
    /* Et il voyage : le code compact doit redonner le même dessin. */
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace un chat de 4 cm', false);
    const code = app.codeDocument();
    app.entities = []; app.render();
    app.loadFromCompressedString(code);
    const apres = app.entities.filter(e => e instanceof Circle || e instanceof Arc).length;
    return { avant, apres, rejoue, refus, prog, avecOutils };
  });
  ck('la figure voyage par le code compact', relu.avant === relu.apres && relu.avant >= 8,
     relu.avant + ' pièces → ' + relu.apres);
  /* Décrit pièce par pièce, un chat donnait huit fois « Trace le cercle de
     centre ? et de rayon 4 cm » — des phrases que personne ne pourrait suivre,
     puisqu'elles ne disent pas où poser les cercles les uns par rapport aux
     autres. Il se relit donc comme un chat. */
  ck('  et l\'énoncé relu dit « un chat », pas huit « cercle de centre ? »',
     relu.prog.length === 1 && /^Trace un chat de 4 cm\.$/.test(relu.prog[0]),
     JSON.stringify(relu.prog));
  ck('  cette phrase se REJOUE et redonne le dessin entier',
     relu.refus.length === 0 && relu.rejoue === relu.avant,
     relu.rejoue + ' pièces sur ' + relu.avant
     + (relu.refus.length ? ' — refusé : ' + relu.refus.join(' | ') : ''));
  ck('  et aux instruments on dit par quoi on commence',
     relu.avecOutils.some(l => /Ouvre le compas de 4 cm/.test(l)),
     relu.avecOutils.join(' | '));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
