// LA FIGURE VOYAGE-T-ELLE ENTIÈRE ? Quatre chemins la font sortir du logiciel
// et y revenir : le fichier .json, le code compact du document, le lien élève,
// et la bibliothèque. Ils n'écrivent pas la même chose, et c'est là que des
// champs se perdent en silence — le nom d'une droite, le codage d'un milieu,
// et l'énoncé lui-même, qui disparaissait de tout ce qui n'était pas le .json.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d !== undefined ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  /* Une figure qui met en jeu tout ce qui se transporte : une droite NOMMÉE,
     un milieu CODÉ, un segment codé, un polygone REMPLI, des angles, et un
     énoncé de plusieurs lignes dont une « aux instruments ». */
  const ENONCE = [
    'Trace une droite d',
    'Trace un segment [AB] de 6 cm',
    'Place son milieu I',
    'Trace un triangle EFG tel que EF = 5 cm, E = 30° et F = 40°',
    'Colorie le triangle EFG',
    'Trace un trapèze KLMN',
  ];

  const empreinte = () => page.evaluate(() => {
    const app = window.app;
    const f = (n) => Math.round(n * 100) / 100;
    return {
      n: app.entities.length,
      droites: app.entities.filter(e => e.nomDroite).map(e => e.nomDroite).sort(),
      milieux: app.entities.filter(e => e.constructor.name === 'Point' && e.codageMilieu)
        .map(e => e.codageMilieu).sort(),
      codages: app.entities.filter(e => e.constructor.name === 'Segment' && e.coding)
        .map(e => e.coding).sort(),
      remplis: app.entities.filter(e => e.constructor.name === 'Polygon'
        && e.fillMode && e.fillMode !== 'none').length,
      angles: app.entities.filter(e => e.constructor.name === 'Angle').length,
      pts: app.entities.filter(e => e.constructor.name === 'Point' && e.label)
        .map(e => `${e.label}:${f(e.x)},${f(e.y)}`).sort().join('|'),
      consignes: (app.consignesListe() || []).filter(c => (c.texte || '').trim())
        .map(c => c.texte),
      instruments: (app.consignesListe() || []).filter(c => (c.texte || '').trim())
        .map(c => c.instruments ? 1 : 0).join(''),
      faites: (app.consignesListe() || []).filter(c => (c.texte || '').trim())
        .map(c => c.faite ? 1 : 0).join(''),
      etapes: Object.keys(app.stepInstructions || {}).length,
    };
  });

  const neuf = () => page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.historyFuture = [];
    app.stepInstructions = {}; app._consignes = []; app._cslSujet = null;
    if (app.cslOublier) app.cslOublier();
    if (app.majConsignes) app.majConsignes();
    app.view = { x: 0, y: 0, zoom: 1 };
    app.render();
  });

  console.log('\n=== la figure de départ ===');
  await neuf();
  await page.evaluate((ph) => {
    const app = window.app;
    ph.forEach((s, k) => {
      const i = app.ajouterConsigne(s);
      // une ligne sur deux se construit aux instruments
      app.consignesListe()[i].instruments = (k === 1);
      app.validerConsigne(i);
    });
    app.isPlaying = false; app.isToolAnimating = false;
    app.render();
  }, ENONCE);
  const depart = await empreinte();
  console.log('  ' + JSON.stringify({ n: depart.n, droites: depart.droites, milieux: depart.milieux,
    codages: depart.codages, remplis: depart.remplis, consignes: depart.consignes.length,
    instruments: depart.instruments }));
  ck('la droite d porte son nom', depart.droites.join(',') === 'd', depart.droites.join(','));
  ck('le milieu est codé', depart.milieux.length === 1, JSON.stringify(depart.milieux));
  ck('le triangle est rempli', depart.remplis >= 1, String(depart.remplis));
  ck('l\'énoncé compte six lignes', depart.consignes.length === 6, String(depart.consignes.length));
  ck('dont une aux instruments', depart.instruments === '010000', depart.instruments);

  const compare = (quoi, apres, champs) => {
    champs.forEach(c => {
      const a = JSON.stringify(depart[c]), z = JSON.stringify(apres[c]);
      ck(`${quoi} : ${c}`, a === z, a === z ? undefined : `${a} ≠ ${z}`);
    });
  };

  /* ---- 1. LE FICHIER .json : « Sauvegarder » puis « Ouvrir » ---------- */
  console.log('\n=== le fichier .json ===');
  const fichier = await page.evaluate(() => {
    const app = window.app;
    const instr = document.getElementById('instrContent');
    return JSON.stringify({
      title: app.projectTitle,
      data: app.serialize(),
      instructions: { html: instr ? instr.innerHTML : '', visible: true,
                      lignes: app.consignesListe().filter(c => (c.texte || '').trim()) },
      chapters: app.chapters || [],
      stepInstructions: app.stepInstructions || {},
      background: app.serializeBackground(),
    });
  });
  await neuf();
  await page.evaluate((json) => {
    const app = window.app;
    const c = JSON.parse(json);
    app.projectTitle = c.title;
    app._consignes = (c.instructions.lignes || []).map(x => Object.assign(app.consigneNeuve(), x));
    app.majConsignes();
    app.entities = app.deserialize(c.data);
    app.stepInstructions = c.stepInstructions || {};
    app.render();
  }, fichier);
  compare('fichier', await empreinte(),
    ['n', 'droites', 'milieux', 'codages', 'remplis', 'angles', 'pts',
     'consignes', 'instruments', 'faites', 'etapes']);

  /* ---- 2. LE CODE COMPACT : bibliothèque, pages ---------------------- */
  console.log('\n=== le code compact (bibliothèque, pages) ===');
  await neuf();
  await page.evaluate((ph) => {
    const app = window.app;
    ph.forEach((s, k) => { const i = app.ajouterConsigne(s);
      app.consignesListe()[i].instruments = (k === 1); app.validerConsigne(i); });
    app.isPlaying = false; app.isToolAnimating = false;
  }, ENONCE);
  const code = await page.evaluate(() => window.app.codeDocument());
  await neuf();
  await page.evaluate((c) => { window.app.chargerDocument(c); window.app.isPlaying = false; }, code);
  compare('code', await empreinte(),
    ['n', 'droites', 'milieux', 'codages', 'remplis', 'angles', 'pts',
     'consignes', 'instruments', 'faites', 'etapes']);

  /* ---- 3. LE LIEN ÉLÈVE ---------------------------------------------- */
  console.log('\n=== le lien élève ===');
  const lien = await page.evaluate(() => {
    const app = window.app;
    try { return app.lienDePartage ? app.lienDePartage('eleve') : null; } catch (e) { return 'ERREUR ' + e.message; }
  });
  ck('un lien est fabriqué', typeof lien === 'string' && lien.length > 40,
     typeof lien === 'string' ? `${lien.length} caractères` : String(lien));
  if (typeof lien === 'string' && lien.indexOf('fig=') >= 0) {
    const dedans = decodeURIComponent(lien.split('fig=')[1].split('&')[0]);
    await neuf();
    await page.evaluate((c) => { window.app.chargerDocument(c); window.app.isPlaying = false; }, dedans);
    compare('lien', await empreinte(),
      ['n', 'droites', 'milieux', 'codages', 'remplis', 'angles', 'pts', 'consignes']);
  }

  /* ---- 4. LA BIBLIOTHÈQUE : ranger, rouvrir -------------------------- */
  console.log('\n=== la bibliothèque ===');
  await neuf();
  await page.evaluate((ph) => {
    const app = window.app;
    ph.forEach((s, k) => { const i = app.ajouterConsigne(s);
      app.consignesListe()[i].instruments = (k === 1); app.validerConsigne(i); });
    app.isPlaying = false; app.isToolAnimating = false;
    app.projectTitle = 'Séance du voyage';
    localStorage.removeItem('gm_biblio');
    app.enregistrerDansBiblio();
  }, ENONCE);
  await page.waitForTimeout(300);
  const range = await page.evaluate(() => {
    const app = window.app;
    const l = app.lireBiblio();
    return { n: l.length, nom: l[0] && l[0].n, vignette: !!(l[0] && l[0].v && l[0].v.length > 200) };
  });
  ck('la séance est rangée', range.n === 1 && range.nom === 'Séance du voyage', JSON.stringify(range));
  ck('avec sa vignette', range.vignette === true);
  await neuf();
  await page.evaluate(() => {
    const app = window.app;
    const l = app.lireBiblio();
    app.ouvrirSeance(l[0].c, l[0].n);
    app.isPlaying = false;
  });
  compare('bibliothèque', await empreinte(),
    ['n', 'droites', 'milieux', 'codages', 'remplis', 'angles', 'pts', 'consignes']);
  await page.evaluate(() => localStorage.removeItem('gm_biblio'));

  /* ---- 5. UN CODE SANS ÉNONCÉ ---------------------------------------
     Un lien d'avant n'a pas de bloc CONSIGNES — et une figure sans énoncé
     n'en a pas non plus. Dans les deux cas elle doit s'ouvrir, et CHASSER
     l'énoncé de la figure précédente : un énoncé qui ne parle pas de ce
     qu'on regarde est pire que pas d'énoncé du tout. */
  console.log('\n=== une figure sans énoncé ===');
  const sansCsl = await page.evaluate(() => {
    const app = window.app;
    const garde = app._consignes;
    app._consignes = [];
    const c = app.codeDocument();
    app._consignes = garde;
    return c;
  });
  const bascule = await page.evaluate(([avec, sans]) => {
    const app = window.app;
    let ok = true;
    app.chargerDocument(avec);
    const enonce = (app.consignesListe() || []).filter(x => (x.texte || '').trim()).length;
    const objets1 = app.entities.length;
    try { app.chargerDocument(sans); } catch (e) { ok = false; }
    return { ok, enonce, objets1, objets2: app.entities.length,
             apres: (app.consignesListe() || []).filter(x => (x.texte || '').trim()).length };
  }, [code, sansCsl]);
  ck('elle s\'ouvre sans rien casser', bascule.ok && bascule.objets2 > 0, JSON.stringify(bascule));
  ck('la figure est la même', bascule.objets1 === bascule.objets2,
     `${bascule.objets1} / ${bascule.objets2}`);
  ck('et elle chasse l\'énoncé d\'avant', bascule.enonce > 0 && bascule.apres === 0,
     `${bascule.enonce} → ${bascule.apres}`);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
