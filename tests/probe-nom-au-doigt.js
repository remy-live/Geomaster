/* LE NOM D'UN POINT SE PLACE AU DOIGT — ET LE CADRAN A ÉTÉ RETIRÉ.
 *
 * CETTE SONDE EN REMPLACE UNE AUTRE, et il faut dire laquelle.
 * `probe-cadran.js` gardait un petit disque, dans le menu du point, qui servait
 * à placer le nom autour de lui. Elle gardait surtout un défaut tenace : au
 * doigt, le navigateur émet souvent `pointercancel` au lieu de `pointerup`, et
 * le cadran continuait de suivre la main après le geste.
 *
 * POURQUOI LE CADRAN N'EST PLUS LÀ. « Ce qui me sert très peu, c'est de changer
 * croix, rond, pixel, la taille, et le rond du nom du point. » Mesuré avant de
 * couper, et c'est la mesure qui a décidé : le nom se déplace DÉJÀ en
 * l'attrapant directement sur la feuille.
 *
 *     avant le glissé   labelAngle −1,571 · isManuallyPlaced false
 *     après le glissé   labelAngle  2,356 · labelDistance 56,6 · true
 *                       et le POINT n'a pas bougé
 *
 * Le cadran ne faisait donc rien que la manipulation directe ne fasse mieux :
 * on voit où l'on pose, au lieu de viser un disque de 60 px — et au tableau,
 * viser petit est précisément ce qu'on veut éviter. Soixante lignes de
 * glissement, de capture de pointeur et de rattrapage du `pointercancel`
 * tactile sont parties avec lui, ainsi que son CSS.
 *
 * CE QUE CETTE SONDE TIENT MAINTENANT. Le geste qui reste doit marcher, à la
 * souris ET au doigt : attraper le nom, le poser ailleurs, sans emmener le
 * point. Et le cadran ne doit pas revenir — ni son élément, ni son code.
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
    const erreurs = [];

    for (const c of [{ n: 'à la souris', w: 1400, h: 950, touch: false },
                     { n: 'au doigt', w: 1024, h: 768, touch: true }]) {
        const ctx = await nav.newContext({ viewport: { width: c.w, height: c.h }, hasTouch: c.touch });
        const page = await ctx.newPage();
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
            a.currentTool = 'move';
            a.addEntity(new Point(500, 400, 'A'));
            a.saveState();
            a.render();
        });
        console.log(`\n=== ${c.n} ===`);
        const avant = await page.evaluate(() => {
            const A = window.app.entities[0];
            return { angle: A.labelAngle, pose: !!A.isManuallyPlaced, x: A.x, y: A.y };
        });
        /* on attrape le NOM là où le logiciel l'écrit, et on le pose en bas à gauche */
        const r = await page.evaluate(() => {
            const b = window.app.canvas.getBoundingClientRect();
            const A = window.app.entities[0];
            const ang = (A.labelAngle === undefined || A.labelAngle === null) ? -Math.PI / 4 : A.labelAngle;
            const d = A.labelDistance || 20;
            return { ox: b.left, oy: b.top,
                     nx: A.x + Math.cos(ang) * d, ny: A.y + Math.sin(ang) * d,
                     cx: A.x, cy: A.y };
        });
        await page.mouse.move(r.ox + r.nx, r.oy + r.ny);
        await page.mouse.down();
        for (let k = 1; k <= 8; k++) {
            await page.mouse.move(r.ox + r.nx + ((r.cx - 45) - r.nx) * k / 8,
                                  r.oy + r.ny + ((r.cy + 45) - r.ny) * k / 8);
        }
        await page.mouse.up();
        await page.waitForTimeout(150);
        const apres = await page.evaluate(() => {
            const A = window.app.entities[0];
            return { angle: A.labelAngle, dist: A.labelDistance, pose: !!A.isManuallyPlaced,
                     x: A.x, y: A.y };
        });
        ck('le nom a changé de place', apres.pose === true && apres.angle !== avant.angle,
           `${(+avant.angle.toFixed(3))} → ${(+apres.angle.toFixed(3))}`);
        ck('  il est là où on l\'a posé', apres.dist > 40 && apres.dist < 80,
           (apres.dist ? apres.dist.toFixed(1) : '?') + ' px du point');
        ck('  et le POINT n\'a pas bougé', apres.x === avant.x && apres.y === avant.y,
           `(${apres.x}, ${apres.y})`);
        await ctx.close();
    }

    /* ============================================================
       LE CADRAN NE REVIENT PAS — NI SON ÉLÉMENT, NI SON CODE
       Un panneau supprimé dont le code reste est un panneau qui repoussera.
       ============================================================ */
    console.log('\n=== le cadran a bien disparu, code compris ===');
    const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    const reste = await page.evaluate(() => ({
        boite: !!document.getElementById('labelPosBox'),
        bouton: !!document.getElementById('labelPosKnob'),
        rangee: !!document.getElementById('rowLabelPos'),
        css: [...document.styleSheets].some(f => {
            try { return [...f.cssRules].some(r => /label-knob|label-positioner/.test(r.selectorText || '')); }
            catch (e) { return false; }
        }),
    }));
    ck('plus de cadran dans la page', !reste.boite && !reste.bouton && !reste.rangee,
       JSON.stringify(reste));
    ck('  ni son habillage', !reste.css, String(reste.css));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
