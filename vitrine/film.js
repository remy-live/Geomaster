/* FILMER GÉOMASTER POUR LES RÉSEAUX.
   On ne simule rien : Playwright pilote la vraie page, tape dans le vrai champ,
   clique les vrais boutons et saisit le compas par ses vraies zones de prise.
   Ce qu'on voit dans le clip est ce qu'on obtient en ouvrant le logiciel.

   Seule addition pour la caméra : une pastille qui suit le pointeur. Playwright
   envoie de vrais événements souris mais aucun curseur n'est rendu dans la
   vidéo ; sans elle, les instruments sembleraient bouger seuls. La pastille
   écoute pointermove : elle montre où le pointeur est vraiment, elle ne joue
   pas un geste qui n'a pas eu lieu.

   Playwright n'enregistre qu'en WebM ; les réseaux veulent du MP4. On convertit
   donc avec un ffmpeg complet (H.264), et l'on produit aussi une version carrée
   pour les fils qui n'aiment pas le 16/9. Celui que Playwright embarque ne sait
   faire que du VP8 : il faut un vrai ffmpeg, d'où GM_FFMPEG.

   Usage : node vitrine/film.js <consigne|instruments|animation>
     GM_CHROME  le navigateur (celui de Playwright par défaut)
     GM_FFMPEG  le ffmpeg à utiliser (`ffmpeg` par défaut)
     GM_FILMS   où écrire (le dossier vitrine/ par défaut) */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
// La page filmée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const OUT = (process.env.GM_FILMS || __dirname).replace(/\/*$/, '/');
const FFMPEG = process.env.GM_FFMPEG || 'ffmpeg';
const W = 1280, H = 720;

const NETTOYER = () => {
    try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
    try { localStorage.setItem('gm_decor', 'non'); } catch (e) { void e; }
    const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
    window.app.checkAutoSave = () => {};
    window.app.entities = [];
    ['#gmDecor'].forEach(s => document.querySelectorAll(s)
        .forEach(e => { e.style.display = 'none'; }));
    window.app.render();
};

/* La pastille de pointeur : branchée sur les vrais événements. */
const CURSEUR = () => {
    const d = document.createElement('div');
    d.id = 'gmCurseurFilm';
    d.style.cssText = 'position:fixed; left:0; top:0; width:22px; height:22px;'
        + 'margin:-11px 0 0 -11px; border-radius:50%; pointer-events:none;'
        + 'z-index:2147483647; background:rgba(41,128,185,.28);'
        + 'border:2px solid rgba(41,128,185,.9); transition:transform .08s ease;'
        + 'opacity:0;';
    document.body.appendChild(d);
    const bouge = (e) => {
        d.style.opacity = '1';
        d.style.left = e.clientX + 'px';
        d.style.top = e.clientY + 'px';
    };
    window.addEventListener('pointermove', bouge, true);
    window.addEventListener('pointerdown', (e) => { bouge(e); d.style.transform = 'scale(.55)'; }, true);
    window.addEventListener('pointerup', () => { d.style.transform = 'scale(1)'; }, true);
};

/* ---- repères : du monde de la figure aux pixels de la page ---- */
const CADRE = (page) => page.evaluate(() => {
    const r = window.app.canvas.getBoundingClientRect(), v = window.app.view;
    return { l: r.left, t: r.top, z: v.zoom, vx: v.x, vy: v.y };
});
const versPage = (c, p) => ({ x: c.l + c.vx + p.x * c.z, y: c.t + c.vy + p.y * c.z });

/* Un point de saisie n'existe que s'il tombe sur la toile : on le vérifie
   auprès de la page elle-même avant de filmer un geste dans le vide. */
async function surLaToile(page, pt, quoi) {
    const quoiLa = await page.evaluate(({ x, y }) => {
        const e = document.elementFromPoint(x, y);
        return e ? (e.id || e.tagName + '.' + (e.className || '').toString().slice(0, 30)) : 'rien';
    }, pt);
    if (!/canvas/i.test(quoiLa)) {
        throw new Error(`${quoi} : le point (${Math.round(pt.x)},${Math.round(pt.y)}) `
            + `ne tombe pas sur la toile mais sur « ${quoiLa} »`);
    }
}
async function glisser(page, de, a, pas = 22, pause = 14) {
    await page.mouse.move(de.x, de.y);
    await page.waitForTimeout(240);
    await page.mouse.down();
    for (let k = 1; k <= pas; k++) {
        const t = k / pas;
        await page.mouse.move(de.x + (a.x - de.x) * t, de.y + (a.y - de.y) * t);
        await page.waitForTimeout(pause);
    }
    await page.waitForTimeout(140);
    await page.mouse.up();
}

/* ---- le compas, saisi par ses vraies zones ---- */
const PRISES = () => {
    const w = window.app.compassWidget;
    const base = w.legLength || 320;
    const leg = Math.max(base, (w.radius / 2) + 20);
    const h = Math.sqrt(leg ** 2 - (w.radius / 2) ** 2);
    const po = w.constructor.pastilleOuverture(w.radius);
    const prise = (lx, ly) => {
        const g = w.toGlobal(lx, ly);
        return { p: g, zone: w.getHitZone(g.x, g.y) };
    };
    return {
        centre: { x: w.x, y: w.y }, r: w.radius, angle: w.angle, h,
        branche: prise(w.radius / 4, -h / 2),
        pastille: prise(po.x, po.y),
        crayon: prise(w.radius, -20),
        pivot: prise(w.radius / 2, -h - 25),
    };
};

async function planter(page, ou) {
    const c = await CADRE(page);
    const pr = await page.evaluate(PRISES);
    if (pr.branche.zone !== 'move') throw new Error('la branche ne répond plus « move » : ' + pr.branche.zone);
    const de = versPage(c, pr.branche.p);
    const a = { x: de.x + (ou.x - pr.centre.x) * c.z, y: de.y + (ou.y - pr.centre.y) * c.z };
    await surLaToile(page, de, 'saisir la branche');
    await surLaToile(page, a, 'planter la pointe');
    await glisser(page, de, a, 26, 16);
}
async function ouvrir(page, rayon) {
    const c = await CADRE(page);
    const pr = await page.evaluate(PRISES);
    if (pr.pastille.zone !== 'resize') throw new Error('la pastille ne répond plus « resize » : ' + pr.pastille.zone);
    const de = versPage(c, pr.pastille.p);
    const a = { x: de.x + (rayon - pr.r) * c.z, y: de.y };
    await surLaToile(page, de, "saisir l'ouverture");
    await glisser(page, de, a, 24, 16);
}
/* Faire pivoter le compas autour de sa pointe jusqu'à un angle visé. Le bouton
   du haut décrit un cercle autour de l'aiguille : on l'y emmène. */
async function pivoter(page, vise) {
    const c = await CADRE(page);
    const pr = await page.evaluate(PRISES);
    if (pr.pivot.zone !== 'rotate') throw new Error('le bouton du haut ne répond plus « rotate » : ' + pr.pivot.zone);
    const d = Math.hypot(pr.r / 2, pr.h + 25);
    const biais = Math.atan2(-(pr.h + 25), pr.r / 2);
    const de = versPage(c, pr.pivot.p);
    const a = versPage(c, { x: pr.centre.x + d * Math.cos(vise + biais),
                            y: pr.centre.y + d * Math.sin(vise + biais) });
    await surLaToile(page, de, 'saisir le bouton de rotation');
    await glisser(page, de, a, 26, 15);
}
async function tracer(page, balayage) {
    const c = await CADRE(page);
    const pr = await page.evaluate(PRISES);
    if (pr.crayon.zone !== 'trace') throw new Error('le crayon ne répond plus « trace » : ' + pr.crayon.zone);
    const depart = versPage(c, pr.crayon.p);
    await surLaToile(page, depart, 'saisir le crayon');
    await page.mouse.move(depart.x, depart.y);
    await page.waitForTimeout(260);
    await page.mouse.down();
    const n = 46;
    for (let k = 0; k <= n; k++) {
        const a = pr.angle + (k / n) * balayage;
        const g = { x: pr.centre.x + pr.r * Math.cos(a), y: pr.centre.y + pr.r * Math.sin(a) };
        const p = versPage(c, g);
        await page.mouse.move(p.x, p.y);
        await page.waitForTimeout(16);
    }
    await page.waitForTimeout(160);
    await page.mouse.up();
}

const SCENES = {
    /* 1. LA CONSIGNE — on écrit la phrase, la figure se fait. */
    consigne: async (page) => {
        await page.waitForTimeout(900);
        const champ = page.locator('#premiereLigneChamp');
        await champ.click();
        await champ.fill('');
        await page.waitForTimeout(400);
        await champ.type('Trace un triangle ABC tel que AB = 7 cm, AC = 6 cm et BC = 5 cm',
                         { delay: 42 });
        await page.waitForTimeout(700);
        await page.locator('#premiereLigneGo').click();
        await page.waitForTimeout(1600);
        /* on enchaîne deux consignes de plus, dans le panneau */
        for (const p of ['Trace les médiatrices du triangle ABC',
                         'Trace le cercle circonscrit au triangle ABC']) {
            await page.evaluate((t) => {
                const l = window.app.consignesListe();
                let i = l.findIndex(c => !(c.texte || '').trim());
                if (i < 0) { l.push(window.app.consigneNeuve()); i = l.length - 1; }
                l[i].texte = t; l[i].faite = false; l[i].etat = null;
                window.app.majConsignes(i);
            }, p);
            await page.waitForTimeout(650);
            await page.evaluate(() => {
                const l = window.app.consignesListe();
                const i = l.findIndex(c => (c.texte || '').trim() && !c.faite);
                if (i >= 0) window.app.validerConsigne(i);
                window.app.render();
            });
            await page.waitForTimeout(900);
        }
        await page.waitForTimeout(1400);
    },

    /* 2. LES INSTRUMENTS — le compas se prend en main : on le plante sur A, on
       l'écarte, on le fait pivoter, on trace ; on le replante sur B, on retrace.
       Les deux arcs se coupent au-dessus ET au-dessous de [AB] : c'est le geste
       de la médiatrice, celui qu'on demande en 6e. Les angles ne sont pas
       choisis à l'œil : les croisements sont à ±41,4° de chaque pointe, on
       balaie de part et d'autre. */
    instruments: async (page) => {
        const A = { x: 300, y: 300 }, B = { x: 720, y: 300 }, R = 280;
        const DEG = Math.PI / 180;
        /* le segment est posé d'avance : le clip parle du compas, pas de lui */
        await page.evaluate(({ a, b }) => {
            window.app.executerConsigneAvec('Trace un segment [AB] de longueur 6 cm', false);
            const pts = window.app.entities.filter(e => e.constructor.name === 'Point');
            const pa = pts.find(p => p.label === 'A'), pb = pts.find(p => p.label === 'B');
            if (pa) { pa.x = a.x; pa.y = a.y; }
            if (pb) { pb.x = b.x; pb.y = b.y; }
            window.app.entities.forEach(e => e.update && e.update());
            window.app.updateDependents && window.app.updateDependents();
            window.app.render();
        }, { a: A, b: B });
        await page.waitForTimeout(1000);

        await page.locator('#btn-compass').click();           /* le compas arrive */
        await page.waitForTimeout(700);
        await planter(page, A);                               /* la pointe sur A */
        await page.waitForTimeout(250);
        await ouvrir(page, R);                                /* on écarte */
        await page.waitForTimeout(250);
        await pivoter(page, -65 * DEG);                       /* on vise sous le croisement */
        await page.waitForTimeout(200);
        await tracer(page, 130 * DEG);                        /* premier arc */
        await page.waitForTimeout(450);
        await planter(page, B);                               /* la pointe sur B */
        await page.waitForTimeout(250);
        await pivoter(page, 115 * DEG);
        await page.waitForTimeout(200);
        await tracer(page, 130 * DEG);                        /* second arc : du même côté que le croisement */
        await page.waitForTimeout(700);
        await page.locator('#btn-compass').click();           /* on range : la figure reste */
        await page.waitForTimeout(1600);
    },

    /* 3. L'ANIMATION — la figure est là ; on appuie sur ▶ et elle se refait
       toute seule, au compas, du premier arc au cercle circonscrit. */
    animation: async (page) => {
        await page.evaluate(() => {
            for (const p of ['Trace un triangle ABC tel que AB = 7 cm, AC = 6 cm et BC = 5 cm',
                             'Trace le cercle circonscrit au triangle ABC']) {
                window.app.executerConsigneAvec(p, true);
            }
            window.app.setSpeed(10);
            if (window.app.cadrerSurFigure) window.app.cadrerSurFigure();
            window.app.render();
        });
        await page.waitForTimeout(2000);                      /* on voit la figure finie */
        const bouton = page.locator('#btnPlay');
        await bouton.scrollIntoViewIfNeeded();
        await bouton.click();                                 /* ▶ : elle se rembobine */
        await page.waitForTimeout(400);
        const t0 = Date.now();
        while (Date.now() - t0 < 40000) {
            await page.waitForTimeout(300);
            if (!(await page.evaluate(() => window.app.isPlaying))) break;
        }
        await page.waitForTimeout(1700);
    },
};

(async () => {
    const quoi = process.argv[2] || 'consigne';
    if (!SCENES[quoi]) { console.log('scène inconnue : ' + quoi); process.exit(1); }
    const brut = OUT + 'brut-' + quoi;
    fs.rmSync(brut, { recursive: true, force: true });
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME || undefined });
    const ctx = await nav.newContext({ viewport: { width: W, height: H },
        recordVideo: { dir: brut, size: { width: W, height: H } } });
    const page = await ctx.newPage();
    const boum = []; page.on('pageerror', e => boum.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    await page.evaluate(NETTOYER);
    await page.evaluate(CURSEUR);
    let rate = null;
    try { await SCENES[quoi](page); } catch (e) { rate = e.message; }
    await ctx.close();
    await nav.close();
    if (rate) { console.log('  GESTE MANQUÉ : ' + rate); process.exit(1); }
    const webm = fs.readdirSync(brut).find(f => f.endsWith('.webm'));
    const src = path.join(brut, webm);
    const mp4 = OUT + quoi + '.mp4';
    const carre = OUT + quoi + '-carre.mp4';
    execFileSync(FFMPEG, ['-y', '-i', src, '-c:v', 'libx264', '-preset', 'slow',
        '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4],
        { stdio: 'pipe' });
    execFileSync(FFMPEG, ['-y', '-i', src, '-vf',
        'scale=1080:-2,pad=1080:1080:0:(oh-ih)/2:white', '-c:v', 'libx264',
        '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', carre], { stdio: 'pipe' });
    const ko = (f) => Math.round(fs.statSync(f).size / 1024);
    /* `ffmpeg -i` sans fichier de sortie se plaint et sort en 1 : c'est normal,
       on ne lui demandait que de décrire. On lit la durée dans sa plainte. */
    let duree = '?';
    try { execFileSync(FFMPEG, ['-i', mp4], { stdio: ['pipe', 'pipe', 'pipe'] }); }
    catch (e) {
        const m = /Duration: (\d+:\d+:\d+\.\d+)/.exec(String(e.stderr || ''));
        if (m) duree = m[1];
    }
    console.log(`  ${quoi} : ${duree} — ${ko(mp4)} ko en 16/9, ${ko(carre)} ko en carré`
        + (boum.length ? '   ERREURS JS : ' + boum[0].slice(0, 60) : ''));
})().catch(e => { console.log('BOUM ' + ((e && e.message) || String(e)).slice(0, 300)); process.exit(1); });
