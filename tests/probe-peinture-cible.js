/* LE POT DE PEINTURE VISE CE QU'ON MONTRE.
 *
 * « Le mode peinture ne fonctionne pas sur un point qui est au bout d'un segment
 *   par exemple. »
 *
 * Et c'est bien « par exemple » : le défaut ne tenait pas à ce point-là mais à la
 * règle de désignation. La peinture prenait le DERNIER objet de la liste qui
 * touche le doigt — or un segment est créé APRÈS ses deux extrémités, et un
 * polygone après ses côtés. Mesuré, un clic pile sur A :
 *
 *     sous le doigt : Point(A), Segment      →      désigné : Segment
 *
 * Le point n'arrivait jamais son tour, quels que soient le zoom et la précision
 * du clic. Un point LIBRE, lui, se peignait parfaitement — c'est ce qui rendait
 * le défaut si déroutant à décrire : « ça marche, sauf sur les points qui
 * servent à quelque chose ».
 *
 * CE QU'ON A CHANGÉ N'EST PAS UN CAS PARTICULIER MAIS LA PRIORITÉ. Le reste du
 * logiciel sait déjà désigner : `closestPoint`, le point visible le plus proche
 * dans la tolérance de clic, décide du déplacement et de la sélection. La
 * peinture s'en sert désormais comme eux — sous le doigt, un POINT l'emporte sur
 * le trait qui le traverse. C'est aussi ce qu'on attend d'un pot de peinture :
 * on vise la petite chose, pas celle qui passe derrière.
 *
 * LES DEUX BORDS SONT TENUS, car un correctif de désignation déborde vite :
 * le MILIEU d'un segment doit peindre le segment, et le vide ne doit rien
 * peindre du tout.
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
        window.app.checkAutoSave = () => {};
    });
    const rect = await page.evaluate(() => {
        const r = window.app.canvas.getBoundingClientRect();
        return { x: r.left, y: r.top };
    });
    const clic = async (x, y) => {
        await page.mouse.move(rect.x + x, rect.y + y);
        await page.mouse.down();
        await page.mouse.move(rect.x + x + 1, rect.y + y + 1);
        await page.mouse.up();
        await page.waitForTimeout(70);
    };

    const planter = () => page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = []; a.historyFuture = [];
        a.view = { zoom: 1, x: 0, y: 0 };
        a.currentTool = 'move';
        const A = new Point(300, 300, 'A'), B = new Point(700, 300, 'B');
        const C = new Point(500, 620, 'C');     /* un point LIBRE, sans trait */
        a.addEntity(A); a.addEntity(B); a.addEntity(C);
        a.addEntity(new Segment(A, B));
        a.saveState();
        a.isPaintMode = true;
        a.globalStyle.color = '#c0392b';
        a.render();
    });
    const couleurs = () => page.evaluate(() => {
        const o = {};
        window.app.entities.forEach(e => {
            o[e.constructor.name + (e.label ? '(' + e.label + ')' : '')] = e.color || '—';
        });
        return o;
    });

    /* ============================================================
       1. LE POINT AU BOUT DU SEGMENT
       ============================================================ */
    console.log('\n=== un clic pile sur A, extrémité du segment [AB] ===');
    await planter();
    await clic(300, 300);
    let c = await couleurs();
    ck('A est peint', c['Point(A)'] === '#c0392b', c['Point(A)']);
    ck('  et le segment n\'a PAS été peint à sa place',
       c['Segment'] !== '#c0392b', c['Segment']);
    ck('  ni l\'autre extrémité', c['Point(B)'] !== '#c0392b', c['Point(B)']);

    /* ============================================================
       2. LES DEUX BORDS : le milieu du trait, et le vide
       ============================================================ */
    console.log('\n=== le milieu du segment peint bien le segment ===');
    await planter();
    await clic(500, 300);
    c = await couleurs();
    ck('le segment est peint', c['Segment'] === '#c0392b', c['Segment']);
    ck('  et aucune extrémité ne l\'est',
       c['Point(A)'] !== '#c0392b' && c['Point(B)'] !== '#c0392b',
       `${c['Point(A)']} / ${c['Point(B)']}`);

    console.log('\n=== un point libre se peint comme avant ===');
    await planter();
    await clic(500, 620);
    c = await couleurs();
    ck('C est peint', c['Point(C)'] === '#c0392b', c['Point(C)']);

    console.log('\n=== et un clic dans le vide ne peint rien ===');
    await planter();
    const avant = await couleurs();
    await clic(1100, 800);
    const apres = await couleurs();
    ck('rien n\'a changé', JSON.stringify(avant) === JSON.stringify(apres),
       JSON.stringify(apres));

    /* ============================================================
       3. UN SOMMET DE POLYGONE — le « par exemple » du signalement
       Un polygone est créé après ses côtés, qui sont créés après ses sommets :
       c'est le cas le plus enfoui de la liste.
       ============================================================ */
    console.log('\n=== un sommet de polygone, l\'objet le plus enfoui ===');
    await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = []; a.historyFuture = [];
        a.view = { zoom: 1, x: 0, y: 0 };
        a.currentTool = 'move';
        const P = [[300, 300], [600, 300], [600, 600], [300, 600]]
            .map(([x, y], i) => new Point(x, y, 'ABCD'[i]));
        P.forEach(p => a.addEntity(p));
        for (let i = 0; i < 4; i++) a.addEntity(new Segment(P[i], P[(i + 1) % 4]));
        a.addEntity(new Polygon([...P]));
        a.saveState();
        a.isPaintMode = true; a.globalStyle.color = '#27ae60';
        a.render();
    });
    await clic(300, 300);
    c = await couleurs();
    ck('le sommet A est peint', c['Point(A)'] === '#27ae60', c['Point(A)']);
    ck('  et ni un côté ni le polygone ne l\'ont été',
       c['Segment'] !== '#27ae60' && c['Polygon'] !== '#27ae60',
       `côté ${c['Segment']} · polygone ${c['Polygon']}`);

    /* ============================================================
       4. LE GESTE RESTE ANNULABLE EN UN SEUL CTRL+Z
       ============================================================ */
    console.log('\n=== et le coup de pinceau s\'annule d\'un seul Ctrl+Z ===');
    await planter();
    const n0 = await page.evaluate(() => window.app.historyPast.length);
    await clic(300, 300);
    const n1 = await page.evaluate(() => window.app.historyPast.length);
    ck('il a laissé exactement un état', n1 === n0 + 1, `${n0} → ${n1}`);
    await page.evaluate(() => window.app.undo());
    await page.waitForTimeout(50);
    c = await couleurs();
    ck('  et un Ctrl+Z lui rend sa couleur', c['Point(A)'] !== '#c0392b', c['Point(A)']);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
