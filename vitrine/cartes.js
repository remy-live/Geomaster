/* LES IMAGES DE LA VITRINE — fabriquées avec le logiciel lui-même.
   On ne met pas une maquette : on fait tracer une vraie figure par GéoMaster,
   avec son panneau de consignes ouvert, et l'on photographie. Ce qu'on montre
   doit être ce qu'on obtient — y compris ses défauts, raison de plus pour les
   refaire après chaque correction qui touche au dessin.

   Usage : node vitrine/cartes.js
     GM_CHROME   le navigateur (celui de Playwright par défaut)
     GM_VITRINE  où écrire (le dossier vitrine/ par défaut) */
const { chromium } = require('playwright');
const path = require('path');
// La page photographiée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const OUT = (process.env.GM_VITRINE || __dirname).replace(/\/*$/, '/');

const SCENES = [
    { nom: 'consigne', w: 1500, h: 950, lignes: [
        "Trace un triangle ABC tel que AB = 7 cm, AC = 6 cm et BC = 5 cm",
        "Trace les médiatrices du triangle ABC",
        "Place le centre du cercle circonscrit O au triangle ABC",
        "Trace le cercle circonscrit au triangle ABC",
        "Code les longueurs égales" ], panneau: true },
    /* La même figure SANS le panneau : c'est elle qui sert de fond à la carte
       de partage. Avec le panneau, un fragment coupé flottait en haut de la
       carte — on montrait un bout d'interface illisible. */
    /* LA FIGURE DE LA CARTE MONTRE LE COMPAS AU TRAVAIL. Un triangle fini ne
       dit rien de ce qui fait GéoMaster ; les arcs de construction, eux,
       disent « règle et compas » d'un coup d'œil. On lance donc la consigne
       AUX INSTRUMENTS, qui laisse ses arcs sur la feuille. */
    { nom: 'compasarcs', w: 1500, h: 950, instruments: true, lignes: [
        "Trace un triangle équilatéral ABC de 6 cm de côté",
        "Trace la médiatrice de [AB]",
        "Code les longueurs égales" ], panneau: false },
    { nom: 'figure', w: 1500, h: 950, lignes: [
        "Trace un triangle ABC tel que AB = 7 cm, AC = 6 cm et BC = 5 cm",
        "Trace les médiatrices du triangle ABC",
        "Place le centre du cercle circonscrit O au triangle ABC",
        "Trace le cercle circonscrit au triangle ABC",
        "Code les longueurs égales" ], panneau: false },
    { nom: 'compas', w: 1500, h: 950, lignes: [
        "Trace un hexagone régulier inscrit dans un cercle de rayon 4 cm",
        "Trace une rosace de 4 cm" ], panneau: false },
    { nom: 'solides', w: 1500, h: 950, lignes: [
        "Trace un cube de 4 cm",
        "Trace le patron d'un cube de 3 cm" ], panneau: false },
];

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME || undefined });
    for (const s of SCENES) {
        const ctx = await nav.newContext({ viewport: { width: s.w, height: s.h },
                                           deviceScaleFactor: 2 });
        const page = await ctx.newPage();
        const boum = []; page.on('pageerror', e => boum.push(e.message));
        await page.goto(PAGE);
        await page.waitForFunction(() => window.app);
        await page.evaluate(() => document.fonts && document.fonts.ready);
        const r = await page.evaluate(({ lignes, panneau, instruments }) => {
            const app = window.app;
            try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
            try { localStorage.setItem('gm_decor', 'non'); } catch (e) { void e; }
            const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
            app.checkAutoSave = () => {};
            app.entities = []; if (app.cslOublier) app.cslOublier();
            if (panneau && app.lancerEnonce) { app.lancerEnonce(lignes, null); }
            else { lignes.forEach(p => { try { app.executerConsigneAvec(p, !!instruments); }
                                        catch (e) { void e; } }); }
            const b = document.getElementById('instructionBox');
            if (b && !panneau) b.style.display = 'none';
            /* ON NE PHOTOGRAPHIE PAS LES SCORIES : le message passager que
               lancerEnonce vient d'émettre, la télécommande de rejeu, la
               ligne d'accueil. Une vitrine montre le travail, pas l'outil en
               train de parler de lui-même. */
            ['#toast-notification', '#replayBar', '#gm-player-fab', '#premiereLigne',
             '#gmDecor'].forEach(sel => document.querySelectorAll(sel)
                .forEach(el => { el.style.display = 'none'; }));
            app.selectedObject = null; app.hoveredEntities = [];
            if (app.cadrerSurFigure) app.cadrerSurFigure(panneau ? 90 : 120);
            app.render();
            return { objets: app.entities.length };
        }, s);
        await page.waitForTimeout(700);
        await page.screenshot({ path: OUT + s.nom + '.png' });
        console.log(`  ${s.nom.padEnd(10)} ${String(r.objets).padStart(3)} objets`
            + (boum.length ? '  ERREURS JS' : ''));
        await ctx.close();
    }
    await nav.close();
})();
