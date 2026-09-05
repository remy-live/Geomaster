// La bibliothèque et les menus : trois présentations pour une même collection,
// des aperçus sur fond blanc, un menu Fichier rangé par bandes sans un mot, et
// les trois transformations qui manquaient aux constructions magiques.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1300, height: 950 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  console.log('\n=== l\'aperçu d\'une séance est sur fond blanc ===');
  /* La vignette recopiait la feuille QUADRILLAGE COMPRIS : on la mesure donc
     là où le quadrillage passe, loin de tout trait — et l'on regarde si les
     pixels y sont blancs. Le réglage du papier doit revenir ensuite : c'est
     une prise de vue, pas un changement de préférence. */
  const blanc = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    if (app.cslOublier) app.cslOublier();
    app.gridMode = 0;                       // quadrillage à carreaux
    app.executerConsigneAvec('Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm', false);
    app.render();
    const url = app.vignetteCourante(200);
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement('canvas');
        c.width = im.width; c.height = im.height;
        const x = c.getContext('2d');
        x.drawImage(im, 0, 0);
        // quatre coins : la figure est au centre, les coins ne portent que le fond
        const coins = [[3, 3], [im.width - 4, 3], [3, im.height - 4], [im.width - 4, im.height - 4]];
        const lus = coins.map(([u, v]) => [...x.getImageData(u, v, 1, 1).data].slice(0, 3).join(','));
        res({ lus, grille: app.gridMode, taille: im.width + 'x' + im.height });
      };
      im.onerror = () => res({ lus: [], grille: app.gridMode });
      im.src = url;
    });
  });
  ck('les quatre coins de l\'aperçu sont blancs',
     blanc.lus.length === 4 && blanc.lus.every(p => p === '255,255,255'),
     blanc.lus.join(' | '));
  ck('et le quadrillage de la feuille est revenu comme il était',
     blanc.grille === 0, String(blanc.grille));

  console.log('\n=== trois présentations, et celle qu\'on a choisie revient ===');
  await page.evaluate(() => {
    const app = window.app;
    const faire = (nom, phrases) => {
      app.entities = []; app.historyPast = []; app.stepInstructions = {};
      if (app.cslOublier) app.cslOublier();
      phrases.forEach(q => app.executerConsigneAvec(q, false));
      app.render(); app.projectTitle = nom;
      const l = app.lireBiblio();
      l.unshift({ n: nom, c: app.codeDocument(), v: app.vignetteCourante(300), d: Date.now(), p: 1 });
      app.ecrireBiblio(l);
    };
    faire('Triangle et médiatrices', ['Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm',
                                      'Trace les médiatrices du triangle ABC']);
    faire('Cercle circonscrit', ['Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 4 cm',
                                 'Trace le cercle circonscrit au triangle ABC']);
    app.ouvrirBiblio();
  });
  await page.waitForTimeout(1200);

  const vue = (v) => page.evaluate((v) => {
    if (v) window.app.presentationBiblio(v);
    const l = document.getElementById('biblioListe');
    const c = l.querySelector('.biblio-carte').getBoundingClientRect();
    const im = l.querySelector('.biblio-vue').getBoundingClientRect();
    let memo = '';
    try { memo = localStorage.getItem('gm_biblio_vue') || ''; } catch (e) { void e; }
    return { classe: l.className, carte: [Math.round(c.width), Math.round(c.height)],
             vue: [Math.round(im.width), Math.round(im.height)], memo,
             allume: [...document.querySelectorAll('.biblio-vues button')]
               .filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.vue).join(',') };
  }, v);

  const g = await vue('galerie');
  ck('galerie : la figure passe en grand', g.classe === 'vue-galerie' && g.vue[1] >= 140,
     JSON.stringify(g.vue));
  const vg = await vue('vignettes');
  ck('vignettes : la présentation compacte', vg.classe === 'vue-vignettes' && vg.carte[0] < 160,
     JSON.stringify(vg.carte));
  const li = await vue('liste');
  ck('liste : une séance par ligne, sur toute la largeur',
     li.classe === 'vue-liste' && li.carte[0] > 400 && li.carte[1] < 70, JSON.stringify(li.carte));
  ck('le bouton de la présentation choisie est le seul allumé',
     li.allume === 'liste', li.allume);
  ck('et le choix est retenu', li.memo === 'liste', li.memo);
  // rouvrir la bibliothèque doit reprendre la présentation retenue
  const reprise = await page.evaluate(() => {
    document.getElementById('biblioModal').style.display = 'none';
    window.app.ouvrirBiblio();
    return document.getElementById('biblioListe').className;
  });
  ck('rouverte, elle reprend la présentation retenue', reprise === 'vue-liste', reprise);
  await page.evaluate(() => {
    window.app.presentationBiblio('vignettes');
    document.getElementById('biblioModal').style.display = 'none';
  });

  console.log('\n=== le menu Fichier : quatre bandes, aucun mot ===');
  await page.locator('button[aria-label="Menu Fichier"]').hover();
  await page.waitForTimeout(400);
  const menu = await page.evaluate(() => {
    const m = document.querySelector('.header-dropdown-content.grid-3-cols');
    const bb = m.getBoundingClientRect();
    const rangees = {};
    m.querySelectorAll('.icon-btn').forEach(e => {
      const t = Math.round(e.getBoundingClientRect().top);
      (rangees[t] = rangees[t] || []).push(e.getAttribute('data-libelle') || '·');
    });
    const cell = m.querySelector('.icon-btn').getBoundingClientRect();
    return {
      w: Math.round(bb.width), h: Math.round(bb.height),
      deborde: bb.left < 0 || bb.right > innerWidth,
      icone: [Math.round(cell.width), Math.round(cell.height)],
      gap: getComputedStyle(m).gap,
      titres: [...m.querySelectorAll('.menu-titre')].map(t => ({
        txt: t.textContent.trim(), taille: getComputedStyle(t).fontSize,
        haut: Math.round(t.getBoundingClientRect().height),
        d: getComputedStyle(t).display })),
      rangees: Object.keys(rangees).sort((a, c) => a - c).map(k => rangees[k]),
    };
  });
  console.log('  ' + JSON.stringify(menu.rangees));
  ck('quatre catégories sont déclarées', menu.titres.length === 4,
     menu.titres.map(t => t.txt).join(' / '));
  ck('aucune ne s\'écrit à l\'écran',
     menu.titres.every(t => t.d === 'none' || t.taille === '0px'),
     menu.titres.map(t => t.taille + '/' + t.d).join(' '));
  /* Le rangement se voit à ceci : chaque catégorie repart à la ligne. Une
     rangée ne mêle donc jamais la fin d'une bande au début de la suivante. */
  /* « Sortir un fichier » compte une sortie de plus depuis l'export TikZ : ce
     qu'on garde, ce n'est pas le nombre — il bougera encore — c'est que les
     quatre bandes existent et qu'aucune ne mêle la fin de l'une au début de la
     suivante. */
  ck('chaque catégorie ouvre sa propre rangée',
     menu.rangees.length === 4 && menu.rangees.every(r => r.length >= 2),
     menu.rangees.map(r => r.length).join('+'));
  ck('les icônes n\'ont pas été desserrées', menu.icone[0] === 40 && menu.icone[1] === 40
     && parseFloat(menu.gap) <= 2, `${menu.icone.join('x')}, gap ${menu.gap}`);
  ck('et le menu tient dans la fenêtre', !menu.deborde, `${menu.w}x${menu.h}`);

  console.log('\n=== les constructions magiques : quatre bandes, cinq transformations ===');
  await page.locator('button[aria-label="Constructions Magiques"]').hover();
  await page.waitForTimeout(400);
  const magie = await page.evaluate(() => {
    const m = document.querySelector('.magic-menu-content');
    const bb = m.getBoundingClientRect();
    return { h: Math.round(bb.height), deborde: bb.bottom > innerHeight,
             grilles: [...m.querySelectorAll('.magic-grid')].map(g =>
               [...g.querySelectorAll('.magic-grid-item')].map(e => e.dataset.libelle)) };
  });
  console.log('  ' + JSON.stringify(magie.grilles));
  ck('les transformations forment leur propre bande',
     magie.grilles.length === 4 && magie.grilles[1].length === 5
     && magie.grilles[1].join(',') === 'Sym. axiale,Sym. centrale,Translation,Rotation,Homothétie',
     magie.grilles[1] ? magie.grilles[1].join(',') : '');
  ck('et le menu tient à l\'écran', !magie.deborde, String(magie.h));
  await page.keyboard.press('Escape');

  console.log('\n=== les trois nouveaux outils construisent juste ===');
  const rc = await page.locator('#geoCanvas').boundingBox();
  const depart = () => page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    app.magicAnimate = false; app.view = { x: 0, y: 0, zoom: 1 };
    if (app.cslOublier) app.cslOublier();
    ['Trace un triangle ABC tel que AB = 4 cm, AC = 3 cm et BC = 3 cm',
     'Trace le segment [DE] de 2 cm'].forEach(q => app.executerConsigneAvec(q, false));
    app.render();
    const P = {};
    app.entities.forEach(e => { if (e.constructor.name === 'Point' && e.label) P[e.label] = { x: e.x, y: e.y }; });
    return P;
  });
  const points = () => page.evaluate(() => {
    const P = {};
    window.app.entities.forEach(e => { if (e.constructor.name === 'Point' && e.label) P[e.label] = { x: e.x, y: e.y }; });
    return P;
  });

  const barre = () => page.evaluate(() => {
    const b = document.getElementById('barreTransfo');
    const ok = document.getElementById('transfoValider');
    return { vis: getComputedStyle(b).display,
             txt: document.getElementById('transfoTexte').textContent,
             bouton: ok.textContent, off: ok.disabled,
             cache: getComputedStyle(ok).display === 'none',
             pris: (window.app.transfoPoints || []).length };
  });

  // TRANSLATION : trois points un par un, valider, puis le segment-vecteur
  let P = await depart();
  await page.evaluate(() => window.app.setTool('magic_translation'));
  let e = await barre();
  ck('la barre s\'ouvre sur « sélectionnez la figure »',
     e.vis === 'flex' && /Sélectionnez la figure/.test(e.txt) && e.off === true, JSON.stringify(e));
  for (const n of ['A', 'B', 'C']) { await page.mouse.click(rc.x + P[n].x, rc.y + P[n].y); await page.waitForTimeout(110); }
  e = await barre();
  ck('  elle compte ce qui est pris, et « Valider » s\'allume',
     e.pris === 3 && /3 points/.test(e.txt) && e.off === false, JSON.stringify(e));
  /* Reprendre un point déjà pris le RETIRE : sans cela, un clic de trop ne se
     rattrape qu'en recommençant tout. */
  await page.mouse.click(rc.x + P.C.x, rc.y + P.C.y); await page.waitForTimeout(150);
  e = await barre();
  ck('  reprendre un point le retire', e.pris === 2, String(e.pris));
  await page.mouse.click(rc.x + P.C.x, rc.y + P.C.y); await page.waitForTimeout(150);
  await page.click('#transfoValider'); await page.waitForTimeout(200);
  e = await barre();
  ck('  validée, elle demande le vecteur et range son bouton',
     /vecteur/.test(e.txt) && e.cache === true, JSON.stringify(e));
  await page.mouse.click(rc.x + (P.D.x + P.E.x) / 2, rc.y + (P.D.y + P.E.y) / 2);
  await page.waitForTimeout(700);
  let Q = await points();
  const v = { x: P.E.x - P.D.x, y: P.E.y - P.D.y };
  ck('translation : les trois images sont à un vecteur DE de leur source',
     ['A', 'B', 'C'].every(n => Q[n + "'"]
       && Math.hypot(Q[n + "'"].x - (P[n].x + v.x), Q[n + "'"].y - (P[n].y + v.y)) < 0.2),
     Object.keys(Q).filter(n => n.includes("'")).join(','));
  e = await barre();
  ck('  et la barre se referme une fois la figure construite', e.vis === 'none', e.vis);

  // ROTATION : le réglage, la figure entière d'un clic, puis le centre
  P = await depart();
  await page.evaluate(() => window.app.setTool('magic_rotation'));
  await page.waitForTimeout(300);
  ck('rotation : l\'angle est demandé avant de toucher à la feuille',
     await page.locator('#gmTrAngle').count() === 1);
  await page.fill('#gmTrAngle', '90');
  await page.selectOption('#gmTrSens', '1');
  await page.locator('.modal-btn.modal-confirm').last().click();
  await page.waitForTimeout(250);
  /* UN CLIC SUR LA FIGURE LA PREND TOUT ENTIÈRE : c'est le cas courant — on
     transforme un triangle, pas trois points l'un après l'autre. */
  await page.mouse.click(rc.x + (P.A.x + P.B.x + P.C.x) / 3, rc.y + (P.A.y + P.B.y + P.C.y) / 3);
  await page.waitForTimeout(250);
  e = await barre();
  ck('  un clic sur le polygone prend ses trois sommets', e.pris === 3, String(e.pris));
  await page.click('#transfoValider'); await page.waitForTimeout(150);
  const O = { x: P.A.x - 60, y: P.A.y + 60 };
  await page.mouse.click(rc.x + O.x, rc.y + O.y);
  await page.waitForTimeout(800);
  Q = await points();
  /* Sens direct = angle NÉGATIF à l'écran, où les y descendent. */
  ck('  la figure entière tourne de 90° autour du centre',
     ['A', 'B', 'C'].every(n => {
       if (!Q[n + "'"]) return false;
       const r0 = Math.hypot(P[n].x - O.x, P[n].y - O.y);
       const r1 = Math.hypot(Q[n + "'"].x - O.x, Q[n + "'"].y - O.y);
       let da = (Math.atan2(Q[n + "'"].y - O.y, Q[n + "'"].x - O.x)
               - Math.atan2(P[n].y - O.y, P[n].x - O.x)) * 180 / Math.PI;
       while (da <= -180) da += 360; while (da > 180) da -= 360;
       return Math.abs(r1 - r0) < 0.3 && Math.abs(da + 90) < 0.3;
     }), Object.keys(Q).filter(n => n.includes("'")).join(','));

  // HOMOTHÉTIE
  P = await depart();
  await page.evaluate(() => window.app.setTool('magic_homothetie'));
  await page.waitForTimeout(300);
  ck('homothétie : le rapport est demandé', await page.locator('#gmTrRapport').count() === 1);
  await page.fill('#gmTrRapport', '2');
  await page.locator('.modal-btn.modal-confirm').last().click();
  await page.waitForTimeout(250);
  await page.mouse.click(rc.x + (P.A.x + P.B.x + P.C.x) / 3, rc.y + (P.A.y + P.B.y + P.C.y) / 3);
  await page.waitForTimeout(200);
  await page.click('#transfoValider'); await page.waitForTimeout(150);
  const O2 = { x: P.A.x - 70, y: P.A.y + 70 };
  await page.mouse.click(rc.x + O2.x, rc.y + O2.y);
  await page.waitForTimeout(800);
  Q = await points();
  ck('  la figure est agrandie deux fois depuis le centre',
     ['A', 'B', 'C'].every(n => Q[n + "'"]
       && Math.hypot(Q[n + "'"].x - (O2.x + 2 * (P[n].x - O2.x)),
                     Q[n + "'"].y - (O2.y + 2 * (P[n].y - O2.y))) < 0.3),
     Object.keys(Q).filter(n => n.includes("'")).join(','));
  // changer d'outil oublie la sélection : sinon la transformation suivante
  // porterait sur une figure choisie pour autre chose
  const oubli = await page.evaluate(() => {
    window.app.setTool('magic_sym_centrale');
    window.app.setTool('move');
    return { n: (window.app.transfoPoints || []).length,
             barre: getComputedStyle(document.getElementById('barreTransfo')).display };
  });
  ck('  changer d\'outil oublie la sélection et referme la barre',
     oubli.n === 0 && oubli.barre === 'none', JSON.stringify(oubli));

  console.log('\n=== le petit trait de la graduation ===');
  /* Au rapporteur, la mesure lue ne laissait AUCUNE trace : un point invisible
     au bord de l'instrument, et la demi-droite semblait sortir de nulle part.
     Au tableau on marque un petit trait au crayon contre la graduation. */
  const tr = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec("Trace un triangle ABC tel que AB = 6 cm, "
      + "l'angle BAC = 40° et l'angle ABC = 60°", true);
    const pt = (n) => app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
    const A = pt('A'), B = pt('B');
    const traits = app.entities.filter(e => e.constructor.name === 'Segment' && e.estConstruction);
    return traits.map(t => {
      // aligné sur le sommet ? l'écart d'angle vu du sommet doit être nul
      const s = [A, B].reduce((meilleur, o) => {
        const d = Math.min(Math.hypot(t.p1.x - o.x, t.p1.y - o.y), Math.hypot(t.p2.x - o.x, t.p2.y - o.y));
        return (!meilleur || d < meilleur.d) ? { o, d } : meilleur;
      }, null).o;
      const a1 = Math.atan2(t.p1.y - s.y, t.p1.x - s.x);
      const a2 = Math.atan2(t.p2.y - s.y, t.p2.x - s.x);
      return { L: +Math.hypot(t.p1.x - t.p2.x, t.p1.y - t.p2.y).toFixed(1),
               ecart: +Math.abs(a1 - a2).toFixed(5), visible: t.color !== null,
               d1: +Math.hypot(t.p1.x - s.x, t.p1.y - s.y).toFixed(0),
               d2: +Math.hypot(t.p2.x - s.x, t.p2.y - s.y).toFixed(0) };
    });
  });
  console.log('  ' + JSON.stringify(tr));
  ck('deux traits de graduation, un par pose du rapporteur', tr.length === 2, String(tr.length));
  ck('chacun est aligné sur le sommet et la graduation',
     tr.every(t => t.ecart < 1e-4), tr.map(t => t.ecart).join(' '));
  /* Le bord du rapporteur est à 180 px du sommet : le trait doit l'enjamber,
     sinon il passe sous le corps de l'instrument — invisible au moment précis
     où il doit se voir. */
  ck('chacun est court et à cheval sur le bord de l\'instrument',
     tr.every(t => t.L > 12 && t.L < 30 && t.d1 < 180 && t.d2 > 180),
     tr.map(t => `${t.L}px ${t.d1}→${t.d2}`).join(' | '));
  ck('et il se voit — il a une couleur', tr.every(t => t.visible));

  console.log('\n=== la bibliothèque d\'exemples s\'est étoffée ===');
  const ex = await page.evaluate(() => {
    const app = window.app, tous = window.GM_EXEMPLES || [];
    return tous.map(e => {
      const code = app.codeExemple(e);
      if (!code) return { n: e.n, ok: false };
      try {
        app.entities = [];
        app.loadFromCompressedString(code.split('~')[0]);
        return { n: e.n, ok: app.entities.length > 0, pages: code.split('~').length,
                 obj: app.entities.length };
      } catch (err) { return { n: e.n, ok: false, err: err.message }; }
    });
  });
  ck('elle compte au moins quinze constructions', ex.length >= 15, String(ex.length));
  ck('chacune s\'ouvre et porte une figure',
     ex.every(e => e.ok && e.obj > 0), ex.filter(e => !e.ok).map(e => e.n).join(', '));
  for (const nom of ['Triangle au rapporteur', 'Symétrique par rapport à une droite',
                     'Translation d’un triangle', 'Rotation d’un triangle',
                     'Homothétie d’un triangle']) {
    ck(`  « ${nom} » est là`, ex.some(e => e.n === nom));
  }
  ck('et « Les quatre transformations » en fait un document de quatre pages',
     ex.some(e => e.n === 'Les quatre transformations' && e.pages === 4),
     JSON.stringify(ex.find(e => e.n === 'Les quatre transformations')));

  console.log('\n=== les transformations rangées sont RELUES, pas supposées ===');
  /* LE PIÈGE, ET IL A COÛTÉ UNE FOIS. Ces entrées sont des figures ENREGISTRÉES :
     du code compact, figé. Corriger un bâtisseur — passer la translation au
     compas seul, par exemple — ne les refait PAS. Elles gardent la construction
     du jour où elles ont été produites, et le logiciel montre alors dans sa
     bibliothèque un geste qu'il ne fait plus nulle part ailleurs.
     Cette section les ouvre et lit ce qu'elles contiennent vraiment. */
  const transfos = await page.evaluate(() => {
    const app = window.app;
    let liste = null;
    for (const k of Object.keys(window)) {
      const v = window[k];
      if (Array.isArray(v) && v.length > 5 && v[0] && typeof v[0].c === 'string' && v[0].n) { liste = v; break; }
    }
    const out = [];
    for (const e of liste) {
      if (!/ym[ée]trique par|ranslation|otation d|omoth/i.test(e.n)) continue;
      app.entities = []; app.historyPast = [];
      app.chargerDocument(e.c);
      const outils = {};
      app.entities.filter(x => x.constructor.name === 'ToolAnimation')
        .forEach(x => { const k2 = x.widgetType || x.type; outils[k2] = (outils[k2] || 0) + 1; });
      const P = {};
      app.entities.forEach(x => { if (x.constructor.name === 'Point' && x.label) P[x.label] = x; });
      const tri = ['A', 'B', 'C'].map(n => P[n]).filter(Boolean);
      const img = ["A'", "B'", "C'"].map(n => P[n]).filter(Boolean);
      const d = (a, c) => +Math.hypot(a.x - c.x, a.y - c.y).toFixed(1);
      /* Le point est-il DANS le triangle ? Test du signe des trois produits
         vectoriels — le même que pour savoir de quel côté d'un côté on est. */
      const dedans = (X) => {
        if (!X || tri.length < 3) return false;
        const s = (a, bb, c) => (a.x - c.x) * (bb.y - c.y) - (bb.x - c.x) * (a.y - c.y);
        const q = [s(X, tri[0], tri[1]), s(X, tri[1], tri[2]), s(X, tri[2], tri[0])];
        return !(q.some(v => v < 0) && q.some(v => v > 0));
      };
      const r = { n: e.n, outils,
                  dedans: ['O', 'D', 'E'].filter(n => P[n] && dedans(P[n])),
                  cotes: null, rapport: null, ecarts: null };
      if (tri.length === 3 && img.length === 3) {
        const cs = [d(tri[0], tri[1]), d(tri[1], tri[2]), d(tri[2], tri[0])];
        const ci = [d(img[0], img[1]), d(img[1], img[2]), d(img[2], img[0])];
        r.cotes = [cs, ci];
        r.rapport = +(ci[0] / cs[0]).toFixed(3);
      }
      if (P.D && P.E && /ranslation/i.test(e.n) && tri.length === 3 && img.length === 3) {
        const vx = P.E.x - P.D.x, vy = P.E.y - P.D.y;
        r.ecarts = tri.map((q, i) => Math.round(Math.hypot(img[i].x - q.x - vx, img[i].y - q.y - vy)));
      }
      out.push(r);
    }
    return out;
  });
  console.log('  ' + transfos.map(t => `${t.n} ${JSON.stringify(t.outils)}`).join('\n  '));
  ck('les quatre transformations du triangle sont rangées', transfos.length === 4,
     transfos.map(t => t.n).join(' | '));
  /* L'AXE, LE CENTRE, LE VECTEUR NE SONT PAS DANS LA FIGURE. Un centre de
     rotation posé au milieu du triangle, c'est le rapporteur à l'étroit sur le
     dessin, et une image qui se superpose à l'originale — la figure ne montre
     plus ce qu'elle est censée montrer. */
  for (const t of transfos) {
    ck(`  « ${t.n} » : l'élément est hors de la figure`,
       t.dedans.length === 0, t.dedans.join(','));
  }
  /* LA TRANSLATION SE CONSTRUIT AU COMPAS SEUL. On y traçait « la parallèle au
     vecteur à la règle » : une règle ne trace pas de parallèle. Le bâtisseur a
     été corrigé — mais la figure rangée, elle, gardait l'ancienne, avec ses six
     poses de règle. C'est le défaut que cette section existe pour attraper. */
  const trans = transfos.find(t => /ranslation/i.test(t.n));
  ck('la translation rangée n\'emploie que le compas',
     trans && !trans.outils.ruler && !trans.outils.setsquare && !trans.outils.protractor
     && trans.outils.compass > 0, JSON.stringify(trans && trans.outils));
  ck('  et ses trois images sont exactes',
     trans && trans.ecarts && trans.ecarts.every(x => x === 0),
     JSON.stringify(trans && trans.ecarts));
  /* Chaque figure doit ÊTRE la transformation qu'elle annonce. */
  const sym = transfos.find(t => /ym[ée]trique/i.test(t.n));
  const rot = transfos.find(t => /otation/i.test(t.n));
  const hom = transfos.find(t => /omoth/i.test(t.n));
  ck('la symétrie conserve les longueurs', sym && sym.rapport === 1, JSON.stringify(sym && sym.cotes));
  ck('la rotation aussi', rot && rot.rapport === 1, JSON.stringify(rot && rot.cotes));
  ck('l\'homothétie les multiplie par son rapport', hom && hom.rapport === 2,
     JSON.stringify(hom && hom.cotes));
  /* Et chacune emploie SES instruments : l'équerre pour la symétrie axiale (la
     perpendiculaire à l'axe), le rapporteur pour la rotation (l'angle). */
  ck('la symétrie axiale sort l\'équerre', sym && sym.outils.setsquare > 0,
     JSON.stringify(sym && sym.outils));
  ck('la rotation sort le rapporteur', rot && rot.outils.protractor > 0,
     JSON.stringify(rot && rot.outils));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
