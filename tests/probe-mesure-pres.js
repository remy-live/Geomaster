/* LE NOMBRE SE POSE PRÈS DU TRAIT, DES DEUX CÔTÉS PAREIL.
 *
 * « Je trouve que l'affichage des longueurs sur les segments est un peu éloigné
 *   du segment. »
 *
 * MESURÉ AVANT, à l'encre et non au réglage : on compte les pixels vides entre
 * le trait et le bas du nombre. Au-dessus (le côté par défaut) : 15 px. En
 * dessous : 10 px. Les deux côtés ne disaient donc pas la même chose, et c'est
 * le côté par défaut qui était le plus loin — d'où l'impression, parfaitement
 * juste, d'un nombre qui flotte.
 *
 * CE QUE LA SONDE TIENT. Trois choses, et aucune n'est « l'écart vaut −11 » :
 * un réglage recopié dans une sonde ne mesure rien, il se contente de répéter
 * le code. Ce qui compte, c'est ce qu'on voit.
 *   1. Le nombre est PRÈS du trait : moins de 13 px de vide. Au-delà, il
 *      flotte ; c'est le reproche de départ.
 *   2. Les deux côtés sont SYMÉTRIQUES à 2 px près. Un nombre qui s'écarte
 *      davantage quand il passe au-dessus n'a aucune raison de le faire.
 *   3. Il ne touche RIEN : ni le trait lui-même, ni la marque de codage qui
 *      monte à 6 px du trait au milieu du segment — c'est-à-dire exactement là
 *      où le nombre s'écrit. Approcher sans toucher : c'est toute la question,
 *      et c'est ce qui interdit d'approcher davantage.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (n, ok, d) => { console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${n}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const page = await nav.newPage({ viewport: { width: 1000, height: 700 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForFunction(() => window.app);
    await page.waitForTimeout(700);

    const r = await page.evaluate(() => {
        const a = window.app;
        const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
        a.checkAutoSave = () => {};
        /* On relève l'encre dans une colonne posée au milieu du segment : y est
           compté depuis le trait, négatif vers le haut. Le trait lui-même tient
           les lignes −1 et 0. */
        const colonne = (regler, large) => {
            a.entities = [];
            const A = new Point(260, 400, 'A'), B = new Point(660, 400, 'B');
            const s = new Segment(A, B);
            regler(s);
            a.entities.push(A, B, s); a.render();
            const v = a.view, c = a.canvas.getContext('2d');
            const x = Math.round(v.x + 460 * v.zoom), y0 = Math.round(v.y + 400 * v.zoom);
            const L = large || 28;
            const d = c.getImageData(x - L / 2, y0 - 60, L, 120).data;
            const ys = [];
            for (let j = 0; j < 120; j++) {
                let n = 0;
                for (let i = 0; i < L; i++) {
                    const k = (j * L + i) * 4;
                    if (d[k + 3] > 40 && (d[k] + d[k + 1] + d[k + 2]) < 560) n++;
                }
                if (n) ys.push(j - 60);
            }
            return ys;
        };
        const nu = colonne(s => { s.showLength = false; });
        const haut = colonne(s => { s.showLength = true; });          /* écart par défaut */
        const bas = colonne(s => { s.showLength = true; s.measureOffset = 20; });
        const marqueSeule = colonne(s => { s.showLength = false; s.coding = 'mark-1'; }, 4);
        const marqueEtNombre = colonne(s => { s.showLength = true; s.coding = 'mark-1'; }, 4);
        const bord = (ys, sens) => {
            const cote = ys.filter(y => sens < 0 ? y < -1 : y > 1);
            if (!cote.length) return null;
            return sens < 0 ? -Math.max(...cote) - 1 : Math.min(...cote) - 1;
        };
        return {
            traitSeul: nu.join(','),
            traitIntact: nu.includes(0) && haut.includes(0) && bas.includes(0),
            videHaut: bord(haut, -1), videBas: bord(bas, 1),
            ecartDefaut: new Segment(new Point(0, 0), new Point(10, 0)).measureOffset,
            marqueSeuleHaut: Math.min(...marqueSeule),
            marqueAvecNombreHaut: Math.min(...marqueEtNombre.filter(y => y > -10)),
            nombreAuDessusDeLaMarque: Math.max(...marqueEtNombre.filter(y => y < -8)),
        };
    });

    console.log('\n=== le nombre se pose près du trait ===');
    ck('le trait n\'est jamais effacé par le cache du nombre', r.traitIntact === true,
       'colonne nue : ' + r.traitSeul);
    ck('au-dessus, le vide fait moins de 13 px', r.videHaut !== null && r.videHaut < 13,
       r.videHaut + ' px (15 px avant)');
    ck('en dessous aussi', r.videBas !== null && r.videBas < 13, r.videBas + ' px');
    ck('et les deux côtés sont pareils, à 2 px près',
       r.videHaut !== null && r.videBas !== null && Math.abs(r.videHaut - r.videBas) <= 2,
       `${r.videHaut} px au-dessus contre ${r.videBas} px en dessous`);

    console.log('\n=== mais il ne touche pas la marque de codage ===');
    ck('la marque monte toujours aussi haut avec le nombre que sans lui',
       r.marqueSeuleHaut === r.marqueAvecNombreHaut,
       `${r.marqueSeuleHaut} seule, ${r.marqueAvecNombreHaut} avec le nombre`);
    ck('et il reste de l\'air entre la marque et le nombre',
       r.nombreAuDessusDeLaMarque < r.marqueSeuleHaut - 2,
       `bas du nombre y=${r.nombreAuDessusDeLaMarque}, haut de la marque y=${r.marqueSeuleHaut}`);

    /* ================================================================
       DESSUS VEUT DIRE DESSUS, QUEL QUE SOIT LE SENS DU TRACÉ.
       « Quand je trace un segment [AB] en commençant par la droite et avec le B
         à gauche et que je demande d'afficher la mesure en haut, ça s'affiche en
         bas — et d'ailleurs c'est collé. »
       Un trait tiré vers la gauche écrirait son nombre à l'envers : on retourne
       le repère d'un demi-tour pour qu'il se lise. Mais ce demi-tour change
       DÉJÀ le côté — l'axe des y tourne avec lui — et l'écart était retourné
       une seconde fois par-dessus. Mesuré, même bouton « Dessus » : de gauche
       à droite l'encre tombait entre −21 et −12 px, de droite à gauche entre
       +2 et +10. Et comme le nombre est posé sur sa ligne de base, l'écart du
       haut (−11) renvoyé en bas ne laisse qu'UN pixel de blanc : « collé »
       est exactement le mot.
       La sonde mesure l'encre des deux côtés, la boîte que le double-clic vise
       — modifier une mesure ailleurs qu'où on la lit serait un autre défaut —
       et compare les deux dessins PIXEL À PIXEL : un nombre à l'envers ne
       donnerait pas la même image.
       ================================================================ */
    console.log('\n=== le sens du tracé ne change pas le côté du nombre ===');
    const sens = await page.evaluate(() => {
        const a = window.app;
        const relever = (versLaDroite, action) => {
            a.entities = [];
            const A = new Point(versLaDroite ? 300 : 700, 400, 'A');
            const B = new Point(versLaDroite ? 700 : 300, 400, 'B');
            A.showLabel = false; B.showLabel = false;
            const s = new Segment(A, B);
            a.entities.push(A, B, s);
            a.selectedObject = s; a.styleObject(action); a.selectedObject = null;
            a.render();
            const v = a.view, c = a.canvas.getContext('2d');
            const x = Math.round(v.x + 500 * v.zoom), y0 = Math.round(v.y + 400 * v.zoom);
            const L = 36, H = 120;
            const d = c.getImageData(x - L / 2, y0 - 60, L, H).data;
            const ys = []; const carte = [];
            for (let j = 0; j < H; j++) {
                let ligne = '';
                for (let i = 0; i < L; i++) {
                    const k = (j * L + i) * 4;
                    const encre = d[k + 3] > 40 && (d[k] + d[k + 1] + d[k + 2]) < 560;
                    ligne += encre ? '#' : '.';
                    if (encre && !ys.includes(j - 60)) ys.push(j - 60);
                }
                carte.push(ligne);
            }
            const haut = ys.filter(y => y < -1), bas = ys.filter(y => y > 1);
            const b = s.boiteMesure(a.ctx);
            /* le dessin du nombre seul, sans le trait : les lignes hors du trait */
            const dessin = carte.filter((_, j) => Math.abs(j - 60) > 1).join('|');
            return {
                cote: haut.length && !bas.length ? 'dessus'
                    : (bas.length && !haut.length ? 'dessous' : 'les deux ou rien'),
                vide: haut.length ? -Math.max(...haut) - 1
                    : (bas.length ? Math.min(...bas) - 1 : null),
                boiteDy: b ? Math.round(b.y - 400) : null,
                /* l'angle du nombre, ramené dans [-180, 180] : il doit se lire */
                boiteAngle: b ? Math.round(((b.angle * 180 / Math.PI) % 360 + 540) % 360 - 180) : null,
                dessin,
            };
        };
        const out = {
            hautGD: relever(true, 'measureUp'), hautDG: relever(false, 'measureUp'),
            basGD: relever(true, 'measureDown'), basDG: relever(false, 'measureDown'),
        };
        a.entities = []; a.render();
        return out;
    });
    ck('tiré de gauche à droite, « Dessus » écrit au-dessus',
       sens.hautGD.cote === 'dessus', sens.hautGD.cote);
    ck('tiré de droite à gauche aussi', sens.hautDG.cote === 'dessus',
       sens.hautDG.cote + ' (c\'était « dessous » avant)');
    ck('  et au même écart du trait, au pixel près',
       sens.hautGD.vide !== null && sens.hautGD.vide === sens.hautDG.vide,
       `${sens.hautGD.vide} px contre ${sens.hautDG.vide} px (1 px avant)`);
    ck('« Dessous » écrit en dessous, dans les deux sens',
       sens.basGD.cote === 'dessous' && sens.basDG.cote === 'dessous',
       `${sens.basGD.cote} / ${sens.basDG.cote}`);
    ck('  au même écart là aussi', sens.basGD.vide === sens.basDG.vide,
       `${sens.basGD.vide} px contre ${sens.basDG.vide} px`);
    /* LE DOUBLE-CLIC VISE LÀ OÙ LE NOMBRE EST ÉCRIT. */
    ck('la boîte que le double-clic vise suit le nombre',
       sens.hautGD.boiteDy === sens.hautDG.boiteDy
       && sens.basGD.boiteDy === sens.basDG.boiteDy,
       `dessus ${sens.hautGD.boiteDy}/${sens.hautDG.boiteDy}, `
       + `dessous ${sens.basGD.boiteDy}/${sens.basDG.boiteDy}`);
    /* ET LE NOMBRE SE LIT : même image des deux côtés, donc même sens. */
    ck('le nombre n\'est pas à l\'envers : même dessin dans les deux sens',
       sens.hautGD.dessin.length > 0 && sens.hautGD.dessin === sens.hautDG.dessin,
       sens.hautGD.dessin === sens.hautDG.dessin ? 'image identique au pixel'
                                                 : 'les deux images diffèrent');
    ck('  et le repère du nombre reste lisible (demi-tour unique)',
       Math.abs(sens.hautDG.boiteAngle) < 1, sens.hautDG.boiteAngle + '°');

    ck('aucune erreur JS', errs.length === 0, errs[0] || '');
    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})().catch(e => { console.log('\x1b[31mBOUM\x1b[0m ' + e.message); process.exit(1); });
