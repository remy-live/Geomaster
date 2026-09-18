/* LE TEXTE SE POSE OÙ ON L'A VU, ET LE CURSEUR LE DIT D'AVANCE.
 *
 * « Pour le texte, j'aimerais avoir le curseur de tape plutôt qu'une croix pour
 *   voir où le texte ira, et quand on le valide il est légèrement décalé. »
 *
 * DEUX DEMANDES, DONT LA SECONDE DEMANDE D'ABORD D'ÊTRE MESURÉE.
 *
 * Le curseur, d'abord : une croix VISE un point. Ici on ne vise pas un point, on
 * ouvre une ligne d'écriture — et le I du curseur de texte la montre, debout, à
 * l'endroit exact où la première lettre se posera. C'est une ligne de code, et
 * elle ne vaut que pour l'outil texte : tous les autres gardent leur croix.
 *
 * LE DÉCALAGE, LUI, NE SE VOIT PAS DANS LES NOMBRES. Le champ de saisie et le
 * texte validé tombent sur les MÊMES coordonnées — mesuré à quatre zooms, l'écart
 * de boîte est nul. Il fallait donc regarder l'IMAGE. Deux captures, l'une
 * pendant la frappe, l'autre après validation, décodées et comparées pixel à
 * pixel : même largeur, même hauteur, même nombre de pixels encrés — et le texte
 * validé REMONTAIT de 2 px à 16, de 6 px à 40. Le champ de saisie et le canevas
 * n'ancrent pas une ligne au même endroit ; la boîte, elle, était au bon endroit,
 * ce qui explique que toutes les vérifications de coordonnées passaient.
 *
 * ET C'EST POURQUOI ON NE CORRIGE PAS D'UNE CONSTANTE. Deux pixels à 16 et six à
 * 40, cela ressemble à « 0,15 fois la taille » — et cette règle serait fausse à
 * la première police au dessin différent. On ALIGNE donc LES DEUX LIGNES DE BASE,
 * chacune mesurée là où elle est : côté DOM par une boîte de hauteur nulle alignée
 * sur la ligne de base, côté canevas par la différence des deux ascendantes
 * d'encre. Rien à refaire le jour où la police change.
 *
 * LA SONDE REFAIT LA MESURE, et c'est la seule qui vaille : elle compare les deux
 * images à quatre tailles, à deux zooms, et sur un texte de deux lignes. L'écart
 * doit être nul, et l'encre identique — sinon c'est que le texte a bougé, ou
 * changé de taille en chemin.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

/* Les captures sont redonnées à la page, qui sait les décoder : c'est le seul
   moyen de comparer une image DOM et une image de canevas au pixel. */
const encre = (page, b64) => page.evaluate((b64) => new Promise((res) => {
    const img = new Image();
    img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data;
        let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, n = 0;
        for (let y = 0; y < c.height; y++) for (let X = 0; X < c.width; X++) {
            const i = (y * c.width + X) << 2;
            if (d[i] < 120 && d[i + 1] < 120 && d[i + 2] < 120) {
                n++;
                if (X < minX) minX = X; if (X > maxX) maxX = X;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
        }
        res(maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    };
    img.onerror = () => res(null);
    img.src = 'data:image/png;base64,' + b64;
}), b64);

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const erreurs = [];

    console.log('\n=== le curseur dit ce qu\'on va faire ===');
    {
        const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
        page.on('pageerror', e => erreurs.push(e.message));
        await page.goto(PAGE);
        await page.waitForFunction(() => window.app);
        const cur = await page.evaluate(() => {
            const a = window.app;
            const m = document.getElementById('customModal');
            if (m) m.style.display = 'none';
            const out = {};
            ['text', 'segment', 'point', 'line', 'circle', 'stylo', 'move', 'pan']
                .forEach(t => { a.setTool(t); out[t] = a.canvas.style.cursor; });
            return out;
        });
        ck('l\'outil texte donne le curseur de frappe', cur.text === 'text', cur.text);
        ck('  et les outils de tracé gardent leur croix',
           ['segment', 'point', 'line', 'circle', 'stylo'].every(t => cur[t] === 'crosshair'),
           JSON.stringify(cur));
        ck('  la main et le déplacement, la flèche',
           cur.move === 'default' && cur.pan === 'default', JSON.stringify(cur));
        await page.close();
    }

    console.log('\n=== le texte validé tombe exactement où on l\'a tapé ===');
    const CAS = [
        [16, 1, 'Hxp', '16 px'],
        [24, 1, 'Hxp', '24 px'],
        [40, 1, 'Hxp', '40 px'],
        [64, 1, 'Hxp', '64 px'],
        [20, 1.5, 'Hxp', '20 px, zoom 1,5'],
        [20, 0.7, 'Hxp', '20 px, zoom 0,7'],
        [28, 1, 'Hxp\nHxp', '28 px, deux lignes'],
    ];
    for (const [fs, z, texte, nom] of CAS) {
        const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
        page.on('pageerror', e => erreurs.push(e.message));
        await page.goto(PAGE);
        await page.waitForFunction(() => window.app);
        await page.evaluate(() => {
            try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
            const m = document.getElementById('customModal');
            if (m) m.style.display = 'none';
            window.app.checkAutoSave = () => {};
        });
        const c = await page.evaluate(([fs, z]) => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            a.defaultFontSize = fs;
            a.view.zoom = z; a.render();
            a.setTool('text');
            const r = a.canvas.getBoundingClientRect();
            return { x: Math.round(r.left + 500 * z + a.view.x),
                     y: Math.round(r.top + 300 * z + a.view.y) };
        }, [fs, z]);
        await page.mouse.click(c.x, c.y);
        await page.waitForTimeout(250);
        const lignes = texte.split('\n');
        for (let k = 0; k < lignes.length; k++) {
            if (k) await page.keyboard.press('Enter');
            await page.keyboard.type(lignes[k]);
        }
        await page.waitForTimeout(200);
        /* Le curseur clignotant et la barre de mise en forme ne sont pas le
           texte : ils fausseraient la boîte d'encre. */
        await page.evaluate(() => {
            const g = document.getElementById('ghostTextInput');
            g.style.caretColor = 'transparent';
            const b = document.getElementById('textFormatToolbar');
            if (b) b.style.visibility = 'hidden';
        });
        await page.waitForTimeout(120);
        const clip = { x: c.x - 20, y: c.y - 30, width: 300, height: 220 };
        const avant = (await page.screenshot({ clip })).toString('base64');
        await page.evaluate(() => window.app.validerTexteFantome());
        await page.waitForTimeout(200);
        const apres = (await page.screenshot({ clip })).toString('base64');
        const a = await encre(page, avant), b = await encre(page, apres);
        if (!a || !b) { ck(nom, false, 'aucune encre trouvée'); await page.close(); continue; }
        ck(nom + ' : pas d\'un pixel de décalage',
           a.x === b.x && a.y === b.y,
           `dx = ${b.x - a.x}, dy = ${b.y - a.y}`);
        ck('  et c\'est bien la même encre', a.w === b.w && a.h === b.h && a.n === b.n,
           `${a.w}×${a.h} (${a.n} px) → ${b.w}×${b.h} (${b.n} px)`);
        await page.close();
    }

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
