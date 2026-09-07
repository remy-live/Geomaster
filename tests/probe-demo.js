/* UNE AIDE QUI SE MONTRE AU LIEU DE SE LIRE.
 *
 * « Dans l'aide on pourrait avoir un mode démo où ça balaye les fonctions avec
 * une démo. »
 *
 * Les quatre onglets de l'aide DÉCRIVENT le logiciel ; le cinquième le FAIT.
 * Huit étapes, sur la feuille, jouées l'une après l'autre — et rien n'y est
 * simulé : chaque étape est une vraie consigne, exécutée pour de bon et rejouée
 * geste par geste. C'est la seule façon de montrer un outil qui ne mente pas
 * quand l'outil change : le jour où une consigne cesse de marcher, la visite
 * s'en aperçoit, et cette sonde aussi.
 *
 * Ce que la sonde tient :
 *
 *   — le sommaire est écrit À PARTIR des étapes, pas recopié à côté. Une ligne
 *     ajoutée au programme s'ajoute toute seule à l'aide, et ne peut pas mentir ;
 *   — CHAQUE étape construit vraiment quelque chose, et lance le rejeu ;
 *   — la figure en cours est mise de côté et REMISE EN PLACE à la sortie, à
 *     l'objet près : une visite ne coûte pas son travail à qui la demande ;
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

    console.log('\n=== on met la figure de côté avant de partir ===');
    const avant = await page.evaluate(() => {
        const app = window.app;
        app.entities = []; app.historyPast = [];
        app.addEntity(new Point(300, 300, 'Z'));
        app.addEntity(new Point(600, 420, 'Y'));
        app.addEntity(new Segment(app.entities[0], app.entities[1], { color: '#000', width: 2 }));
        app.saveState();
        return app.entities.map(e => e.constructor.name + ':' + (e.label || ''));
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

    console.log('\n=== les huit étapes construisent vraiment ===');
    const vus = [];
    for (let k = 0; k < 8; k++) {
        const e = await page.evaluate(() => ({
            rang: document.getElementById('demoRang').textContent,
            titre: document.getElementById('demoTitre').textContent,
            dit: document.getElementById('demoDit').textContent,
            barre: document.getElementById('demoBar').style.display,
            objets: window.app.entities.length,
            joue: !!window.app.isPlaying }));
        vus.push(e);
        if (k < 7) { await page.evaluate(() => window.app.demoAller(1)); await page.waitForTimeout(350); }
    }
    vus.forEach((v, i) => {
        ck('étape ' + v.rang + ' · ' + v.titre,
           v.barre === 'flex' && v.objets > 2 && !!v.titre && !!v.dit,
           v.objets + ' objets' + (v.joue ? ', le rejeu tourne' : ''));
    });
    ck('  les huit étapes ont des titres tous différents',
       new Set(vus.map(v => v.titre)).size === 8,
       new Set(vus.map(v => v.titre)).size + ' titres distincts');
    ck('  et au moins six lancent une animation',
       vus.filter(v => v.joue).length >= 6,
       vus.filter(v => v.joue).length + ' étapes en cours de rejeu');

    console.log('\n=== on peut mettre en pause, et sortir ===');
    await page.evaluate(() => window.app.demoPause());
    const enPause = await page.evaluate(() => ({
        pause: !!(window.app._demo && window.app._demo.pause),
        bouton: document.getElementById('demoPause').textContent }));
    ck('la pause se voit sur le bouton', enPause.pause && enPause.bouton === '▶',
       JSON.stringify(enPause));

    await page.evaluate(() => window.app.demoArreter());
    await page.waitForTimeout(300);
    const apres = await page.evaluate(() => ({
        objets: window.app.entities.map(e => e.constructor.name + ':' + (e.label || '')),
        barre: document.getElementById('demoBar').style.display,
        verrou: !!window.app.isLocked,
        demo: !!window.app._demo }));
    ck('la barre disparaît', apres.barre === 'none', apres.barre);
    ck('l\'interface est déverrouillée', apres.verrou === false);
    ck('et la figure est rendue telle qu\'on l\'a trouvée',
       JSON.stringify(apres.objets) === JSON.stringify(avant),
       JSON.stringify(avant) + ' → ' + JSON.stringify(apres.objets));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
