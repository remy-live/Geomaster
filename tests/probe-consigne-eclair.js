// La consigne éclair : une phrase, tracée tout de suite, sans ouvrir le panneau.
// Le panneau des consignes prend 46 % d'un écran de téléphone — la bonne place
// pour composer un énoncé de vingt lignes, beaucoup trop pour en écrire une.
// Cette sonde vérifie les trois choses qui comptent : qu'elle marche sur les
// trois appareils, que la phrase se range QUAND MÊME avec la figure, et qu'elle
// ne fait pas doublon avec la loupe.
const { chromium, devices } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const errs = [];
  const ouvrir = async (W, H, tactile) => {
    const ctx = await b.newContext(tactile
      ? { viewport: { width: W, height: H }, hasTouch: true, isMobile: true,
          userAgent: devices['iPhone 13'].userAgent }
      : { viewport: { width: W, height: H } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(PAGE); await p.waitForTimeout(1500);
    return { ctx, p };
  };

  console.log('\n=== sur les trois appareils, une phrase suffit ===');
  for (const [W, H, nom, tactile] of [[1440, 900, 'ordinateur', false],
                                      [820, 1180, 'tablette', true],
                                      [390, 844, 'téléphone', true]]) {
    const { ctx, p } = await ouvrir(W, H, tactile);
    /* Le bouton doit être atteignable SANS passer par la grille des commandes :
       il est en tête de bande, comme la loupe. */
    const bt = await p.evaluate(() => {
      const e = document.getElementById('btnConsigneEclair');
      const b = e.getBoundingClientRect();
      return { visible: getComputedStyle(e).display !== 'none',
               dansEcran: b.right <= innerWidth + 1 && b.left >= -1,
               taille: [Math.round(b.width), Math.round(b.height)] };
    });
    ck(`${nom} : le bouton est à l'écran sans rien déplier`,
       bt.visible && bt.dansEcran, JSON.stringify(bt));
    await p.locator('#btnConsigneEclair').click(); await p.waitForTimeout(300);
    const place = await p.evaluate(() => {
      const bo = document.getElementById('ceBoite').getBoundingClientRect();
      const pan = document.getElementById('instructionBox');
      return { part: Math.round(100 * bo.width * bo.height / (innerWidth * innerHeight)),
               deborde: bo.left < -1 || bo.right > innerWidth + 1,
               panneau: getComputedStyle(pan).display !== 'none',
               focus: document.activeElement.id };
    });
    ck(`  elle tient dans l'écran et laisse le panneau fermé`,
       !place.deborde && !place.panneau, JSON.stringify(place));
    ck('  le curseur y est déjà : on écrit sans viser',
       place.focus === 'ceChamp', place.focus);
    await p.fill('#ceChamp', 'Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm');
    await p.click('#ceGo'); await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const c = window.app.consignesListe()[0] || {};
      return { objets: window.app.entities.length, texte: c.texte || '', faite: !!c.faite,
               champ: document.getElementById('ceChamp').value,
               ouverte: document.getElementById('consigneEclair').classList.contains('ouvert'),
               reponse: document.getElementById('ceReponse').textContent };
    });
    ck('  la figure est tracée', r.objets > 3, String(r.objets));
    /* LE POINT CAPITAL : la phrase se range dans la liste des consignes. Sans
       cela on aurait une figure sans son énoncé, et le lien élève arriverait
       muet — l'énoncé voyage avec la figure, c'est acquis depuis longtemps. */
    ck('  la phrase est rangée avec la figure, et marquée faite',
       /triangle ABC/.test(r.texte) && r.faite, JSON.stringify(r.texte.slice(0, 40)));
    ck('  la réponse est affichée sur place', /✓/.test(r.reponse), JSON.stringify(r.reponse));
    /* Réussie, la ligne se vide et reste ouverte : on enchaîne. */
    ck('  le champ est vidé et la ligne reste ouverte',
       r.champ === '' && r.ouverte, JSON.stringify({ champ: r.champ, ouverte: r.ouverte }));
    if (nom === 'téléphone') {
      const cmp = await p.evaluate(() => {
        const app = window.app;
        app.fermerConsigneEclair();
        app.toggleInstructions();
        const pan = document.getElementById('instructionBox').getBoundingClientRect();
        const pp = Math.round(100 * pan.width * pan.height / (innerWidth * innerHeight));
        app.toggleInstructions();
        app.ouvrirConsigneEclair();
        const ec = document.getElementById('ceBoite').getBoundingClientRect();
        return { panneau: pp, eclair: Math.round(100 * ec.width * ec.height / (innerWidth * innerHeight)) };
      });
      console.log(`  place prise : panneau ${cmp.panneau} % · éclair ${cmp.eclair} %`);
      ck('  et elle prend bien moins de place que le panneau',
         cmp.eclair * 2 < cmp.panneau, JSON.stringify(cmp));
    }
    await ctx.close();
  }

  console.log('\n=== la case des instruments décide, et s\'en souvient ===');
  {
    const { ctx, p } = await ouvrir(1440, 900, false);
    const avec = async (coche, phrase) => p.evaluate(([c, ph]) => {
      const app = window.app;
      app.entities = []; app.historyPast = []; app._consignes = [];
      if (app.cslOublier) app.cslOublier();
      app.ouvrirConsigneEclair();
      const cases = document.getElementById('ceInstruments');
      cases.checked = c;
      cases.dispatchEvent(new Event('change'));
      document.getElementById('ceChamp').value = ph;
      app.lancerConsigneEclair();
      const cpt = {};
      app.entities.forEach(e => { cpt[e.constructor.name] = (cpt[e.constructor.name] || 0) + 1; });
      let memo = '';
      try { memo = localStorage.getItem('gm_eclair_outils') || ''; } catch (e) { void e; }
      return { cpt, memo, n: app.entities.length };
    }, [coche, phrase]);
    const nu = await avec(false, 'Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm');
    const out = await avec(true, 'Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm');
    console.log('  sans : ' + JSON.stringify(nu.cpt) + '\n  avec : ' + JSON.stringify(out.cpt));
    ck('décochée, on obtient la figure seule',
       !nu.cpt.ToolAnimation && !nu.cpt.CompassArc, JSON.stringify(nu.cpt));
    ck('cochée, on obtient la construction aux instruments',
       out.cpt.ToolAnimation > 0 && out.cpt.CompassArc > 0, JSON.stringify(out.cpt));
    ck('et le choix est retenu d\'une fois sur l\'autre', out.memo === '1', out.memo);
    await ctx.close();
  }

  console.log('\n=== elle ne fait pas doublon avec la loupe ===');
  {
    const { ctx, p } = await ouvrir(1440, 900, false);
    /* La loupe cherche une COMMANDE, le crayon écrit une PHRASE. Qui se trompe
       de porte ne doit pas rester devant « aucune commande ». */
    await p.keyboard.press('Control+k'); await p.waitForTimeout(300);
    await p.fill('#rechercheChamp', 'trace un triangle ABC'); await p.waitForTimeout(300);
    const vide = await p.evaluate(() => document.getElementById('rechercheListe').innerText.replace(/\s+/g, ' ').trim());
    ck('une phrase tapée dans la loupe est reconnue comme telle',
       /consigne/i.test(vide), JSON.stringify(vide));
    await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    const bascule = await p.evaluate(() => ({
      loupe: document.getElementById('rechercheOverlay').classList.contains('ouvert'),
      eclair: document.getElementById('consigneEclair').classList.contains('ouvert'),
      champ: document.getElementById('ceChamp').value }));
    ck('  et Entrée l\'emmène au crayon, texte compris',
       !bascule.loupe && bascule.eclair && /triangle ABC/.test(bascule.champ), JSON.stringify(bascule));
    /* Et l'inverse ne doit PAS arriver : un vrai nom de commande reste à la loupe. */
    await p.evaluate(() => window.app.fermerConsigneEclair());
    await p.keyboard.press('Control+k'); await p.waitForTimeout(250);
    await p.fill('#rechercheChamp', 'compas'); await p.waitForTimeout(250);
    const cmd = await p.evaluate(() => ({
      premier: ((window.app.rechercheResultats || [])[0] || {}).nom,
      bascule: !!window.app.consigneDepuisRecherche }));
    ck('un nom de commande reste une commande', /Compas/.test(cmd.premier || '') && !cmd.bascule,
       JSON.stringify(cmd));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    await p.keyboard.press('Control+e'); await p.waitForTimeout(350);
    const ce = await p.evaluate(() => ({
      eclair: document.getElementById('consigneEclair').classList.contains('ouvert'),
      focus: document.activeElement.id }));
    ck('Ctrl+E ouvre le crayon, le curseur dedans',
       ce.eclair && ce.focus === 'ceChamp', JSON.stringify(ce));
    await ctx.close();
  }

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
