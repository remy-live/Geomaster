// LE VECTEUR, ET LA PORTE PAR LAQUELLE ON Y ENTRE.
//
// L'appui long sur un bouton d'outil veut déjà dire « options de cet outil » —
// le croquis et le stylo le disent dans leur infobulle. Lui faire dire « un
// autre outil » aurait donné deux sens au même geste, et caché un objet entier
// derrière quelque chose que personne ne découvre : c'est exactement pour cela
// que le quart de tour a fini par avoir son bouton. Le vecteur est donc une
// OPTION du segment — même geste, même sens — et cette sonde garde les trois
// choses qui font qu'il ne se perdra pas : on l'atteint, on le VOIT quand il est
// actif, et la loupe le trouve.
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
    await p.goto(PAGE); await p.waitForTimeout(1400);
    return { ctx, p };
  };

  console.log('\n=== l\'appui long ouvre les OPTIONS, comme partout ailleurs ===');
  const { ctx, p } = await ouvrir(1400, 950, false);
  /* Le même geste que le croquis et le stylo, et la même durée. */
  await p.locator('#btn-segment').hover();
  await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up();
  let e = await p.evaluate(() => {
    const el = document.getElementById('segmentOptions');
    const r = el.getBoundingClientRect();
    return { ouvert: getComputedStyle(el).display !== 'none',
             dansEcran: r.right <= innerWidth + 1 && r.left >= -1 && r.bottom <= innerHeight + 1,
             texte: el.innerText.replace(/\s+/g, ' ').trim() };
  });
  ck('le panneau s\'ouvre', e.ouvert, JSON.stringify(e));
  ck('  et tient dans l\'écran', e.dansEcran, JSON.stringify(e));
  ck('  il propose le vecteur, en toutes lettres', /Vecteur/.test(e.texte), JSON.stringify(e.texte));
  /* L'infobulle du bouton doit ANNONCER le geste : sans cela il est introuvable,
     et c'est précisément la faute que le bouton « quart de tour » a corrigée. */
  const bulle = await p.evaluate(() =>
    document.getElementById('btn-segment').getAttribute('data-tooltip'));
  ck('le bouton annonce lui-même l\'appui long', /appui long/.test(bulle), bulle);

  console.log('\n=== coché, il se voit — un mode qui persiste sans marque est un piège ===');
  await p.click('#optSegmentFleche'); await p.waitForTimeout(200);
  e = await p.evaluate(() => {
    const btn = document.getElementById('btn-segment');
    const av = getComputedStyle(btn, '::after');
    return { badge: btn.classList.contains('gm-mode-vecteur'),
             dessine: av.content !== 'none' && av.borderBottomWidth !== '0px',
             bulle: btn.getAttribute('data-tooltip'),
             memo: localStorage.getItem('gm_segment_fleche') };
  });
  ck('le bouton porte une marque', e.badge && e.dessine, JSON.stringify(e));
  ck('  et son infobulle dit « Vecteur »', /Vecteur/.test(e.bulle), e.bulle);
  ck('le choix est retenu d\'une séance à l\'autre', e.memo === '1', String(e.memo));
  /* Retenu, donc : au rechargement, la marque doit être là AVANT qu'on ait rien
     fait — sinon on rouvre le logiciel et l'on trace des flèches sans le savoir. */
  await p.reload(); await p.waitForTimeout(1400);
  const apres = await p.evaluate(() => ({
    badge: document.getElementById('btn-segment').classList.contains('gm-mode-vecteur'),
    actif: window.app.segmentFleche }));
  ck('  et la marque revient au rechargement', apres.badge && apres.actif, JSON.stringify(apres));

  console.log('\n=== un segment tracé devient un vecteur, et le reste ===');
  const trace = await p.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = [];
    const A = app.createPointAt(300, 300), B = app.createPointAt(600, 420);
    const s = new Segment(A, B);
    if (app.segmentFleche) s.fleche = true;
    app.addEntity(s);
    /* LES QUATRE CHEMINS. Une pointe qui ne survit pas à l'enregistrement, c'est
       une figure qui change en la rangeant — le défaut le plus coûteux qui soit,
       parce qu'on ne le voit que plus tard. */
    const code = app.codeDocument();
    app.chargerDocument(code);
    const parCode = app.entities.find(x => x.constructor.name === 'Segment');
    /* deserialize() RENVOIE les objets, il ne les pose pas : c'est ce que fait
       l'annulation, et c'est aussi ce chemin-là qu'emprunte le fichier .json. */
    const brut = app.serialize();
    const parJson = (app.deserialize(brut) || []).find(x => x.constructor.name === 'Segment');
    return { parCode: !!(parCode && parCode.fleche), parJson: !!(parJson && parJson.fleche) };
  });
  ck('la pointe survit au code compact (lien élève, bibliothèque, pages)', trace.parCode);
  ck('la pointe survit au fichier .json', trace.parJson);
  /* Elle doit aussi être DESSINÉE : le drapeau seul ne se voit pas. */
  const peint = await p.evaluate(() => {
    const app = window.app;
    app.entities = [];
    const A = app.createPointAt(200, 200), B = app.createPointAt(600, 200);
    const s = new Segment(A, B); s.fleche = true; s.color = '#000000'; app.addEntity(s);
    app.gridMode = 'none'; app.view = { x: 0, y: 0, zoom: 1 };
    app.render();
    /* On compte l'encre AU BOUT du trait : une pointe pleine y met beaucoup plus
       de pixels noirs qu'un trait de 2 px. */
    const cv = app.canvas, x = cv.getContext('2d');
    const encre = (cx) => {
      const d = x.getImageData(cx * app.dpr, (200 - 12) * app.dpr, 2, 24 * app.dpr).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
      return n;
    };
    return { auBout: encre(596), auMilieu: encre(400) };
  });
  ck('la pointe est vraiment peinte au bout du trait',
     peint.auBout > peint.auMilieu * 2, JSON.stringify(peint));

  console.log('\n=== on peut le trouver sans connaître le geste ===');
  /* LA VRAIE QUESTION. Un geste sans affordance ne se découvre pas : la loupe
     doit ramener le vecteur à qui le cherche par son nom. */
  await p.keyboard.press('Control+k'); await p.waitForTimeout(300);
  await p.fill('#rechercheChamp', 'vecteur'); await p.waitForTimeout(300);
  const trouve = await p.evaluate(() =>
    (window.app.rechercheResultats || []).slice(0, 4).map(r => r.nom));
  ck('la loupe trouve « Vecteur »', trouve.some(t => /Vecteur/i.test(t)), JSON.stringify(trouve));
  await p.keyboard.press('Escape');

  console.log('\n=== décoché, on retrouve un segment ordinaire ===');
  await p.evaluate(() => { window.app.reglerSegment('fleche', false); });
  const remis = await p.evaluate(() => ({
    badge: document.getElementById('btn-segment').classList.contains('gm-mode-vecteur'),
    memo: localStorage.getItem('gm_segment_fleche'),
    bulle: document.getElementById('btn-segment').getAttribute('data-tooltip') }));
  ck('la marque disparaît, et le souvenir avec',
     !remis.badge && remis.memo === '0' && /Segment/.test(remis.bulle), JSON.stringify(remis));
  await ctx.close();

  console.log('\n=== au doigt aussi ===');
  /* Sur un téléphone, l'appui long EST le clic droit : c'est le seul chemin. */
  {
    const t = await ouvrir(390, 844, true);
    const dansGrille = await t.p.evaluate(() => {
      const b2 = document.getElementById('btn-segment');
      return { existe: !!b2, r: b2 ? Math.round(b2.getBoundingClientRect().width) : 0 };
    });
    ck('le bouton du segment est là', dansGrille.existe && dansGrille.r >= 32, JSON.stringify(dansGrille));
    await t.p.locator('#btn-segment').tap({ timeout: 5000 }).catch(() => {});
    await t.p.evaluate(() => window.app.ouvrirOptionsSegment(document.getElementById('btn-segment')));
    await t.p.waitForTimeout(200);
    const pan = await t.p.evaluate(() => {
      const el = document.getElementById('segmentOptions');
      const r = el.getBoundingClientRect();
      return { ouvert: getComputedStyle(el).display !== 'none',
               dansEcran: r.right <= innerWidth + 1 && r.left >= -1 };
    });
    ck('  et son panneau tient dans un écran de 390 px',
       pan.ouvert && pan.dansEcran, JSON.stringify(pan));
    await t.ctx.close();
  }

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
