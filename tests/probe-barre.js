// La barre de style du texte et le panneau d'aide restent-ils dans l'écran,
// quel que soit l'endroit où l'on écrit ?
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
  for (const c of [
    { n: 'iPhone 390x844', w: 390, h: 844, touch: true },
    { n: 'tablette 1024x768', w: 1024, h: 768, touch: true },
    { n: 'desktop 1440x900', w: 1440, h: 900, touch: false },
  ]) {
    const page = await (await b.newContext({ viewport: { width: c.w, height: c.h }, hasTouch: c.touch })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForTimeout(1400);
    console.log(`\n=== ${c.n} ===`);
    // 9 emplacements de saisie répartis sur la zone visible du conteneur
    const res = await page.evaluate(() => {
      const app = window.app, cont = app.canvas.parentElement;
      const out = [];
      const fx = [0.05, 0.5, 0.95], fy = [0.05, 0.5, 0.95];
      for (const ax of fx) for (const ay of fy) {
        // coordonnées SCÈNE correspondant au point visé de la bande visible
        const sx = (cont.scrollLeft + cont.clientWidth * ax - app.view.x) / app.view.zoom;
        const sy = (cont.scrollTop + cont.clientHeight * ay - app.view.y) / app.view.zoom;
        app.validerTexteFantome();
        app.setTool('text');
        const r = app.canvas.getBoundingClientRect();
        const cx = sx * app.view.zoom + app.view.x + r.left, cy = sy * app.view.zoom + app.view.y + r.top;
        const ev = (t, bt) => app.canvas.dispatchEvent(new PointerEvent(t, {
          pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
          clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
        ev('pointerdown', 1); ev('pointerup', 0);
        const g = document.getElementById('ghostTextInput');
        if (g.style.display !== 'block') { out.push({ ax, ay, ouvert: false }); continue; }
        g.focus(); document.execCommand('insertText', false, '\\frac{b \\times h}{2}');
        app.basculerAideFormule(true);
        const R = (id) => document.getElementById(id).getBoundingClientRect();
        const rb = R('textFormatToolbar'), ra = R('aideFormule'), rg = R('ghostTextInput');
        const rc = cont.getBoundingClientRect();
        const rp = document.getElementById('stylePalettePanel');
        // bande visible en coordonnées de fenêtre
        const V = { l: Math.max(0, rc.left), t: Math.max(0, rc.top),
                    r: Math.min(innerWidth, rc.right), b: Math.min(innerHeight, rc.bottom) };
        const dehors = (r) => ({ g: Math.max(0, Math.round(V.l - r.left)), d: Math.max(0, Math.round(r.right - V.r)),
                                 h: Math.max(0, Math.round(V.t - r.top)), b: Math.max(0, Math.round(r.bottom - V.b)) });
        const chev = (a, z) => { const dx = Math.min(a.right, z.right) - Math.max(a.left, z.left);
          const dy = Math.min(a.bottom, z.bottom) - Math.max(a.top, z.top);
          return (dx > 0 && dy > 0) ? Math.round(dx * dy) : 0; };
        out.push({ ax, ay, ouvert: true, barre: dehors(rb), aide: dehors(ra),
                   aideSurBarre: chev(ra, rb), aideSurChamp: chev(ra, rg),
                   bAide: [Math.round(ra.width), Math.round(ra.height)],
                   aideSurPalette: (rp && rp.offsetParent !== null) ? chev(ra, rp.getBoundingClientRect()) : 0 });
      }
      app.validerTexteFantome();
      return out;
    });
    let sortBarre = 0, sortAide = 0, chevB = 0, chevC = 0, chevP = 0, nb = 0;
    for (const r of res) {
      if (!r.ouvert) { console.log(`  (${r.ax},${r.ay}) saisie non ouverte`); fail++; continue; }
      nb++;
      const sb = Object.values(r.barre).reduce((a, v) => a + v, 0);
      const sa = Object.values(r.aide).reduce((a, v) => a + v, 0);
      sortBarre += sb; sortAide += sa; chevB += r.aideSurBarre; chevC += r.aideSurChamp; chevP += r.aideSurPalette;
      if (sb || sa || r.aideSurBarre || r.aideSurChamp || r.aideSurPalette)
        console.log(`  (${r.ax},${r.ay}) barre hors=${JSON.stringify(r.barre)} aide hors=${JSON.stringify(r.aide)} chevauche barre=${r.aideSurBarre} champ=${r.aideSurChamp} palette=${r.aideSurPalette}`);
    }
    console.log(`  ${nb} emplacements | aide ${res.find(r => r.ouvert) ? res.find(r => r.ouvert).bAide.join('x') : '?'}`);
    ck('la barre reste entièrement dans l\'écran', sortBarre === 0, `${sortBarre}px de débord cumulé`);
    ck('l\'aide reste entièrement dans l\'écran', sortAide === 0, `${sortAide}px de débord cumulé`);
    ck('l\'aide ne recouvre jamais la barre', chevB === 0, `${chevB}px² cumulés`);
    ck('l\'aide ne recouvre jamais le champ', chevC === 0, `${chevC}px² cumulés`);
    ck('l\'aide ne recouvre jamais la palette de style', chevP === 0, `${chevP}px² cumulés`);
    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await page.context().close();
  }

  /* ================================================================
     ET ELLE NE DOIT PAS COUVRIR LE TEXTE QU'ON ÉCRIT.
     « Quand on écrit plusieurs lignes et que la barre va en bas — car
     normalement elle va en haut, mais comme on est en haut du canevas elle va
     en bas —, elle cache les lignes en dessous. »
     Les épreuves d'au-dessus ne tenaient que le DÉBORD : la barre restait dans
     l'écran, et personne ne regardait si elle restait hors du champ. Elle était
     placée à l'ouverture, sur une saisie d'UNE ligne, et plus jamais ensuite :
     chaque ligne tapée poussait le champ sous elle.
     MESURÉ, texte posé à 30 px du bord haut : deux lignes en cachaient 0,6,
     cinq lignes 2,6 — on écrit sans voir ce qu'on écrit.
     On mesure donc l'AIRE COMMUNE des deux rectangles, qui est exactement ce
     que l'utilisateur ne voit plus.
     ================================================================ */
  {
    const page = await (await b.newContext({ viewport: { width: 1400, height: 950 } })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForTimeout(1400);
    console.log('\n=== la barre ne couvre pas les lignes qu\'on ajoute ===');
    const poser = async (yEcran) => {
      await page.evaluate(() => {
        const a = window.app;
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
        a.checkAutoSave = () => {};
        a.validerTexteFantome();
        a.entities = []; a.view = { zoom: 1, x: 0, y: 0 };
        a.setTool('text');
      });
      const r = await page.evaluate(() => {
        const q = window.app.canvas.getBoundingClientRect();
        return { x: q.left, y: q.top };
      });
      await page.mouse.click(r.x + 300, r.y + yEcran);
      await page.waitForTimeout(300);
    };
    const chevauchement = () => page.evaluate(() => {
      const ch = document.getElementById('ghostTextInput');
      const ba = document.getElementById('textFormatToolbar');
      const rc = ch.getBoundingClientRect(), rb = ba.getBoundingClientRect();
      const dy = Math.min(rc.bottom, rb.bottom) - Math.max(rc.top, rb.top);
      const dx = Math.min(rc.right, rb.right) - Math.max(rc.left, rb.left);
      const lh = parseFloat(getComputedStyle(ch).lineHeight) || 20;
      return { aire: (dx > 0 && dy > 0) ? Math.round(dx * dy) : 0,
               lignes: (dy > 0) ? Math.round(dy / lh * 10) / 10 : 0,
               dessus: rb.bottom <= rc.top + 1 };
    });

    /* EN HAUT : la barre passe dessous, et doit suivre le champ qui grandit. */
    await poser(30);
    let pire = 0, quand = '';
    for (let n = 1; n <= 6; n++) {
      const v = await chevauchement();
      if (v.aire > pire) { pire = v.aire; quand = n + ' ligne(s)'; }
      await page.keyboard.type('ligne ' + n);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(110);
    }
    ck('en haut du canevas, six lignes restent visibles', pire === 0,
       pire ? `${pire} px² cachés à ${quand}` : '0 px² caché');

    /* LA POLICE AUSSI CHANGE LA HAUTEUR. Un écouteur de frappe ne l'aurait pas
       vu ; c'est pourquoi la barre suit la TAILLE du champ et non les touches. */
    await poser(30);
    await page.keyboard.type('une ligne');
    await page.waitForTimeout(120);
    await page.evaluate(() => {
      const t = document.getElementById('ghostTextSize');
      t.value = '60';
      t.dispatchEvent(new Event('input', { bubbles: true }));
      t.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(250);
    const gros = await chevauchement();
    ck('  et grossir la police ne la fait pas recouvrir non plus', gros.aire === 0,
       gros.aire + ' px² cachés');

    /* AU MILIEU : rien ne change, la barre reste AU-DESSUS. */
    await poser(420);
    for (let n = 1; n <= 5; n++) {
      await page.keyboard.type('x'); await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(150);
    const milieu = await chevauchement();
    ck('  au milieu, elle reste au-dessus comme avant',
       milieu.dessus && milieu.aire === 0,
       (milieu.dessus ? 'au-dessus' : 'EN DESSOUS') + ', ' + milieu.aire + ' px² cachés');

    /* PLUS HAUT QUE L'ÉCRAN : elle ne tient nulle part. On exige alors qu'elle
       soit EN HAUT, loin du curseur — on écrit par le bas. */
    await poser(30);
    for (let n = 1; n <= 30; n++) {
      await page.keyboard.type('ligne ' + n); await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(300);
    const tres = await page.evaluate(() => {
      const ba = document.getElementById('textFormatToolbar').getBoundingClientRect();
      const ch = document.getElementById('ghostTextInput').getBoundingClientRect();
      const v = window.app.bandeVisible(8);
      return { barreT: Math.round(ba.top), champB: Math.round(ch.bottom),
               hauteurBande: Math.round(v.b - v.t), ecran: window.innerHeight };
    });
    /* ET ELLE DOIT RESTER DANS L'ÉCRAN. Sur la version d'avant, ce cas-là
       envoyait la barre à -1204 px — entièrement hors de la fenêtre. Un
       « au-dessus » qui veut dire « nulle part » passerait une épreuve écrite
       seulement sur « plus haut que » : on exige les deux. */
    ck('  un texte plus haut que l\'écran la renvoie EN HAUT, loin du curseur',
       tres.barreT >= 0 && tres.barreT < tres.ecran / 3,
       `barre à ${tres.barreT} px, dernière ligne vers ${tres.champB} px`);
    ck('  aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await page.context().close();
  }
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
