/* UNE DROITE SE DÉPLACE, ET ELLE GARDE SA PENTE.
 *
 * « Pourrait-on bouger une droite (on garde sa pente) ? »
 *
 * On ne le pouvait pas. On ne prenait que ses extrémités — ce qui la fait
 * PIVOTER, pas glisser — et pour la translater il fallait déplacer A puis B du
 * même vecteur, à la main, sans se tromper. Mesuré : tirée par son milieu, la
 * droite ne bougeait pas d'un pixel.
 *
 * On la prend maintenant par son trait, et ses deux points partent ensemble : la
 * pente est conservée PAR CONSTRUCTION, puisque le vecteur est le même pour les
 * deux. Rien à vérifier après coup, rien qui dérive.
 *
 * Deux garde-fous, et la sonde les tient tous les deux :
 *
 *   — seuls les traits dont les DEUX extrémités sont libres se prennent ainsi.
 *     Une droite bâtie sur un milieu ou sur un croisement appartient à ce qui la
 *     porte : la tirer par le trait n'aurait aucun sens, puisque ses points ne
 *     s'appartiennent pas ;
 *   — et le CADRE DE SÉLECTION doit survivre. Il naît d'un appui dans le vide ;
 *     si le trait le mangeait, on perdrait le geste qui encadre une figure.
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
    /* Chaque enregistrement écrit une sauvegarde automatique, et la modale
       « une sauvegarde a été trouvée, voulez-vous la restaurer ? » vient alors
       se poser SUR le canevas : les appuis suivants ne l'atteignent plus. C'est
       le décor de la sonde, pas un défaut — on l'écarte. */
    const ecarterModale = () => page.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) {}
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
    });
    await ecarterModale();

    const coin = await page.evaluate(() => {
        const c = document.getElementById('geoCanvas').getBoundingClientRect();
        return { x: c.left, y: c.top };
    });

    /* Un glissement à la souris, comme une main : par petits pas, ET en
       laissant respirer entre chacun. Envoyés à la file, les mouvements se font
       absorber par le navigateur — mesuré, le segment n'avançait alors que d'un
       pas sur dix, et j'ai bien failli accuser l'application. */
    const glisser = async (x, y, dx, dy) => {
        await page.mouse.move(coin.x + x, coin.y + y);
        await page.mouse.down();
        for (let i = 1; i <= 10; i++) {
            await page.mouse.move(coin.x + x + (dx * i) / 10, coin.y + y + (dy * i) / 10);
            await page.waitForTimeout(16);
        }
        await page.mouse.up();
        await page.waitForTimeout(120);
    };

    const poser = async (quoi) => {
        await ecarterModale();
        return page.evaluate((q) => {
        const app = window.app;
        app.entities = []; app.historyPast = [];
        if (app.cslOublier) app.cslOublier();
        app.viderSelection && app.viderSelection();
        const A = new Point(400, 500, 'A'), B = new Point(900, 620, 'B');
        app.addEntity(A); app.addEntity(B);
        let obj;
        if (q === 'droite') obj = new Line(A, B, { color: '#000', width: 2 });
        if (q === 'segment') obj = new Segment(A, B, { color: '#000', width: 2 });
        if (q === 'portee') {
            /* Une droite bâtie sur un MILIEU : elle ne s'appartient pas. */
            const C = new Point(650, 900, 'C'); app.addEntity(C);
            const M = new Point(0, 0, '', [A, B]); M.update(); app.addEntity(M);
            obj = new Line(M, C, { color: '#000', width: 2 });
        }
        app.addEntity(obj);
        app.setTool('move'); app.render();
        const pente = (o) => (o.p2.y - o.p1.y) / (o.p2.x - o.p1.x);
        return { pente: pente(obj), p1: { x: obj.p1.x, y: obj.p1.y },
                 p2: { x: obj.p2.x, y: obj.p2.y } };
        }, quoi);
    };

    const lire = () => page.evaluate(() => {
        const app = window.app;
        const obj = app.entities.find(e => e instanceof Line || e instanceof Segment);
        const pente = (obj.p2.y - obj.p1.y) / (obj.p2.x - obj.p1.x);
        return { pente, p1: { x: Math.round(obj.p1.x), y: Math.round(obj.p1.y) },
                 p2: { x: Math.round(obj.p2.x), y: Math.round(obj.p2.y) },
                 cadre: !!app.cadreSelection };
    });

    console.log('\n=== on prend la droite par son trait ===');
    for (const quoi of ['droite', 'segment']) {
        const avant = await poser(quoi);
        await glisser(650, 560, 80, -60);
        const apres = await lire();
        const dx = apres.p1.x - Math.round(avant.p1.x), dy = apres.p1.y - Math.round(avant.p1.y);
        const dx2 = apres.p2.x - Math.round(avant.p2.x), dy2 = apres.p2.y - Math.round(avant.p2.y);
        ck(quoi + ' : elle se déplace', dx !== 0 || dy !== 0,
           'déplacée de (' + dx + ', ' + dy + ')');
        ck('  et elle garde sa pente, au millième',
           Math.abs(apres.pente - avant.pente) < 0.001,
           avant.pente.toFixed(3) + ' → ' + apres.pente.toFixed(3));
        ck('  les deux extrémités du MÊME vecteur', dx === dx2 && dy === dy2,
           '(' + dx + ', ' + dy + ') et (' + dx2 + ', ' + dy2 + ')');
    }

    console.log('\n=== mais pas celle qui ne s\'appartient pas ===');
    const avantP = await poser('portee');
    await glisser(660, 780, 70, -50);
    const apresP = await lire();
    ck('une droite bâtie sur un milieu ne se tire pas par le trait',
       apresP.p1.x === Math.round(avantP.p1.x) && apresP.p1.y === Math.round(avantP.p1.y),
       JSON.stringify(avantP.p1) + ' → ' + JSON.stringify(apresP.p1));

    console.log('\n=== et le cadre de sélection survit ===');
    await poser('droite');
    /* Un appui LOIN du trait doit toujours ouvrir un cadre. */
    await page.mouse.move(coin.x + 300, coin.y + 200);
    await page.mouse.down();
    await page.waitForTimeout(30);
    await page.mouse.move(coin.x + 340, coin.y + 240);
    await page.waitForTimeout(30);
    const pendant = await page.evaluate(() => !!window.app.cadreSelection);
    await page.mouse.up();
    ck('un appui dans le vide ouvre encore un cadre', pendant === true);

    /* Et un cadre tiré autour de la figure la sélectionne toujours. */
    await poser('droite');
    await glisser(300, 380, 700, 380);
    const choisis = await page.evaluate(() => (window.app._selection || []).length);
    ck('  et il attrape la figure', choisis > 0, choisis + ' objet(s) sélectionné(s)');

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
