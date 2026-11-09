/* LE RAPPORTEUR QU'ON POSE, ET L'ANGLE QU'IL TRACE VRAIMENT.
 *
 * « Comment améliorer le rapporteur et le tracé et le blocage une idée ? »
 * « Oui et de toute façon il faudrait un peu que le cadenas soit automatique. »
 *
 * TROIS DÉFAUTS MESURÉS, QU'ON N'AURAIT PAS VUS EN LISANT LE CODE.
 *
 * 1. L'ÉCRAN ANNONÇAIT UN ENTIER ET LE LOGICIEL EN TRAÇAIT UN AUTRE. Rapporteur
 *    bloqué sur un sommet, on tire la demi-droite : l'affichage disait
 *    « 121° / 59° » pendant le geste, et la demi-droite posée mesurait 58,6°.
 *    Un demi-degré d'écart — exactement l'erreur qu'on apprend à l'élève à ne
 *    pas faire, et le logiciel la lui montrait en lui annonçant le contraire.
 *    La sonde ne regarde donc pas le trait fantôme : elle lit le NOMBRE ÉCRIT à
 *    l'écran pendant le geste, puis mesure l'angle de l'objet créé, et exige que
 *    ce soit le même. C'est la seule façon de prendre ce défaut-là : l'un comme
 *    l'autre pris seul paraissait juste.
 *
 * 2. LE CENTRE S'AIMANTAIT AU SOMMET, MAIS LE ZÉRO RESTAIT OÙ IL ÉTAIT. Lâché
 *    à 9 px de O, le centre tombait à 0,00 px — et la graduation 0 était relevée
 *    à 0° alors que le côté [OA] était à −20°. Il fallait aligner le zéro sur le
 *    côté à l'œil, c'est-à-dire rater la mesure avant de commencer à tracer.
 *
 * 3. LE CADENAS ÉTAIT UN PRÉALABLE INVISIBLE. La zone « tracer » n'existe que
 *    rapporteur bloqué : sans l'avoir armé, tirer depuis le centre déplaçait
 *    l'instrument. Quatre gestes, dont un qu'on ne pouvait pas deviner.
 *
 * MAINTENANT : on lâche, il se pose, son zéro se couche sur un côté partant du
 * sommet, il se bloque. Le cadenas reste pour le libérer d'un clic — un
 * instrument qui refuse de bouger doit dire pourquoi.
 *
 * ET LA POSE NE DOIT PAS DÉPENDRE DE L'AIMANT, qui se coupe d'un bouton : la
 * sonde refait tout le geste aimant éteint. Dernier point, le symétrique de
 * tous les autres : lâché dans le vide, l'instrument reste LIBRE. Un aimant qui
 * prend toujours ne se distingue pas d'un instrument coincé.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};
const d3 = (x) => Math.round(x * 1000) / 1000;

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

    /* Un geste de souris, en vrai : on vise, puis on frappe. Un locator.click()
       remesure la boîte avant de taper ; une main, non. */
    const glisser = async (de, vers, pas = 14) => {
        await page.mouse.move(de.x, de.y);
        await page.mouse.down();
        for (let k = 1; k <= pas; k++) {
            await page.mouse.move(de.x + (vers.x - de.x) * k / pas,
                                  de.y + (vers.y - de.y) * k / pas);
            await page.waitForTimeout(12);
        }
    };

    // ------------------------------------------------------------------
    console.log('\n=== le degré annoncé est le degré tracé ===');

    const vise = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.entities.push(new Point(600, 600, 'O'));
        a.activeWidgets.protractor = true;
        a.protractorWidget = new ProtractorWidget(600, 600);
        a.protractorWidget.angle = 0;
        a.protractorWidget.isLocked = true;
        a.render();
        const r = a.canvas.getBoundingClientRect(), v = a.view;
        const vers = (x, y) => ({ x: r.left + v.x + x * v.zoom, y: r.top + v.y + y * v.zoom });
        /* on vise 58,6° : un angle qu'aucun arrondi ne donne par hasard */
        const ang = -58.6 * Math.PI / 180;
        return { centre: vers(600, 600),
                 bout: vers(600 + Math.cos(ang) * 260, 600 + Math.sin(ang) * 260) };
    });
    await glisser(vise.centre, vise.bout, 12);
    /* ce que l'écran ÉCRIT, juste avant qu'on lâche */
    const annonce = await page.evaluate(() => {
        const a = window.app, ctx = a.ctx;
        const vrai = ctx.fillText.bind(ctx), vus = [];
        ctx.fillText = function (t, x, y) { vus.push(String(t)); return vrai(t, x, y); };
        a.render();
        ctx.fillText = vrai;
        const nombres = [];
        /* Une seule chaîne porte les deux lectures : « 121° / 59° ». Prendre
           la première occurrence seulement, c'était rater celle du bon côté —
           la sonde aurait crié au défaut sur un logiciel juste. */
        vus.forEach(t => {
            const trouves = String(t).match(/-?\d+(?:[.,]\d+)?\s*°/g) || [];
            trouves.forEach(x => nombres.push(parseFloat(x.replace('°', '').replace(',', '.'))));
        });
        return nombres;
    });
    await page.mouse.up();
    await page.waitForTimeout(220);
    const trace = await page.evaluate(() => {
        const a = window.app, w = a.protractorWidget;
        const ray = a.entities.filter(e => e.constructor.name === 'Ray').pop();
        if (!ray) return null;
        let deg = (Math.atan2(ray.p2.y - ray.p1.y, ray.p2.x - ray.p1.x) - w.angle) * 180 / Math.PI;
        while (deg < 0) deg += 360; while (deg >= 360) deg -= 360;
        if (deg > 180) deg = 360 - deg;
        return { deg, surLeSommet: Math.hypot(ray.p1.x - 600, ray.p1.y - 600) < 0.01 };
    });
    ck('la demi-droite est bien tracée depuis le centre', !!trace && trace.surLeSommet,
       trace ? null : 'aucune demi-droite créée');
    if (trace) {
        const ecartEntier = Math.abs(trace.deg - Math.round(trace.deg));
        ck('l\'angle tracé tombe sur un degré entier', ecartEntier < 0.001,
           `${d3(trace.deg)}°`);
        /* On compare au degré RÉELLEMENT tracé, pas à son arrondi : arrondir
           d'abord, c'était refaire soi-même la correction qu'on vient
           d'écrire, et la sonde passait au vert sur la version fautive. */
        ck('ce degré est celui que l\'écran annonçait',
           annonce.some(n => Math.abs(n - trace.deg) < 0.001),
           `écrit : ${annonce.length ? annonce.join('° / ') + '°' : 'rien'} · tracé : ${d3(trace.deg)}°`);
    }

    // ------------------------------------------------------------------
    /* Le même geste complet, deux fois : aimant allumé, puis éteint. La pose
       du rapporteur sur un sommet est le fait de l'instrument, pas du réglage. */
    for (const aimant of [true, false]) {
        console.log(`\n=== on le lâche près du sommet (aimant ${aimant ? 'allumé' : 'éteint'}) ===`);
        const prep = await page.evaluate((mag) => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            a.isObjectMagnetActive = mag;
            const O = new Point(600, 600, 'O');
            const A = new Point(600 + Math.cos(-20 * Math.PI / 180) * 300,
                                600 + Math.sin(-20 * Math.PI / 180) * 300, 'A');
            a.entities.push(O, A, new Segment(O, A));
            a.activeWidgets.protractor = true;
            a.protractorWidget = new ProtractorWidget(300, 300);
            a.protractorWidget.angle = 0;
            a.protractorWidget.isLocked = false;
            a.render();
            const r = a.canvas.getBoundingClientRect(), v = a.view;
            const vers = (x, y) => ({ x: r.left + v.x + x * v.zoom, y: r.top + v.y + y * v.zoom });
            return { depart: vers(300, 300), presDeO: vers(607, 606), centre: vers(600, 600) };
        }, aimant);
        await glisser(prep.depart, prep.presDeO);
        await page.mouse.up();
        await page.waitForTimeout(220);
        const pose = await page.evaluate(() => {
            const a = window.app, w = a.protractorWidget;
            const O = a.entities.find(e => e.label === 'O');
            const A = a.entities.find(e => e.label === 'A');
            let ecartZero = ((w.angle + Math.PI) - Math.atan2(A.y - O.y, A.x - O.x)) * 180 / Math.PI;
            while (ecartZero <= -180) ecartZero += 360;
            while (ecartZero > 180) ecartZero -= 360;
            return { bloque: !!w.isLocked,
                     auSommet: Math.hypot(w.x - O.x, w.y - O.y),
                     ecartZero: Math.abs(ecartZero) };
        });
        ck('le centre se pose sur le sommet', pose.auSommet < 0.01,
           `${d3(pose.auSommet)} px du sommet`);
        ck('le zéro se couche sur le côté qui part du sommet', pose.ecartZero < 0.01,
           `${d3(pose.ecartZero)}° d'écart avec [OA]`);
        ck('le cadenas se ferme tout seul', pose.bloque === true);

        /* et de là, on trace : 61,4° visé doit donner 61° pile depuis le côté */
        const bout = await page.evaluate(() => {
            const a = window.app, w = a.protractorWidget;
            const r = a.canvas.getBoundingClientRect(), v = a.view;
            const ang = (w.angle + Math.PI) - 61.4 * Math.PI / 180;
            return { x: r.left + v.x + (w.x + Math.cos(ang) * 250) * v.zoom,
                     y: r.top + v.y + (w.y + Math.sin(ang) * 250) * v.zoom };
        });
        await glisser(prep.centre, bout, 12);
        await page.mouse.up();
        await page.waitForTimeout(220);
        const fin = await page.evaluate(() => {
            const a = window.app;
            const ray = a.entities.filter(e => e.constructor.name === 'Ray').pop();
            if (!ray) return null;
            const O = a.entities.find(e => e.label === 'O');
            const A = a.entities.find(e => e.label === 'A');
            let dd = (Math.atan2(ray.p2.y - ray.p1.y, ray.p2.x - ray.p1.x)
                    - Math.atan2(A.y - O.y, A.x - O.x)) * 180 / Math.PI;
            while (dd <= -180) dd += 360; while (dd > 180) dd -= 360;
            return { angle: Math.abs(dd),
                     surLeSommet: Math.hypot(ray.p1.x - O.x, ray.p1.y - O.y) < 0.01 };
        });
        ck('l\'angle tracé depuis là fait un entier de degrés avec le côté',
           !!fin && fin.surLeSommet && Math.abs(fin.angle - 61) < 0.001,
           fin ? `${d3(fin.angle)}° (61 visé à 0,4° près)` : 'aucune demi-droite créée');
    }

    // ------------------------------------------------------------------
    console.log('\n=== lâché dans le vide, il reste libre ===');
    const vide = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.isObjectMagnetActive = true;
        a.entities.push(new Point(600, 600, 'O'));
        a.activeWidgets.protractor = true;
        a.protractorWidget = new ProtractorWidget(300, 300);
        a.protractorWidget.angle = 0;
        a.protractorWidget.isLocked = false;
        a.render();
        const r = a.canvas.getBoundingClientRect(), v = a.view;
        const vers = (x, y) => ({ x: r.left + v.x + x * v.zoom, y: r.top + v.y + y * v.zoom });
        return { depart: vers(300, 300), loin: vers(420, 760) };
    });
    await glisser(vide.depart, vide.loin);
    await page.mouse.up();
    await page.waitForTimeout(220);
    const libre = await page.evaluate(() => {
        const w = window.app.protractorWidget;
        return { bloque: !!w.isLocked, distO: Math.hypot(w.x - 600, w.y - 600) };
    });
    ck('aucun sommet alentour : le cadenas reste ouvert', libre.bloque === false,
       `à ${Math.round(libre.distO)} px du seul point de la feuille`);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
