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
        this.ev('pointerup', c, 0); app.setTool('select'); },
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

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
