// UNE ÉQUERRE PAR COIN, ET ELLE DOIT TENIR QUAND ON TIRE.
//
// « Tu vois les angles droits, il y a du double, des en vert et des en noir. »
// Deux peintres indépendants : PerpendicularLine.draw peignait son propre
// carré de 12 px dans l'encre du trait, et l'Angle posé par la construction en
// peignait un second de 16 px, vert. Même sommet, même quadrant, 4 px d'écart.
//
// La sonde ne lit NI le code NI les entités : elle espionne le pinceau. Tout
// chemin de trois points dont les deux bras sont égaux et perpendiculaires est
// une équerre, d'où qu'elle vienne — on la ramène en coordonnées écran par la
// matrice du contexte, car la perpendiculaire dessine la sienne dans un repère
// tourné. Le sommet de l'angle droit se retrouve par P0 - P1 + P2.
//
// Deux exigences, et la seconde est celle qui manquait au dépôt :
//   1. aucun coin ne porte deux équerres ;
//   2. aucun coin n'en perd la sienne, et l'angle reste DROIT quand on tire un
//      sommet — probe-magiques-tiennent.js dit la règle : « la figure était
//      juste une fois, à l'instant du clic, et fausse au premier geste ».
// Mesuré avant correction : 6 équerres pour 3 coins sur la figure de l'énoncé,
// et après un glissement les trois angles valaient 116,6°, 195° et 90°.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;

let fail = 0;
const ck = (nom, ok, d) => { console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

/* L'ESPION — posé dans la page, il rend les équerres d'un rendu complet. */
const ESPION = () => {
    window.gmEquerres = function () {
        const ctx = window.app.ctx;
        const vrai = { beginPath: ctx.beginPath, moveTo: ctx.moveTo, lineTo: ctx.lineTo, stroke: ctx.stroke };
        const chemins = [];
        let cur = [];
        ctx.beginPath = function () { cur = []; return vrai.beginPath.apply(this, arguments); };
        ctx.moveTo = function (x, y) { cur.push([x, y]); return vrai.moveTo.apply(this, arguments); };
        ctx.lineTo = function (x, y) { cur.push([x, y]); return vrai.lineTo.apply(this, arguments); };
        ctx.stroke = function () {
            if (cur.length) {
                const m = this.getTransform();
                chemins.push({
                    pts: cur.map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]),
                    couleur: String(this.strokeStyle),
                });
                cur = [];
            }
            return vrai.stroke.apply(this, arguments);
        };
        try { window.app.render(); } finally { Object.assign(ctx, vrai); }
        /* Une équerre : trois points, deux bras égaux et perpendiculaires. */
        const eq = [];
        for (const c of chemins) {
            if (c.pts.length !== 3) continue;
            const [p0, p1, p2] = c.pts;
            const u = [p1[0] - p0[0], p1[1] - p0[1]], v = [p2[0] - p1[0], p2[1] - p1[1]];
            const lu = Math.hypot(u[0], u[1]), lv = Math.hypot(v[0], v[1]);
            if (lu < 4 || lv < 4) continue;
            if (Math.abs(lu - lv) > 1.5) continue;
            if (Math.abs(u[0] * v[0] + u[1] * v[1]) / (lu * lv) > 0.04) continue;
            eq.push({ sommet: [p0[0] - p1[0] + p2[0], p0[1] - p1[1] + p2[1]],
                      bras: Math.round(lu), couleur: c.couleur });
        }
        /* regroupées par coin : 6 px, c'est le même coin pour une main */
        const coins = [];
        for (const e of eq) {
            const g = coins.find(g => Math.hypot(g.sommet[0] - e.sommet[0], g.sommet[1] - e.sommet[1]) <= 6);
            if (g) g.marques.push(e);
            else coins.push({ sommet: e.sommet, marques: [e] });
        }
        return { total: eq.length, coins: coins.map(c => ({
            x: Math.round(c.sommet[0]), y: Math.round(c.sommet[1]), n: c.marques.length,
            bras: c.marques.map(m => m.bras), couleurs: c.marques.map(m => m.couleur) })) };
    };
};

const NET = () => {
    try { localStorage.setItem('gm_decor', 'non'); } catch (e) { void e; }
    const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
    window.app.checkAutoSave = () => {};
    const d = document.getElementById('gmDecor'); if (d) d.style.display = 'none';
    window.app.entities = []; window.app.historyPast = [];
    if (window.app.cslOublier) window.app.cslOublier();
};

(async () => {
    const nav = await chromium.launch({ executablePath: NAVIGATEUR });
    const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    await page.waitForTimeout(900);
    await page.evaluate(ESPION);

    const figure = (phrases, instruments) => page.evaluate(({ ph, ins }) => {
        window.app.entities = []; window.app.historyPast = [];
        if (window.app.cslOublier) window.app.cslOublier();
        const refus = [];
        for (const p of ph) {
            let r = null;
            try { r = window.app.executerConsigneAvec(p, !!ins); } catch (e) { refus.push(p + ' : ' + e.message); }
            if (r && !r.ok) refus.push(p + ' : ' + (r.message || 'refus'));
        }
        window.app.render();
        return { refus, equerres: window.gmEquerres() };
    }, { ph: phrases, ins: instruments });

    await page.evaluate(NET);

    const CAS = [
        { nom: "la figure de l'énoncé : triangle, médiatrices, cercle circonscrit",
          ph: ['Trace un triangle ABC tel que AB = 7 cm, AC = 6 cm et BC = 5 cm',
               'Trace les médiatrices du triangle ABC',
               'Trace le cercle circonscrit au triangle ABC'], coins: 3 },
        { nom: 'une seule médiatrice', ph: ['Trace un segment [AB] de longueur 7 cm',
               'Trace la médiatrice du segment [AB]'], coins: 1 },
        { nom: 'deux droites perpendiculaires', ph: ['Trace deux droites perpendiculaires'], coins: 1 },
        { nom: 'la tangente à un cercle', ph: ['Trace un cercle de centre O et de rayon 3 cm',
               'Trace la tangente au cercle en A'], coins: 1 },
        { nom: 'la hauteur garde la sienne (aucun Angle posé)',
          ph: ['Trace un triangle ABC tel que AB = 7 cm, AC = 6 cm et BC = 5 cm',
               'Trace la hauteur issue de A dans le triangle ABC'], coins: 1 },
        /* LE FAUX VOISIN : sur un triangle presque isocèle, le pied d'une
           hauteur tombe à 7 px du milieu d'un côté. Sans la comparaison des
           directions, la hauteur perdait sa seule marque. */
        { nom: 'le faux voisin : médiatrices ET hauteurs, triangle presque isocèle',
          ph: ['Trace un triangle ABC tel que AB = 7 cm, AC = 6.9 cm et BC = 5 cm',
               'Trace les médiatrices du triangle ABC',
               'Trace les hauteurs du triangle ABC'], coins: 6 },
        { nom: 'les médiatrices aux instruments', ph: ['Trace un triangle ABC tel que AB = 7 cm, AC = 6 cm et BC = 5 cm',
               'Trace les médiatrices du triangle ABC'], instruments: true, coins: 3 },
    ];

    console.log('\n=== une seule équerre par coin ===');
    for (const c of CAS) {
        const r = await figure(c.ph, c.instruments);
        if (r.refus.length) { ck(c.nom, false, 'consigne refusée : ' + r.refus[0].slice(0, 70)); continue; }
        const e = r.equerres;
        const doubles = e.coins.filter(x => x.n > 1);
        ck(c.nom + ' : aucun coin codé deux fois', doubles.length === 0,
           `${e.coins.length} coin(s), ${e.total} équerre(s)` +
           (doubles.length ? ' — DOUBLE : ' + JSON.stringify(doubles[0]) : ''));
        ck(c.nom + ` : ${c.coins} coin(s) codé(s), pas zéro`, e.coins.length === c.coins,
           e.coins.length + ' au lieu de ' + c.coins);
    }

    /* ---- ET ELLE DOIT TENIR QUAND ON TIRE ---- */
    console.log("\n=== l'angle reste droit, et seul, quand on tire un sommet ===");
    const tirer = async (phrases, label, dx, dy) => {
        await page.evaluate(({ ph, lb, ddx, ddy }) => {
            window.app.entities = []; window.app.historyPast = [];
            if (window.app.cslOublier) window.app.cslOublier();
            for (const p of ph) { try { window.app.executerConsigneAvec(p, false); } catch (e) { void e; } }
            const cible = window.app.entities.find(e => e.constructor.name === 'Point' && e.label === lb);
            if (cible) { cible.x += ddx; cible.y += ddy; }
            window.app.entities.forEach(e => e.update && e.update());
            window.app.updateDependents && window.app.updateDependents();
            window.app.render();
        }, { ph: phrases, lb: label, ddx: dx, ddy: dy });
        return page.evaluate(() => ({
            equerres: window.gmEquerres(),
            angles: window.app.entities.filter(e => e.constructor.name === 'Angle')
                .map(a => Math.round(a.getAngleValue() * 10) / 10),
        }));
    };

    const med = ['Trace un triangle ABC tel que AB = 7 cm, AC = 6 cm et BC = 5 cm',
                 'Trace les médiatrices du triangle ABC',
                 'Trace le cercle circonscrit au triangle ABC'];
    for (const [lb, dx, dy] of [['B', 120, -70], ['A', -90, 60], ['C', 40, 130]]) {
        const r = await tirer(med, lb, dx, dy);
        const droits = r.angles.filter(v => Math.abs(v - 90) < 0.5).length;
        ck(`on tire ${lb} : les 3 angles restent droits`, droits === 3 && r.angles.length === 3,
           'valeurs : ' + r.angles.join('° / ') + '°');
        const doubles = r.equerres.coins.filter(x => x.n > 1);
        ck(`on tire ${lb} : toujours une seule équerre par coin`,
           doubles.length === 0 && r.equerres.coins.length === 3,
           `${r.equerres.coins.length} coin(s)` + (doubles.length ? ' — DOUBLE ' + JSON.stringify(doubles[0]) : ''));
    }

    const tg = ['Trace un cercle de centre O et de rayon 3 cm', 'Trace la tangente au cercle en A'];
    const rt = await tirer(tg, 'O', 70, 50);
    ck('on tire le centre : la tangente reste à angle droit',
       rt.angles.length >= 1 && rt.angles.every(v => Math.abs(v - 90) < 0.5), rt.angles.join('° / ') + '°');
    ck('on tire le centre : une seule équerre',
       rt.equerres.coins.length === 1 && rt.equerres.coins[0].n === 1, JSON.stringify(rt.equerres.coins));

    /* ---- LE REJEU : le coin n'est jamais nu ---- */
    console.log('\n=== pendant le rejeu, le coin n\'est jamais nu ni double ===');
    const rejeu = await page.evaluate(({ ph }) => {
        window.app.entities = []; window.app.historyPast = [];
        if (window.app.cslOublier) window.app.cslOublier();
        for (const p of ph) { try { window.app.executerConsigneAvec(p, false); } catch (e) { void e; } }
        const n = window.app.entities.length;
        const etapes = [];
        for (let i = 1; i <= n; i++) {
            window.app.replayIndex = i;
            window.app.isPlaying = true;
            const e = window.gmEquerres();
            etapes.push({ i, coins: e.coins.length, double: e.coins.filter(c => c.n > 1).length });
        }
        window.app.isPlaying = false; window.app.replayIndex = n; window.app.render();
        return { n, pires: etapes.filter(s => s.double > 0) };
    }, { ph: ['Trace un segment [AB] de longueur 7 cm', 'Trace la médiatrice du segment [AB]'] });
    ck('aucune étape du rejeu ne montre deux équerres', rejeu.pires.length === 0,
       `${rejeu.n} étapes parcourues` + (rejeu.pires.length ? ' — ' + JSON.stringify(rejeu.pires[0]) : ''));

    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
