/* LE STYLO MAGIQUE MONTRE CE QU'IL TRACE, ET RANGE SES LETTRES DEHORS.
 *
 * « Le stylo magique n'écrit rien mais donne la figure finale. Quand tu places
 *   les lettres (sur un rectangle par exemple), utilise le placement magique qui
 *   fait que la lettre est bien placée. »
 *
 * DEUX PANNES, ET LA PREMIÈRE N'ÉTAIT PAS L'OUTIL. L'aperçu du geste — le trait
 * bleu qu'on voit se former sous le doigt — était dessiné TOUT EN HAUT de
 * dessinerTout, avant this.drawGrid(). Or sur fond blanc, drawGrid ne dessine
 * pas un quadrillage : il repeint la feuille en blanc. L'aperçu passait donc
 * dessous et disparaissait. Mesuré, pixels non blancs sur une bande de 360×40
 * traversée par le geste, PENDANT le geste :
 *
 *   outil            quadrillage       points  isométrique        blanc
 *   magic_croquis           1903         1296         2813            0
 *   croquis                 1903         1296         2813            0
 *   stylo                   1341          722         2212            0
 *
 * Trois outils, un seul fond : ce n'était pas « le stylo magique n'écrit rien »,
 * c'était « rien ne s'écrit sur une feuille blanche ». Le bloc est passé juste
 * avant dessinerSelection, à la fin du dessin. C'est cette sonde qui tient
 * l'ordre : elle mesure les quatre fonds, pas seulement celui du démarrage.
 *
 * LA SECONDE EST LE RANGEMENT DES LETTRES. finirCroquis était le seul chemin de
 * création à ne pas appeler autoPlaceLabels : les quatre sommets d'un rectangle
 * croqué gardaient l'angle par défaut, droit au-dessus. A et B tombaient juste
 * par accident, étant en haut ; C et D se posaient DANS la figure, sur leurs
 * propres marques d'angle droit.
 *
 * ET LE RANGEMENT LUI-MÊME NE SAVAIT PAS RÉPONDRE. computeBestLabelAngle ne
 * connaissait que deux cas : le point d'un Polygon — bissectrice vers le dehors,
 * la bonne réponse — et tout le reste, où il ne regardait QU'UN SEUL trait et
 * posait la lettre perpendiculairement, sans savoir de quel côté est le dedans.
 * Or un croquis ne fabrique pas de Polygon : quatre points, quatre segments,
 * quatre angles droits. Le trou valait pour toute figure faite trait par trait,
 * à la règle comme au stylo. Deux traits qui se rejoignent suffisent à désigner
 * le dehors ; c'est ce que fait maintenant la règle générale, et les quatre
 * lettres sortent par leur coin : -135, -45, 45, 135.
 *
 * ON NE RANGE QUE CE QU'ON VIENT DE POSER — dernier point tenu ici. Ranger toute
 * la feuille déplacerait les lettres qu'on a écartées à la main sur une figure
 * d'à côté, et celles-là, personne ne les a mises là par hasard.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

/* Le geste : un tour de rectangle, en huit pas par côté pour que l'aperçu ait
   le temps d'exister entre deux points. */
const tracer = async (page, sommets, relacher) => {
    await page.mouse.move(sommets[0].x, sommets[0].y);
    await page.mouse.down();
    let dep = sommets[0];
    for (const p of sommets.slice(1)) {
        for (let k = 1; k <= 8; k++) {
            await page.mouse.move(dep.x + (p.x - dep.x) * k / 8, dep.y + (p.y - dep.y) * k / 8);
        }
        dep = p;
    }
    if (relacher) { await page.mouse.up(); await page.waitForTimeout(700); }
};

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    const propre = () => page.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        const c = document.getElementById('croquisModal');
        if (c) c.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });
    await propre();

    /* ============================================================
       1. L'APERÇU DU GESTE, SUR LES QUATRE FONDS
       La mesure compte les pixels non blancs d'une bande que le trait
       traverse, PENDANT le geste — bouton enfoncé, rien encore construit.
       ============================================================ */
    console.log('\n=== on voit le trait pendant qu\'on le trace, sur les quatre fonds ===');
    const FONDS = [[0, 'quadrillage'], [1, 'points'], [2, 'isométrique'], [3, 'blanc']];
    for (const outil of ['magic_croquis', 'croquis', 'stylo']) {
        for (const [g, nomFond] of FONDS) {
            const geo = await page.evaluate(([o, g]) => {
                const a = window.app;
                a.entities = []; a.historyPast = [];
                if (a.cslOublier) a.cslOublier();
                a.traitCroquis = null;
                a.gridMode = g;
                a.setTool(o);
                a.render();
                const r = a.canvas.getBoundingClientRect();
                const e = (x, y) => ({ x: r.left + x * a.view.zoom + a.view.x,
                                       y: r.top + y * a.view.zoom + a.view.y });
                return [e(400, 300), e(800, 300), e(800, 560)];
            }, [outil, g]);
            await tracer(page, geo, false);
            await page.waitForTimeout(90);
            const encre = await page.evaluate(() => {
                const x = window.app.canvas.getContext('2d');
                const d = x.getImageData(500, 280, 360, 40).data;
                let n = 0;
                for (let i = 0; i < d.length; i += 4) {
                    if (d[i + 3] > 40 && !(d[i] > 230 && d[i + 1] > 230 && d[i + 2] > 230)) n++;
                }
                return n;
            });
            ck(`${outil} sur fond ${nomFond}`, encre > 200, encre + ' pixels d\'encre');
            await page.mouse.up();
            await page.waitForTimeout(250);
            await propre();
            await page.evaluate(() => { window.app.traitCroquis = null; });
        }
    }

    /* ============================================================
       2. LES LETTRES DU CROQUIS SORTENT DE LA FIGURE
       ============================================================ */
    console.log('\n=== les lettres d\'un rectangle croqué se rangent dehors ===');
    const geo = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        a.gridMode = 0;
        a.isAutoLabelMode = true;
        a.setTool('croquis');
        a.render();
        const r = a.canvas.getBoundingClientRect();
        const e = (x, y) => ({ x: r.left + x * a.view.zoom + a.view.x,
                               y: r.top + y * a.view.zoom + a.view.y });
        return [e(400, 300), e(800, 300), e(800, 560), e(400, 560), e(400, 300)];
    });
    await tracer(page, geo, true);

    const fig = await page.evaluate(() => {
        const a = window.app;
        const pts = a.entities.filter(e => e instanceof Point && e.label);
        if (!pts.length) return { vide: true };
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        const dist = 20;
        return {
            n: pts.length,
            lettres: pts.map((p) => {
                const ang = (p.labelAngle !== undefined) ? p.labelAngle : -Math.PI / 2;
                const lx = p.x + Math.cos(ang) * dist;
                const ly = p.y + Math.sin(ang) * dist;
                return {
                    l: p.label,
                    /* DEHORS : l'étiquette est plus loin du centre que son point. */
                    dehors: Math.hypot(lx - cx, ly - cy) > Math.hypot(p.x - cx, p.y - cy),
                    /* Et c'est bien le rangement magique qui l'a mise là. */
                    magique: Math.abs(ang - a.computeBestLabelAngle(p)) < 1e-6,
                    deg: Math.round(ang * 180 / Math.PI),
                };
            }),
        };
    });
    ck('le croquis a posé quatre sommets nommés', fig.n === 4, String(fig.n || 0));
    (fig.lettres || []).forEach((x) => {
        ck(`  ${x.l} est dehors`, x.dehors, x.deg + '°');
        ck(`  ${x.l} est au rangement magique`, x.magique);
    });
    /* Les quatre coins d'un rectangle sortent par leurs quatre diagonales : si
       deux lettres partagent une direction, l'une des deux longe un côté. */
    const directions = new Set((fig.lettres || []).map(x => x.deg));
    ck('  et les quatre partent dans quatre directions', directions.size === 4,
       [...directions].join('°, ') + '°');

    /* ============================================================
       3. ON NE RANGE QUE CE QU'ON VIENT DE POSER
       ============================================================ */
    console.log('\n=== une lettre écartée à la main ailleurs ne bouge pas ===');
    const avant = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        a.isAutoLabelMode = true;
        const z = new Point(1200, 900, 'Z');
        z.labelAngle = 0.4242;              // écartée à la main, valeur reconnaissable
        a.addEntity(z);
        a.saveState();                      // la feuille d'avant, pour pouvoir y revenir
        a.setTool('croquis');
        a.render();
        return a.entities.filter(e => e instanceof Point).length;
    });
    ck('la feuille porte déjà une lettre rangée à la main', avant === 1, String(avant));
    await tracer(page, geo, true);
    const apres = await page.evaluate(() => {
        const a = window.app;
        const z = a.entities.find(e => e instanceof Point && e.label === 'Z');
        return { trouve: !!z, angle: z ? z.labelAngle : null,
                 pts: a.entities.filter(e => e instanceof Point).length };
    });
    ck('le croquis a bien construit par-dessus', apres.pts >= 5, apres.pts + ' points');
    ck('  et Z a gardé son angle', apres.trouve && Math.abs(apres.angle - 0.4242) < 1e-9,
       String(apres.angle));

    /* L'annulation doit retrouver les lettres à leur place : le rangement est
       fait AVANT saveState, sans quoi l'état enregistré serait l'ancien. */
    console.log('\n=== et l\'annulation retrouve la feuille d\'avant ===');
    const undo = await page.evaluate(() => {
        const a = window.app;
        a.undo();
        const z = a.entities.find(e => e instanceof Point && e.label === 'Z');
        return { pts: a.entities.filter(e => e instanceof Point).length,
                 zAngle: z ? z.labelAngle : null };
    });
    ck('un seul point revient', undo.pts === 1, undo.pts + ' points');
    ck('  et c\'est Z, à son angle', Math.abs((undo.zAngle || 0) - 0.4242) < 1e-9,
       String(undo.zAngle));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
