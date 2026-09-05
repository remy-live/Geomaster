// La fiche de construction : les étapes numérotées, chacune avec sa consigne et
// l'image de la figure à cette étape-là, sur une feuille A4 qu'on imprime.
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
  await page.goto(PAGE); await page.waitForTimeout(1400);

  // une médiatrice construite par le logiciel : elle pose ses propres consignes
  const poser = (consignesEnPlus) => page.evaluate(async (consignesEnPlus) => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const ev = (t, s, bt) => { (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, {
      pointerId: 3, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
      clientX: s.x + rc.left, clientY: s.y + rc.top, bubbles: true, cancelable: true })); };
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    app.view = { x: 0, y: 0, zoom: 1 };
    app.setTool('segment');
    ev('pointerdown', { x: 300, y: 400 }, 1);
    for (let i = 1; i <= 6; i++) ev('pointermove', { x: 300 + 300 * i / 6, y: 400 }, 1);
    ev('pointerup', { x: 600, y: 400 }, 0);
    app.setTool('select');
    const seg = app.entities.find(e => e.constructor.name === 'Segment');
    app.buildMediatrice(seg, 450, 500, seg.p1, seg.p2);
    await new Promise(r => setTimeout(r, 400));
    app.isPlaying = false; app.isToolAnimating = false; app.isLooping = false;
    const n = app.entities.length;
    /* Des index DISTINCTS, dans la figure, et qui ne retombent pas sur ceux que
       le bâtisseur a déjà posés : sans quoi deux consignes se partagent une
       étape et la fiche a une image de moins que de consignes — un défaut du
       test, pas de la fiche. */
    let pose = 0;
    for (let i = 1; i < n && pose < consignesEnPlus; i++) {
      if (app.stepInstructions[i] !== undefined) continue;
      app.stepInstructions[i] =
        'On reporte la longueur au compas, puis on trace à la règle en passant par les deux points obtenus.';
      pose++;
      i++;   // on saute une entité pour espacer les étapes
    }
    app.replayIndex = n;
    app.projectTitle = 'Médiatrice';
    return { etapes: Object.keys(app.stepInstructions).length, objets: n };
  }, consignesEnPlus);

  const sortir = () => page.evaluate(async () => {
    const app = window.app;
    let blob = null; const vrai = URL.createObjectURL;
    URL.createObjectURL = function (x) { if (x instanceof Blob) blob = x; return vrai.call(URL, x); };
    await app.ficheConstruction();
    URL.createObjectURL = vrai;
    if (!blob) return { err: 'pas de fichier' };
    const buf = new Uint8Array(await blob.arrayBuffer());
    let f = ''; for (let i = 0; i < buf.length; i++) f += String.fromCharCode(buf[i]);
    return { octets: buf.length,
             pages: (f.match(/\/Type\s*\/Page[^s]/g) || []).length,
             format: ((f.match(/\/MediaBox\s*\[([^\]]+)\]/) || [])[1] || '').trim(),
             images: (f.match(/\/Subtype\s*\/Image/g) || []).length,
             // l'état du travail après coup : exporter ne doit rien déplacer
             idx: app.replayIndex, objets: app.entities.length, grille: app.gridMode };
  });

  console.log('\n=== une médiatrice, deux étapes ===');
  const a = await poser(0);
  ck('la construction a posé ses consignes', a.etapes === 2, String(a.etapes));
  const f1 = await sortir();
  console.log('  ' + JSON.stringify(f1));
  ck('une feuille sort', !f1.err && f1.pages === 1, String(f1.pages));
  ck('au format A4 portrait', /595/.test(f1.format) && /841/.test(f1.format), f1.format);
  /* Une image par étape, plus la figure terminée en haut : on sait où l'on va
     avant de partir. */
  ck('deux étapes et la figure terminée : trois images', f1.images === 3, String(f1.images));
  ck('exporter ne déplace pas le travail',
     f1.idx === a.objets && f1.objets === a.objets, `${f1.idx} / ${f1.objets}`);
  ck('le quadrillage est revenu comme il était', f1.grille === 0, String(f1.grille));

  console.log('\n=== neuf étapes : la feuille se tourne ===');
  const c = await poser(7);
  ck('assez de consignes pour déborder', c.etapes >= 8, String(c.etapes));
  const f2 = await sortir();
  console.log('  ' + JSON.stringify(f2));
  ck('plusieurs feuilles', f2.pages >= 2, String(f2.pages));
  ck('une image par étape, plus la figure terminée',
     f2.images === c.etapes + 1, `${f2.images} images pour ${c.etapes} étapes`);

  console.log('\n=== sans consignes, elle le dit ===');
  /* Une fiche sans étapes n'a rien à montrer : autant dire où on les pose
     plutôt que sortir une feuille vide. */
  const vide = await page.evaluate(async () => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    let blob = null; const vrai = URL.createObjectURL;
    URL.createObjectURL = function (x) { if (x instanceof Blob) blob = x; return vrai.call(URL, x); };
    await app.ficheConstruction();
    URL.createObjectURL = vrai;
    const t = document.getElementById('toast-notification');
    return { fichier: !!blob, message: t ? (t.innerText || '').trim() : '' };
  });
  console.log('  ' + JSON.stringify(vide));
  ck('aucun fichier n\'est produit', vide.fichier === false);
  ck('le message dit où poser une consigne', /Étape|consigne/i.test(vide.message), vide.message);

  console.log('\n=== le menu fichier dit ce qu\'il fait ===');
  /* Quinze icônes muettes, dont deux « </> » identiques pour deux commandes
     différentes. Les libellés n'étaient affichés qu'au doigt. */
  const menu = await page.evaluate(() => {
    const d = document.querySelector('.header-dropdown-content.grid-3-cols');
    d.style.display = 'grid';
    /* Le nom n'est plus écrit SOUS l'icône — quinze libellés faisaient un menu
       de six cents pixels de haut — mais il doit rester lisible quelque part :
       c'est l'info-bulle, comme partout ailleurs dans le logiciel. */
    const btns = [...d.querySelectorAll('.icon-btn[data-libelle]')];
    const sansNom = btns.filter(b => {
      const n = (b.getAttribute('data-tooltip') || b.getAttribute('aria-label') || '').trim();
      return n.length < 3;
    }).map(b => b.dataset.libelle);
    return { boutons: btns.length, sansNom,
             titres: [...d.querySelectorAll('.menu-titre')].map(t => t.textContent),
             fiche: !!d.querySelector('[onclick="app.ouvrirComposeurFiche()"]'),
             avecPDF: !!d.querySelector('[onclick="app.requestExport(\'pdf\')"]') };
  });
  console.log('  ' + JSON.stringify(menu));
  ck('chaque icône se nomme au survol', menu.sansNom.length === 0, menu.sansNom.join(', '));
  /* Quatre bandes : le document, ce qu'on en sort, ce qu'on transmet, ce qu'on
     enregistre. Les intitulés ne s'affichent plus — ils sont devenus les
     filets qui séparent les bandes — mais ils restent dans le DOM. */
  ck('quatre intitulés au lieu de quatre traits', menu.titres.length === 4, menu.titres.join(' / '));
  ck('la fiche est là, avec les autres sorties', menu.fiche && menu.avecPDF);

  console.log('\n=== le composeur ===');
  await poser(4);
  const comp = await page.evaluate(async () => {
    const app = window.app;
    app.ouvrirComposeurFiche();
    await new Promise(r => setTimeout(r, 1500));
    return { ouvert: document.getElementById('ficheModal').style.display,
             lignes: document.querySelectorAll('#ficheListe .fiche-etape').length,
             feuilles: document.querySelectorAll('#ficheApercu canvas').length,
             etapes: app.ficheItems.length };
  });
  console.log('  ' + JSON.stringify(comp));
  ck('il s\'ouvre avec une ligne par étape',
     comp.ouvert === 'flex' && comp.lignes === comp.etapes, JSON.stringify(comp));
  /* L'aperçu N'EST PAS une imitation : c'est le PDF lui-même, relu par pdf.js.
     Il ne peut donc pas différer de ce qui sortira. */
  ck('l\'aperçu montre les feuilles du vrai PDF', comp.feuilles >= 1, String(comp.feuilles));

  const jeux = await page.evaluate(async () => {
    const app = window.app;
    const attendre = () => new Promise(r => setTimeout(r, 900));
    const res = {};
    for (const d of ['liste', 'tableau', 'images', 'texte']) {
      app.reglerFiche('dispo', d);
      await attendre();
      const pdf = await app.composerFichePDF(app.ficheItems, app.ficheFinale);
      const f = pdf.output('datauristring');
      res[d] = { feuilles: pdf.getNumberOfPages(),
                 select: document.getElementById('ficheDispo').value,
                 colonnesGrisees: document.getElementById('ficheLabelCols').classList.contains('inactif') };
    }
    return res;
  });
  console.log('  ' + JSON.stringify(jeux));
  ck('les quatre dispositions composent une feuille',
     ['liste', 'tableau', 'images', 'texte'].every(d => jeux[d].feuilles >= 1), JSON.stringify(jeux));
  ck('le menu suit l\'état', jeux.texte.select === 'texte', jeux.texte.select);
  /* Les colonnes ne veulent rien dire pour une liste ou un texte : le réglage
     s'éteint au lieu de mentir. */
  ck('les colonnes ne s\'offrent que là où elles servent',
     jeux.liste.colonnesGrisees && jeux.texte.colonnesGrisees
     && !jeux.tableau.colonnesGrisees && !jeux.images.colonnesGrisees, JSON.stringify(jeux));

  console.log('\n=== choisir, ranger, réécrire ===');
  const choix = await page.evaluate(async () => {
    const app = window.app;
    app.reglerFiche('dispo', 'liste');
    await new Promise(r => setTimeout(r, 600));
    const n = app.ficheItems.length;
    // décocher deux étapes
    document.querySelectorAll('#ficheListe .fiche-etape input[type=checkbox]')[0].click();
    document.querySelectorAll('#ficheListe .fiche-etape input[type=checkbox]')[1].click();
    const gardees = app.ficheItems.filter(i => i.actif !== false).length;
    // ranger : la dernière passe en tête
    const dernier = app.ficheItems[n - 1].cle;
    app.deplacerEtapeFiche(n - 1, 0);
    const enTete = app.ficheItems[0].cle;
    // réécrire une consigne : elle change AUSSI dans la figure
    const cle = app.ficheItems[2].cle;
    const zone = document.querySelectorAll('#ficheListe .fiche-etape textarea')[2];
    zone.value = 'Trace le cercle de centre A.';
    zone.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 800));
    const pdf = await app.composerFichePDF(app.ficheItems, app.ficheFinale);
    return { n, gardees, dernier, enTete, cle,
             consigne: app.stepInstructions[cle],
             ordreConstruction: Object.keys(app.stepInstructions).map(Number).sort((a, b) => a - b),
             feuilles: pdf.getNumberOfPages() };
  });
  console.log('  ' + JSON.stringify(choix));
  ck('décocher retire l\'étape de la fiche', choix.gardees === choix.n - 2,
     `${choix.gardees} sur ${choix.n}`);
  ck('tirer une ligne la range ailleurs', choix.enTete === choix.dernier,
     `${choix.enTete} en tête, ${choix.dernier} attendu`);
  /* Une seule vérité : la consigne réécrite pour la fiche est celle de l'étape,
     donc celle que la classe entendra au rejeu. */
  ck('réécrire la consigne la change aussi dans la figure',
     choix.consigne === 'Trace le cercle de centre A.', choix.consigne);
  /* Mais l'ordre de la CONSTRUCTION ne bouge pas : le changer casserait la
     figure — les objets ne peuvent pas exister avant ceux dont ils dépendent. */
  ck('ranger la fiche ne touche pas à l\'ordre de la construction',
     JSON.stringify(choix.ordreConstruction)
       === JSON.stringify(choix.ordreConstruction.slice().sort((a, b) => a - b)),
     JSON.stringify(choix.ordreConstruction));

  const enreg = await page.evaluate(async () => {
    const app = window.app;
    let blob = null; const vrai = URL.createObjectURL;
    URL.createObjectURL = function (x) { if (x instanceof Blob) blob = x; return vrai.call(URL, x); };
    await app.enregistrerFiche();
    URL.createObjectURL = vrai;
    return { octets: blob ? blob.size : 0,
             ferme: document.getElementById('ficheModal').style.display };
  });
  console.log('  ' + JSON.stringify(enreg));
  ck('« Enregistrer » sort le fichier et referme', enreg.octets > 1000 && enreg.ferme === 'none',
     JSON.stringify(enreg));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
