/* UN BOUTON ALLUMÉ DOIT SE VOIR ALLUMÉ.
 *
 * « Le crayon est on mais il n'est pas montré actif, comme s'il était off. »
 *
 * C'était exact, et la cause tenait à un partage : le bouton naissait BLEU et
 * disait « Crayon (ON) » — les deux écrits en dur dans le HTML — mais la classe
 * « active », celle qui dessine le fond du bouton enfoncé, n'était posée que par
 * `initStudentInterface()`, le dock élève, qui ne s'exécute pas sur la page du
 * professeur. Trois façons de dire « allumé », dont deux seulement au rendez-vous.
 *
 * Mesuré à l'ouverture, avant : showPencil = true, infobulle « Crayon (ON) »,
 * mine bleue, et bouton actif = FALSE. Il fallait éteindre puis rallumer pour
 * qu'il ait enfin l'air de ce qu'il était depuis le début.
 *
 * L'apparence se déduit maintenant de l'état, en un seul endroit — et la sonde
 * vérifie les trois marques ensemble, à l'ouverture comme après chaque clic :
 * une apparence à moitié juste est un mensonge à moitié.
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
    await page.waitForTimeout(300);

    const etat = () => page.evaluate(() => {
        const b = document.getElementById('btnPencil');
        if (!b) return null;
        const svg = b.querySelector('svg');
        const bleu = svg && /2980b9|41,\s*128,\s*185/.test(svg.style.color || '');
        return { on: !!window.app.showPencil,
                 actif: b.classList.contains('active'),
                 bleu: !!bleu,
                 dit: (b.dataset.tooltip || '') };
    });

    /* Les trois marques disent-elles la même chose que l'état ? */
    const accord = (e) => e && e.actif === e.on && e.bleu === e.on
        && e.dit === (e.on ? 'Crayon (ON)' : 'Crayon (OFF)');
    const dire = (e) => e ? `on=${e.on} actif=${e.actif} bleu=${e.bleu} « ${e.dit} »` : 'bouton absent';

    console.log('\n=== à l\'ouverture ===');
    const depart = await etat();
    ck('le crayon est allumé', depart && depart.on === true, dire(depart));
    ck('  et son bouton le montre — classe, couleur et infobulle d\'accord',
       accord(depart), dire(depart));

    console.log('\n=== et à chaque clic ===');
    for (let i = 1; i <= 3; i++) {
        await page.evaluate(() => window.app.togglePencil());
        const e = await etat();
        ck('clic ' + i + ' : l\'apparence suit l\'état', accord(e), dire(e));
    }

    /* Le dock élève porte le même crayon : il doit s'accorder aussi. */
    console.log('\n=== le dock élève dit la même chose ===');
    const dock = await page.evaluate(() => {
        if (typeof initStudentInterface === 'function' && !document.getElementById('studentDock')) {
            try { initStudentInterface(); } catch (e) { return { erreur: e.message }; }
        }
        const b2 = document.getElementById('stdPencilBtn');
        if (!b2) return { absent: true };
        window.app.showPencil = false; window.app.majBoutonCrayon();
        const eteint = b2.classList.contains('active');
        window.app.showPencil = true; window.app.majBoutonCrayon();
        return { eteint, allume: b2.classList.contains('active') };
    });
    if (dock.absent || dock.erreur) {
        console.log('  · dock élève non monté ici — non jugé' + (dock.erreur ? ' (' + dock.erreur + ')' : ''));
    } else {
        ck('éteint puis rallumé, le crayon du dock suit',
           dock.eteint === false && dock.allume === true, JSON.stringify(dock));
    }

    console.log('\n=== un seul outil allumé à la fois ===');
    /* « L'icône segment reste toujours allumée. » Elle l'était : la ligne qui
       éteint l'outil précédent épargnait tous les boutons dont l'identifiant
       commence par « btn- », pour ne pas éteindre les quatre instruments quand on
       change d'outil de tracé. Or les instruments ne portent pas cette classe-là,
       ils ont la leur — l'exception ne protégeait donc personne, et elle attrapait
       le seul outil de tracé qui ait un identifiant : le segment. Passé du segment
       au cercle, on voyait DEUX icônes allumées, et celle du segment ne
       s'éteignait plus jamais. */
    const suite = await page.evaluate(() => {
        const app = window.app;
        const lire = () => [...document.querySelectorAll('.tool-btn.active')]
            .map(b => (b.getAttribute('onclick') || b.id || '?')
                .replace("app.setTool('", '').replace("')", ''));
        const vus = [];
        ['point', 'segment', 'circle', 'angle', 'move', 'segment', 'point'].forEach(o => {
            app.setTool(o);
            vus.push({ o, actifs: lire() });
        });
        /* Et par un vrai clic sur l'icône, comme le fait une main. */
        document.querySelector('.tool-btn[onclick="app.setTool(\'segment\')"]').click();
        const apresClic = lire();
        document.querySelector('.tool-btn[onclick="app.setTool(\'move\')"]').click();
        return { vus, apresClic, apresMove: lire() };
    });
    const fautives = suite.vus.filter(v => v.actifs.length !== 1 || v.actifs[0] !== v.o);
    ck('changer d\'outil n\'en laisse qu\'un allumé',
       fautives.length === 0,
       fautives.length ? fautives.map(v => v.o + ' → ' + v.actifs.join('+')).join(', ')
                       : suite.vus.map(v => v.o).join(' → '));
    ck('  et le segment s\'éteint comme les autres',
       suite.apresClic.join() === 'segment' && suite.apresMove.join() === 'move',
       JSON.stringify(suite.apresClic) + ' puis ' + JSON.stringify(suite.apresMove));
    /* L'exception voulait protéger les instruments : ils doivent effectivement
       rester allumés quand on change d'outil de tracé — avec LEUR classe. */
    const trousse = await page.evaluate(() => {
        const app = window.app;
        ['ruler', 'setsquare', 'protractor', 'compass'].forEach(w => {
            if (!app.activeWidgets[w]) app.toggleWidget(w);
        });
        app.setTool('point');
        return ['ruler', 'setsquare', 'protractor', 'compass'].map(w => {
            const b = document.getElementById('btn-' + w);
            return w + ':' + (b && b.classList.contains('widget-active') ? 'allumé' : 'ÉTEINT');
        });
    });
    ck('  tandis que les instruments sortis restent allumés',
       trousse.every(t => /allumé$/.test(t)), trousse.join(' '));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
