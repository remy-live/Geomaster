// Le téléphone. Deux bandes défilent en largeur — l'en-tête et la barre
// d'outils — et ce qu'elles cachaient n'était signalé par rien : sur un écran
// de 390 px, seize outils sur vingt-deux étaient hors de vue, dont le segment
// et le cercle. On ne pouvait pas tracer un trait sans découvrir seul que la
// barre glissait. Cette sonde vérifie qu'un appui suffit désormais, partout où
// une bande déborde — et qu'aucun bouton n'apparaît là où rien ne manque.
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
          deviceScaleFactor: 2, userAgent: devices['iPhone 13'].userAgent }
      : { viewport: { width: W, height: H } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(PAGE); await p.waitForTimeout(1500);
    return { ctx, p };
  };

  console.log('\n=== téléphone debout : tout outil est à un appui ===');
  {
    const { ctx, p } = await ouvrir(390, 844, true);
    /* La barre elle-même ne peut pas tout montrer — 1220 px d'outils dans
       390 — et ce n'est pas ce qu'on lui demande : on lui demande de ne rien
       rendre inatteignable. */
    const barre = await p.evaluate(() => {
      const tb = document.querySelector('.toolbar');
      const tous = [...tb.querySelectorAll('.tool-btn')].filter(e => e.id !== 'btnTousOutils');
      const vus = tous.filter(e => e.getBoundingClientRect().right <= innerWidth + 1);
      const bt = document.getElementById('btnTousOutils').getBoundingClientRect();
      return { total: tous.length, vus: vus.length,
               premiers: vus.map(e => (e.getAttribute('data-tooltip') || '').split(/\s[—:]|\s*\(/)[0].trim()),
               bouton: { x: Math.round(bt.x), w: Math.round(bt.width), h: Math.round(bt.height),
                         dansEcran: bt.right <= innerWidth + 1 } };
    });
    console.log('  ' + JSON.stringify(barre.premiers));
    /* Les six places visibles doivent servir à DESSINER. Elles étaient
       dépensées en milieu et deux symétries pendant que segment et droite
       restaient dehors : les six premières étaient les mauvaises six. */
    ck('les outils de tracé sont dans les premiers visibles',
       barre.premiers.includes('Segment [AB]') && barre.premiers.includes('Point'),
       barre.premiers.join(', '));
    ck('le bouton « tous les outils » est à l\'écran et tapable',
       barre.bouton.dansEcran && barre.bouton.w >= 44 && barre.bouton.h >= 44,
       JSON.stringify(barre.bouton));
    /* Il est COLLÉ au bord : la barre glisse dessous, il ne part pas avec. */
    const apres = await p.evaluate(() => {
      document.querySelector('.toolbar').scrollLeft = 9999;
      const b = document.getElementById('btnTousOutils').getBoundingClientRect();
      return { x: Math.round(b.x), dansEcran: b.right <= innerWidth + 1 };
    });
    ck('il reste au bord quand la barre défile à fond', apres.dansEcran, JSON.stringify(apres));
    await p.evaluate(() => { document.querySelector('.toolbar').scrollLeft = 0; });

    await p.locator('#btnTousOutils').click(); await p.waitForTimeout(350);
    const grille = await p.evaluate(() => {
      const c = [...document.querySelectorAll('.tiroir-outil')];
      return { n: c.length, noms: c.map(x => x.querySelector('span:last-child').textContent.trim()),
               petites: c.filter(x => { const b = x.getBoundingClientRect(); return b.width < 44 || b.height < 44; }).length,
               hors: c.filter(x => { const b = x.getBoundingClientRect();
                 return b.bottom > innerHeight + 1 || b.right > innerWidth + 1 || b.top < 0; }).length,
               masques: c.filter(x => { const b = x.getBoundingClientRect();
                 const d = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
                 return d && d !== x && !x.contains(d); }).length };
    });
    ck(`la grille porte les ${barre.total} outils`, grille.n === barre.total, String(grille.n));
    ck('chacun est tapable (44 px), à l\'écran, et rien ne le recouvre',
       grille.petites === 0 && grille.hors === 0 && grille.masques === 0,
       `petites ${grille.petites}, hors ${grille.hors}, recouverts ${grille.masques}`);
    /* Deux cellules du même nom seraient pires qu'une barre qui défile : la
       grille ne sert qu'à RECONNAÎTRE l'outil. */
    ck('aucun outil n\'y porte le nom d\'un autre',
       new Set(grille.noms).size === grille.noms.length,
       grille.noms.filter((n, i) => grille.noms.indexOf(n) !== i).join(', '));
    for (const nom of ['Cercle', 'Compas', 'Règle', 'Rapporteur', 'Angle']) {
      ck(`  « ${nom} » y est`, grille.noms.some(n => n === nom || n.startsWith(nom)));
    }
    const i = grille.noms.findIndex(n => n === 'Cercle');
    await p.locator('.tiroir-outil').nth(i).click(); await p.waitForTimeout(350);
    const fin = await p.evaluate(() => ({ outil: window.app.currentTool,
      tiroir: getComputedStyle(document.getElementById('tiroirOutils')).display }));
    ck('un appui arme l\'outil et referme la grille',
       fin.outil === 'circle' && fin.tiroir === 'none', JSON.stringify(fin));
    await ctx.close();
  }

  console.log('\n=== téléphone debout : toute commande est à un appui ===');
  {
    const { ctx, p } = await ouvrir(390, 844, true);
    const bt = await p.evaluate(() => {
      const e = document.getElementById('btnToutesCommandes');
      const b = e.getBoundingClientRect();
      return { montre: getComputedStyle(e).display !== 'none',
               dansEcran: b.right <= innerWidth + 1 && b.left >= -1,
               w: Math.round(b.width), h: Math.round(b.height) };
    });
    ck('le bouton « toutes les commandes » est là et tapable',
       bt.montre && bt.dansEcran && bt.w >= 40 && bt.h >= 40, JSON.stringify(bt));
    await p.locator('#btnToutesCommandes').click(); await p.waitForTimeout(350);
    const g = await p.evaluate(() => {
      const c = [...document.querySelectorAll('.tiroir-outil')];
      return { titre: document.querySelector('.tiroir-outils-tete span').textContent,
               noms: c.map(x => x.querySelector('span:last-child').textContent.trim()) };
    });
    ck('la grille annonce les commandes', /commandes/i.test(g.titre), g.titre);
    /* Sans elles, un téléphone ne pouvait ni ouvrir un fichier, ni écrire une
       consigne, ni appeler l'aide : elles étaient toutes hors de la bande. */
    for (const nom of ['Fichier', 'Consignes', 'Constructions Magiques', 'Aide']) {
      ck(`  « ${nom} » y est`, g.noms.some(n => new RegExp(nom, 'i').test(n)),
         g.noms.join(' · ').slice(0, 90));
    }
    const i = g.noms.findIndex(n => /Consignes/i.test(n));
    await p.locator('.tiroir-outil').nth(i).click(); await p.waitForTimeout(500);
    const cons = await p.evaluate(() => {
      const e = document.getElementById('instructionBox');
      const b = e.getBoundingClientRect();
      return { visible: getComputedStyle(e).display !== 'none',
               dansEcran: b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1 };
    });
    ck('et les consignes s\'ouvrent vraiment', cons.visible && cons.dansEcran, JSON.stringify(cons));
    await ctx.close();
  }

  console.log('\n=== le bouton ne paraît QUE là où une bande cache quelque chose ===');
  /* Le réglage se fait sur une mesure, pas sur un palier d'écran : l'en-tête
     déborde encore sur un téléphone couché et sur une tablette, là où la barre
     d'outils, elle, tient tout entière. */
  for (const [W, H, nom, tactile] of [[390, 844, 'téléphone debout', true],
                                      [844, 390, 'téléphone couché', true],
                                      [820, 1180, 'tablette', true],
                                      [1400, 900, 'bureau', false]]) {
    const { ctx, p } = await ouvrir(W, H, tactile);
    const r = await p.evaluate(() => {
      const f = (sel, id) => {
        const bande = document.querySelector(sel), e = document.getElementById(id);
        const montre = getComputedStyle(e).display !== 'none';
        const caches = [...bande.querySelectorAll('.top-btn, .icon-btn, .tool-btn')].filter(x => {
          if (x.id === id || x.closest('.header-dropdown-content') || x.closest('.magic-menu-content')) return false;
          const b = x.getBoundingClientRect();
          return b.width && (b.right > innerWidth + 1 || b.left < -1);
        }).length;
        return { montre, caches };
      };
      return { entete: f('header', 'btnToutesCommandes'), outils: f('.toolbar', 'btnTousOutils') };
    });
    const juste = (x) => (x.caches > 0) === x.montre;
    ck(`${nom} : le bouton suit ce qui est caché`,
       juste(r.entete) && juste(r.outils),
       `en-tête ${r.entete.caches} caché(s)/bouton ${r.entete.montre} · outils ${r.outils.caches}/${r.outils.montre}`);
    await ctx.close();
  }

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
