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

    ck('aucune erreur JS', errs.length === 0, errs[0] || '');
    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})().catch(e => { console.log('\x1b[31mBOUM\x1b[0m ' + e.message); process.exit(1); });
