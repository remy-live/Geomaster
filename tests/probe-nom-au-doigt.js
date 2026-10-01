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
 * PUIS LE CADRAN EST REVENU, DERRIÈRE LE PLI. « Où est le cercle de
 * positionnement ? » — « Oui, derrière le pli. » L'argument du geste direct
 * tenait, mais il demande de VISER UNE LETTRE DE 14 px : au tableau, ce n'est pas
 * le même geste que viser un cadran de 60. Les deux façons ne se valent pas, et
 * le pli permet de garder la seconde sans la payer tous les jours.
 *
 * CE QUE CETTE SONDE TIENT MAINTENANT. Le geste direct doit marcher, à la souris
 * ET au doigt : attraper le nom, le poser ailleurs, sans emmener le point. Et
 * surtout, LES DEUX FAÇONS DOIVENT DIRE LA MÊME CHOSE — c'est là qu'une
 * duplication devient un mensonge. Après avoir posé le nom au doigt, le cadran
 * rouvert doit montrer CET angle-là, et non le sien ou celui d'origine : un
 * cadran qui repart du nord à chaque ouverture ferait sauter le nom au premier
 * contact, sans que rien ne l'ait demandé.
 *
 * ET IL RESTE DERRIÈRE LE PLI. Un menu qui naît replié et montre quand même le
 * cadran n'aurait rien replié du tout ; la sonde relève sa hauteur dans les deux
 * états, pas seulement la présence de l'élément.
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
       LE CADRAN ET LE DOIGT DISENT LA MÊME CHOSE
       Deux façons de poser le même nom : si elles divergent, l'une des deux ment.
       ============================================================ */
    console.log('\n=== le cadran repart d\'où le doigt a laissé le nom ===');
    const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    await page.evaluate(() => {
        try {
            localStorage.removeItem('geoMaster_backup');
            localStorage.removeItem('gm_menu_replie');
        } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });

    /* un point, son nom posé AU DOIGT très loin de l'angle par défaut */
    const pose = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = []; a.historyFuture = [];
        a.view = { zoom: 1, x: 0, y: 0 };
        const p = new Point(500, 400, 'A');
        a.addEntity(p); a.saveState();
        return { defaut: p.labelAngle };
    });
    const b = await page.evaluate(() => {
        const r = window.app.canvas.getBoundingClientRect();
        return { x: r.left, y: r.top };
    });
    /* on attrape la lettre et on la pose en bas à gauche du point */
    await page.evaluate(() => { window.app.currentTool = 'move'; });
    const nom = await page.evaluate(() => {
        const p = window.app.entities[0];
        const d = (p.padding + (p.fontSize || 14) / 2);
        const a = (p.labelAngle !== undefined) ? p.labelAngle : -Math.PI / 2;
        return { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d };
    });
    await page.mouse.move(b.x + nom.x, b.y + nom.y);
    await page.mouse.down();
    await page.mouse.move(b.x + 460, b.y + 440, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(150);
    const apresDoigt = await page.evaluate(() => window.app.entities[0].labelAngle);
    ck('le doigt a posé le nom ailleurs', Math.abs(apresDoigt - pose.defaut) > 0.3,
       pose.defaut.toFixed(3) + ' -> ' + apresDoigt.toFixed(3) + ' rad');

    /* on ouvre le menu : le cadran doit montrer CET angle-là */
    await page.evaluate(() => {
        const a = window.app;
        a.selectedObject = a.entities[0];
        const r = a.canvas.getBoundingClientRect();
        a.canvas.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
            clientX: r.left + 500, clientY: r.top + 400, button: 2 }));
    });
    await page.waitForTimeout(300);

    const cadranReplie = await page.evaluate(() =>
        Math.round(document.getElementById('rowLabelPos').getBoundingClientRect().height));
    ck('  et il reste derrière le pli à l\'ouverture', cadranReplie <= 2, cadranReplie + ' px');

    await page.evaluate(() => window.app.basculerPliageMenu(false));
    await page.waitForTimeout(250);
    const vu = await page.evaluate(() => {
        const k = document.getElementById('labelPosKnob');
        /* l'angle que le bouton DESSINE, relu depuis sa position */
        return { l: parseFloat(k.style.left), t: parseFloat(k.style.top),
                 h: Math.round(document.getElementById('rowLabelPos').getBoundingClientRect().height) };
    });
    const angleMontre = Math.atan2(vu.t - 30, vu.l - 30);
    const ecart = Math.abs(Math.atan2(Math.sin(angleMontre - apresDoigt),
                                      Math.cos(angleMontre - apresDoigt)));
    ck('  déplié, il montre l\'angle du nom et non le sien', ecart < 0.1,
       'cadran ' + angleMontre.toFixed(3) + ' rad, nom ' + apresDoigt.toFixed(3)
       + ' rad, écart ' + ecart.toFixed(3));
    ck('  et il occupe bien la place qu\'on lui a rendue', vu.h > 50, vu.h + ' px');


    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
