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

    /* LE CURSEUR SE MESURE APRÈS UN DÉPLACEMENT, JAMAIS AU MOMENT DU CLIC SUR LE
       BOUTON. C'est la leçon de ce défaut-ci : cette sonde lisait le curseur
       juste après setTool, et le trouvait juste — « l'outil texte donne le
       curseur de frappe », vert. Mais le survol recalcule le curseur à CHAQUE
       mouvement de souris, et il repartait d'un « default » en dur : le I
       disparaissait au premier pixel parcouru. « Quand on va sur le canvas, on a
       toujours le pointeur de la souris. » La sonde mesurait le bon fait au
       mauvais instant, ce qui est la façon la plus sûre de passer à côté.

       Ils étaient ONZE dans ce cas, mesuré : le texte, le stylo, le croquis, la
       gomme et tous les outils magiques — tout ce qui ne figurait pas dans la
       courte liste des outils de tracé. Le survol repart donc du curseur que
       l'outil a demandé, et non du néant. */
    console.log('\n=== le curseur dit ce qu\'on va faire, et il le dit encore après un mouvement ===');
    {
        const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
        page.on('pageerror', e => erreurs.push(e.message));
        await page.goto(PAGE);
        await page.waitForFunction(() => window.app);
        const vide = await page.evaluate(() => {
            const a = window.app;
            const m = document.getElementById('customModal');
            if (m) m.style.display = 'none';
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            const r = a.canvas.getBoundingClientRect();
            return { x: r.left + 700, y: r.top + 600 };
        });
        const OUTILS = ['text', 'segment', 'point', 'line', 'circle', 'polygon', 'angle',
                        'stylo', 'croquis', 'magic_triangle', 'magic_mediatrice',
                        'eraser', 'move', 'pan'];
        const cur = {};
        for (const t of OUTILS) {
            await page.evaluate((t) => window.app.setTool(t), t);
            /* Deux pas, pour que le gestionnaire de survol ait vraiment tourné. */
            await page.mouse.move(vide.x - 6, vide.y - 6);
            await page.mouse.move(vide.x, vide.y);
            await page.waitForTimeout(40);
            cur[t] = await page.evaluate(() => window.app.canvas.style.cursor);
        }
        ck('l\'outil texte garde le curseur de frappe sur la feuille',
           cur.text === 'text', cur.text);
        ck('  les outils de tracé gardent leur croix',
           ['segment', 'point', 'line', 'circle', 'polygon', 'angle'].every(t => cur[t] === 'crosshair'),
           JSON.stringify(cur));
        ck('  le stylo, le croquis, la gomme et les magiques aussi',
           ['stylo', 'croquis', 'eraser', 'magic_triangle', 'magic_mediatrice']
               .every(t => cur[t] === 'crosshair'), JSON.stringify(cur));
        ck('  la main garde sa flèche, le panoramique sa main ouverte',
           cur.move === 'default' && cur.pan === 'grab', JSON.stringify(cur));
        const perdus = OUTILS.filter(t => t !== 'move' && cur[t] === 'default');
        ck('aucun outil ne retombe sur la flèche par oubli',
           perdus.length === 0, perdus.join(', ') || 'aucun');

        /* Sur un texte déjà posé, le clic ne l'écrit pas : il le PREND. Et le
           corps d'un instrument l'emporte sur tout le reste, comme avant. */
        const lieux = await page.evaluate(() => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            const t = new TextLabel(500, 400, 'Bonjour');
            t.fontSize = 24; a.addEntity(t);
            if (!a.activeWidgets.ruler) a.toggleWidget('ruler');
            a.rulerWidget.x = 300; a.rulerWidget.y = 700; a.rulerWidget.angle = 0;
            a.setTool('text'); a.render();
            const r = a.canvas.getBoundingClientRect();
            const e = (x, y) => ({ x: r.left + x * a.view.zoom + a.view.x,
                                   y: r.top + y * a.view.zoom + a.view.y });
            return { surTexte: e(520, 412), loin: e(950, 250), regle: e(350, 740) };
        });
        const ou = async (p) => {
            await page.mouse.move(p.x - 5, p.y - 5);
            await page.mouse.move(p.x, p.y);
            await page.waitForTimeout(60);
            return page.evaluate(() => window.app.canvas.style.cursor);
        };
        ck('loin de tout, le I de la frappe', await ou(lieux.loin) === 'text');
        ck('  sur un texte déjà posé, la main qui le prend', await ou(lieux.surTexte) === 'grab');
        ck('  et le corps de la règle l\'emporte, comme avant',
           await ou(lieux.regle) === 'move');
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

    /* LE TEXTE TOMBE SUR LE CURSEUR, PAS EN DESSOUS.
     *
     * « L'endroit où on écrit le texte est décalé par rapport au curseur. Il faut
     *   que cela tombe précisément. »
     *
     * La correction précédente avait aligné la saisie et le texte validé L'UN SUR
     * L'AUTRE — au pixel — sans se demander si les deux tombaient au bon endroit.
     * Ils n'y tombaient pas. Mesuré, l'encre par rapport au point cliqué :
     *
     *     16 px  haut +4   bas +17   (milieu +10,5)
     *     64 px  haut +15  bas +59   (milieu +37)
     *
     * — entièrement SOUS le clic, et d'autant plus bas que la police est grosse.
     * On posait le coin haut-gauche de la ligne sur le point cliqué ; or le I du
     * curseur de frappe a son point chaud EN SON MILIEU, comme tout curseur de
     * saisie. C'est la ligne d'écriture qui doit l'enjamber.
     *
     * CE QU'ON MESURE ICI N'EST PAS « le centre de l'encre vaut zéro ». Ce serait
     * faux, et pour une bonne raison : « ppp » n'a que des jambages et pèse vers
     * le bas, « ABC » n'a que des capitales et pèse vers le haut — mesuré +4 et
     * −1 à la même taille. Ce qui doit être vrai de toute chaîne, c'est que
     * l'encre ENJAMBE le clic, et que le centre n'en soit jamais loin.
     */
    console.log('\n=== le texte tombe sur le curseur, pas en dessous ===');
    {
        const R = 60;
        const boite = (page, b64) => page.evaluate(([b64, R]) => new Promise((res) => {
            const im = new Image();
            im.onload = () => {
                const c = document.createElement('canvas');
                c.width = im.width; c.height = im.height;
                const x = c.getContext('2d');
                x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
                x.drawImage(im, 0, 0);
                const d = x.getImageData(0, 0, c.width, c.height).data;
                let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
                for (let y = 0; y < c.height; y++) for (let X = 0; X < c.width; X++) {
                    const i = (y * c.width + X) << 2;
                    if (d[i] < 120 && d[i + 1] < 120 && d[i + 2] < 120) {
                        if (X < minX) minX = X; if (X > maxX) maxX = X;
                        if (y < minY) minY = y; if (y > maxY) maxY = y;
                    }
                }
                /* en coordonnées RELATIVES au clic : la capture est cadrée sur lui,
                   son centre EST donc le curseur. */
                res(maxX < 0 ? null : { g: minX - R, h: minY - R, b: maxY - R,
                                        milieu: (minY + maxY) / 2 - R });
            };
            im.onerror = () => res(null);
            im.src = 'data:image/png;base64,' + b64;
        }), [b64, R]);

        const CAS = [[16, 'Hxp'], [24, 'Hxp'], [40, 'Hxp'], [64, 'Hxp'],
                     [24, 'ppp'], [24, 'ABC'], [40, 'Aire du triangle']];
        for (const [fs, mot] of CAS) {
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
            const c = await page.evaluate((fs) => {
                const a = window.app;
                a.entities = []; a.historyPast = [];
                if (a.cslOublier) a.cslOublier();
                a.defaultFontSize = fs; a.setTool('text');
                const r = a.canvas.getBoundingClientRect();
                return { x: Math.round(r.left + 500 + a.view.x),
                         y: Math.round(r.top + 300 + a.view.y) };
            }, fs);
            await page.mouse.click(c.x, c.y);
            await page.waitForTimeout(250);
            await page.keyboard.type(mot);
            await page.waitForTimeout(180);
            await page.evaluate(() => window.app.validerTexteFantome());
            await page.waitForTimeout(180);
            const im = (await page.screenshot({
                clip: { x: c.x - R, y: c.y - R, width: 2 * R, height: 2 * R } })).toString('base64');
            const e = await boite(page, im);
            const nom = `${fs} px « ${mot} »`;
            if (!e) { ck(nom, false, 'aucune encre'); await page.close(); continue; }
            ck(nom + ' : l\'encre enjambe le clic',
               e.h < 0 && e.b > 0, `haut ${e.h}, bas ${e.b}`);
            ck('  et son centre n\'en est jamais loin',
               Math.abs(e.milieu) <= 5, `milieu ${Math.round(e.milieu * 10) / 10} px`);
            /* Le texte commence JUSTE À DROITE du curseur, comme après le trait
               clignotant d'un champ de saisie — la marge est celle du glyphe. */
            ck('  et il commence juste à droite du curseur',
               e.g >= 0 && e.g <= 8, `bord gauche ${e.g} px`);
            await page.close();
        }
    }

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
