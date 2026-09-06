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

const BETES = ['chat', 'panda', 'souris', 'chouette', 'ourson', 'coccinelle',
               'poisson', 'escargot', 'cœur'];

/* Le tigre, la tortue et l'écureuil ont été retirés à la demande. Le lapin
   est parti ensuite : ses oreilles en amande demandaient des longueurs qui ne
   se reportent pas au compas — mieux vaut neuf dessins justes que dix dont un
   triche. */
const RETIRES = ['tigre', 'tortue', 'écureuil', 'lapin'];

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
  /* La fenêtre « une sauvegarde a été trouvée » s'ouvre après coup : si elle
     arrive au milieu d'un glissé, elle couvre le canevas et le geste s'arrête. */
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const m = document.getElementById('customModal');
    if (m && getComputedStyle(m).display !== 'none') window.app.closeModal();
  });

  console.log('\n=== neuf dessins, et tous se tracent ===');
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
      /* UN CERCLE A UN CENTRE, ET ON DOIT POUVOIR LE PRENDRE. Les centres
         étaient cachés : le dessin était un décor qu'on ne pouvait pas
         toucher, et un cercle sans centre n'est pas une figure de géométrie. */
      const cercles = app.entities.filter(e => e instanceof Circle);
      const centresVus = cercles.every(c => c.p1 && c.p1.visible !== false && c.p1.label);
      return { n, ok: !!(r && r.ok), msg: (r && r.message) || '',
               pieces: pieces.length, traces, larg, haut, centresVus,
               cercles: cercles.length,
               astuce: (r && r.astuce) || '' };
    });
  }, BETES);
  tout.forEach((x) => {
    console.log('  ' + ('« Trace un ' + x.n + ' »').padEnd(28) + ' → ' + x.msg);
  });
  ck('les neuf sont comprises', tout.every(x => x.ok),
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
  ck('  chaque cercle a un centre VISIBLE et nommé, qu\'on peut prendre',
     tout.every(x => x.centresVus),
     tout.filter(x => !x.centresVus).map(x => x.n).join(', ') || 'tous');
  ck('  la bulle dit qu\'une seule longueur se mesure',
     tout.every(x => /UNE SEULE LONGUEUR SE MESURE/.test(x.astuce)
                  && /REPORTE ce même écartement six fois/.test(x.astuce)),
     tout[0].astuce.slice(0, 90));

  console.log('\n=== UNE SEULE LONGUEUR SE MESURE : le rayon ===');
  /* « Comment places-tu les points sur les cercles ? Il faut que les
     constructions soient logiques… tu utilises des approximations de longueur.
     Quand on est au compas, on reporte des longueurs. La seule longueur que
     l'on donne et que l'on mesure est celle du rayon de base. »
     La première table posait chaque cercle à des coordonnées décimales choisies
     à l'œil — ('c', -0.62, -0.78, 0.45). Ce n'était pas une construction, c'était
     une liste de points : au compas, ces nombres-là ne se reportent pas.
     La sonde relit la table pièce par pièce. */
  const logique = await page.evaluate(() => {
    const mauvais = [];
    Object.keys(GM_DESSINS).forEach((cle) => {
      const d = GM_DESSINS[cle];
      /* Directions : multiples de 60° (report du rayon), 30° (leur bissectrice),
         90° (la perpendiculaire) et 45° (sa bissectrice). Rien d'autre. */
      const ok = (ou) => (Array.isArray(ou[0]) ? ou : [ou]).every(([dir, dist]) =>
        (dir % 30 === 0 || dir % 45 === 0) && GM_COMPAS_LONGUEURS.includes(dist));
      d.pieces.forEach((x, i) => {
        if (x[0] === 'c' || x[0] === 'a') {
          if (!ok(x[1])) mauvais.push(cle + ' #' + i + ' centre ' + JSON.stringify(x[1]));
          if (!GM_COMPAS_LONGUEURS.includes(x[2])) mauvais.push(cle + ' #' + i + ' rayon ' + x[2]);
        } else if (!ok(x[1]) || !ok(x[2])) {
          mauvais.push(cle + ' #' + i + ' trait ' + JSON.stringify([x[1], x[2]]));
        }
      });
    });
    return { mauvais, longueurs: GM_COMPAS_LONGUEURS.length };
  });
  ck('AUCUNE pièce n\'est posée à une longueur qui ne se reporte pas',
     logique.mauvais.length === 0,
     logique.mauvais.slice(0, 4).join(' · ') || logique.longueurs + ' longueurs autorisées');

  /* Et les six reports sont TRACÉS : au compas on ne place pas les points, on
     les reporte — et cela doit se voir. */
  const reports = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace un chat', true);
    const traces = app.entities.filter(e => e instanceof CompassArc);
    const avecOutils = app.programmeDeConstruction(true) || [];
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    const r = app.executerConsigneAvec('Trace un chat', false);
    return { traces: traces.length, grises: traces.every(e => e.color === '#b8b8b8'),
             sansOutils: app.entities.filter(e => e instanceof CompassArc).length,
             avecOutils, astuce: (r && r.astuce) || '' };
  });
  ck('aux instruments, le cercle de base et ses SIX reports sont tracés',
     reports.traces === 7 && reports.grises, reports.traces + ' traces de compas');
  ck('  et sans les instruments, aucune : la figure reste nue',
     reports.sansOutils === 0, reports.sansOutils + ' traces');
  ck('le programme dit la seule longueur mesurée, et le report',
     /SEULE longueur que tu mesureras/.test(reports.avecOutils[0] || '')
     && /reporte-le six fois/.test(reports.avecOutils[1] || ''),
     reports.avecOutils.slice(0, 2).join(' | '));
  ck('  et la médiatrice donne la moitié puis le quart, sans rien mesurer',
     reports.avecOutils.some(l => /médiatrice/.test(l))
     && reports.avecOutils.some(l => /quart du rayon/.test(l)),
     reports.avecOutils.slice(2, 4).join(' | '));
  ck('  la bulle le dit aussi', /UNE SEULE LONGUEUR SE MESURE/.test(reports.astuce),
     reports.astuce.slice(0, 70));

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
      /* Un CompassArc en est une aussi : c'est la trace grise des six reports. */
      if (!(s instanceof Arc || s instanceof Circle || s instanceof Segment
            || s instanceof CompassArc)) {
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

  console.log('\n=== ce qui a été retiré est bien parti ===');
  const partis = await page.evaluate((noms) => {
    const app = window.app;
    return noms.map((n) => {
      app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
      const r = app.executerConsigneAvec('Trace un ' + n, false);
      return { n, ok: !!(r && r.ok) };
    });
  }, RETIRES);
  ck('tigre, tortue et écureuil ne sont plus proposés',
     partis.every(x => !x.ok), partis.filter(x => x.ok).map(x => x.n).join(', ') || 'aucun');

  console.log('\n=== on prend un cercle par son centre, et il garde son rayon ===');
  /* « Pourquoi ne peut-on pas bouger les cercles ? C'est surprenant d'avoir des
     cercles sans centre. » */
  /* Le rejeu du bloc précédent laisse la feuille dans un état de lecture : on
     repart d'une page neuve plutôt que de démêler ce qu'il en reste. */
  await page.goto(PAGE);
  await page.waitForFunction(() => window.app);
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const m = document.getElementById('customModal');
    if (m && getComputedStyle(m).display !== 'none') window.app.closeModal();
  });
  const prise = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace un chat', false);
    app.setTool('move'); app.render();
    const tete = app.entities.filter(e => e instanceof Circle)[0];
    const o = app.entities.filter(e => e instanceof Circle)[1];
    const R = Math.hypot(tete.p2.x - tete.p1.x, tete.p2.y - tete.p1.y);
    const r = app.canvas.getBoundingClientRect();
    return { cx: o.p1.x, cy: o.p1.y, nom: o.p1.label,
             /* Le centre de l'oreille est un point REPORTÉ sur le cercle de la
                tête : il en dépend, et c'est ce qu'on vérifie. */
             lie: (o.p1.parents || []).length === 1 && o.p1.parents[0] === tete,
             surTete: Math.abs(Math.hypot(o.p1.x - tete.p1.x, o.p1.y - tete.p1.y) - R),
             rayon: Math.round(Math.hypot(o.p2.x - o.p1.x, o.p2.y - o.p1.y)),
             tx: tete.p1.x, ty: tete.p1.y, R,
             cl: r.left, ct: r.top, view: app.view };
  });
  ck('le centre d\'une oreille DÉPEND du cercle de la tête',
     prise.lie && prise.surTete < 0.5,
     'lié : ' + prise.lie + ', à ' + Math.round(prise.surTete * 100) / 100 + ' px du cercle');
  const T = (x, y) => ({ x: prise.cl + (x * prise.view.zoom + prise.view.x),
                         y: prise.ct + (y * prise.view.zoom + prise.view.y) });
  /* On tire LE LONG du cercle : tirer vers l'extérieur ne ferait que reprojeter
     le point au même endroit — c'est justement ce que « il en dépend » veut
     dire. On vise donc sa position après un quart de tour autour de la tête. */
  const ang0 = Math.atan2(prise.cy - prise.ty, prise.cx - prise.tx);
  const visee = { x: prise.tx + Math.cos(ang0 + 0.7) * prise.R,
                  y: prise.ty + Math.sin(ang0 + 0.7) * prise.R };
  const C0 = T(prise.cx, prise.cy), C1 = T(visee.x, visee.y);
  await page.mouse.move(C0.x, C0.y); await page.waitForTimeout(60);
  await page.mouse.down(); await page.waitForTimeout(60);
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(C0.x + (C1.x - C0.x) * i / 8, C0.y + (C1.y - C0.y) * i / 8);
    await page.waitForTimeout(20);
  }
  await page.mouse.up(); await page.waitForTimeout(60);
  const bouge = await page.evaluate(() => {
    const app = window.app;
    const tete = app.entities.filter(e => e instanceof Circle)[0];
    const o = app.entities.filter(e => e instanceof Circle)[1];
    const R = Math.hypot(tete.p2.x - tete.p1.x, tete.p2.y - tete.p1.y);
    return { x: o.p1.x, y: o.p1.y,
             surTete: Math.abs(Math.hypot(o.p1.x - tete.p1.x, o.p1.y - tete.p1.y) - R),
             rayon: Math.round(Math.hypot(o.p2.x - o.p1.x, o.p2.y - o.p1.y)) };
  });
  const parcouru = Math.round(Math.hypot(bouge.x - prise.cx, bouge.y - prise.cy));
  /* Il se prend et il glisse — LE LONG DU CERCLE, puisqu'il en dépend. Une
     oreille de chat tourne autour de la tête ; elle ne s'en décolle pas. */
  ck('le centre d\'une oreille se prend et glisse sur la tête', parcouru > 20,
     'centre « ' + prise.nom + ' » tiré de ' + parcouru + ' px');
  ck('  et il RESTE sur le cercle de la tête', bouge.surTete < 0.5,
     'à ' + Math.round(bouge.surTete * 100) / 100 + ' px du cercle');
  ck('  le cercle de l\'oreille garde son rayon', bouge.rayon === prise.rayon,
     prise.rayon + ' px → ' + bouge.rayon + ' px');

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
