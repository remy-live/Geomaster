/* UN GESTE COMMENCÉ SUR LA FEUILLE SE SUIT JUSQU'AU BOUT, MÊME HORS DE LA FEUILLE.
 *
 * « J'ai eu quelques bugs de […] traits de compas qui ne veulent pas se faire
 *   car ils atteignent une sorte de limite. » — une professeure qui s'en sert
 *   tous les jours en classe.
 *
 * LA LIMITE, C'ÉTAIT LE BORD DU CANEVAS. `pointermove` était écouté sur le
 * canevas SEUL — alors que `pointerup`, lui, l'était sur la fenêtre — si bien que
 * tout geste cessait d'avancer dès que le pointeur passait sur la barre du haut,
 * sur un panneau, ou sortait de la fenêtre. Le compas est l'instrument qui le
 * paie le plus cher : sa mine décrit un cercle, et un cercle de 8 cm de rayon ne
 * tient pas dans la hauteur visible d'une feuille projetée.
 *
 * MESURÉ AVANT, un tour complet tenté à la main :
 *   · écartement 4 cm, mine toujours sur le canevas → l'arc fait 360° ;
 *   · 8 cm, la mine sort à 88° → 360° quand même, car un saut d'angle de moins
 *     d'un demi-tour se rattrape à la rentrée : c'est ce rattrapage qui faisait
 *     passer le défaut pour une bizarrerie intermittente ;
 *   · 14 cm, elle sort dès 4° → IL NE SE TRACE RIEN DU TOUT ;
 *   · 19,2 cm, 170° de rotation → 25° d'arc.
 * Après : 170° de rotation donnent 170° d'arc.
 *
 * LA CAPTURE DU POINTEUR RÈGLE CELA D'UNE LIGNE, et pour tous les gestes à la
 * fois — le compas, le stylo, la règle, un point qu'on déplace. La sonde le
 * vérifie donc aussi AU STYLO, en comptant les points du tracé : un trait qui
 * passe sur la barre d'outils gardait un trou de plusieurs centaines de pixels.
 *
 * ET ELLE SURVEILLE LE PIÈGE QUE CETTE CORRECTION OUVRE. Rien ne bornait
 * l'écartement du compas : le geste se suivant maintenant hors de la fenêtre, une
 * seule traction donnait 50,4 cm de rayon, molette d'ouverture et mine à 1 500 px
 * hors de l'écran — un instrument qu'on ne pouvait plus ni refermer ni employer.
 * La feuille fait 19,6 cm de large ; l'écartement s'arrête donc à 20 cm.
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
    await page.waitForTimeout(900);
    await page.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });

    /* Le compas posé à une place connue, avec un écartement connu : une sonde qui
       tourne une mine doit savoir où est le centre. */
    const poserCompas = (x, y, r) => page.evaluate(([cx, cy, rr]) => {
        const a = window.app;
        a.entities = []; a.historyPast = []; a.historyFuture = [];
        a.view = { x: 0, y: 0, zoom: 1 };
        if (!a.activeWidgets.compass) a.toggleWidget('compass');
        const w = a.compassWidget;
        w.x = cx; w.y = cy; w.angle = 0; w.radius = rr;
        w.rotMin = undefined; w.rotMax = undefined;
        a.currentTracingArc = null;
        a.render();
        const b = a.canvas.getBoundingClientRect(), v = a.view;
        const q = CompassWidget.pastilleOuverture(w.radius);
        return {
            centre: { x: b.left + v.x + cx * v.zoom, y: b.top + v.y + cy * v.zoom },
            mine: { x: b.left + v.x + (cx + rr) * v.zoom, y: b.top + v.y + cy * v.zoom },
            pastille: { x: b.left + v.x + (cx + q.x) * v.zoom, y: b.top + v.y + (cy + q.y) * v.zoom },
            canevas: { l: b.left, t: b.top }, rayon: rr,
        };
    }, [x, y, r]);

    /* On fait tourner la mine le long de son cercle, comme une main. */
    const tourner = async (g, degres) => {
        await page.mouse.move(g.mine.x, g.mine.y);
        await page.mouse.down();
        let sorties = 0;
        for (let d = 4; d <= degres; d += 4) {
            const a2 = d * Math.PI / 180;
            const px = g.centre.x + Math.cos(a2) * g.rayon;
            const py = g.centre.y + Math.sin(a2) * g.rayon;
            if (px < g.canevas.l || py < g.canevas.t || px > 1400 || py > 950) sorties++;
            await page.mouse.move(px, py);
            await page.waitForTimeout(6);
        }
        await page.mouse.up();
        await page.waitForTimeout(150);
        const arcs = await page.evaluate(() => window.app.entities
            .filter(e => e.constructor.name === 'CompassArc')
            .map(x => Math.abs(x.endAngle - x.startAngle) * 180 / Math.PI));
        return { arcs: arcs.map(v => Math.round(v * 10) / 10), sorties };
    };

    // ------------------------------------------------------------------
    console.log('\n=== le compas trace même quand sa mine sort de la feuille ===');
    let g = await poserCompas(500, 500, 200);
    let r = await tourner(g, 360);
    ck('écartement 4 cm : le cercle se ferme', r.arcs.length === 1 && r.arcs[0] >= 355,
       `${r.arcs.join(', ')}° · ${r.sorties} positions hors feuille`);

    g = await poserCompas(500, 500, 400);
    r = await tourner(g, 360);
    ck('écartement 8 cm : le cercle se ferme encore', r.arcs.length === 1 && r.arcs[0] >= 355,
       `${r.arcs.join(', ')}° · ${r.sorties} positions hors feuille`);

    /* LE CAS QUI MORDAIT : la mine passe hors de la FENÊTRE et n'y revient pas.
       On ne demande pas le tour complet — à ce rayon il ne tient pas à l'écran —
       mais que l'arc fasse l'angle qu'on a vraiment tourné. */
    g = await poserCompas(260, 500, 900);
    r = await tourner(g, 170);
    ck('écartement 18 cm : 170° tournés donnent 170° d\'arc',
       r.arcs.length === 1 && r.arcs[0] >= 165,
       `${r.arcs.join(', ')}° · ${r.sorties} positions hors feuille (25° avant la correction)`);

    // ------------------------------------------------------------------
    console.log('\n=== et l\'écartement s\'arrête à la largeur de la feuille ===');
    g = await poserCompas(300, 500, 120);
    await page.mouse.move(g.pastille.x, g.pastille.y);
    await page.mouse.down();
    for (let x = g.pastille.x; x <= 3000; x += 100) { await page.mouse.move(x, g.pastille.y); await page.waitForTimeout(6); }
    await page.mouse.up(); await page.waitForTimeout(120);
    /* CE QU'IL FAUT MESURER, C'EST QUE LA MOLETTE RESTE ATTRAPABLE — et non que
       le rayon vaille un nombre précis, qui dépend de la place du compas et du
       zoom. Un plafond respecté dont la poignée est hors de l'écran ne vaut rien :
       c'était le cas à 20 cm, la molette tombant 39 px au-delà du bord. */
    const ouvert = await page.evaluate(() => {
        const a = window.app, w = a.compassWidget;
        const b = a.canvas.getBoundingClientRect(), v = a.view;
        const q = CompassWidget.pastilleOuverture(w.radius);
        const ex = b.left + v.x + (w.x + q.x) * v.zoom;
        const ey = b.top + v.y + (w.y + q.y) * v.zoom;
        return { px: Math.round(w.radius), cm: Math.round(w.radius / 50 * 10) / 10,
                 molette: { x: Math.round(ex), y: Math.round(ey) },
                 attrapable: ex > 0 && ey > 0 && ex < window.innerWidth && ey < window.innerHeight };
    });
    ck('tirée à 1 600 px hors de l\'écran, l\'ouverture s\'arrête et sa molette reste visible',
       ouvert.attrapable && ouvert.px <= 1000,
       `${ouvert.cm} cm, molette à (${ouvert.molette.x}, ${ouvert.molette.y}) dans une fenêtre de 1400×950 — 50,4 cm et molette hors écran avant la correction`);
    ck('  et elle s\'ouvre quand même largement', ouvert.px >= 750,
       `${ouvert.cm} cm (un cercle de 15 cm de rayon doit rester possible)`);
    /* ET UNE BORNE N'EST PAS UN VERROU : on referme du même geste, à l'envers.
       On repart d'un compas posé net plutôt que d'enchaîner sur le geste
       précédent : deux gestes à la file, le second partait de la molette que le
       premier venait de déplacer, et la sonde mesurait alors un enchaînement, pas
       une fermeture. */
    g = await poserCompas(300, 500, 800);
    await page.mouse.move(g.pastille.x, g.pastille.y);
    await page.mouse.down();
    for (let x = g.pastille.x; x >= g.centre.x + 160; x -= 60) { await page.mouse.move(x, g.pastille.y); await page.waitForTimeout(8); }
    await page.mouse.up(); await page.waitForTimeout(120);
    const referme = await page.evaluate(() => Math.round(window.app.compassWidget.radius));
    ck('  et il se referme (la borne n\'est pas un verrou)', referme < 300, referme + ' px');

    // ------------------------------------------------------------------
    /* LA MÊME CORRECTION VAUT POUR TOUS LES GESTES, et le stylo le montre en
       comptant ses points : un trait qui passe sur la barre d'outils gardait un
       trou là où les mouvements n'étaient plus reçus. */
    console.log('\n=== un trait au stylo qui passe sur la barre ne se coupe plus ===');
    const trait = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.view = { x: 0, y: 0, zoom: 1 };
        /* L'outil s'appelle « stylo » : « pen » ne sélectionne rien, et la sonde
           mesurait alors l'absence de tracé au lieu du tracé. */
        a.setTool('stylo');
        a.render();
        const b = a.canvas.getBoundingClientRect();
        return { haut: b.top, gauche: b.left };
    });
    /* on monte en ligne droite jusqu'au-dessus de la barre, puis on redescend */
    await page.mouse.move(600, 300);
    await page.mouse.down();
    for (let y = 300; y >= 10; y -= 10) { await page.mouse.move(600, y); await page.waitForTimeout(5); }
    for (let y = 10; y <= 300; y += 10) { await page.mouse.move(620, y); await page.waitForTimeout(5); }
    await page.mouse.up(); await page.waitForTimeout(200);
    /* ON NE COMPTE PAS LES POINTS : LE STYLO SIMPLIFIE SON TRACÉ. Deux segments
       droits se rangent en quatre points, et ma première mesure y voyait un
       « trou de 290 px » qui n'était que la droite entre deux sommets. Ce qui se
       mesure, c'est jusqu'OÙ l'encre est montée : la barre d'outils occupe les
       51 premiers pixels de la fenêtre, donc tout ce qui est au-dessus du bord
       haut de la feuille n'a pu être tracé QUE si le geste y était encore suivi. */
    const encre = await page.evaluate(() => {
        const a = window.app;
        const an = a.entities.filter(e => e.constructor.name === 'Annotation');
        if (!an.length) return null;
        let minV = Infinity, n = 0;
        an.forEach(e => (e.local || []).forEach(q => { minV = Math.min(minV, q.v); n++; }));
        return { traits: an.length, points: n, hautDeLEncre: Math.round(minV) };
    });
    ck('l\'encre monte au-dessus du bord de la feuille, sous la barre d\'outils',
       !!encre && encre.hautDeLEncre <= -20,
       encre ? `${encre.traits} trait(s), ${encre.points} points, le plus haut à ${encre.hautDeLEncre} (0 = le bord de la feuille)`
             : 'aucun trait');

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
