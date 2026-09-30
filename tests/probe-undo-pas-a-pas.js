/* UN GESTE, UN CTRL+Z.
 *
 * « Les undo parfois embarquent 2 étapes. »
 *
 * LA PILE CONTIENT LES ÉTATS D'APRÈS CHAQUE ACTION : undo() dépile le dernier et
 * rend le précédent. Or la moitié des outils n'enregistraient que l'état
 * d'AVANT, celui pris à l'appui — et comme cet état est justement celui qu'a
 * laissé le geste précédent, saveState l'écartait comme doublon. Le geste
 * n'entrait alors JAMAIS dans l'historique, et le Ctrl+Z suivant remontait d'un
 * cran de trop : il défaisait deux gestes.
 *
 * MESURÉ, GESTES À LA SOURIS SUR FEUILLE VIDE — le compte des états dit tout :
 *
 *     clic de point          1 objet   · 0 état poussé   ← jamais enregistré
 *     glissé de segment      3 objets  · 2 états         ← deux Ctrl+Z pour un geste
 *     angle (3 clics)        4 objets  · 2 états
 *     polygone (5 clics)     9 objets  · 5 états         ← jamais le dernier
 *
 * Deux symptômes opposés, une seule cause : deux conventions mélangées dans la
 * même pile. Les gestes qui enregistraient leur arrivée poussaient bien un état ;
 * ceux qui n'enregistraient que leur départ n'en poussaient aucun quand le geste
 * précédent avait fait son travail — et DEUX quand il ne l'avait pas fait, d'où
 * le « parfois ».
 *
 * CE QUE LA SONDE MESURE, ET POURQUOI PAS AUTRE CHOSE. Pas le nombre d'appels à
 * saveState, qui est une affaire interne : ce que l'utilisateur constate. Elle
 * joue une suite de gestes À LA SOURIS, relève la figure après chacun, puis
 * annule un par un et exige de retomber exactement sur les jalons, en sens
 * inverse. Un geste = un état = un Ctrl+Z.
 *
 * LES OUTILS À PLUSIEURS CLICS COMPTENT PAR CLIC. Un polygone de quatre sommets
 * se défait en quatre Ctrl+Z, pas en un : chaque clic pose un point, et c'est
 * l'unité de geste. La sonde le vérifie explicitement, parce que c'est un choix
 * et non une conséquence — et ma première version de cette sonde s'est trompée
 * là-dessus avant que la mesure ne me corrige.
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
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        const a = window.app;
        a.checkAutoSave = () => {};
        a.entities = []; a.historyPast = []; a.historyFuture = [];
        a.view = { zoom: 1, x: 0, y: 0 };
        a.isObjectMagnetActive = true;
        a.saveState();
    });
    const rect = await page.evaluate(() => {
        const r = window.app.canvas.getBoundingClientRect();
        return { x: r.left, y: r.top };
    });

    const etat = () => page.evaluate(() => ({
        n: window.app.entities.length,
        passe: window.app.historyPast.length,
        quoi: window.app.entities.map(e => e.constructor.name
            + (e instanceof Point ? '(' + (e.label || '?') + ')' : '')).join('·'),
    }));
    const outil = (t) => page.evaluate((t) => { window.app.currentTool = t; }, t);
    const clic = async (x, y) => {
        await page.mouse.move(rect.x + x, rect.y + y);
        await page.mouse.down();
        await page.mouse.move(rect.x + x + 1, rect.y + y + 1);
        await page.mouse.up();
        await page.waitForTimeout(60);
    };
    const glisser = async (x1, y1, x2, y2) => {
        await page.mouse.move(rect.x + x1, rect.y + y1);
        await page.mouse.down();
        for (let k = 1; k <= 6; k++) {
            await page.mouse.move(rect.x + x1 + (x2 - x1) * k / 6,
                                  rect.y + y1 + (y2 - y1) * k / 6);
        }
        await page.mouse.up();
        await page.waitForTimeout(80);
    };

    /* CHAQUE ENTRÉE EST UN GESTE ÉLÉMENTAIRE : un clic, ou un glissé. */
    const GESTES = [
        ['point : clic 1', async () => { await outil('point'); await clic(200, 200); }],
        ['point : clic 2', async () => { await clic(320, 200); }],
        ['segment : glissé dans le vide', async () => { await outil('segment'); await glisser(200, 420, 520, 420); }],
        ['segment : depuis un point existant', async () => { await glisser(200, 200, 620, 260); }],
        ['cercle : glissé', async () => { await outil('circle'); await glisser(760, 520, 860, 520); }],
        ['déplacer : bouger un point', async () => { await outil('move'); await glisser(320, 200, 350, 170); }],
        ['angle : clic 1', async () => { await outil('angle'); await clic(1000, 620); }],
        ['angle : clic 2', async () => { await clic(1100, 660); }],
        ['angle : clic 3 (il ferme l\'angle)', async () => { await clic(1040, 760); }],
        ['polygone : clic 1', async () => { await outil('polygon'); await clic(150, 700); }],
        ['polygone : clic 2', async () => { await clic(250, 700); }],
        ['polygone : clic 3', async () => { await clic(250, 800); }],
        ['polygone : clic 4', async () => { await clic(150, 800); }],
        ['polygone : le clic qui ferme', async () => { await clic(150, 700); }],
        ['peinture sur un trait', async () => {
            await outil('move');
            await page.evaluate(() => { window.app.isPaintMode = true; window.app.globalStyle.color = '#c0392b'; });
            await clic(360, 420);
            await page.evaluate(() => { window.app.isPaintMode = false; });
        }],
        ['gomme : effacer un point', async () => { await outil('delete'); await clic(1000, 620); }],
    ];

    console.log('\n=== chaque geste ajoute exactement un état ===');
    const jalons = [];
    let passePrec = (await etat()).passe;
    for (const [nom, faire] of GESTES) {
        await faire();
        const e = await etat();
        jalons.push(e);
        ck(nom, e.passe === passePrec + 1,
           `${e.passe - passePrec} état(s), ${e.n} objets`);
        passePrec = e.passe;
    }

    console.log('\n=== et chaque Ctrl+Z défait exactement ce geste-là ===');
    for (let k = GESTES.length - 1; k >= 0; k--) {
        await page.evaluate(() => window.app.undo());
        await page.waitForTimeout(40);
        const e = await etat();
        const attendu = k === 0 ? { n: 0, quoi: '' } : { n: jalons[k - 1].n, quoi: jalons[k - 1].quoi };
        const ok = e.n === attendu.n && e.quoi === attendu.quoi;
        ck(`on revient avant « ${GESTES[k][0]} »`, ok,
           ok ? `${e.n} objets` : `${e.n} objets au lieu de ${attendu.n}`);
        if (!ok) {
            console.log(`       obtenu  : ${e.quoi || '(vide)'}`);
            console.log(`       attendu : ${attendu.quoi || '(vide)'}`);
        }
    }

    /* ============================================================
       ET LE REFAIRE REMET TOUT EN PLACE
       Une pile dont les états sont décalés d'un cran se voit aussi au redo :
       on doit retrouver la figure exactement telle qu'on l'avait laissée.
       ============================================================ */
    console.log('\n=== puis Ctrl+Y rend la figure entière ===');
    for (let k = 0; k < GESTES.length; k++) {
        await page.evaluate(() => window.app.redo());
        await page.waitForTimeout(30);
    }
    const fin = await etat();
    const der = jalons[jalons.length - 1];
    ck('la figure est revenue au caractère près', fin.quoi === der.quoi,
       fin.quoi === der.quoi ? fin.n + ' objets' : `${fin.n} au lieu de ${der.n}`);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
