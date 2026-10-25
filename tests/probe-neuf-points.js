// LE CERCLE DES NEUF POINTS — et il doit en porter NEUF.
//
// Question d'un professeur sur les réseaux : « Ça marcherait avec le cercle des
// neuf points ? » Mesuré avant de répondre, et la réponse était pire qu'un
// refus : « Trace le cercle des neuf points du triangle ABC » était ACCEPTÉE,
// répondait « Triangle ABC », et ne traçait aucun cercle. « Trace le cercle
// d'Euler » traçait la DROITE d'Euler — le mot « cercle » purement ignoré.
// « Cercle de Feuerbach » ne faisait rien non plus. Trois façons de poser la
// même question, trois réponses rassurantes et fausses.
//
// La sonde ne se contente pas de vérifier qu'un cercle paraît. Elle prend les
// neuf points que le logiciel a POSÉS et mesure leur distance au centre : un
// cercle « des neuf points » qui n'en porterait que six serait un faux ami, et
// il passerait tous les contrôles de comptage. Elle vérifie aussi que la droite
// d'Euler, elle, reste une DROITE — c'est le voisin qu'on casse en corrigeant.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;

let fail = 0;
const ck = (n, ok, d) => { console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${n}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

const TRI = 'Trace un triangle ABC tel que AB = 7 cm, AC = 6 cm et BC = 5 cm';

(async () => {
    const b = await chromium.launch({ executablePath: NAVIGATEUR });
    const page = await b.newPage({ viewport: { width: 1400, height: 950 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    await page.waitForTimeout(900);
    await page.evaluate(() => { const m = document.getElementById('customModal'); if (m) m.style.display = 'none'; });

    /* Construit la figure et rend ce que le LOGICIEL a posé. */
    const faire = (phrases) => page.evaluate((ph) => {
        const app = window.app;
        app.entities = []; app.historyPast = [];
        if (app.cslOublier) app.cslOublier();
        const refus = [];
        let dernier = null;
        for (const p of ph) {
            let r = null;
            try { r = app.executerConsigneAvec(p, false); } catch (e) { refus.push(p + ' : ' + e.message); }
            if (r && !r.ok) refus.push(p + ' : ' + (r.message || 'refus'));
            dernier = r;
        }
        const cercles = app.entities.filter(e => e.constructor.name === 'Circle');
        const droites = app.entities.filter(e => e.constructor.name === 'Line');
        const pts = app.entities.filter(e => e.constructor.name === 'Point' && e.label);
        const c = cercles[cercles.length - 1] || null;
        return {
            refus, message: (dernier && dernier.message) || '', ok: !!(dernier && dernier.ok),
            astuce: (dernier && dernier.astuce) || '',
            cercles: cercles.length, droites: droites.length,
            centre: c ? { x: c.p1.x, y: c.p1.y, nom: c.p1.label } : null,
            rayon: c ? Math.hypot(c.p2.x - c.p1.x, c.p2.y - c.p1.y) : 0,
            points: pts.map(p => ({ nom: p.label, x: p.x, y: p.y })),
            sommets: ['A', 'B', 'C'].map(l => { const q = pts.find(p => p.nom === l || p.label === l); return q ? { x: q.x, y: q.y } : null; }),
        };
    }, phrases);

    /* Les neuf points, calculés ICI et non demandés au logiciel. */
    const neufAttendus = (A, B, C) => {
        const mid = (P, Q) => ({ x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 });
        const proj = (P, U, V) => { const dx = V.x - U.x, dy = V.y - U.y;
            const k = ((P.x - U.x) * dx + (P.y - U.y) * dy) / (dx * dx + dy * dy);
            return { x: U.x + k * dx, y: U.y + k * dy }; };
        const inter = (p1, q1, p2, q2) => {
            const a1 = q1.y - p1.y, b1 = p1.x - q1.x, c1 = a1 * p1.x + b1 * p1.y;
            const a2 = q2.y - p2.y, b2 = p2.x - q2.x, c2 = a2 * p2.x + b2 * p2.y;
            const d = a1 * b2 - a2 * b1;
            return { x: (b2 * c1 - b1 * c2) / d, y: (a1 * c2 - a2 * c1) / d }; };
        const H = inter(A, proj(A, B, C), B, proj(B, A, C));
        return [['milieu [AB]', mid(A, B)], ['milieu [BC]', mid(B, C)], ['milieu [CA]', mid(C, A)],
                ['pied issu de A', proj(A, B, C)], ['pied issu de B', proj(B, A, C)], ['pied issu de C', proj(C, A, B)],
                ['milieu [AH]', mid(A, H)], ['milieu [BH]', mid(B, H)], ['milieu [CH]', mid(C, H)]];
    };

    console.log('\n=== les cinq façons de le demander tracent bien un cercle ===');
    for (const ph of ['Trace le cercle des neuf points du triangle ABC',
                      "Trace le cercle d'Euler du triangle ABC",
                      'Trace le cercle des neuf points',
                      "Trace le cercle d'Euler",
                      'Trace le cercle de Feuerbach du triangle ABC']) {
        const r = await faire([TRI, ph]);
        ck(`« ${ph} »`, r.ok && r.cercles === 1 && !r.refus.length && /neuf points/i.test(r.message),
           r.refus[0] || `${r.cercles} cercle(s) — ${r.message}`);
    }

    console.log('\n=== LE THÉORÈME : les neuf points sont-ils SUR le cercle ? ===');
    const r = await faire([TRI, 'Trace le cercle des neuf points du triangle ABC']);
    const [A, B, C] = r.sommets;
    ck('le cercle a un centre nommé et un rayon', !!r.centre && r.rayon > 5,
       r.centre ? `${r.centre.nom}, rayon ${Math.round(r.rayon * 10) / 10} px` : 'aucun cercle');
    if (r.centre && A && B && C) {
        const attendus = neufAttendus(A, B, C);
        /* 1. le cercle passe par les neuf points THÉORIQUES */
        let pire = 0;
        attendus.forEach(([n, p]) => { pire = Math.max(pire, Math.abs(Math.hypot(p.x - r.centre.x, p.y - r.centre.y) - r.rayon)); });
        ck('les neuf points théoriques sont sur le cercle', pire < 0.5, `écart max ${Math.round(pire * 1000) / 1000} px`);
        /* 2. le logiciel a POSÉ un point à chacun des neuf endroits */
        const manquants = attendus.filter(([, p]) =>
            !r.points.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 1.5)).map(([n]) => n);
        ck('le logiciel a posé un point à chacun des neuf endroits', manquants.length === 0,
           manquants.length ? 'manquants : ' + manquants.join(', ') : `${r.points.length} points nommés en tout`);
        /* 3. et chacun des points POSÉS par le logiciel est bien sur le cercle */
        const hors = r.points.filter(q => !['A', 'B', 'C'].includes(q.nom))
            .map(q => ({ q, e: Math.hypot(q.x - r.centre.x, q.y - r.centre.y) - r.rayon }))
            .filter(o => Math.abs(o.e) > 0.5 && o.q.nom !== r.centre.nom);
        /* l'orthocentre n'est pas sur le cercle : c'est normal, on l'exclut par sa distance */
        ck('neuf des points posés sont exactement sur le cercle',
           r.points.filter(q => Math.abs(Math.hypot(q.x - r.centre.x, q.y - r.centre.y) - r.rayon) < 0.5).length === 9,
           r.points.filter(q => Math.abs(Math.hypot(q.x - r.centre.x, q.y - r.centre.y) - r.rayon) < 0.5).length
           + ' sur le cercle, ' + hors.length + ' ailleurs (dont l\'orthocentre)');
        /* Le rapport est le théorème : R9 = R/2. Écrire ck(..., true, ...) ici
           aurait fait une ligne verte qui ne mesure rien. */
        const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
        const ka = A.x * A.x + A.y * A.y, kb = B.x * B.x + B.y * B.y, kc = C.x * C.x + C.y * C.y;
        const O = { x: (ka * (B.y - C.y) + kb * (C.y - A.y) + kc * (A.y - B.y)) / d,
                    y: (ka * (C.x - B.x) + kb * (A.x - C.x) + kc * (B.x - A.x)) / d };
        const R = Math.hypot(A.x - O.x, A.y - O.y);
        ck('le rayon vaut la MOITIÉ de celui du cercle circonscrit',
           Math.abs(r.rayon - R / 2) < 0.5,
           `${Math.round(r.rayon * 10) / 10} px contre ${Math.round(R * 10) / 10} ÷ 2 = ${Math.round(R / 2 * 10) / 10} px`);
        /* Et son centre est le milieu de [OH] : l'autre moitié du théorème. */
        const projH = (P, U, V) => { const dx = V.x - U.x, dy = V.y - U.y;
            const k = ((P.x - U.x) * dx + (P.y - U.y) * dy) / (dx * dx + dy * dy);
            return { x: U.x + k * dx, y: U.y + k * dy }; };
        const iH = (p1, q1, p2, q2) => { const a1 = q1.y - p1.y, b1 = p1.x - q1.x, c1 = a1 * p1.x + b1 * p1.y;
            const a2 = q2.y - p2.y, b2 = p2.x - q2.x, c2 = a2 * p2.x + b2 * p2.y;
            const dd = a1 * b2 - a2 * b1; return { x: (b2 * c1 - b1 * c2) / dd, y: (a1 * c2 - a2 * c1) / dd }; };
        const H = iH(A, projH(A, B, C), B, projH(B, A, C));
        const mOH = { x: (O.x + H.x) / 2, y: (O.y + H.y) / 2 };
        ck('son centre est le milieu de [OH]',
           Math.hypot(r.centre.x - mOH.x, r.centre.y - mOH.y) < 0.5,
           `écart ${Math.round(Math.hypot(r.centre.x - mOH.x, r.centre.y - mOH.y) * 1000) / 1000} px`);
    }

    console.log('\n=== et la droite d\'Euler reste une DROITE ===');
    const rd = await faire([TRI, "Trace la droite d'Euler du triangle ABC"]);
    ck("« Trace la droite d'Euler » trace une droite, pas un cercle",
       rd.ok && rd.droites >= 1 && rd.cercles === 0 && /droite d'euler/i.test(rd.message),
       `${rd.droites} droite(s), ${rd.cercles} cercle(s) — ${rd.message}`);

    console.log('\n=== les cas limites se disent, ils ne se taisent pas ===');
    const req = await faire(['Trace un triangle équilatéral ABC de 6 cm de côté',
                             'Trace le cercle des neuf points du triangle ABC']);
    ck('un triangle équilatéral a bien un cercle des neuf points',
       req.ok && req.cercles === 1, `${req.cercles} cercle(s) — ${req.message}`);
    const rplat = await page.evaluate(() => {
        const app = window.app;
        app.entities = []; app.historyPast = [];
        if (app.cslOublier) app.cslOublier();
        ['A', 'B', 'C'].forEach((l, i) => app.addEntity(new Point(400 + i * 150, 500, l)));
        let r = null;
        try { r = app.executerConsigneAvec('Trace le cercle des neuf points du triangle ABC', false); }
        catch (e) { return { err: e.message }; }
        return { ok: !!(r && r.ok), msg: (r && r.message) || '',
                 cercles: app.entities.filter(e => e.constructor.name === 'Circle').length };
    });
    ck('un triangle aplati est REFUSÉ, et il le dit',
       !rplat.err && rplat.ok === false && rplat.cercles === 0 && /aplati/i.test(rplat.msg),
       rplat.err || `${rplat.cercles} cercle(s) — ${rplat.msg}`);

    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await b.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
