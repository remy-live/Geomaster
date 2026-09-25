/* LE LIEN GARDE LA VUE DANS LAQUELLE ON TRAVAILLE.
 *
 * « Quand on fait créer un lien partageable, il faudrait pouvoir garder la vue
 *   dans laquelle on travaille. »
 *
 * Le cadrage était DÉJÀ dans le lien : getCompressedString y écrit
 * « ¦VIEW:zoom;x;y;largeur;hauteur », et loadFromCompressedString le rangeait
 * bien dans importedView. Mais syncViewWithTeacher, la fonction qui l'applique,
 * n'était appelée que dans la branche du mode lecture. Le cadrage faisait donc
 * tout le voyage — écrit, compressé, transporté, décompressé, relu — pour être
 * jeté à l'arrivée.
 *
 * MESURÉ, sur une vue de travail à zoom 2,3 centrée sur le point (516, 361) de
 * la feuille :
 *
 *     lien                       zoom    centre du monde
 *     ?mode=lecture&fig=         2,49    (516, 361)   ← exact
 *     ?fig=                      1       (646, 450)   ← le défaut
 *
 * CE QU'ON VÉRIFIE EST LA PORTION DE FEUILLE, PAS LE ZOOM. C'est le piège de
 * cette mesure, et la raison pour laquelle une première version de cette sonde
 * déclarait le mode lecture en échec : syncViewWithTeacher remet volontairement
 * le zoom à l'échelle de la fenêtre qui ouvre — 2,3 devient 2,49 quand la barre
 * d'outils disparaît et que le canevas s'élargit. Le nombre change POUR QUE le
 * cadrage ne change pas. On juge donc sur deux choses qui, elles, doivent être
 * stables : le point du monde au centre de l'écran, et la largeur de feuille
 * visible.
 *
 * ET L'ON OUVRE POUR DE BON, dans un second onglet, avec l'adresse complète.
 * Relire importedView dans la page qui a fabriqué le lien ne prouverait rien :
 * c'est précisément l'étape d'après qui manquait.
 */
const { chromium } = require('playwright');
const path = require('path');

const FICHIER = path.resolve(__dirname, '..', 'index.html');
const PAGE = 'file://' + FICHIER;

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

/* Ce qu'on voit d'une feuille : le point du monde au centre de l'écran, et
   combien de centimètres de feuille tiennent en largeur. */
const CE_QU_ON_VOIT = () => {
    const a = window.app;
    const cont = a.canvas.parentElement;
    const z = a.view.zoom || 1;
    return {
        zoom: Math.round(z * 100) / 100,
        cx: Math.round((cont.clientWidth / 2 - a.view.x) / z),
        cy: Math.round((cont.clientHeight / 2 - a.view.y) / z),
        largeurVue: Math.round(cont.clientWidth / z),
        objets: a.entities.length,
    };
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
        window.app.checkAutoSave = () => {};
    });

    /* ON TRAVAILLE DANS UNE VUE PARTICULIÈRE : un zoom franc et un décalage
       franc, pour qu'aucune valeur par défaut ne puisse passer pour la bonne. */
    const depart = await page.evaluate((voir) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        const A = new Point(400, 400, 'A'), B = new Point(700, 300, 'B');
        [A, B].forEach(p => a.addEntity(p));
        a.addEntity(new Segment(A, B, { color: '#000', width: 2 }));
        a.view.zoom = 2.3; a.view.x = -540; a.view.y = -380;
        a.render();
        const vu = new Function('return (' + voir + ')()')();
        return { vu, normal: a.lienDePartage(), lecture: a.lienDePartage('lecture'),
                 porteLeCadrage: LZString.decompressFromEncodedURIComponent(
                     a.codeDocument()).includes('¦VIEW:') };
    }, CE_QU_ON_VOIT.toString());

    console.log('\n=== le lien emporte le cadrage ===');
    ck('le code de la figure porte un bloc VIEW', depart.porteLeCadrage);
    ck('  et la vue de travail est bien particulière',
       depart.vu.zoom === 2.3, `zoom ${depart.vu.zoom}, centre (${depart.vu.cx}, ${depart.vu.cy})`);

    /* On ouvre POUR DE BON, dans un autre onglet, avec l'adresse complète. */
    const ouvrir = async (lien, largeur, hauteur) => {
        const q = lien.slice(lien.indexOf('?'));
        const p2 = await nav.newPage({ viewport: { width: largeur, height: hauteur } });
        const e2 = [];
        p2.on('pageerror', e => e2.push(e.message));
        await p2.goto('file://' + FICHIER + q);
        await p2.waitForFunction(() => window.app && window.app.entities.length > 0,
            { timeout: 20000 }).catch(() => {});
        await p2.waitForTimeout(700);
        const vu = await p2.evaluate((voir) => new Function('return (' + voir + ')()')(),
            CE_QU_ON_VOIT.toString());
        await p2.close();
        return { vu, erreurs: e2 };
    };

    for (const [titre, lien] of [['le lien ordinaire', depart.normal],
                                 ['le lien élève', depart.lecture]]) {
        console.log(`\n=== ${titre}, rouvert dans un autre onglet ===`);
        const r = await ouvrir(lien, 1400, 950);
        ck('la figure est là', r.vu.objets === depart.vu.objets,
           r.vu.objets + ' objets sur ' + depart.vu.objets);
        /* LE CENTRE, exact : c'est lui le cadrage. */
        const d = Math.hypot(r.vu.cx - depart.vu.cx, r.vu.cy - depart.vu.cy);
        ck('  on retrouve le même point au centre de l\'écran', d < 12,
           `(${r.vu.cx}, ${r.vu.cy}) contre (${depart.vu.cx}, ${depart.vu.cy}) — ${Math.round(d)} px`);
        /* LA PORTION DE FEUILLE, et non le zoom : le mode lecture élargit le
           canevas en masquant les outils, et le zoom suit pour compenser. */
        const ecart = Math.abs(r.vu.largeurVue - depart.vu.largeurVue) / depart.vu.largeurVue;
        ck('  et la même largeur de feuille', ecart < 0.08,
           `${r.vu.largeurVue} px de feuille contre ${depart.vu.largeurVue}`
           + ` (zoom ${r.vu.zoom} contre ${depart.vu.zoom})`);
        ck('  aucune erreur JS à l\'ouverture', r.erreurs.length === 0,
           r.erreurs.slice(0, 2).join(' | '));
    }

    /* UNE AUTRE FENÊTRE : c'est là que le choix de remettre le zoom à l'échelle
       se juge. Sur un écran deux fois moins large, on veut voir LA MÊME CHOSE,
       donc un zoom deux fois plus petit — pas le même nombre. */
    console.log('\n=== ouvert sur un écran plus étroit ===');
    const etroit = await ouvrir(depart.normal, 700, 950);
    ck('la figure est là', etroit.vu.objets === depart.vu.objets, etroit.vu.objets + ' objets');
    const dE = Math.hypot(etroit.vu.cx - depart.vu.cx, etroit.vu.cy - depart.vu.cy);
    ck('  le centre tient toujours', dE < 12,
       `(${etroit.vu.cx}, ${etroit.vu.cy}) — ${Math.round(dE)} px d'écart`);
    ck('  et le zoom a suivi la fenêtre au lieu de rester figé',
       etroit.vu.zoom < depart.vu.zoom * 0.75,
       `zoom ${etroit.vu.zoom} contre ${depart.vu.zoom}`);
    const ecartE = Math.abs(etroit.vu.largeurVue - depart.vu.largeurVue) / depart.vu.largeurVue;
    ck('    de sorte qu\'on voit la même portion de feuille', ecartE < 0.12,
       `${etroit.vu.largeurVue} px de feuille contre ${depart.vu.largeurVue}`);

    /* UN LIEN D'HIER, sans bloc VIEW : il doit s'ouvrir, et sans cadrage
       fantaisiste. On ne casse pas ce qui est déjà distribué. */
    console.log('\n=== un lien d\'avant, sans cadrage enregistré ===');
    const vieux = await page.evaluate(() => {
        const a = window.app;
        const code = a.codeDocument();
        const brut = LZString.decompressFromEncodedURIComponent(code);
        const sansVue = brut.split('¦').filter(p => !p.startsWith('VIEW:')).join('¦');
        return window.location.origin + window.location.pathname + '?fig='
            + LZString.compressToEncodedURIComponent(sansVue);
    });
    const rv = await ouvrir(vieux, 1400, 950);
    ck('il s\'ouvre quand même', rv.vu.objets === depart.vu.objets,
       rv.vu.objets + ' objets');
    ck('  au cadrage par défaut, sans rien inventer', rv.vu.zoom === 1,
       'zoom ' + rv.vu.zoom);
    ck('  et sans erreur', rv.erreurs.length === 0, rv.erreurs.slice(0, 2).join(' | '));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
