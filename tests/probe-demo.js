/* UNE AIDE QUI SE MONTRE AU LIEU DE SE LIRE.
 *
 * « Dans l'aide on pourrait avoir un mode démo où ça balaye les fonctions avec
 * une démo. » Puis, la première version vue tourner :
 *
 *   « Il faut montrer où on appuie sur l'icône, ce qui apparaît […] il faut
 *   montrer la plupart des outils, le crayon magique, les constructions
 *   magiques […] il faut faire rêver. »
 *
 *   « Pour les instruments, il faut montrer leur manipulation un par un. Il faut
 *   qu'ils soient la star. L'idée est vraiment de montrer LES OUTILS de
 *   Géomaster, pas de réaliser des figures. »
 *
 * Cette dernière phrase a défait la moitié du programme : cinq étapes montraient
 * de belles figures — l'hexagone, l'étoile, la rosace, le chat au compas — et
 * aucune ne montrait un outil. Ce qui reste ne montre que des OUTILS, et chaque
 * instrument a son étape à lui, où on le prend, on le déplace, on le tourne, et
 * où il sert.
 *
 * Rien n'y est simulé : aucune capture, aucun film, aucun faux bouton. La main de
 * la visite appuie sur les VRAIES icônes, écrit dans la VRAIE barre, trace sur la
 * VRAIE feuille — et prend les instruments par les VRAIES poignées, qu'elle
 * demande au logiciel lui-même (getHitZone) au lieu de les recopier.
 *
 * Ce que la sonde tient :
 *
 *   — le sommaire est écrit À PARTIR des étapes, pas recopié à côté. Une ligne
 *     ajoutée au programme s'ajoute toute seule à l'aide, et ne peut pas mentir ;
 *   — CHAQUE étape construit vraiment quelque chose ;
 *   — les QUATRE instruments ont chacun leur étape, et chacune le sort VRAIMENT
 *     et le manipule : mesuré, l'instrument bouge et tourne pour de bon ;
 *   — la main VA sur les icônes, et sur les VRAIES : chaque cible que la visite
 *     désigne doit exister dans la page. Une visite qui montre un bouton absent
 *     est pire qu'une visite absente ;
 *   — la médiatrice SE VOIT EN ENTIER. Mesuré avant : la figure occupait 1298 px
 *     de large pour 1292 px visibles, et ses arcs sortaient par le bas ;
 *   — la figure en cours est mise de côté et REMISE EN PLACE à la sortie, à
 *     l'objet près, avec le cadrage, la vitesse de rejeu et les réglages : une
 *     visite ne coûte pas son travail à qui la demande ;
 *   — et l'on peut en sortir. La barre vit au-dessus de l'interface verrouillée
 *     par le rejeu — sans quoi une aide deviendrait une prison.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    await page.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) {}
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        /* Une demi-seconde après l'ouverture, l'application demande « une
           sauvegarde automatique a été trouvée, voulez-vous la restaurer ? ».
           Vider le magasin ne suffit pas : la sonde POSE une figure et
           l'enregistre, ce qui réécrit la sauvegarde avant que la question ne
           soit posée. Elle se posait donc DANS la même boîte que celle de la
           visite, et par-dessus : mesuré, une fois sur deux, « Confirmer »
           restaurait un brouillon au lieu de lancer la démonstration — et
           j'allais accuser le clic. Personne ne lance une visite guidée dans la
           demi-seconde qui suit l'ouverture ; on désamorce la question au lieu
           de compter les millisecondes. */
        window.app.checkAutoSave = () => {};
    });

    console.log('\n=== l\'onglet, et son sommaire écrit à partir des étapes ===');
    const onglet = await page.evaluate(() => {
        const app = window.app;
        const btns = [...document.querySelectorAll('.help-tab-btn')];
        const b = btns.find(x => /D[ée]mo/i.test(x.textContent));
        if (!b) return { absent: true };
        app.switchHelpTab('demo', b);
        const ol = document.getElementById('demoSommaire');
        const titres = app.demoEtapes().map(e => e.titre);
        return { visible: document.getElementById('tab-demo').style.display,
                 lignes: ol ? [...ol.children].map(li => li.textContent) : [],
                 titres };
    });
    ck('l\'aide a un onglet « Démonstration »', !onglet.absent);
    ck('  il s\'affiche', onglet.visible === 'block', onglet.visible);
    ck('  et son sommaire vient des étapes elles-mêmes',
       JSON.stringify(onglet.lignes) === JSON.stringify(onglet.titres),
       onglet.lignes.length + ' lignes pour ' + onglet.titres.length + ' étapes');
    ck('  la visite balaye largement le logiciel', onglet.titres.length >= 10,
       onglet.titres.length + ' étapes');
    /* LES OUTILS, PAS LES FIGURES. Chaque instrument doit avoir son étape à lui :
       une étape qui les sort tous les quatre à la file n'en montre aucun. */
    const instr = ['#btn-ruler', '#btn-setsquare', '#btn-protractor', '#btn-compass'];
    const chacun = await page.evaluate((ids) => {
        const src = window.app.demoEtapes().map(e => String(e.faire));
        return ids.map(id => ({ id, n: src.filter(t => t.includes(id)).length }));
    }, instr);
    ck('  chaque instrument a son étape, et une seule',
       chacun.every(x => x.n === 1),
       chacun.map(x => x.id.replace('#btn-', '') + '×' + x.n).join(' '));
    const manip = await page.evaluate(() => {
        const src = window.app.demoEtapes().map(e => String(e.faire)).join('\n');
        return { bouge: (src.match(/outilBouger/g) || []).length,
                 tourne: (src.match(/outilTourner/g) || []).length,
                 zone: (src.match(/outilZone/g) || []).length };
    });
    ck('  et on l\'y manipule : on le déplace, on le tourne, on s\'en sert',
       manip.bouge >= 4 && manip.tourne >= 3 && manip.zone >= 3,
       JSON.stringify(manip));

    console.log('\n=== la main désigne des icônes qui EXISTENT ===');
    /* Les sélecteurs que la visite montre sont écrits en dur dans les étapes.
       Un bouton renommé, un onclick réécrit, et la main désignerait le vide en
       racontant qu'elle appuie : c'est exactement le genre de mensonge que
       cette visite existe pour ne pas faire. */
    const cibles = await page.evaluate(() => {
        const src = window.app.demoEtapes().map(e => String(e.faire)).join('\n');
        const sel = [...src.matchAll(/g\.viser\(\s*(?:outil|magie)\('([a-z_]+)'\)/g)]
            .map(m => /^magic_/.test(m[1])
                ? `.magic-grid-item[onclick="app.setTool('${m[1]}')"]`
                : `.tool-btn[onclick="app.setTool('${m[1]}')"]`);
        const ids = [...src.matchAll(/g\.viser\('(#[A-Za-z0-9_-]+)'/g)].map(m => m[1]);
        const tous = [...new Set([...sel, ...ids,
            '#btnConsigneEclair', '#ceGo', '#ceOutils', '#ceChamp'])];
        return tous.map(s => ({ s, la: !!document.querySelector(s) }));
    });
    const manquants = cibles.filter(c => !c.la);
    ck('chaque cible montrée existe dans la page', manquants.length === 0,
       cibles.length + ' cibles' + (manquants.length ? ' — absente(s) : '
        + manquants.map(c => c.s).join(', ') : ''));

    console.log('\n=== on met la figure de côté avant de partir ===');
    const avant = await page.evaluate(() => {
        const app = window.app;
        app.entities = []; app.historyPast = [];
        app.addEntity(new Point(300, 300, 'Z'));
        app.addEntity(new Point(600, 420, 'Y'));
        app.addEntity(new Segment(app.entities[0], app.entities[1], { color: '#000', width: 2 }));
        app.saveState();
        return { objets: app.entities.map(e => e.constructor.name + ':' + (e.label || '')),
                 vitesse: app.playbackSpeed,
                 style: JSON.stringify(app.globalStyle) };
    });
    await page.evaluate(() => window.app.demoDemarrer());
    /* On attend que la modale soit POSÉE — elle met son bouton au foyer en
       dernier — au lieu de compter les millisecondes : cliquer trop tôt ne
       déclenchait rien, et j'ai bien failli accuser le code. */
    await page.waitForFunction(() =>
        document.activeElement && document.activeElement.id === 'btnModalConfirm');
    const demande = await page.evaluate(() => ({
        modale: document.getElementById('customModal').style.display,
        texte: (document.getElementById('modalMessage') || {}).textContent || '' }));
    ck('sur une feuille occupée, on demande avant de l\'effacer',
       demande.modale === 'flex' && /mise de côté/.test(demande.texte),
       demande.texte.slice(0, 70));
    await page.click('#btnModalConfirm');
    await page.waitForTimeout(400);

    console.log('\n=== les étapes construisent vraiment ===');
    const total = onglet.titres.length;
    const vus = [];
    for (let k = 0; k < total; k++) {
        /* On attend que l'étape ait FINI ses gestes — elle pose alors son
           minuteur d'enchaînement — plutôt qu'un temps deviné : une étape qui
           trace un chat au compas ne dure pas ce que dure un clic. */
        let attente = 0;
        while (attente < 75000) {
            await page.waitForTimeout(500); attente += 500;
            const e = await page.evaluate(() => {
                const d = window.app._demo;
                return { i: d ? d.i : -1, pret: !!(d && d.fini) };
            });
            if (e.i !== k || e.pret) break;
        }
        const e = await page.evaluate(() => {
            const app = window.app;
            const boite = (app.canvas.parentElement || app.canvas).getBoundingClientRect();
            const b = app.getSceneBounds(false);
            const z = app.view.zoom || 1;
            const ecran = { x0: b.minX * z + app.view.x, y0: b.minY * z + app.view.y,
                            x1: b.maxX * z + app.view.x, y1: b.maxY * z + app.view.y };
            return { rang: document.getElementById('demoRang').textContent,
                     titre: document.getElementById('demoTitre').textContent,
                     dit: document.getElementById('demoDit').textContent,
                     barre: document.getElementById('demoBar').style.display,
                     objets: app.entities.filter(x => !(x instanceof ToolAnimation)).length,
                     encre: !!app.traitCroquis,
                     boucle: !!app.isLooping,
                     /* Un instrument SORTI n'est pas un instrument MONTRÉ. On note
                        où toggleWidget l'aurait posé — au centre de ce qu'on voit —
                        et l'on regarde s'il en a bougé, ou s'il a tourné. */
                     outils: (() => {
                         const noms = { ruler: 'rulerWidget', setsquare: 'setSquareWidget',
                                        protractor: 'protractorWidget', compass: 'compassWidget' };
                         const c = (app.canvas.parentElement || app.canvas).getBoundingClientRect();
                         const z = app.view.zoom || 1;
                         const cx = (c.width / 2 - app.view.x) / z, cy = (c.height / 2 - app.view.y) / z;
                         return Object.entries(noms)
                             .filter(([n]) => app.activeWidgets && app.activeWidgets[n])
                             .map(([n, champ]) => {
                                 const w = app[champ];
                                 return { n, d: Math.round(Math.hypot(w.x - cx, w.y - cy)),
                                          a: +(Math.abs(w.angle || 0)).toFixed(2) };
                             });
                     })(),
                     dedans: ecran.x0 > -3 && ecran.y0 > -3
                          && ecran.x1 < boite.width + 3 && ecran.y1 < boite.height + 3,
                     cadre: [Math.round(ecran.x0), Math.round(ecran.y0),
                             Math.round(ecran.x1), Math.round(ecran.y1)],
                     vue: [Math.round(boite.width), Math.round(boite.height)] };
        });
        vus.push(e);
        ck('étape ' + e.rang + ' · ' + e.titre,
           e.barre === 'flex' && e.objets >= 3 && !!e.titre && !!e.dit,
           e.objets + ' objets');
        if (k < total - 1) { await page.evaluate(() => window.app.demoAller(1)); await page.waitForTimeout(500); }
    }
    ck('  les étapes ont des titres tous différents',
       new Set(vus.map(v => v.titre)).size === total,
       new Set(vus.map(v => v.titre)).size + ' titres distincts');
    /* LA MÉDIATRICE, EN ENTIER. Elle est la plus large de la visite : le segment,
       les quatre arcs qui débordent de part et d'autre, et la droite qui traverse
       tout. Si une figure de la visite doit sortir du cadre, c'est celle-là. */
    const dehors = vus.filter(v => !v.dedans);
    ck('  chaque figure tient dans ce qu\'on voit, en entier',
       dehors.length === 0,
       dehors.length ? dehors.map(v => v.titre + ' ' + JSON.stringify(v.cadre)
                                      + ' dans ' + JSON.stringify(v.vue)).join(' | ')
                     : vus.length + ' figures cadrées');
    /* UNE CONSTRUCTION MAGIQUE LAISSE LE REJEU EN BOUCLE, et c'est fait exprès :
       on la regarde se refaire autant de fois qu'on veut. Ce qui n'allait pas,
       c'est que la boucle DÉBORDAIT sur l'étape suivante — mesuré, à partir de la
       médiatrice magique, isPlaying ne retombait plus jamais et chaque étape
       butait sur la minute d'attente, la visite passant de trois minutes et demie
       à treize. La sonde ne demande donc pas qu'aucune étape ne boucle : elle
       demande que celles qui REJOUENT aient bel et bien fini. */
    const rejouent = await page.evaluate(() =>
        window.app.demoEtapes().map(e => /g\.rejeu\(/.test(String(e.faire))));
    const coincees = vus.filter((v, i) => rejouent[i] && v.boucle);
    ck('  une étape qui rejoue va jusqu\'au bout, sans hériter d\'une boucle',
       coincees.length === 0,
       rejouent.filter(Boolean).length + ' étapes rejouent'
       + (coincees.length ? ', coincée(s) : ' + coincees.map(v => v.titre).join(', ') : ''));
    /* Le trait à main levée n'est pas un objet, c'est de l'encre : vider la
       feuille ne l'effaçait pas, et le carré tremblé du crayon magique restait
       en travers de la rosace deux étapes plus loin. */
    ck('  et aucune ne garde l\'encre de la précédente',
       vus.filter(v => v.encre).length === 0);
    /* « Pour les instruments, il faut montrer leur MANIPULATION un par un. »
       Sorti et laissé au centre, un instrument n'est pas montré : il est posé.
       On exige qu'il ait bougé d'au moins 40 px, ou tourné d'au moins 0,1 rad. */
    const sortis = vus.flatMap((v, i) => v.outils.map(o => ({ ...o, etape: v.titre })));
    const inertes = sortis.filter(o => o.d < 40 && o.a < 0.1);
    ck('  chaque instrument sorti est VRAIMENT manipulé',
       sortis.length >= 4 && inertes.length === 0,
       sortis.map(o => o.n + ' ' + o.d + 'px/' + o.a + 'rad').join(', ')
       + (inertes.length ? ' — inerte(s) : ' + inertes.map(o => o.n).join(', ') : ''));

    console.log('\n=== le curseur va où l\'on veut ===');
    /* Douze étapes, c'est trop pour avancer une par une quand on cherche celle du
       compas. */
    await page.evaluate(() => {
        const c = document.getElementById('demoCurseur');
        c.value = '4'; window.app.demoVersEtape('4');
    });
    await page.waitForTimeout(900);
    const saute = await page.evaluate(() => ({
        i: window.app._demo ? window.app._demo.i : -1,
        rang: document.getElementById('demoRang').textContent,
        curseur: document.getElementById('demoCurseur').value,
        max: document.getElementById('demoCurseur').max }));
    ck('la barre a un curseur, et il mène à l\'étape voulue',
       saute.i === 4 && saute.curseur === '4', JSON.stringify(saute));
    ck('  et il couvre toute la visite',
       parseInt(saute.max, 10) === onglet.titres.length - 1,
       '0 → ' + saute.max + ' pour ' + onglet.titres.length + ' étapes');

    console.log('\n=== la pause SUSPEND, elle ne recommence pas ===');
    /* « Le bouton pause fait tout démarrer. » Elle coupait les minuteurs de
       l'étape en cours, et reprendre la rejouait depuis le début. On mesure ce
       qui compte : mise en pause au milieu d'un geste, la feuille NE SE VIDE PAS
       et l'étape ne repart pas de zéro. */
    await page.evaluate(() => window.app.demoVersEtape('0'));
    await page.waitForTimeout(6000);
    const avantPause = await page.evaluate(() => ({
        n: window.app.entities.length, i: window.app._demo.i }));
    await page.evaluate(() => window.app.demoPause());
    const enPause = await page.evaluate(() => ({
        pause: !!(window.app._demo && window.app._demo.pause),
        bouton: document.getElementById('demoPause').textContent }));
    ck('la pause se voit sur le bouton', enPause.pause && enPause.bouton === '▶',
       JSON.stringify(enPause));
    await page.waitForTimeout(2500);
    const pendant = await page.evaluate(() => ({
        n: window.app.entities.length, i: window.app._demo.i }));
    ck('  en pause, rien ne bouge et rien ne recommence',
       pendant.n === avantPause.n && pendant.i === avantPause.i,
       avantPause.n + ' objets → ' + pendant.n);
    await page.evaluate(() => window.app.demoPause());
    await page.waitForTimeout(2500);
    const apresPause = await page.evaluate(() => ({
        n: window.app.entities.length, i: window.app._demo.i }));
    ck('  et l\'on repart où l\'on s\'était arrêté, sans revenir au début',
       apresPause.i === avantPause.i && apresPause.n >= avantPause.n,
       avantPause.n + ' → ' + apresPause.n + ' objets, étape '
       + (apresPause.i + 1));

    await page.evaluate(() => window.app.demoArreter());
    await page.waitForTimeout(300);
    const apres = await page.evaluate(() => ({
        objets: window.app.entities.map(e => e.constructor.name + ':' + (e.label || '')),
        barre: document.getElementById('demoBar').style.display,
        main: document.getElementById('demoMain').style.display,
        verrou: !!window.app.isLocked,
        vitesse: window.app.playbackSpeed,
        style: JSON.stringify(window.app.globalStyle),
        vue: [window.app.view.x, window.app.view.y, window.app.view.zoom],
        instruments: Object.values(window.app.activeWidgets || {}).filter(Boolean).length,
        demo: !!window.app._demo }));
    ck('la barre disparaît', apres.barre === 'none', apres.barre);
    ck('  et la main aussi', apres.main === 'none', apres.main);
    ck('l\'interface est déverrouillée', apres.verrou === false);
    ck('les instruments sont rangés', apres.instruments === 0,
       apres.instruments + ' instrument(s) restés sur la feuille');
    ck('la vitesse de rejeu est rendue', apres.vitesse === avant.vitesse,
       avant.vitesse + ' → ' + apres.vitesse);
    /* L'étape de la palette change le style du trait POUR DE BON — c'est bien
       l'idée. On sortait donc de la visite avec un crayon bleu, en pointillés et
       deux fois trop épais, sans avoir rien demandé. */
    ck('le style du crayon est rendu', apres.style === avant.style,
       avant.style + ' → ' + apres.style);
    ck('le cadrage est rendu',
       JSON.stringify(apres.vue) === JSON.stringify([0, 0, 1]), JSON.stringify(apres.vue));
    ck('et la figure est rendue telle qu\'on l\'a trouvée',
       JSON.stringify(apres.objets) === JSON.stringify(avant.objets),
       JSON.stringify(avant.objets) + ' → ' + JSON.stringify(apres.objets));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
