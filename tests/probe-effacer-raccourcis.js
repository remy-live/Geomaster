/* TOUT EFFACER, ET LES DEUX OUTILS QU'ON REPREND SANS CESSE.
 *
 * « Quand on met tout effacer, si l'animation est en route, ça bloque la
 * prochaine session. De plus quand on met tout effacer les outils se rangent.
 * Y a-t-il des raccourcis pour la souris ou la main ? Si oui mets en tooltip
 * aussi, si non fais-en. »
 *
 * TROIS CHOSES, ET LA PREMIÈRE EST UN GEL. « Tout effacer » vidait la feuille
 * sans prévenir le rejeu qui tournait dessus. Mesuré, juste après l'effacement :
 * isPlaying et isLocked restaient VRAIS sur une feuille vide, et le curseur
 * affichait « interdit » — l'interface était gelée le temps que le moteur
 * s'aperçoive qu'il n'a plus rien à jouer. Ctrl+Z, lui, appelle depuis longtemps
 * la fonction qui arrête proprement le rejeu avant de toucher à l'historique ;
 * « tout effacer » ne l'appelait pas. C'est le même besoin : l'historique change
 * sous les pieds du rejeu.
 *
 * DEUXIÈMEMENT, LA TABLE DOIT ÊTRE NETTE. Une feuille vide avec la règle,
 * l'équerre, le rapporteur et le compas encore posés dessus n'est pas une
 * feuille vide.
 *
 * TROISIÈMEMENT, IL N'Y AVAIT AUCUN RACCOURCI pour la flèche ni pour la main —
 * les deux outils sur lesquels on revient après chaque tracé. S comme
 * Sélectionner, M comme Main : les initiales, en français. Et ils sont écrits
 * dans l'infobulle des deux boutons, car un raccourci que personne ne découvre
 * n'existe pas.
 *
 * Le garde-fou qui compte pour des touches d'une seule lettre : elles ne doivent
 * RIEN faire pendant qu'on écrit. La sonde tape « ms » dans la barre éclair et
 * vérifie que l'outil n'a pas bougé et que les deux lettres sont bien dans le
 * champ.
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
        window.app.checkAutoSave = () => {};
    });

    const etat = () => page.evaluate(() => ({
        n: window.app.entities.length,
        joue: !!window.app.isPlaying,
        verrou: !!window.app.isLocked,
        boucle: !!window.app.isLooping,
        anim: !!window.app.isToolAnimating,
        curseur: window.app.canvas.style.cursor,
        outil: window.app.currentTool,
        outils: Object.entries(window.app.activeWidgets || {})
            .filter(([, v]) => v).map(([k]) => k).sort().join('+') || '—',
        boutonMain: document.getElementById('btnPan').classList.contains('active'),
        boutonFleche: !!document.querySelector(
            '.tool-btn.active[onclick="app.setTool(\'move\')"]') }));

    const effacer = async () => {
        await page.evaluate(() => {
            window.app.clearAll();
            document.getElementById('btnModalConfirm').click();
        });
        /* AUSSITÔT, pas « au bout d'un moment » : c'est justement le délai qui
           gelait l'interface. */
        await page.waitForTimeout(120);
    };

    console.log('\n=== effacer pendant que l\'animation tourne ===');
    await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.executerConsigneAvec('Trace un hexagone régulier de 3 cm', true);
        a.playFromStart();
    });
    await page.waitForFunction(() => window.app.isToolAnimating, { timeout: 20000 })
        .catch(() => {});
    const pendant = await etat();
    ck('le décor est bien planté : le rejeu tourne et verrouille',
       pendant.joue && pendant.verrou, JSON.stringify({ n: pendant.n, joue: pendant.joue,
       verrou: pendant.verrou, curseur: pendant.curseur }));
    await effacer();
    const apres = await etat();
    ck('la feuille est vide', apres.n === 0, apres.n + ' objets');
    ck('  et AUSSITÔT rien ne joue, rien n\'est verrouillé',
       !apres.joue && !apres.verrou && !apres.boucle && !apres.anim,
       JSON.stringify({ joue: apres.joue, verrou: apres.verrou,
                        boucle: apres.boucle, anim: apres.anim }));
    ck('  le curseur n\'est plus « interdit »',
       apres.curseur !== 'not-allowed', apres.curseur || '(aucun)');

    /* Et l'on peut repartir : une construction, son rejeu, jusqu'au bout. */
    const repart = await page.evaluate(() => {
        const a = window.app;
        let r;
        try { r = a.executerConsigneAvec('Trace un carré ABCD de 4 cm de côté', true); }
        catch (e) { return { erreur: e.message }; }
        a.playbackSpeed = 60;
        a.playFromStart();
        return { ok: !!(r && r.ok), n: a.entities.length };
    });
    let fini = false;
    for (let t = 0; t < 120 && !fini; t++) {
        await page.waitForTimeout(500);
        fini = await page.evaluate(() => !window.app.isPlaying);
    }
    ck('on repart aussitôt : la construction suivante se rejoue jusqu\'au bout',
       repart.ok && fini, JSON.stringify(repart) + (fini ? '' : ' — REJEU BLOQUÉ'));

    console.log('\n=== tout effacer range aussi les instruments ===');
    await page.evaluate(() => {
        const a = window.app;
        a.playbackSpeed = 500;
        a.addEntity(new Point(400, 400, 'A'));
        ['ruler', 'setsquare', 'protractor', 'compass'].forEach(w => {
            if (!a.activeWidgets[w]) a.toggleWidget(w);
        });
    });
    const avecOutils = await etat();
    ck('les quatre instruments sont sur la feuille',
       avecOutils.outils === 'compass+protractor+ruler+setsquare', avecOutils.outils);
    await effacer();
    const nette = await etat();
    ck('  après « tout effacer », la table est nette',
       nette.outils === '—' && nette.n === 0,
       nette.n + ' objets, instruments : ' + nette.outils);

    console.log('\n=== la flèche et la main ont leur raccourci ===');
    const bulles = await page.evaluate(() => ({
        fleche: document.querySelector('.tool-btn[onclick="app.setTool(\'move\')"]')
            .dataset.tooltip || '',
        main: document.getElementById('btnPan').dataset.tooltip || '' }));
    ck('l\'infobulle de la flèche annonce la touche',
       /\(S\)/.test(bulles.fleche), bulles.fleche.slice(0, 40));
    ck('  et celle de la main aussi',
       /\(M\)/.test(bulles.main), bulles.main.slice(0, 40));

    await page.evaluate(() => window.app.setTool('circle'));
    await page.keyboard.press('KeyS');
    await page.waitForTimeout(120);
    const surS = await etat();
    ck('S reprend la flèche, et son bouton s\'allume',
       surS.outil === 'move' && surS.boutonFleche && !surS.boutonMain,
       JSON.stringify({ outil: surS.outil, fleche: surS.boutonFleche }));

    await page.keyboard.press('KeyM');
    await page.waitForTimeout(120);
    const surM = await etat();
    ck('M prend la main, et c\'est SON bouton qui s\'allume',
       surM.outil === 'pan' && surM.boutonMain && !surM.boutonFleche,
       JSON.stringify({ outil: surM.outil, main: surM.boutonMain }));

    /* Rappuyer sur M ne doit pas la reposer : on demande la main, on l'a. */
    await page.keyboard.press('KeyM');
    await page.waitForTimeout(120);
    const encore = await etat();
    ck('  et rappuyer sur M la garde', encore.outil === 'pan', encore.outil);

    await page.keyboard.press('KeyS');
    await page.waitForTimeout(120);
    const retour = await etat();
    ck('  S ramène la flèche depuis la main, et éteint son bouton',
       retour.outil === 'move' && !retour.boutonMain,
       JSON.stringify({ outil: retour.outil, main: retour.boutonMain }));

    console.log('\n=== mais pas une lettre pendant qu\'on écrit ===');
    /* Le garde-fou qui compte : une touche d'une seule lettre ne doit rien
       piloter tant qu'un champ a le foyer, sinon écrire « ms » dans une consigne
       changerait deux fois d'outil au lieu d'écrire deux lettres. */
    await page.evaluate(async () => {
        window.app.setTool('circle');
        window.app.ouvrirConsigneEclair();
        await new Promise(k => setTimeout(k, 250));
        document.getElementById('ceChamp').focus();
    });
    await page.waitForTimeout(200);
    await page.keyboard.type('ms');
    await page.waitForTimeout(150);
    const enEcrivant = await page.evaluate(() => ({
        outil: window.app.currentTool,
        texte: document.getElementById('ceChamp').value }));
    ck('taper « ms » dans un champ écrit « ms » et ne change pas d\'outil',
       enEcrivant.texte === 'ms' && enEcrivant.outil === 'circle',
       JSON.stringify(enEcrivant));
    await page.evaluate(() => window.app.fermerConsigneEclair());

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
