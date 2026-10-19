// LE DÉCOR DE SAISON : paraît-il quand il faut, se tait-il quand il faut, et
// cliquer dessus trace-t-il vraiment la figure promise ?
//
// Un décor qui se contente d'être joli n'a rien à prouver. Celui-ci prétend
// trois choses : qu'il ne paraît qu'à l'approche d'une fête, qu'il ne mange
// aucun clic de la feuille, et qu'un clic sur un motif EXÉCUTE la
// construction. Ce sont trois promesses vérifiables, et la troisième est la
// seule qui compte vraiment : un dessin cliquable qui ne trace rien serait
// pire que pas de décor du tout.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

// On ne dépend pas de la date du jour : on la FEINT. Une sonde qui ne passe
// qu'au mois d'octobre n'est pas une sonde, c'est un hasard.
const FEINDRE = (mois, jour) => `(() => {
  const V = Date;
  const faux = new V(2026, ${mois - 1}, ${jour}, 10, 0, 0);
  class D extends V {
    constructor(...a) { if (!a.length) { super(faux.getTime()); } else { super(...a); } }
    static now() { return faux.getTime(); }
  }
  window.Date = D;
})()`;

const propre = async (page) => page.evaluate(() => {
  try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
  const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
  window.app.checkAutoSave = () => {};
  window.app.entities = [];
  window.app.render();
});

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const neuf = async (opts = {}) => {
    const ctx = await b.newContext({ viewport: opts.vp || { width: 1366, height: 768 },
                                     hasTouch: !!opts.touch, isMobile: !!opts.touch });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    if (opts.date) await page.addInitScript(FEINDRE(opts.date[0], opts.date[1]));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    await page.waitForTimeout(500);
    await propre(page);
    await page.waitForTimeout(250);
    return { page, ctx, errs };
  };

  console.log('\n=== LA DATE COMMANDE ===');
  for (const [mois, jour, attendu, quoi] of [
    [10, 16, false, 'la veille de la fenêtre'],
    [10, 17, true, "premier jour de la fenêtre"],
    [10, 19, true, "en plein dedans"],
    [10, 31, true, 'le jour même'],
    [11, 1, false, 'le lendemain'],
    [6, 15, false, 'en juin, aucune fête'],
  ]) {
    const { page, ctx, errs } = await neuf({ date: [mois, jour] });
    const la = await page.evaluate(() => !!document.getElementById('gmDecor'));
    ck(`${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')} : `
       + (attendu ? 'décor présent' : 'pas de décor') + ` (${quoi})`,
       la === attendu, la === attendu ? '' : (la ? 'il est là' : 'il manque'));
    if (errs.length) ck(`  pas d'erreur JS le ${mois}-${jour}`, false, errs[0].slice(0, 90));
    await ctx.close();
  }

  console.log('\n=== CE QUE LE DÉCOR NE DOIT JAMAIS MANGER ===');
  {
    const { page, ctx, errs } = await neuf({ date: [10, 19] });
    const m = await page.evaluate(() => {
      const h = document.getElementById('gmDecor');
      if (!h) return { absent: true };
      const r = h.getBoundingClientRect();
      /* CE QUI COMPTE, C'EST L'ENCRE POSÉE : le bloc est coupé à ses bords
         (overflow:hidden), donc une pièce qui dépasse ne peint rien dehors.
         On intersecte chaque pièce avec le bloc avant de comparer. */
      const coupe = (a) => ({
        left: Math.max(a.left, r.left), top: Math.max(a.top, r.top),
        right: Math.min(a.right, r.right), bottom: Math.min(a.bottom, r.bottom) });
      const touche = [];
      h.querySelectorAll('.gm-decor-piece, .gm-decor-fermer').forEach(d => {
        const a = coupe(d.getBoundingClientRect());
        if (a.right - a.left < 2 || a.bottom - a.top < 2) return;
        ['#premiereLigne', 'header', '.main-container > .toolbar',
         '#stylePalettePanel', '#btnZoom'].forEach(s => {
          const e = document.querySelector(s); if (!e || e.contains(d)) return;
          const c = e.getBoundingClientRect();
          if (c.width < 2 || c.height < 2) return;
          const ov = Math.max(0, Math.min(a.right, c.right) - Math.max(a.left, c.left))
                   * Math.max(0, Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top));
          if (ov > 4) touche.push(s + ' (' + Math.round(ov) + ' px²)');
        });
      });
      /* LE BLOC NE PREND PAS LES CLICS, les motifs seuls en prennent : on
         interroge le point le plus dangereux, le centre du bloc, là où l'on
         commence à dessiner. */
      const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      const dessous = document.elementFromPoint(cx, cy);
      const motifs = h.querySelectorAll('.gm-decor-piece').length;
      const boutons = h.querySelectorAll('button.gm-decor-piece').length;
      /* LA CROIX NE DOIT PAS MORDRE UN MOTIF. La première version ne
         comparait le décor qu'aux commandes du logiciel : elle a laissé
         passer une croix de 32 px plantée dans une citrouille de 45 au
         téléphone. Deux éléments du décor qui se marchent dessus sont un
         défaut comme un autre — et c'est celui qu'on voit en premier. */
      const x = h.querySelector('.gm-decor-fermer');
      let surMotif = 0;
      if (x) {
        const a = coupe(x.getBoundingClientRect());
        h.querySelectorAll('.gm-decor-piece').forEach(d => {
          if (d.offsetParent === null) return;
          const c = coupe(d.getBoundingClientRect());
          surMotif += Math.max(0, Math.min(a.right, c.right) - Math.max(a.left, c.left))
                    * Math.max(0, Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top));
        });
      }
      const surMotifPx = Math.round(surMotif);
      return { absent: false, touche, motifs, boutons, surMotifPx,
               auCentre: dessous ? (dessous.id || dessous.tagName) : 'rien',
               croixEnDernier: h.lastElementChild
                   && h.lastElementChild.classList.contains('gm-decor-fermer') };
    });
    ck('le décor est là', !m.absent);
    ck('il ne recouvre aucune commande', !m.absent && m.touche.length === 0, (m.touche || []).join(', '));
    ck('le milieu du décor laisse passer le clic vers la feuille',
       m.auCentre === 'geoCanvas', 'on y trouve : ' + m.auCentre);
    ck('trois motifs', m.motifs === 3, 'il y en a ' + m.motifs);
    ck('la croix est le dernier enfant (sinon elle ne paraît jamais)', !!m.croixEnDernier);
    ck('la croix ne mord aucun motif', m.surMotifPx === 0, m.surMotifPx + ' px²');
    if (errs.length) ck('pas d\'erreur JS', false, errs[0].slice(0, 90));
    await ctx.close();
  }

  console.log('\n=== UN CLIC SUR UN MOTIF TRACE VRAIMENT ===');
  {
    const { page, ctx, errs } = await neuf({ date: [10, 19] });
    const avant = await page.evaluate(() => window.app.entities.length);
    const cliquables = await page.locator('button.gm-decor-piece').count();
    ck('au moins un motif est cliquable', cliquables > 0, cliquables + ' cliquable(s)');
    if (cliquables > 0) {
      await page.locator('button.gm-decor-piece').first().click();
      await page.waitForTimeout(900);
      const apres = await page.evaluate(() => {
        const b = document.getElementById('instructionBox');
        const liste = (window.app.consignesListe && window.app.consignesListe()) || [];
        const ecrites = liste.filter(c => (c.texte || '').trim());
        return { objets: window.app.entities.length,
                 panneau: !!(b && b.style.display && b.style.display !== 'none'),
                 lignes: ecrites.length,
                 rates: ecrites.filter(c => c.etat === 'rate').length,
                 decor: !!document.getElementById('gmDecor') };
      });
      ck('la figure existe', apres.objets > avant, `${avant} → ${apres.objets} objets`);
      ck('le panneau des consignes s\'ouvre', apres.panneau);
      ck('les lignes de l\'énoncé y sont écrites', apres.lignes >= 8, apres.lignes + ' lignes');
      ck('aucune ligne refusée', apres.rates === 0, apres.rates + ' refus');
      ck('le décor s\'efface dès qu\'il y a une figure', apres.decor === false);
    }
    if (errs.length) ck('pas d\'erreur JS', false, errs[0].slice(0, 90));
    await ctx.close();
  }

  console.log('\n=== ON PEUT L\'ÉTEINDRE, ET ÇA TIENT ===');
  {
    const { page, ctx, errs } = await neuf({ date: [10, 19] });
    ck('présent au départ', await page.evaluate(() => !!document.getElementById('gmDecor')));
    await page.evaluate(() => document.querySelector('.gm-decor-fermer').click());
    await page.waitForTimeout(250);
    ck('la croix l\'éteint', await page.evaluate(() => !document.getElementById('gmDecor')));
    ck('le réglage est écrit',
       await page.evaluate(() => localStorage.getItem('gm_decor') === 'non'));
    await page.reload();
    await page.waitForFunction(() => window.app);
    await page.waitForTimeout(500);
    await propre(page);
    await page.waitForTimeout(250);
    ck('toujours éteint après rechargement',
       await page.evaluate(() => !document.getElementById('gmDecor')));
    const remis = await page.evaluate(() => {
      window.app.toggleHelp();
      const c = document.getElementById('gmDecorCase');
      const etat = c ? c.checked : null;
      window.app.reglerDecor(true);
      window.app.toggleHelp();
      window.app.render();
      return { caseDecochee: etat === false, revenu: !!document.getElementById('gmDecor') };
    });
    ck('l\'aide montre la case décochée', remis.caseDecochee);
    ck('et le décor revient quand on la recoche', remis.revenu);
    if (errs.length) ck('pas d\'erreur JS', false, errs[0].slice(0, 90));
    await ctx.close();
  }

  console.log('\n=== LÀ OÙ IL NE DOIT JAMAIS PARAÎTRE ===');
  {
    const { page, ctx } = await neuf({ date: [10, 19] });
    const r = await page.evaluate(() => {
      const out = {};
      document.body.classList.add('mode-lecture');
      window.app.render();
      out.lecture = !!document.getElementById('gmDecor');
      document.body.classList.remove('mode-lecture');
      window.app.render();
      out.revenu = !!document.getElementById('gmDecor');
      window.app.setTool('point');
      window.app.render();
      out.outilEnMain = !!document.getElementById('gmDecor');
      window.app.setTool('move');
      window.app.render();
      return out;
    });
    ck('pas de décor dans un lien élève (mode lecture)', r.lecture === false);
    ck('il revient en sortant du mode lecture', r.revenu === true);
    ck('pas de décor quand on a pris un outil à la main', r.outilEnMain === false);
    await ctx.close();
  }
  {
    // DANS UN CADRE, JAMAIS : un GéoMaster encastré dans un cahier en ligne
    // n'a pas à fêter Halloween chez l'hôte.
    //
    // CE CONTRÔLE A SON PROPRE NAVIGATEUR, et il le faut. Chromium traite deux
    // fichiers file:// comme deux origines étrangères : la sonde ne pouvait
    // donc pas regarder DANS le cadre, et elle expirait au bout de trente
    // secondes en accusant le logiciel d'un défaut qui n'était que le sien.
    // Le drapeau ne change rien à ce qui est mesuré — que l'accès à
    // window.top passe ou lève, le code conclut « je suis dans un cadre »
    // dans les deux cas.
    const b2 = await chromium.launch({ executablePath: NAVIGATEUR,
      args: ['--allow-file-access-from-files'] });
    const ctx = await b2.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    await page.addInitScript(FEINDRE(10, 19));
    await page.goto('file://' + path.resolve(__dirname, 'fixtures', 'cadre-decor.html'));
    let dedans = null;
    try {
      const cadre = await page.waitForSelector('iframe').then(h => h.contentFrame());
      await cadre.waitForFunction(() => window.app, { timeout: 20000 });
      await page.waitForTimeout(700);
      await cadre.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
        window.app.entities = []; window.app.render();
      });
      await page.waitForTimeout(300);
      const r = await cadre.evaluate(() => ({
        decor: !!document.getElementById('gmDecor'),
        invitation: (document.getElementById('premiereLigne') || {}).style
          ? document.getElementById('premiereLigne').style.display !== 'none' : null }));
      dedans = r.decor;
      // La sonde doit mesurer le décor, pas le vide : si l'invitation elle-même
      // n'est pas là, l'absence du décor ne prouve rien.
      ck('  (l\'invitation, elle, est bien dans le cadre)', r.invitation === true,
         'sinon le contrôle ci-dessous mesure le vide');
    } catch (e) { dedans = 'inatteignable : ' + e.message.slice(0, 70); }
    ck('pas de décor dans un cadre', dedans === false, String(dedans));
    await ctx.close();
    await b2.close();
  }

  console.log('\n=== AU TÉLÉPHONE ===');
  {
    const { page, ctx } = await neuf({ date: [10, 19], touch: true,
                                       vp: { width: 390, height: 844 } });
    const m = await page.evaluate(() => {
      const h = document.getElementById('gmDecor');
      if (!h) return { absent: true };
      const r = h.getBoundingClientRect();
      const vus = [...h.querySelectorAll('.gm-decor-piece')]
        .filter(d => d.offsetParent !== null)
        .map(d => { const a = d.getBoundingClientRect();
          return { cls: d.className, w: Math.round(a.width), h: Math.round(a.height),
                   dansEcran: a.left >= -1 && a.right <= innerWidth + 1,
                   bouton: d.tagName === 'BUTTON' }; });
      const x = h.querySelector('.gm-decor-fermer').getBoundingClientRect();
      let sur = 0;
      [...h.querySelectorAll('.gm-decor-piece')].filter(d => d.offsetParent !== null)
        .forEach(d => { const c = d.getBoundingClientRect();
          sur += Math.max(0, Math.min(x.right, c.right) - Math.max(x.left, c.left))
               * Math.max(0, Math.min(x.bottom, c.bottom) - Math.max(x.top, c.top)); });
      return { absent: false, zone: { x: Math.round(r.left), w: Math.round(r.width) },
               vus, croix: Math.round(Math.min(x.width, x.height)),
               surMotifPx: Math.round(sur),
               croixDansEcran: x.left >= 0 && x.right <= innerWidth + 1 };
    });
    ck('le décor est là au téléphone', !m.absent);
    if (!m.absent) {
      ck('la zone est dans l\'écran', m.zone.x >= 0 && m.zone.w > 60,
         `x ${m.zone.x}, ${m.zone.w} px de large`);
      ck('un seul motif y reste', m.vus.length === 1, m.vus.length + ' visibles');
      ck('et c\'est un motif cliquable', m.vus.every(v => v.bouton));
      ck('il tient dans l\'écran', m.vus.every(v => v.dansEcran));
      ck('la croix fait au moins 32 px au doigt', m.croix >= 32, m.croix + ' px');
      ck('la croix ne mord pas le motif', m.surMotifPx === 0, m.surMotifPx + ' px²');
      ck('la croix est dans l\'écran', m.croixDansEcran === true);
    }
    await ctx.close();
  }

  await b.close();
  console.log(fail ? `\n${fail} échec(s)` : '\nTout passe.');
  process.exit(fail ? 1 : 0);
})();
