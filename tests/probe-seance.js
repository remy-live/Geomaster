// Une séance, ce n'est pas une figure : les pages d'un même document, et la
// bibliothèque où les séances se rangent d'une année sur l'autre.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;
(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);
  await page.evaluate(`
    window.__s = {
      ev(t, s, bt) { const app = window.app, rc = app.canvas.getBoundingClientRect();
        const X = s.x*app.view.zoom+app.view.x+rc.left, Y = s.y*app.view.zoom+app.view.y+rc.top;
        (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{ pointerId:3,
          pointerType:'mouse', isPrimary:true, button:0, buttons:bt, clientX:X, clientY:Y,
          bubbles:true, cancelable:true })); },
      seg(a, c) { const app = window.app; app.setTool('segment'); this.ev('pointerdown', a, 1);
        for (let i=1;i<=8;i++) this.ev('pointermove',{x:a.x+(c.x-a.x)*i/8,y:a.y+(c.y-a.y)*i/8},1);
        this.ev('pointerup', c, 0); app.setTool('select');
        // le segment tracé : les bâtisseurs le prennent en base
        return app.entities.filter(e => e.constructor.name === 'Segment').pop(); },
      neuf() { const app = window.app; app.pages = null; app.pageActive = 0;
        app.entities = []; app.historyPast = []; app.saveState(); app.majBarrePages(); },
    };`);

  console.log('\n=== les pages d\'une séance ===');
  const pages = await page.evaluate(() => {
    const app = window.app, s = window.__s;
    s.neuf();
    const avant = getComputedStyle(document.getElementById('pageEtiquette')).display;
    s.seg({x:200,y:250},{x:600,y:250});
    const p1 = app.entities.length;
    app.ajouterPage();
    const apres = getComputedStyle(document.getElementById('pageEtiquette')).display;
    const vide = app.entities.length;
    s.seg({x:200,y:300},{x:500,y:300}); s.seg({x:200,y:400},{x:500,y:400});
    const p2 = app.entities.length;
    app.ajouterPage(); s.seg({x:300,y:300},{x:700,y:600});
    return { avant, apres, p1, vide, p2, p3: app.entities.length,
             etiquette: document.getElementById('pageEtiquette').textContent,
             code: app.codeDocument() };
  });
  console.log('  ' + JSON.stringify({ ...pages, code: pages.code.length + ' car.' }));
  ck('à une seule page, la pagination reste cachée', pages.avant === 'none', pages.avant);
  ck('elle apparaît dès la deuxième', pages.apres !== 'none', pages.apres);
  ck('une page neuve est vierge', pages.vide === 0);
  ck('chaque page garde son contenu', pages.p1 === 3 && pages.p2 === 6 && pages.p3 === 3,
     `${pages.p1}/${pages.p2}/${pages.p3}`);
  ck('l\'étiquette compte juste', pages.etiquette === '3/3', pages.etiquette);
  ck('les trois pages tiennent dans un seul code',
     (pages.code.match(/~/g) || []).length === 2, pages.code.slice(0, 30));

  const nav = await page.evaluate(() => {
    const app = window.app;
    app.allerPage(0); const a = app.entities.length;
    app.allerPage(1); const b2 = app.entities.length;
    app.allerPage(2); const c = app.entities.length;
    return [a, b2, c];
  });
  ck('on feuillette sans rien perdre', JSON.stringify(nav) === '[3,6,3]', JSON.stringify(nav));

  const relu = await page.evaluate((code) => {
    const app = window.app, s = window.__s;
    s.neuf();
    app.chargerDocument(code);
    const un = app.entities.length, n = app.pagesDocument().length;
    app.allerPage(1); const deux = app.entities.length;
    return { un, deux, n, etiquette: document.getElementById('pageEtiquette').textContent };
  }, pages.code);
  console.log('  rechargé : ' + JSON.stringify(relu));
  ck('le code rouvre les trois pages', relu.n === 3 && relu.un === 3 && relu.deux === 6, JSON.stringify(relu));

  /* Le séparateur n'appartient pas à l'alphabet de LZString : un document d'une
     seule page n'en contient aucun, et les liens déjà distribués s'ouvrent. */
  const solo = await page.evaluate(() => {
    const app = window.app, s = window.__s;
    s.neuf(); s.seg({x:200,y:250},{x:600,y:250});
    const c = app.codeDocument();
    return { tildes: (c.match(/~/g) || []).length, egal: c === app.getCompressedString() };
  });
  ck('un document d\'une page reste un code d\'autrefois', solo.tildes === 0 && solo.egal, JSON.stringify(solo));

  console.log('\n=== le panneau des pages : ranger, cocher, fusionner ===');
  const panneau = await page.evaluate(async () => {
    const app = window.app, s = window.__s;
    s.neuf();
    s.seg({x:200,y:250},{x:600,y:250});
    app.ajouterPage(); s.seg({x:200,y:300},{x:500,y:300}); s.seg({x:200,y:400},{x:500,y:400});
    app.ajouterPage(); s.seg({x:300,y:300},{x:700,y:600});
    app.allerPage(1);
    /* Fabriquer les vignettes suppose de charger chaque page : l'état courant
       est mis de côté et remis. Si ça ne marchait pas, on perdrait la figure
       ouverte et son historique en ouvrant simplement le panneau. */
    const avant = { objets: app.entities.length, page: app.pageActive, hist: app.historyPast.length };
    app.ouvrirPanneauPages();
    await new Promise(r => setTimeout(r, 300));
    const cartes = [...document.querySelectorAll('#pagesListe .page-carte')];
    return { avant, apres: { objets: app.entities.length, page: app.pageActive, hist: app.historyPast.length },
             cartes: cartes.length,
             vignettes: cartes.filter(c => /^data:image/.test(c.querySelector('img').src)).length,
             active: cartes.findIndex(c => c.classList.contains('active')) };
  });
  console.log('  ' + JSON.stringify(panneau));
  ck('une vignette par page', panneau.cartes === 3 && panneau.vignettes === 3, JSON.stringify(panneau));

  const range = await page.evaluate(() => {
    const app = window.app;
    const tailles = app.pagesDocument().map(c => c.length);
    document.querySelectorAll('#pagesListe .page-carte')[0].querySelectorAll('.page-mini')[1].click();
    return { avant: tailles, apres: app.pagesDocument().map(c => c.length), page: app.pageActive };
  });
  console.log('  ' + JSON.stringify(range));
  ck('« avancer » échange bien deux pages',
     range.apres[0] === range.avant[1] && range.apres[1] === range.avant[0], JSON.stringify(range));
  ck('et la page qu\'on regardait reste celle qu\'on regarde', range.page === 0, String(range.page));

  /* La vignette découpe la ZONE UTILE. Le canevas mesure 3000×2000 et la figure
     n'en occupe qu'un coin : sans découpe, toutes les vignettes auraient le même
     format, celui de la feuille, et ne montreraient que du blanc. Deux figures de
     formes opposées doivent donc donner deux vignettes de formes opposées. */
  const cadrage = await page.evaluate(async () => {
    const app = window.app, s = window.__s;
    const forme = (v) => new Promise(res => {
      const im = new Image();
      im.onload = () => res(+(im.width / im.height).toFixed(2));
      im.onerror = () => res(null);
      im.src = v;
    });
    s.neuf(); s.seg({x:200,y:400},{x:900,y:430});          // très large et plat
    app.render();
    const large = await forme(app.vignetteCourante(150));
    s.neuf(); s.seg({x:400,y:150},{x:430,y:800});          // haut et étroit
    app.render();
    const haut = await forme(app.vignetteCourante(150));
    return { large, haut, feuille: +(app.canvas.width / app.canvas.height).toFixed(2) };
  });
  console.log('  ' + JSON.stringify(cadrage));
  ck('la vignette d\'une figure large est large', cadrage.large > 1.6, String(cadrage.large));
  ck('celle d\'une figure haute est haute', cadrage.haut < 0.9, String(cadrage.haut));
  ck('aucune des deux n\'a le format de la feuille',
     Math.abs(cadrage.large - cadrage.feuille) > 0.2 && Math.abs(cadrage.haut - cadrage.feuille) > 0.2,
     JSON.stringify(cadrage));
  ck('la page ouverte est signalée', panneau.active === 1, String(panneau.active));
  ck('ouvrir le panneau ne touche pas au travail en cours',
     panneau.apres.objets === panneau.avant.objets && panneau.apres.page === panneau.avant.page
     && panneau.apres.hist === panneau.avant.hist, JSON.stringify(panneau));

  console.log('\n=== fusionner : quatre quadrilatères sur une feuille ===');
  /* Le cas demandé : parallélogramme, rectangle, losange, carré construits
     chacun sur sa page, chacun nommé à partir de A. Réunis, ils ne doivent ni
     se superposer, ni porter deux fois la même lettre. */
  const fusion = await page.evaluate(async () => {
    const app = window.app, s = window.__s;
    const attendre = (ms) => new Promise(r => setTimeout(r, ms));
    const fini = async () => { await attendre(400); app.stopAnimation(); await attendre(150);
      app.replayIndex = null; app.render(); };
    s.neuf();
    let sg = s.seg({x:200,y:500},{x:480,y:500}); app.buildSquare(sg, 340, 400); await fini();
    const nomsCarre = app.entities.filter(e => e.constructor.name === 'Point').map(p => p.label);
    app.ajouterPage(); sg = s.seg({x:200,y:500},{x:520,y:500}); app.buildRhombus(sg, 360, 420); await fini();
    app.ajouterPage(); sg = s.seg({x:200,y:500},{x:460,y:500}); app.buildEquilateralTriangle(sg, 330, 400); await fini();
    app.ajouterPage(); sg = s.seg({x:200,y:500},{x:440,y:500}); app.buildHexagon(sg, 320, 430); await fini();
    const avant = { pages: app.pagesDocument().length, nomsCarre,
                    etapes: app.pagesDocument().length };
    app.fusionnerPages([0, 1, 2, 3]);
    await attendre(200);
    const pts = app.entities.filter(e => e.constructor.name === 'Point');
    const labels = pts.map(p => p.label).filter(Boolean);
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    return { avant, pages: app.pagesDocument().length, pageActive: app.pageActive,
             objets: app.entities.length,
             points: pts.length, labels,
             doublons: labels.filter((l, i) => labels.indexOf(l) !== i),
             etapes: Object.keys(app.stepInstructions).length,
             largeur: Math.round(Math.max(...xs) - Math.min(...xs)),
             hauteur: Math.round(Math.max(...ys) - Math.min(...ys)),
             zoom: +app.view.zoom.toFixed(2) };
  });
  console.log('  ' + JSON.stringify({ ...fusion, labels: fusion.labels.join('') }));
  /* La fusion AJOUTE une page, elle n'en mange aucune : quatre fusionnées en
     donnent cinq. Rien ne se perd, et l'on peut refaire la fusion autrement. */
  ck('les quatre pages d\'origine restent, plus la fusionnée', fusion.pages === 5, String(fusion.pages));
  ck('et c\'est la nouvelle qu\'on regarde', fusion.pageActive === 4, String(fusion.pageActive));
  ck('les quatre figures sont toutes là', fusion.objets > 100 && fusion.points >= 16,
     `${fusion.objets} objets, ${fusion.points} points`);
  ck('AUCUN point ne porte deux fois la même lettre', fusion.doublons.length === 0,
     JSON.stringify(fusion.doublons));
  ck('le premier lot garde ses lettres', fusion.labels.slice(0, 4).join('') === fusion.avant.nomsCarre.join(''),
     `${fusion.labels.slice(0, 4).join('')} vs ${fusion.avant.nomsCarre.join('')}`);
  ck('les figures sont rangées en grille, pas empilées',
     fusion.largeur > 400 && fusion.hauteur > 400, `${fusion.largeur}×${fusion.hauteur}`);
  ck('les consignes des quatre constructions sont conservées', fusion.etapes >= 8, String(fusion.etapes));
  ck('la vue se recule pour tout montrer', fusion.zoom < 1, String(fusion.zoom));

  console.log('\n=== fusionner « figures seules » ===');
  /* Fusionner pour rejouer et fusionner pour composer une feuille ne demandent
     pas la même chose. « Figures seules » retire ce qui a servi À FAIRE la
     figure — instruments, arcs de compas, objets masqués — et pose UNE étape par
     figure, pour les découvrir une par une au tableau. */
  const seules = await page.evaluate(async () => {
    const app = window.app, s = window.__s;
    const attendre = (ms) => new Promise(r => setTimeout(r, ms));
    const fini = async () => { await attendre(400); app.stopAnimation(); await attendre(150);
      app.replayIndex = null; app.render(); };
    const compte = () => { const c = {}; app.entities.forEach(e => c[e.constructor.name] = (c[e.constructor.name] || 0) + 1); return c; };
    const monter = async () => {
      s.neuf();
      let sg = s.seg({x:200,y:500},{x:480,y:500}); app.buildSquare(sg, 340, 400); await fini();
      app.ajouterPage(); sg = s.seg({x:200,y:500},{x:520,y:500}); app.buildRhombus(sg, 360, 420); await fini();
      app.ajouterPage(); sg = s.seg({x:200,y:500},{x:460,y:500}); app.buildEquilateralTriangle(sg, 330, 400); await fini();
      app.ajouterPage(); sg = s.seg({x:200,y:500},{x:440,y:500}); app.buildHexagon(sg, 320, 430); await fini();
    };
    await monter(); app.fusionnerPages([0,1,2,3], false); await attendre(150);
    const avec = { objets: app.entities.length, types: compte(), etapes: app.bornesEtapes().length - 1 };
    await monter(); app.fusionnerPages([0,1,2,3], true); await attendre(150);
    const sans = { objets: app.entities.length, types: compte(), etapes: app.bornesEtapes().length - 1,
                   consignes: Object.values(app.stepInstructions) };
    const vus = [];
    for (let i = 0; i < 4; i++) { app.allerEtape(1);
      vus.push(app.entities.slice(0, app.replayIndex).filter(e => e.constructor.name === 'Point').length); }
    return { avec, sans, vus };
  });
  console.log('  avec construction : ' + JSON.stringify(seules.avec));
  console.log('  figures seules    : ' + JSON.stringify(seules.sans));
  ck('les tracés d\'instruments s\'en vont', !seules.sans.types.ToolAnimation
     && seules.avec.types.ToolAnimation > 20, JSON.stringify(seules.sans.types));
  ck('les figures elles-mêmes restent entières',
     seules.sans.types.Point === seules.avec.types.Point
     && seules.sans.types.Segment === seules.avec.types.Segment,
     `${seules.sans.types.Point}/${seules.sans.types.Segment}`);
  ck('la page s\'allège nettement', seules.sans.objets < seules.avec.objets / 2,
     `${seules.avec.objets} → ${seules.sans.objets}`);
  ck('une étape par figure', seules.sans.etapes === 4, String(seules.sans.etapes));
  ck('et elles se découvrent une par une',
     JSON.stringify(seules.vus) === JSON.stringify([...seules.vus].sort((a, b) => a - b))
     && seules.vus[0] < seules.vus[3], JSON.stringify(seules.vus));
  ck('les consignes disent ce qui est vrai',
     seules.sans.consignes.every(c => /^Figure \d+ sur 4$/.test(c)), JSON.stringify(seules.sans.consignes));

  /* Un cercle entier tracé au compas est un RÉSULTAT, pas une trace : le cercle
     circonscrit ne doit pas disparaître avec les arcs de construction. */
  const rescape = await page.evaluate(async () => {
    const app = window.app, s = window.__s;
    const attendre = (ms) => new Promise(r => setTimeout(r, ms));
    s.neuf();
    const A = app.createPointAt(300, 560), B = app.createPointAt(700, 520), C = app.createPointAt(480, 240);
    s.seg({x:300,y:560},{x:700,y:520}); s.seg({x:700,y:520},{x:480,y:240}); s.seg({x:480,y:240},{x:300,y:560});
    app.buildCircumscribedCircle(A, B, C);
    await attendre(400); app.stopAnimation(); await attendre(150); app.replayIndex = null;
    app.ajouterPage(); const sg = s.seg({x:200,y:500},{x:480,y:500}); app.buildSquare(sg, 340, 400);
    await attendre(400); app.stopAnimation(); await attendre(150); app.replayIndex = null;
    app.fusionnerPages([0, 1], true); await attendre(150);
    const arcs = app.entities.filter(e => e.constructor.name === 'CompassArc');
    return arcs.map(a => +(Math.abs(a.endAngle - a.startAngle) / Math.PI).toFixed(2));
  });
  console.log('  arcs survivants (en demi-tours) : ' + JSON.stringify(rescape));
  ck('le cercle circonscrit survit à l\'allègement',
     rescape.length === 1 && rescape[0] > 1.99, JSON.stringify(rescape));

  console.log('\n=== le PDF sort en un seul document, dans l\'ordre ===');
  const pdf = await page.evaluate(async () => {
    const app = window.app, s = window.__s;
    s.neuf();
    s.seg({x:200,y:250},{x:600,y:250});                 // large et plat
    app.ajouterPage(); s.seg({x:200,y:200},{x:400,y:700});   // haut et étroit
    app.ajouterPage(); s.seg({x:100,y:100},{x:900,y:200});   // très large
    app.allerPage(1);                                    // on exporte depuis la 2e
    window.gmEnsurePdfLibs();
    let blob = null; const vrai = URL.createObjectURL;
    URL.createObjectURL = function (x) { if (x instanceof Blob) blob = x; return vrai.call(URL, x); };
    await app.exportPDF(false, 'text');
    URL.createObjectURL = vrai;
    if (!blob) return { err: 'pas de fichier' };
    const buf = new Uint8Array(await blob.arrayBuffer());
    let f = ''; for (let i = 0; i < buf.length; i++) f += String.fromCharCode(buf[i]);
    return { pages: (f.match(/\/Type\s*\/Page[^s]/g) || []).length,
             formats: [...f.matchAll(/\/MediaBox\s*\[([^\]]+)\]/g)].map(m => m[1].trim()),
             revenue: app.pageActive, objetsIci: app.entities.length };
  });
  console.log('  ' + JSON.stringify(pdf));
  ck('trois feuilles dans le PDF', pdf.pages === 3, String(pdf.pages));
  ck('chacune au format de sa figure, dans l\'ordre des pages',
     /520/.test(pdf.formats[0] || '') && /320/.test(pdf.formats[1] || '') && /920/.test(pdf.formats[2] || ''),
     JSON.stringify(pdf.formats));
  ck('exporter ne déplace pas le travail', pdf.revenue === 1 && pdf.objetsIci === 3, JSON.stringify(pdf));

  console.log('\n=== la bibliothèque ===');
  const bib = await page.evaluate(async () => {
    const app = window.app, s = window.__s;
    localStorage.removeItem('gm_biblio');
    s.neuf(); s.seg({x:200,y:250},{x:600,y:250});
    app.ajouterPage(); s.seg({x:200,y:400},{x:500,y:400});
    app.projectTitle = 'Séance 1 — symétries';
    app.enregistrerDansBiblio();
    const l = app.lireBiblio();
    s.neuf(); s.seg({x:100,y:100},{x:800,y:700});
    app.projectTitle = 'Séance 2 — Thalès';
    app.enregistrerDansBiblio();
    return { n: l.length, nom: l[0] && l[0].n, pages: l[0] && l[0].p,
             vignette: !!(l[0] && String(l[0].v).startsWith('data:image/jpeg')),
             poids: l[0] && l[0].v ? l[0].v.length : 0,
             noms: app.lireBiblio().map(e => e.n) };
  });
  console.log('  ' + JSON.stringify(bib));
  ck('la séance est rangée avec son nombre de pages', bib.n === 1 && bib.pages === 2, JSON.stringify(bib));
  ck('et avec une vignette légère', bib.vignette && bib.poids < 12000, bib.poids + ' octets');
  ck('deux séances cohabitent', bib.noms.length === 2, JSON.stringify(bib.noms));

  const rouvre = await page.evaluate(async () => {
    const app = window.app, s = window.__s;
    s.neuf();
    app.ouvrirBiblio();
    const cartes = [...document.querySelectorAll('#biblioListe .biblio-carte')];
    const cible = cartes.find(c => /Séance 1/.test(c.textContent));
    if (!cible) return { err: 'carte introuvable' };
    cible.click();
    await new Promise(r => setTimeout(r, 200));
    app.allerPage(1);
    return { cartes: cartes.length, titre: app.projectTitle, pages: app.pagesDocument().length,
             page2: app.entities.length,
             modale: getComputedStyle(document.getElementById('biblioModal')).display };
  });
  console.log('  ' + JSON.stringify(rouvre));
  ck('un clic rouvre la séance entière', rouvre.titre === 'Séance 1 — symétries'
     && rouvre.pages === 2 && rouvre.page2 === 3, JSON.stringify(rouvre));
  ck('et referme la bibliothèque', rouvre.modale === 'none');

  /* Une bibliothèque vide n'apprend rien. Les exemples sont fabriqués par les
     bâtisseurs du logiciel : chacun doit donc porter de VRAIS instruments et de
     vraies étapes, pas une figure posée à plat. */
  console.log('\n=== les constructions d\'exemple ===');
  const exemples = await page.evaluate(async () => {
    const app = window.app;
    const liste = window.GM_EXEMPLES || [];
    const out = [];
    for (const e of liste) {
      const code = app.codeExemple(e);
      if (!code) { out.push({ n: e.n, err: 'code vide' }); continue; }
      app.ouvrirSeance(code, e.n, true);
      await new Promise(r => setTimeout(r, 120));
      const anims = app.entities.filter(x => x.constructor.name === 'ToolAnimation');
      out.push({ n: e.n, objets: app.entities.length, pages: app.pagesDocument().length,
                 etapes: app.bornesEtapes().length - 1,
                 outils: [...new Set(anims.map(a => a.widgetType))].filter(t => !/Hide/.test(t)) });
    }
    return out;
  });
  exemples.forEach(e => console.log(`  ${e.n} — ${e.objets} objets, ${e.etapes} étapes, ${(e.outils||[]).join(' ')}`));
  ck('la bibliothèque n\'est pas vide au premier lancement', exemples.length >= 8, String(exemples.length));
  ck('chaque exemple s\'ouvre', exemples.every(e => !e.err && e.objets > 5), JSON.stringify(exemples.filter(e => e.err || e.objets <= 5)));
  ck('chacun est une vraie construction aux instruments',
     exemples.every(e => (e.outils || []).includes('compass')),
     JSON.stringify(exemples.filter(e => !(e.outils || []).includes('compass')).map(e => e.n)));
  ck('et se rejoue en plusieurs étapes', exemples.every(e => e.etapes >= 2),
     JSON.stringify(exemples.map(e => e.etapes)));
  ck('l\'une d\'elles est une séance de plusieurs pages',
     exemples.some(e => e.pages > 1), JSON.stringify(exemples.map(e => e.pages)));
  const cartes = await page.evaluate(() => {
    localStorage.removeItem('gm_biblio');
    window.app.ouvrirBiblio();
    const c = [...document.querySelectorAll('#biblioListe .biblio-exemple')];
    document.getElementById('biblioModal').style.display = 'none';
    return { n: c.length, sansCroix: c.every(x => !x.querySelector('.biblio-sup')) };
  });
  ck('elles s\'affichent même quand la collection est vide', cartes.n === exemples.length, String(cartes.n));
  ck('et ne se suppriment pas : elles font partie du logiciel', cartes.sansCroix === true);

  const collec = await page.evaluate(() => {
    const app = window.app;
    // la collection a été vidée juste au-dessus : on y remet une séance
    app.projectTitle = 'Séance à exporter';
    app.enregistrerDansBiblio();
    let blob = null; const vrai = URL.createObjectURL;
    URL.createObjectURL = function (x) { if (x instanceof Blob) blob = x; return vrai.call(URL, x); };
    app.exporterBiblio(); URL.createObjectURL = vrai;
    return blob ? blob.size : 0;
  });
  ck('la collection s\'exporte en un fichier', collec > 100, collec + ' octets');

  console.log('\n=== dupliquer une page ===');
  /* Le « + » crée une page VIDE : pour trois variantes du même triangle il
     fallait tout retracer. La copie se pose juste après son original, et l'on
     reste où l'on est. */
  const copie = await page.evaluate(() => {
    const app = window.app, s = window.__s;
    s.neuf();
    s.seg({x:200,y:250},{x:600,y:250});                    // page 1 : un segment
    app.ajouterPage(); s.seg({x:200,y:300},{x:500,y:300});
    s.seg({x:200,y:400},{x:500,y:400});                    // page 2 : deux segments
    app.ajouterPage(); s.seg({x:300,y:300},{x:700,y:600});  // page 3
    app.allerPage(1);
    const avant = app.pagesDocument().slice();
    app.pagesChoisies = new Set();
    app.dupliquerChoix();                                   // sans case cochée : la page ouverte
    const apres = app.pagesDocument().slice();
    const surPlace = { page: app.pageActive, objets: app.entities.length };
    // deux pages cochées à la fois
    app.pagesChoisies = new Set([0, 3]);
    app.dupliquerChoix();
    const enfin = app.pagesDocument().slice();
    return { avant: avant.length, apres: apres.length, enfin: enfin.length,
             copieJusteApres: apres[2] === avant[1],
             originauxIntacts: apres[0] === avant[0] && apres[3] === avant[2],
             surPlace,
             pairs: [enfin[0] === enfin[1], enfin[4] === enfin[5]],
             pageApres: app.pageActive };
  });
  console.log('  ' + JSON.stringify(copie));
  ck('une page de plus', copie.apres === copie.avant + 1, `${copie.avant} → ${copie.apres}`);
  ck('la copie se pose juste après son original', copie.copieJusteApres);
  ck('les autres pages ne bougent pas', copie.originauxIntacts);
  ck('on reste sur sa page, avec sa figure',
     copie.surPlace.page === 1 && copie.surPlace.objets === 6, JSON.stringify(copie.surPlace));
  ck('deux pages cochées font deux copies', copie.enfin === copie.apres + 2,
     `${copie.apres} → ${copie.enfin}`);
  ck('chacune est bien collée à la sienne', copie.pairs[0] && copie.pairs[1], JSON.stringify(copie.pairs));
  /* La page ouverte était la 2e ; une copie s'est insérée avant elle, son rang
     doit suivre — sinon on se retrouverait à travailler sur une autre page. */
  ck('le rang de la page ouverte a suivi le décalage', copie.pageApres === 2, String(copie.pageApres));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
