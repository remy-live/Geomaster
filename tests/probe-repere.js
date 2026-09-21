/* LE REPÈRE, ET LE POINT QU'ON Y PLACE.
 *
 * « Trace un repère » répondait « Je n'ai pas compris », et « Place le point
 * A(3;2) » posait un point AU HASARD : les coordonnées étaient lues, puis jetées,
 * et la réponse ne disait rien. C'est la figure de la 5e, et celle de tous les
 * chapitres de fonctions ensuite.
 *
 * IL N'A PAS DE BOUTON, ET C'EST LA PARTIE QU'ON RISQUE D'OUBLIER DE MESURER.
 * La barre d'outils compte vingt-trois icônes dont quinze sont hors écran sur un
 * téléphone ; un repère se pose une fois par exercice. C'est une phrase, pas un
 * geste — comme le flocon de Koch, la spirale, le patron du cube et la droite
 * d'Euler, qui vivent déjà sans icône. La sonde tient donc aussi ce qui ne se
 * voit pas : **aucun bouton n'a été ajouté**.
 *
 * L'AXE DES ORDONNÉES MONTE, ET C'EST LE SIGNE QU'ON INVERSE UNE FOIS SUR DEUX.
 * Le canevas compte ses y vers le BAS. La sonde ne se contente donc pas de voir
 * que A existe : elle RELIT sa position dans le repère et demande (3;2), et elle
 * vérifie qu'un point d'ordonnée positive est bien PLUS HAUT à l'écran que
 * l'origine — en pixels, où « plus haut » veut dire « y plus petit ».
 *
 * TROIS ALLERS-RETOURS, parce qu'une figure qui ne se range pas n'existe qu'une
 * fois : le fichier JSON, le lien compact, et l'export SVG. Le dernier est le
 * plus sournois — la chaîne d'export est une suite de « sinon si » par classe, et
 * une classe qu'elle ne connaît pas tombe SANS RIEN DIRE. La figure exportée
 * aurait perdu ses axes, et rien ne l'aurait signalé : c'est précisément la faute
 * que probe-dit-vrai.js vient d'outiller.
 *
 * ET SANS REPÈRE, LES COORDONNÉES SE REFUSENT. « Place le point A(3;2) » sur une
 * feuille nue ne doit pas poser un point quelque part en répondant oui : il n'y a
 * pas d'origine, pas d'unité, la phrase ne veut rien dire. Elle le dit.
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
    });

    const faire = (phrases) => page.evaluate((phrases) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        const reponses = [];
        phrases.forEach((p) => {
            let r;
            try { r = a.executerConsigneAvec(p, false); }
            catch (e) { r = { ok: false, message: 'BOUM ' + e.message }; }
            reponses.push({ ok: !!(r && r.ok), msg: (r && r.message) || '' });
        });
        const rep = a.entities.filter(e => e instanceof Repere).pop();
        const lu = (l) => {
            const p = a.entities.find(e => e instanceof Point && e.label === l);
            if (!p || !rep) return null;
            const c = rep.versRepere(p.x, p.y);
            return { u: Math.round(c.u * 100) / 100, v: Math.round(c.v * 100) / 100,
                     ecranY: p.y };
        };
        return { reponses, repere: !!rep,
                 unite: rep ? rep.unite : null,
                 bornes: rep ? [rep.xMin, rep.xMax, rep.yMin, rep.yMax] : null,
                 origineY: rep && rep.origine ? rep.origine.y : null,
                 A: lu('A'), B: lu('B'), C: lu('C'), M: lu('M') };
    }, phrases);

    console.log('\n=== « Trace un repère » ===');
    {
        const r = await faire(['Trace un repère']);
        ck('la phrase est comprise', r.reponses[0].ok, r.reponses[0].msg);
        ck('  un repère est sur la feuille', r.repere);
        ck('  son unité vaut un centimètre', r.unite === 50, String(r.unite));
        ck('  et il tient dans l\'écran', JSON.stringify(r.bornes) === '[-5,5,-4,4]',
           JSON.stringify(r.bornes));
    }

    console.log('\n=== ce que la phrase règle ===');
    {
        const r = await faire(["Trace un repère d'unité 2 cm"]);
        ck('« d\'unité 2 cm » double l\'unité', r.unite === 100, String(r.unite));
        ck('  et la réponse le dit', /2 cm/.test(r.reponses[0].msg), r.reponses[0].msg);
        const b = await faire(['Trace un repère de -10 à 10']);
        ck('« de -10 à 10 » règle les bornes',
           JSON.stringify(b.bornes) === '[-10,10,-10,10]', JSON.stringify(b.bornes));
        const d = await faire(['Trace un repère', 'Trace un repère']);
        ck('un second repère est refusé', !d.reponses[1].ok, d.reponses[1].msg);
    }

    console.log('\n=== un point tombe à SES coordonnées, et l\'axe des y MONTE ===');
    {
        const r = await faire(['Trace un repère', 'Place le point A(3;2)',
                               'Place les points B(-2;1) et C(1;-3)']);
        ck('les trois phrases passent', r.reponses.every(x => x.ok),
           r.reponses.map(x => x.msg).join(' | '));
        ck('A est en (3;2)', !!r.A && r.A.u === 3 && r.A.v === 2, JSON.stringify(r.A));
        ck('  B en (-2;1)', !!r.B && r.B.u === -2 && r.B.v === 1, JSON.stringify(r.B));
        ck('  C en (1;-3)', !!r.C && r.C.u === 1 && r.C.v === -3, JSON.stringify(r.C));
        /* LE SIGNE. Sur le canevas, y grandit vers le BAS : une ordonnée POSITIVE
           doit donc donner un y d'écran PLUS PETIT que celui de l'origine. C'est
           l'erreur qu'on ne voit pas dans les nombres du repère, puisqu'ils sont
           calculés avec le même signe que le dessin. */
        ck('  une ordonnée positive est plus HAUT à l\'écran',
           !!r.A && r.A.ecranY < r.origineY,
           `A à y=${Math.round(r.A ? r.A.ecranY : 0)}, origine à y=${Math.round(r.origineY)}`);
        ck('  et une ordonnée négative plus BAS',
           !!r.C && r.C.ecranY > r.origineY,
           `C à y=${Math.round(r.C ? r.C.ecranY : 0)}`);
        /* La réponse doit citer les coordonnées, pas seulement la lettre. */
        ck('  la réponse cite les coordonnées',
           /3\s*;\s*2/.test(r.reponses[1].msg), r.reponses[1].msg);
    }

    console.log('\n=== sans repère, les coordonnées se refusent ===');
    {
        const r = await faire(['Place le point A(3;2)']);
        ck('la phrase est refusée', !r.reponses[0].ok, r.reponses[0].msg);
        ck('  et le refus dit quoi écrire d\'abord',
           /repère/i.test(r.reponses[0].msg), r.reponses[0].msg);
        const d = await faire(['Trace un triangle ABC', 'Trace un repère',
                               'Place le point A(1;1)']);
        ck('un point qui existe déjà n\'est pas déplacé en silence',
           !d.reponses[2].ok && /existe/i.test(d.reponses[2].msg), d.reponses[2].msg);
    }

    console.log('\n=== la figure se range, et revient entière ===');
    {
        const aller = await page.evaluate(() => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            a.executerConsigneAvec('Trace un repère', false);
            a.executerConsigneAvec('Place les points A(3;2), B(-2;1) et C(1;-3)', false);
            a.executerConsigneAvec('Trace le triangle ABC', false);
            const lire = () => {
                const rep = a.entities.filter(e => e instanceof Repere).pop();
                if (!rep) return null;
                const pts = ['A', 'B', 'C'].map((l) => {
                    const p = a.entities.find(e => e instanceof Point && e.label === l);
                    if (!p) return l + '?';
                    const c = rep.versRepere(p.x, p.y);
                    return `${l}(${Math.round(c.u * 100) / 100};${Math.round(c.v * 100) / 100})`;
                }).join(' ');
                return { pts, unite: rep.unite, bornes: [rep.xMin, rep.xMax, rep.yMin, rep.yMax] };
            };
            const avant = lire();
            /* 1. le fichier */
            const json = JSON.stringify(a.serialize());
            a.entities = a.deserialize(JSON.parse(json));
            const apresJson = lire();
            /* 2. le lien */
            const code = a.getCompressedString();
            a.loadFromCompressedString(code);
            const apresLien = lire();
            /* 3. l'export */
            const svg = a.generateSVGString(false, 'text') || '';
            const textes = (svg.match(/<text[^>]*>([^<]*)<\/text>/g) || [])
                .map(x => x.replace(/<[^>]*>/g, ''));
            return { avant, apresJson, apresLien, taille: code.length,
                     svgLignes: (svg.match(/<line /g) || []).length,
                     svgTextes: textes };
        });
        ck('par le fichier JSON',
           !!aller.apresJson && JSON.stringify(aller.apresJson) === JSON.stringify(aller.avant),
           JSON.stringify(aller.apresJson));
        ck('par le lien compact',
           !!aller.apresLien && JSON.stringify(aller.apresLien) === JSON.stringify(aller.avant),
           `${JSON.stringify(aller.apresLien)} — ${aller.taille} caractères`);
        /* L'EXPORT EST LE PLUS SOURNOIS : une classe inconnue de la chaîne tombe
           sans rien dire, et la figure sort sans ses axes. */
        ck('et l\'export SVG emporte les axes',
           aller.svgLignes >= 20, aller.svgLignes + ' lignes');
        ck('  avec ses graduations chiffrées',
           ['-5', '5', '-4', '4'].every(n => aller.svgTextes.includes(n)),
           aller.svgTextes.join(' '));
        ck('  le nom des axes', aller.svgTextes.includes('x') && aller.svgTextes.includes('y'),
           aller.svgTextes.join(' '));
        ck('  et les points de la figure',
           ['O', 'A', 'B', 'C'].every(n => aller.svgTextes.includes(n)),
           aller.svgTextes.join(' '));
    }

    /* CE QUI NE SE VOIT PAS : la barre d'outils n'a pas grossi. C'est la moitié
       de la décision, et c'est celle qu'on oublie de tenir. */
    console.log('\n=== et la barre d\'outils n\'a pas grossi ===');
    {
        const n = await page.evaluate(() => ({
            outils: document.querySelectorAll('.tool-btn').length,
            haut: document.querySelectorAll('.top-btn').length,
        }));
        ck('vingt-trois outils, comme avant le repère', n.outils === 23, String(n.outils));
        ck('  et vingt-et-un boutons d\'en-tête', n.haut === 21, String(n.haut));
    }

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
