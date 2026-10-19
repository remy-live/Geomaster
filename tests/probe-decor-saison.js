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
  /* UNE SONDE DOIT ÉCHOUER, PAS PLANTER. En sabotant la table exprès — deux
     motifs posés à la même place —, les deux dessins se sont recouverts, le
     clic n'est plus passé, et la sonde est morte sur une exception non
     rattrapée AVANT d'avoir rendu le moindre verdict. Elle ne disait donc rien
     du défaut qu'elle venait pourtant de provoquer. Un clic qui ne passe pas
     est un résultat, et il se raconte. */
  const cliquer = async (loc, quoi) => {
    try { await loc.click({ timeout: 6000 }); return true; }
    catch (e) {
      ck(quoi, false, 'le clic ne passe pas : ' + String(e.message).split('\n')[0].slice(0, 90));
      return false;
    }
  };
  const neuf2 = async (opts = {}) => {
    const ctx = await b.newContext({ viewport: opts.vp || { width: 1366, height: 768 },
                                     hasTouch: !!opts.touch, isMobile: !!opts.touch });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    if (opts.date) await page.addInitScript(FEINDRE(opts.date[0], opts.date[1]));
    await page.goto(PAGE + (opts.q ? '?' + opts.q : ''));
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
    const { page, ctx, errs } = await neuf2({ date: [mois, jour] });
    const la = await page.evaluate(() => !!document.getElementById('gmDecor'));
    ck(`${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')} : `
       + (attendu ? 'décor présent' : 'pas de décor') + ` (${quoi})`,
       la === attendu, la === attendu ? '' : (la ? 'il est là' : 'il manque'));
    if (errs.length) ck(`  pas d'erreur JS le ${mois}-${jour}`, false, errs[0].slice(0, 90));
    await ctx.close();
  }

  console.log('\n=== LA TABLE SE TIENT, QUELLE QUE SOIT LA FÊTE ===');
  // CES CONTRÔLES NE CONNAISSENT PAS HALLOWEEN : ils parcourent window.GM_DECORS
  // et valent donc pour toute fête qu'on ajoutera. La version précédente était
  // câblée sur une seule fête et sur trois motifs — la deuxième serait entrée
  // sans le moindre contrôle.
  {
    const { page, ctx } = await neuf2({ date: [10, 19] });
    const T = await page.evaluate(() => window.GM_DECORS || []);
    ck('la table existe et n\'est pas vide', Array.isArray(T) && T.length > 0,
       (T || []).length + ' fête(s)');
    const jour = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    const places = ['coin', 'haut', 'bas'];
    T.forEach(t => {
      const nom = t && t.cle ? t.cle : '(sans clé)';
      /* UNE FÊTE MOBILE N'A PAS DE BORNES ÉCRITES : elles se calculent à
         partir du dimanche de Pâques de l'année en cours. Sans ce cas, le
         contrôle réclamait un « MM-JJ » que Pâques n'a pas — et pire, la
         vérification des collisions plus bas comparait des bornes
         INDÉFINIES, donc ne trouvait jamais rien. Elle mesurait le vide. */
      const mobile = !!t.mobile;
      ck(`${nom} : clé, nom et bornes bien formées`,
         !!(t.cle && t.nom && (mobile
              ? (t.mobile === 'paques' && Number.isFinite(t.avant) && Number.isFinite(t.apres))
              : (jour.test(t.du || '') && jour.test(t.au || '')))),
         mobile ? `mobile : ${t.avant} jours avant Pâques à ${t.apres} après`
                : `du ${t.du} au ${t.au}`);
      const m = t.motifs || [];
      ck(`${nom} : au moins un motif`, m.length > 0, m.length + ' motif(s)');
      const vus = new Set();
      let dbl = 0, malPlace = 0, malSvg = 0, sansTitre = 0;
      m.forEach(x => {
        if (vus.has(x.place)) dbl++; else vus.add(x.place);
        if (!places.includes(x.place)) malPlace++;
        if (!x.titre) sansTitre++;
        const g = String(x.svg || '');
        // UN SVG QUI PORTE SA PROPRE TAILLE IGNORE CELLE QU'ON LUI DONNE : il
        // sortirait de sa case, par-dessus les commandes.
        if (!/viewBox/.test(g) || /<svg[^>]*\s(width|height)=/.test(g)
            || (g.match(/<svg/g) || []).length !== 1) malSvg++;
      });
      ck(`${nom} : deux motifs ne se disputent pas la même place`, dbl === 0, dbl + ' doublon(s)');
      ck(`${nom} : toutes les places sont connues (coin, haut, bas)`, malPlace === 0,
         malPlace + ' inconnue(s)');
      ck(`${nom} : chaque motif a un titre (il devient l'étiquette du bouton)`,
         sansTitre === 0, sansTitre + ' sans titre');
      ck(`${nom} : chaque SVG a un viewBox et aucune taille en dur`, malSvg === 0,
         malSvg + ' fautif(s)');
    });
    // DEUX FÊTES LE MÊME JOUR SERAIENT UNE AMBIGUÏTÉ SILENCIEUSE : la première
    // de la table gagnerait, sans que rien ne le dise.
    /* LES COLLISIONS SE CHERCHENT ANNÉE PAR ANNÉE. Une fête mobile n'occupe
       pas les mêmes jours d'une année à l'autre : deux fenêtres qui ne se
       touchent pas en 2027 peuvent se chevaucher en 2030. On balaie donc
       vingt ans, bornes CALCULÉES par le logiciel lui-même. */
    const { page: pc, ctx: cc } = await neuf2({ date: [6, 15] });
    const collisions = await pc.evaluate(() => {
      const app = window.app, T = window.GM_DECORS || [], out = [];
      for (let y = 2026; y <= 2045; y++) {
        for (let mo = 1; mo <= 12; mo++) {
          for (let jo = 1; jo <= 31; jo++) {
            const d = new Date(y, mo - 1, jo);
            if (d.getMonth() !== mo - 1) continue;      // 31 février n'existe pas
            const j = String(mo).padStart(2, '0') + '-' + String(jo).padStart(2, '0');
            const q = T.filter(t => {
              const b = app.decorBornes(t, d);
              if (!b.du || !b.au) return false;
              return (b.du <= b.au) ? (j >= b.du && j <= b.au) : (j >= b.du || j <= b.au);
            });
            if (q.length > 1) out.push(`${y}-${j} : ${q.map(t => t.cle).join(' et ')}`);
          }
        }
      }
      return out;
    });
    ck('aucune date ne tombe dans deux fêtes à la fois, sur vingt ans',
       collisions.length === 0, collisions.slice(0, 3).join(' ; '));
    /* ET AUCUNE FÊTE NE DOIT AVOIR DE BORNES VIDES : sans ce contrôle, une
       fête mal déclarée échapperait à TOUTES les vérifications ci-dessus sans
       qu'une seule ne crie. */
    const vides = await pc.evaluate(() => {
      const app = window.app;
      return (window.GM_DECORS || []).filter(t => {
        const b = app.decorBornes(t, new Date(2027, 5, 1));
        return !b.du || !b.au;
      }).map(t => t.cle);
    });
    ck('aucune fête n\'a de bornes vides', vides.length === 0, vides.join(', '));
    await cc.close();
    await ctx.close();

    // ET CHAQUE FÊTE DOIT VRAIMENT PARAÎTRE DANS SA FENÊTRE.
    // Les bornes sont DEMANDÉES AU LOGICIEL et non lues dans la table : une
    // fête mobile n'a pas de « du » écrit, et String(undefined).split('-')
    // aurait donné une date NaN — la sonde aurait ouvert une page au hasard
    // et conclu n'importe quoi.
    const bornes = await (async () => {
      const { page: pb, ctx: cb } = await neuf2({ date: [6, 15] });
      const r = await pb.evaluate(() => (window.GM_DECORS || []).map(t => {
        const b = window.app.decorBornes(t, new Date(2027, 5, 1));
        return { cle: t.cle, du: b.du, n: (t.motifs || []).length };
      }));
      await cb.close();
      return r;
    })();
    for (const t of bornes) {
      const [mo, jo] = String(t.du).split('-').map(Number);
      const { page: p3, ctx: c3 } = await neuf2({ date: [mo, jo] });
      const r = await p3.evaluate(() => {
        const h = document.getElementById('gmDecor');
        return h ? { cle: h.dataset.cle,
                     motifs: h.querySelectorAll('.gm-decor-piece').length,
                     portes: h.querySelectorAll('button.gm-decor-piece').length } : null;
      });
      ck(`${t.cle} : paraît bien le ${t.du}, avec ses ${t.n} motifs`,
         !!r && r.cle === t.cle && r.motifs === t.n,
         r ? `${r.cle}, ${r.motifs} motifs dont ${r.portes} cliquables` : 'aucun décor');
      await c3.close();
    }
  }

  console.log('\n=== CE QUE LE DÉCOR NE DOIT JAMAIS MANGER ===');
  {
    const { page, ctx, errs } = await neuf2({ date: [10, 19] });
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
    const { page, ctx, errs } = await neuf2({ date: [10, 19] });
    const avant = await page.evaluate(() => window.app.entities.length);
    const cliquables = await page.locator('button.gm-decor-piece').count();
    ck('au moins un motif est cliquable', cliquables > 0, cliquables + ' cliquable(s)');
    if (cliquables > 0) {
      const passe = await cliquer(page.locator('button.gm-decor-piece').first(),
                                  'le premier motif se laisse cliquer');
      await page.waitForTimeout(passe ? 900 : 50);
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
    /* LA FIGURE DOIT ÊTRE SOUS LES YEUX, pas quelque part plus bas. Mesuré
       sans recadrage sur 1366 × 768 : la chauve-souris ne tenait qu'à 76 %
       dans l'écran. On exige la figure ENTIÈRE, pour chacun des trois motifs.
       L'emprise est demandée au logiciel (getSceneBounds), qui échantillonne
       chaque arc sur sa portion réellement tracée : prendre la boîte du cercle
       entier faisait crier au débordement sur une toile qui tenait déjà. */
    for (let i = 0; i < 3; i++) {
      const { page: p2, ctx: c2 } = await neuf2({ date: [10, 19] });
      const nom = await p2.evaluate((i) => {
        const b = document.querySelectorAll('button.gm-decor-piece')[i];
        return b ? b.getAttribute('aria-label').replace('Tracer ', '') : null; }, i);
      if (!await cliquer(p2.locator('button.gm-decor-piece').nth(i),
                         `${nom} : le motif se laisse cliquer`)) { await c2.close(); continue; }
      await p2.waitForTimeout(1200);
      const v = await p2.evaluate(() => {
        const app = window.app;
        const sb = app.getSceneBounds(false);
        if (!sb || !isFinite(sb.minX)) return null;
        const r = app.canvas.getBoundingClientRect(), vv = app.view;
        const ec = (x, y) => ({ x: x * vv.zoom + vv.x + r.left, y: y * vv.zoom + vv.y + r.top });
        const a = ec(sb.minX, sb.minY), b = ec(sb.maxX, sb.maxY);
        const vis = { l: Math.max(0, r.left), t: Math.max(0, r.top),
                      r: Math.min(innerWidth, r.right), b: Math.min(innerHeight, r.bottom) };
        const dedans = Math.max(0, Math.min(b.x, vis.r) - Math.max(a.x, vis.l))
                     * Math.max(0, Math.min(b.y, vis.b) - Math.max(a.y, vis.t));
        return { part: Math.round(100 * dedans / Math.max(1, (b.x - a.x) * (b.y - a.y))) };
      });
      ck(`${nom} : la figure entière est dans l'écran`, v && v.part >= 99,
         v ? v.part + '%' : 'aucune emprise');
      await c2.close();
    }
    if (errs.length) ck('pas d\'erreur JS', false, errs[0].slice(0, 90));
    await ctx.close();
  }

  console.log('\n=== ON PEUT L\'ÉTEINDRE, ET ÇA TIENT ===');
  {
    const { page, ctx, errs } = await neuf2({ date: [10, 19] });
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
    const { page, ctx } = await neuf2({ date: [10, 19] });
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

  console.log('\n=== VOIR UN DÉCOR AVANT SA DATE ===');
  // « Comment je fais pour tester de façon future ? » Sans réponse, il fallait
  // changer l'horloge de la machine pour vérifier un décor qui ne paraîtra que
  // dans deux mois. Le paramètre ?decor= répond — encore faut-il qu'il marche,
  // et qu'il PARLE quand on lui donne n'importe quoi.
  {
    const T = await (async () => {
      const { page, ctx } = await neuf2({ date: [6, 15] });
      const t = await page.evaluate(() => (window.GM_DECORS || []).map(x => x.cle));
      await ctx.close();
      return t;
    })();

    // en juin, aucune fête : tout ce qui paraît ci-dessous vient du paramètre
    for (const cle of T) {
      const { page, ctx } = await neuf2({ date: [6, 15], q: 'decor=' + cle });
      const r = await page.evaluate(() => {
        const h = document.getElementById('gmDecor');
        return h ? h.dataset.cle : null;
      });
      ck(`?decor=${cle} montre ${cle} en plein mois de juin`, r === cle, String(r));
      await ctx.close();
    }
    {
      const { page, ctx } = await neuf2({ date: [6, 15], q: 'decor=10-31' });
      const r = await page.evaluate(() => {
        const h = document.getElementById('gmDecor'); return h ? h.dataset.cle : null; });
      ck('?decor=10-31 fait comme si l\'on était le 31 octobre', r === 'halloween', String(r));
      await ctx.close();
    }
    {
      const { page, ctx } = await neuf2({ date: [10, 19], q: 'decor=non' });
      ck('?decor=non éteint le décor un jour où il paraîtrait',
         await page.evaluate(() => !document.getElementById('gmDecor')));
      await ctx.close();
    }
    {
      // UN DÉCOR FORCÉ PASSE PAR-DESSUS L'EXTINCTION : on ne force un décor
      // que pour le regarder.
      const { page, ctx } = await neuf2({ date: [6, 15], q: 'decor=' + T[0] });
      const r = await page.evaluate((cle) => {
        window.app.reglerDecor(false);          // comme si l'on avait cliqué la croix
        window.app.render();
        const h = document.getElementById('gmDecor');
        return { eteint: localStorage.getItem('gm_decor') === 'non',
                 la: h ? h.dataset.cle : null };
      }, T[0]);
      ck('le décor forcé reste visible même après extinction',
         r.eteint === true && r.la === T[0], JSON.stringify(r));
      await ctx.close();
    }
    {
      // UN NOM INCONNU NE SE TAIT PAS. Sans ce message, celui qui a mal
      // orthographié la fête croit le décor cassé.
      const { page, ctx } = await neuf2({ date: [6, 15], q: 'decor=paques' });
      await page.waitForTimeout(1600);
      const t = await page.evaluate(() => {
        const el = document.getElementById('toast-notification');
        return el ? { vu: /show/.test(el.className), txt: el.innerText } : null;
      });
      ck('un nom inconnu répond la liste des fêtes',
         !!t && t.vu && /inconnu/.test(t.txt) && t.txt.includes(T[0]),
         t ? t.txt.slice(0, 90) : 'pas de message');
      await ctx.close();
    }
  }

  console.log('\n=== AU TÉLÉPHONE ===');
  {
    const { page, ctx } = await neuf2({ date: [10, 19], touch: true,
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
