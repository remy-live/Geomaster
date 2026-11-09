/* UN TRAIT CACHÉ RESTE CACHÉ.
 *
 * « Quand on fait un undo, les traits que j'avais mis cachés réapparaissent. »
 *
 * Deux causes, et il fallait les deux.
 *   1. Cacher ne passait pas par saveState : mesuré, l'historique restait à UN
 *      seul état après avoir caché un côté. Le geste n'existait pas pour
 *      l'historique, donc le Ctrl+Z suivant sautait par-dessus.
 *   2. Et quand bien même : « hidden » n'était écrit NULLE PART dans l'état
 *      enregistré. Revenir à un état, quel qu'il soit, rendait donc tout
 *      visible — et le lien de partage comme le fichier enregistré perdaient
 *      l'information de la même façon.
 *
 * CE QUE LA SONDE MESURE, ET COMMENT ELLE A FAILLI NE RIEN MESURER.
 * Le drapeau ne suffit pas : ce qui compte, c'est qu'il n'y ait pas d'encre.
 * On compte donc les pixels du trait sur la feuille, en plus du drapeau.
 * Et `deserialize` REND la liste des objets, il ne la pose pas : l'appeler
 * sans prendre son résultat laisse une feuille vide, où « aucun objet caché »
 * est vrai sans rien prouver. La sonde relit comme le fait l'ouverture d'un
 * fichier — `entities = deserialize(...)` — et exige de retrouver les trois
 * segments avant de conclure quoi que ce soit sur l'un d'eux.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (n, ok, d) => { console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${n}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const page = await nav.newPage({ viewport: { width: 1300, height: 860 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForFunction(() => window.app);
    await page.waitForTimeout(800);
    await page.evaluate(() => {
        const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });

    /* Un triangle dont [AB] est horizontal : on saura où regarder l'encre. */
    const preparer = () => page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = []; a.historyFuture = [];
        const A = new Point(300, 600, 'A'), B = new Point(800, 600, 'B'), C = new Point(520, 280, 'C');
        const ab = new Segment(A, B), bc = new Segment(B, C), ca = new Segment(C, A);
        a.entities.push(A, B, C, ab, bc, ca);
        a.saveState(); a.render();
        return a.historyPast.length;
    });
    /* L'ENCRE DU CÔTÉ [AB], relevée au milieu du trait. Le drapeau peut dire
       « caché » pendant que le trait se dessine encore : c'est l'encre qui
       tranche. */
    const lire = () => page.evaluate(() => {
        const a = window.app;
        const seg = a.entities.filter(e => e.constructor.name === 'Segment');
        const ab = seg.find(s => (s.p1.label === 'A' && s.p2.label === 'B')
                              || (s.p1.label === 'B' && s.p2.label === 'A'));
        const v = a.view, c = a.canvas.getContext('2d');
        const x = Math.round(v.x + 550 * v.zoom), y = Math.round(v.y + 600 * v.zoom);
        const d = c.getImageData(x - 10, y - 4, 20, 9).data;
        let encre = 0;
        for (let i = 0; i < 20 * 9; i++) { const k = i * 4;
            if (d[k + 3] > 60 && (d[k] + d[k + 1] + d[k + 2]) < 450) encre++; }
        return { segments: seg.length, drapeau: !!(ab && ab.hidden), encre,
                 historique: a.historyPast.length, futur: a.historyFuture.length };
    });
    const cacherAB = () => page.evaluate(() => {
        const a = window.app;
        const ab = a.entities.find(e => e.constructor.name === 'Segment'
            && ((e.p1.label === 'A' && e.p2.label === 'B') || (e.p1.label === 'B' && e.p2.label === 'A')));
        a.selectedObject = ab;
        a.toggleVisibilityFromMenu();
        a.render();
    });

    console.log('\n=== cacher, c\'est un geste : il s\'annule, et il se retient ===');
    await preparer();
    const nu = await lire();
    ck('le côté [AB] est d\'abord visible', nu.drapeau === false && nu.encre > 10,
       `${nu.encre} px d'encre`);
    await cacherAB();
    const cache = await lire();
    ck('une fois caché, il ne reste plus d\'encre', cache.drapeau === true && cache.encre === 0,
       `${cache.encre} px d'encre`);
    ck('  et le geste est entré dans l\'historique',
       cache.historique === nu.historique + 1,
       `${nu.historique} état(s) → ${cache.historique}`);

    /* LE CAS RAPPORTÉ : on fait autre chose, puis on annule CETTE chose. */
    await page.evaluate(() => {
        const a = window.app;
        a.addEntity(new Point(1000, 400, 'M'));
        a.saveState(); a.render();
    });
    await page.evaluate(() => { window.app.undo(); window.app.render(); });
    const apres = await lire();
    ck('annuler autre chose ne le fait pas réapparaître',
       apres.drapeau === true && apres.encre === 0,
       `${apres.encre} px d'encre (le trait revenait entier avant)`);
    ck('  et les trois côtés sont bien tous là', apres.segments === 3, apres.segments + ' segments');

    /* ET CACHER S'ANNULE AUSSI : un geste qu'on ne peut pas défaire n'en est pas un. */
    await page.evaluate(() => { window.app.undo(); window.app.render(); });
    const defait = await lire();
    ck('un second Ctrl+Z défait le fait de cacher', defait.drapeau === false && defait.encre > 10,
       `${defait.encre} px d'encre`);
    await page.evaluate(() => { window.app.redo(); window.app.render(); });
    const refait = await lire();
    ck('  et Ctrl+Y le recache', refait.drapeau === true && refait.encre === 0,
       `${refait.encre} px d'encre`);

    console.log('\n=== et il reste caché quand la figure voyage ===');
    const lien = await page.evaluate(() => {
        const a = window.app;
        const code = a.getCompressedString();
        a.entities = [];
        a.loadFromCompressedString(code);
        const seg = a.entities.filter(e => e.constructor.name === 'Segment');
        return { segments: seg.length, caches: seg.filter(s => s.hidden).length,
                 bloc: /CACHES:/.test(LZString.decompressFromEncodedURIComponent(code) || '') };
    });
    ck('le lien de partage porte le rang des objets cachés', lien.bloc === true);
    ck('  et la figure relue retrouve ses trois côtés', lien.segments === 3, lien.segments + ' segments');
    ck('  dont un caché', lien.caches === 1, lien.caches + ' caché(s)');

    const fichier = await page.evaluate(() => {
        const a = window.app;
        const json = a.serialize();
        /* comme le fait l'ouverture d'un fichier : deserialize REND la liste */
        a.entities = a.deserialize(json);
        const seg = a.entities.filter(e => e.constructor.name === 'Segment');
        return { segments: seg.length, caches: seg.filter(s => s.hidden).length };
    });
    ck('le fichier enregistré retrouve ses trois côtés', fichier.segments === 3,
       fichier.segments + ' segments');
    ck('  dont un caché', fichier.caches === 1, fichier.caches + ' caché(s)');

    /* UN LIEN D'AVANT N'A PAS CE BLOC : il ne doit rien cacher, ni se casser. */
    const vieux = await page.evaluate(() => {
        const a = window.app;
        const code = a.getCompressedString();
        const brut = LZString.decompressFromEncodedURIComponent(code)
            .split('¦').filter(p => !p.startsWith('CACHES:')).join('¦');
        a.entities = [];
        a.loadFromCompressedString(LZString.compressToEncodedURIComponent(brut));
        const seg = a.entities.filter(e => e.constructor.name === 'Segment');
        return { segments: seg.length, caches: seg.filter(s => s.hidden).length };
    });
    ck('un lien d\'avant se relit comme avant : rien de caché',
       vieux.segments === 3 && vieux.caches === 0,
       `${vieux.segments} segments, ${vieux.caches} caché(s)`);

    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})().catch(e => { console.log('\x1b[31mBOUM\x1b[0m ' + e.message); process.exit(1); });
