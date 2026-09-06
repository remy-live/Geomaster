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

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
