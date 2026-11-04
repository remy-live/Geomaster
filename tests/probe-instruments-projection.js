/* LA GRAVURE NE GROSSIT PAS AVEC LE VIDÉOPROJECTEUR — ON AGRANDIT L'INSTRUMENT.
 *
 * « En mode projection, les chiffres des instruments de géométrie font de gros
 *   pâtés, j'aimerais bien aussi pouvoir agrandir le rapporteur comme on peut le
 *   faire avec la règle ou l'équerre. »
 *
 * Les deux phrases n'en font qu'une. Le mode projection multiplie par 2,2 TOUTE
 * police et TOUTE épaisseur posée sur la toile. C'est juste pour la figure — un
 * trait qu'on dessine n'a pas de voisin à toucher. C'est faux pour un
 * instrument, dont la géométrie ne bouge pas : la gravure enfle dans une place
 * qui reste la même.
 *
 * MESURÉ AVANT, en espionnant ce qui est VRAIMENT peint :
 *   — rapporteur de rayon 180 : les degrés passent de 11 à 24,2 px, et
 *     « 100 » recouvre « 110 » sur 13,6 px ;
 *   — règle : l'encre sur la ligne des graduations passe de 40 % à 80 % —
 *     les traits du millimètre, larges de 3,3 px tous les 5, se rejoignent.
 *
 * ATTENTION À CE QU'ON LIT. Le mode projection REMPLACE l'accesseur « font » du
 * contexte, et son getter rend la valeur d'origine, pas celle qui est posée sur
 * la toile. Lire `ctx.font`, c'est lire ce que le code a demandé, jamais ce qui
 * est peint : une sonde qui s'y fierait ne verrait jamais le défaut. On passe
 * par le descripteur du prototype.
 *
 * ET LA SORTIE, c'est d'agrandir l'objet — comme on prendrait le grand
 * rapporteur du tableau. La sonde l'étire à la souris par le bout de sa
 * semelle, vérifie que sa gravure suit, et que les chiffres ne se marchent
 * toujours pas dessus.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (n, ok, d) => { console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${n}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const page = await nav.newPage({ viewport: { width: 1400, height: 900 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForFunction(() => window.app);
    await page.waitForTimeout(800);
    await page.evaluate(() => {
        const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
        const a = window.app;
        a.activeWidgets.ruler = true; a.rulerWidget = new RulerWidget(200, 120); a.rulerWidget.angle = 0;
        a.activeWidgets.protractor = true; a.protractorWidget = new ProtractorWidget(700, 600);
        a.render();
    });

    const relever = (projo) => page.evaluate((projo) => {
        const a = window.app;
        a.facteurProjection = projo ? 2.2 : 1;
        const ctx = a.ctx;
        const vrai = ctx.fillText.bind(ctx);
        /* la VRAIE police, celle qui est posée sur la toile */
        const vraiFont = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font').get;
        const vus = [];
        ctx.fillText = function (t, x, y) { vus.push({ t: String(t), x, y, font: vraiFont.call(this) }); return vrai(t, x, y); };
        a.render();
        ctx.fillText = vrai;
        const deg = vus.filter(v => /^\d+$/.test(v.t) && Number(v.t) % 10 === 0 && Number(v.t) <= 180);
        const g = document.createElement('canvas').getContext('2d');
        const boites = deg.map(v => { g.font = v.font; return { t: v.t, x: v.x, y: v.y, w: g.measureText(v.t).width }; });
        let pire = 0, paire = '';
        for (let i = 0; i < boites.length; i++) for (let j = i + 1; j < boites.length; j++) {
            const A = boites[i], B = boites[j];
            if (Math.abs(A.y - B.y) >= 8) continue;
            const chevauche = (A.w + B.w) / 2 - Math.abs(A.x - B.x);
            if (chevauche > pire) { pire = chevauche; paire = A.t + ' et ' + B.t; }
        }
        /* l'encre des graduations de la règle, sur une ligne pile sous le bord */
        const v = a.view, c = a.canvas.getContext('2d');
        const y = Math.round(v.y + 123 * v.zoom);
        const x0 = Math.round(v.x + 205 * v.zoom), larg = 200;
        const d = c.getImageData(x0, y, larg, 1).data;
        let noirs = 0;
        for (let i = 0; i < larg; i++) { const k = i * 4;
            if (d[k + 3] > 40 && (d[k] + d[k + 1] + d[k + 2]) < 400) noirs++; }
        return { nbDeg: deg.length, policeDeg: (deg[0] || {}).font || '',
                 taille: parseFloat(((deg[0] || {}).font || '0px').match(/(\d*\.?\d+)px/)[1]),
                 chevauchement: Math.round(pire * 10) / 10, paire,
                 encreRegle: Math.round(100 * noirs / larg), rayon: a.protractorWidget.radius };
    }, projo);

    console.log('\n=== la gravure reste à sa taille, projecteur ou pas ===');
    const normal = await relever(false);
    ck('les dix-neuf degrés sont écrits', normal.nbDeg === 19, normal.nbDeg + ' nombres');
    const projo = await relever(true);
    ck('en projection, la police des degrés ne change pas',
       Math.abs(projo.taille - normal.taille) < 0.6,
       `${normal.taille} px hors projection, ${projo.taille} px en projection (24,2 px avant)`);
    ck('aucun degré n\'en recouvre un autre', projo.chevauchement <= 0,
       projo.chevauchement > 0 ? `${projo.chevauchement} px entre ${projo.paire}` : 'aucun chevauchement');
    ck('et les traits du millimètre ne se rejoignent pas',
       projo.encreRegle <= normal.encreRegle + 5,
       `${projo.encreRegle} % d'encre en projection contre ${normal.encreRegle} % sans (80 % avant)`);

    console.log('\n=== on agrandit le rapporteur, à la main, par sa semelle ===');
    /* On vise le bout de la semelle, puis on tire vers la droite. */
    const prise = await page.evaluate(() => {
        const a = window.app, w = a.protractorWidget;
        const p = w.toGlobal(w.radius, 10);
        const r = a.canvas.getBoundingClientRect(), v = a.view;
        return { zone: w.getHitZone(p.x, p.y), rayon: w.radius,
                 x: r.left + v.x + p.x * v.zoom, y: r.top + v.y + p.y * v.zoom };
    });
    ck('le bout de la semelle est une prise d\'agrandissement', prise.zone === 'resize', String(prise.zone));
    await page.mouse.move(prise.x, prise.y, { steps: 6 });
    await page.mouse.down();
    for (let k = 1; k <= 12; k++) { await page.mouse.move(prise.x + 10 * k, prise.y); await page.waitForTimeout(12); }
    await page.mouse.up();
    await page.waitForTimeout(200);
    const apres = await page.evaluate(() => window.app.protractorWidget.radius);
    ck('tirer dessus l\'agrandit vraiment', apres > prise.rayon + 80,
       `${Math.round(prise.rayon)} px → ${Math.round(apres)} px`);

    const grand = await relever(true);
    ck('et sa gravure grandit avec lui', grand.taille > projo.taille * 1.3,
       `${projo.taille} px à ${Math.round(projo.rayon)} px de rayon, ${grand.taille} px à ${Math.round(grand.rayon)}`);
    ck('sans que les degrés se marchent dessus', grand.chevauchement <= 0,
       grand.chevauchement > 0 ? `${grand.chevauchement} px entre ${grand.paire}` : 'aucun chevauchement');

    console.log('\n=== et le rayon voyage avec la figure ===');
    const voyage = await page.evaluate(() => {
        const a = window.app;
        const avant = a.protractorWidget.radius;
        const code = a.getCompressedString();
        a.protractorWidget.radius = 180;
        a.loadFromCompressedString(code);
        return { avant: Math.round(avant), apres: Math.round(a.protractorWidget.radius) };
    });
    /* Et l'on exige que le rayon relu ne soit pas simplement celui d'usine :
       sinon la ligne passerait au vert sur un rapporteur qu'on n'a pas su
       agrandir, en ne mesurant rien du tout. */
    ck('le lien de partage le retient',
       voyage.avant > 200 && Math.abs(voyage.avant - voyage.apres) <= 1,
       `${voyage.avant} px → ${voyage.apres} px`);

    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})().catch(e => { console.log('\x1b[31mBOUM\x1b[0m ' + e.message); process.exit(1); });
