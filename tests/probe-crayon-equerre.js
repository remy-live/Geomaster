/* LE CRAYON SUIT LE BORD DE L'ÉQUERRE LE LONG DUQUEL ON A TRACÉ.
 *
 * « Je traçais une parallèle et le crayon monte toujours, il ne va pas sur le
 *   bon côté de l'équerre. »
 * « En fait le crayon suit la direction de la droite tracée (et là en
 *   l'occurrence c'est avec l'équerre). »
 *
 * LE GESTE. On couche la règle, on pose l'équerre contre elle, on la fait
 * GLISSER jusqu'au point, et l'on trace le long de l'autre bord de l'équerre.
 * Les deux instruments sont sortis en même temps et ils se touchent : c'est là
 * que tout se joue.
 *
 * DEUX FAUTES, ET LA SECONDE NE SE VOIT QU'UNE FOIS LA PREMIÈRE RÉPARÉE.
 *
 * 1. LE CRAYON COURAIT SUR L'AUTRE BORD. planRegle — qui dit où le crayon en
 *    est le long de l'instrument — avait été écrit pour la RÈGLE, qui n'a qu'un
 *    bord gradué : l'axe partait toujours de l'angle de l'instrument, donc du
 *    GRAND côté de l'équerre. Or la parallèle se trace le long du PETIT, celui
 *    qui reste libre une fois l'équerre glissée contre la règle. Relevé au
 *    rejeu, équerre posée en (900,500) tournée d'un demi-tour, trait VERTICAL
 *    en x = 900 :
 *
 *        crayon à t=0,3 → (780, 500)        après : (900, 425)
 *        crayon à t=0,6 → (660, 500)        après : (900, 350)
 *        crayon à t=0,9 → (540, 500)        après : (900, 275)
 *
 *    Le trait montait, le crayon filait à l'horizontale — le long du bord posé
 *    sur la règle. Et chaque bord a sa portée : le grand fait width, le petit
 *    height ; prendre width pour les deux fait courir le crayon dans le vide.
 *
 * 2. L'ÉQUERRE N'ÉTAIT RECONNUE QU'À MOITIÉ. getNearbyWidget cherchait son petit
 *    côté en y NÉGATIF — hors du triangle — et bornait le grand à height au lieu
 *    de width. Mesuré, équerre 400 × 250 :
 *
 *        bord horizontal x=200 → setsquare     bord vertical y=120 → null
 *        bord horizontal x=300 → null          (jamais, nulle part)
 *
 *    Ne reconnaissant pas l'équerre, le logiciel se rabattait sur la règle
 *    d'à côté et orientait le crayon par rapport au corps de la RÈGLE.
 *
 * CE QUE LA SONDE MESURE : le dessin, pas la méthode. Elle piège le crayon là
 * où il est peint et relève la matrice du contexte — c'est la position et
 * l'inclinaison que l'élève voit, quelle que soit la façon dont on y est venu.
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
    const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    await page.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
        /* LE PIÈGE À CRAYON. Peu importe qu'il soit peint en image ou en
           chemins : on relève la matrice du contexte à l'instant où il l'est. */
        window.__crayon = [];
        const a = window.app;
        const vraiImg = a.ctx.drawImage.bind(a.ctx);
        a.ctx.drawImage = function (...args) {
            if (args[0] === a.pencilImage) {
                const m = a.ctx.getTransform();
                window.__crayon.push({ a: m.a, b: m.b, e: m.e, f: m.f });
            }
            return vraiImg(...args);
        };
        const vraiP = a.drawPencil.bind(a);
        a.drawPencil = function (ctx) {
            const m = ctx.getTransform();
            window.__crayon.push({ a: m.a, b: m.b, e: m.e, f: m.f });
            return vraiP(ctx);
        };
    });

    /* ============================================================
       1. LES DEUX BORDS DE L'ÉQUERRE SONT RECONNUS, ENTIERS
       ============================================================ */
    console.log('\n=== l\'équerre est reconnue sur ses deux bords entiers ===');
    /* SEULE D'ABORD. La question est celle des BORNES : jusqu'où l'équerre est
       reconnue le long de chacun de ses côtés. Avec la règle posée dessous, un
       point du grand côté est à 0 px des DEUX instruments — c'est une autre
       question, et elle est traitée juste après. */
    const bords = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.activeWidgets.setsquare = true; a.activeWidgets.ruler = false;
        if (!a.setSquareWidget) a.setSquareWidget = new SetSquareWidget(400, 400);
        if (!a.rulerWidget) a.rulerWidget = new RulerWidget(200, 600);
        const w = a.setSquareWidget;
        w.width = 400; w.height = 250; w.angle = Math.PI; w.x = 900; w.y = 500;
        const lu = (lx, ly) => { const g = w.toGlobal(lx, ly); return a.getNearbyWidget(g.x, g.y); };
        return { grand: [60, 200, 300, 380].map(x => lu(x, 0)),
                 petit: [30, 60, 120, 200, 240].map(y => lu(0, y)),
                 dehors: lu(0, -120), audela: lu(520, 0) };
    });
    ck('le grand côté, sur toute sa longueur',
       bords.grand.every(v => v === 'setsquare'), bords.grand.join(' · '));
    ck('  le petit aussi — celui qu\'on longe pour la parallèle',
       bords.petit.every(v => v === 'setsquare'), bords.petit.join(' · '));
    ck('  mais rien là où l\'équerre n\'est pas',
       bords.dehors === null && bords.audela === null,
       `${bords.dehors} / ${bords.audela}`);

    /* ET MAINTENANT LA RÈGLE EST LÀ, l'équerre posée contre elle. Le bord qu'on
       va suivre est le petit : lui n'appartient qu'à l'équerre, et c'est elle
       qu'on doit reconnaître — c'est le manquement qui envoyait le crayon
       s'orienter sur le corps de la règle. */
    console.log('\n=== la règle est posée dessous, et le bord libre reste à l\'équerre ===');
    const contre = await page.evaluate(() => {
        const a = window.app;
        a.activeWidgets.ruler = true;
        const w = a.setSquareWidget, r = a.rulerWidget;
        r.angle = 0; r.x = 300; r.y = 500;
        const lu = (lx, ly) => { const g = w.toGlobal(lx, ly); return a.getNearbyWidget(g.x, g.y); };
        return { depart: lu(-3, 60), milieu: lu(-3, 140), bout: lu(-3, 220) };
    });
    ck('tout le long du bord libre, c\'est l\'équerre',
       ['depart', 'milieu', 'bout'].every(k => contre[k] === 'setsquare'),
       `${contre.depart} · ${contre.milieu} · ${contre.bout}`);

    /* ============================================================
       2. LE GESTE COMPLET, À LA SOURIS, PUIS LE REJEU
       ============================================================ */
    const lire = () => page.evaluate(() => {
        const a = window.app;
        window.__crayon = [];
        a.render();
        const c = window.__crayon[window.__crayon.length - 1] || null;
        if (!c) return null;
        const t = a.entities.find(e => e instanceof Line || e instanceof Segment);
        const co = MathUtils.getLineCoords(t);
        const w = a.setSquareWidget;
        /* de la pointe du crayon au trait : la distance perpendiculaire */
        const dx = co.p2.x - co.p1.x, dy = co.p2.y - co.p1.y;
        const dl = Math.hypot(dx, dy) || 1;
        const ecart = Math.abs((c.e - co.p1.x) * dy - (c.f - co.p1.y) * dx) / dl;
        const tot = Math.atan2(c.b, c.a);
        const vx = Math.sin(tot), vy = -Math.cos(tot);
        const G = w.toGlobal(w.width / 3, w.height / 3);
        const nx = -dy, ny = dx;
        return { x: Math.round(c.e), y: Math.round(c.f), ecart: Math.round(ecart),
                 dedans: a.isPointInsideWidgetBody('setsquare', w, c.e + vx * 30, c.f + vy * 30),
                 memeCote: ((G.x - c.e) * nx + (G.y - c.f) * ny) * (vx * nx + vy * ny) > 0 };
    });

    const geste = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.showPencil = true; a.showTools = true;
        a.currentTool = 'line';
        a.view = { zoom: 1, x: 0, y: 0 };
        const w = a.setSquareWidget;
        const rect = a.canvas.getBoundingClientRect();
        /* on part JUSTE à côté du bord : appuyer dessus empoignerait l'équerre */
        return { A: w.toGlobal(-3, 60), B: w.toGlobal(-3, 220),
                 rect: { x: rect.left, y: rect.top } };
    });
    const px = p => ({ x: geste.rect.x + p.x, y: geste.rect.y + p.y });
    const a1 = px(geste.A), b1 = px(geste.B);
    await page.mouse.move(a1.x, a1.y);
    await page.mouse.down();
    for (let k = 1; k <= 12; k++)
        await page.mouse.move(a1.x + (b1.x - a1.x) * k / 12, a1.y + (b1.y - a1.y) * k / 12);
    await page.mouse.up();
    await page.waitForTimeout(200);

    console.log('\n=== le geste est enregistré comme un tracé à l\'équerre ===');
    const enr = await page.evaluate(() => window.app.entities.map(e =>
        e.constructor.name + (e.originalType ? '[' + e.originalType + ':' + (e.widgetType || 'AUCUN') + ']' : '')));
    ck('une animation « tracé », portée par l\'équerre',
       enr.some(n => /trace:setsquare/.test(n)), enr.join(' · '));

    console.log('\n=== et au rejeu, le crayon est SUR le trait ===');
    const vus = [];
    for (const t of [0.3, 0.6, 0.9]) {
        const ok = await page.evaluate((t) => {
            const a = window.app;
            const i = a.entities.findIndex(e => e.originalType === 'trace');
            if (i < 0) return false;
            a.isReplaying = true; a.isToolAnimating = true;
            a.replayIndex = i; a.currentAnimProgress = t;
            a.applyInterpolation(a.entities[i], t);
            return true;
        }, t);
        if (!ok) break;
        vus.push({ t, v: await lire() });
        await page.evaluate(() => { window.app.isReplaying = false; window.app.isToolAnimating = false; });
    }
    ck('un crayon à chaque instant du rejeu', vus.length === 3 && vus.every(o => o.v),
       vus.length + ' relevé(s)');
    if (vus.length === 3 && vus.every(o => o.v)) {
        const pos = vus.map(o => `t=${o.t} (${o.v.x},${o.v.y}) à ${o.v.ecart} px`).join('  ');
        ck('  il ne quitte jamais le trait', vus.every(o => o.v.ecart <= 2), pos);
        /* AVANT, il courait sur l'autre bord : y restait à 500 pendant que le
           trait montait. On exige donc qu'il AVANCE le long du trait. */
        ck('  et il avance bien le long du trait',
           Math.abs(vus[2].v.y - vus[0].v.y) > 50, pos);
        ck('  jamais couché SUR l\'équerre', vus.every(o => !o.v.dedans));
        ck('  toujours du côté opposé à son corps', vus.every(o => !o.v.memeCote));
    }

    /* ============================================================
       3. LA RÈGLE, ELLE, N'A PAS CHANGÉ DE BORD
       Le correctif ne doit pas déborder : la règle n'a qu'un bord gradué,
       et son crayon doit continuer à le suivre.
       ============================================================ */
    console.log('\n=== et la règle n\'a pas bougé d\'un pixel ===');
    const regle = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.activeWidgets.setsquare = false; a.activeWidgets.ruler = true;
        const r = a.rulerWidget;
        r.angle = 0; r.x = 300; r.y = 500;
        a.currentTool = 'segment';
        const A = { x: 320, y: 500 }, B = { x: 620, y: 500 };
        const pA = new Point(A.x, A.y), pB = new Point(B.x, B.y);
        a.addEntity(pA);
        const anim = new ToolAnimation('trace', { x: r.x, y: r.y, angle: r.angle },
                                                { x: r.x, y: r.y, angle: r.angle });
        anim.widgetType = 'ruler';
        a.addEntity(anim);
        const seg = new Segment(pA, pB);
        a.addEntity(seg); a.addEntity(pB);
        const i = a.entities.indexOf(anim);
        const out = [];
        for (const t of [0.3, 0.9]) {
            a.isReplaying = true; a.isToolAnimating = true;
            a.replayIndex = i; a.currentAnimProgress = t;
            a.applyInterpolation(anim, t);
            window.__crayon = [];
            a.render();
            const c = window.__crayon[window.__crayon.length - 1];
            out.push(c ? { x: Math.round(c.e), y: Math.round(c.f) } : null);
            a.isReplaying = false; a.isToolAnimating = false;
        }
        return out;
    });
    ck('le crayon court le long de la règle',
       regle[0] && regle[1] && regle[0].y === 500 && regle[1].y === 500
       && regle[1].x > regle[0].x,
       JSON.stringify(regle));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
