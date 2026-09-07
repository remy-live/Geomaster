/* L'ANGLE DROIT N'EST PAS UN OBJET DE PLUS.
 *
 * « J'ai deux angles droits !!!! » — deux petits carrés superposés au même
 * croisement, décalés de quelques pixels, l'un noir et l'autre vert. Puis le
 * diagnostic, qui vaut mieux que le mien :
 *
 *   « Je pense que les deux angles droits, c'est quand tu traces une
 *   perpendiculaire d'un schéma et que l'on met un angle. Il ne faut pas qu'il y
 *   ait les deux : l'angle droit est un dessin particulier de l'angle. »
 *
 * C'est exactement cela. La perpendiculaire code déjà son coin ; l'élève repose
 * un angle au même endroit ; et comme il vaut 90°, il se dessine lui aussi en
 * petit carré. Deux objets pour une seule chose à dire.
 *
 * Une première garde comparait les sommets au DEMI-PIXEL : seul un recouvrement
 * exact était vu. Or personne ne clique au pixel près — mesuré, UN pixel d'écart
 * suffisait à faire réapparaître les deux carrés. La garde prend maintenant la
 * distance d'accrochage de l'application, celle à laquelle un point s'attrape à
 * la souris : ce qui est « le même point » pour la main est le même point pour
 * la figure.
 *
 * Et le geste de l'élève n'est pas perdu : ce que le nouvel angle dit de PLUS —
 * sa couleur, sa valeur affichée, son remplissage — passe sur celui qui est
 * déjà là. Un seul angle, mais c'est bien le sien.
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

    const r = await page.evaluate(() => {
        const app = window.app;

        /* Reposer un angle sur un coin déjà codé, le sommet décalé de « d » px —
           comme le fait une main qui vise le croisement. */
        const reposer = (d, options) => {
            app.entities = []; app.historyPast = [];
            if (app.cslOublier) app.cslOublier();
            app.executerConsigneAvec('Trace deux droites perpendiculaires', false);
            const avant = app.entities.filter(e => e instanceof Angle);
            if (!avant.length) return { erreur: 'la perpendiculaire ne code pas son coin' };
            const m = avant[0], S = m.p2;
            const a1 = Math.atan2(m.p1.y - S.y, m.p1.x - S.x);
            const a2 = Math.atan2(m.p3.y - S.y, m.p3.x - S.x);
            const V = new Point(S.x + d, S.y, ''); app.addEntity(V);
            const P1 = new Point(S.x + Math.cos(a1) * 120, S.y + Math.sin(a1) * 120, '');
            const P3 = new Point(S.x + Math.cos(a2) * 140, S.y + Math.sin(a2) * 140, '');
            app.addEntity(P1); app.addEntity(P3);
            const neuf = new Angle(P1, V, P3);
            Object.assign(neuf, options || {});
            app.addEntity(neuf);
            const apres = app.entities.filter(e => e instanceof Angle);
            return { avant: avant.length, apres: apres.length,
                     couleur: apres[0] ? apres[0].color : null,
                     valeur: apres[0] ? !!apres[0].showValue : null };
        };

        const decalages = [0, 1, 3, 6, 10].map(d => ({ d, ...reposer(d) }));
        const repris = reposer(4, { color: '#c0392b', showValue: true });

        /* Les figures où DEUX angles partagent un sommet doivent les garder :
           leurs côtés sont différents, ce ne sont pas les mêmes angles. */
        const partages = ['Trace deux angles complémentaires',
                          'Trace deux angles adjacents',
                          'Trace deux angles supplémentaires',
                          'Trace deux angles opposés par le sommet'].map(ph => {
            app.entities = []; app.historyPast = [];
            if (app.cslOublier) app.cslOublier();
            let res;
            try { res = app.executerConsigneAvec(ph, false); }
            catch (e) { return { ph, erreur: e.message }; }
            return { ph, ok: !!(res && res.ok),
                     angles: app.entities.filter(e => e instanceof Angle).length };
        });

        /* Et les quatre angles d'un croisement restent quatre. */
        app.entities = []; app.historyPast = [];
        if (app.cslOublier) app.cslOublier();
        const O = new Point(700, 500, 'O'); app.addEntity(O);
        const bras = [0, 90, 180, 270].map(deg => {
            const a = deg * Math.PI / 180;
            const p = new Point(O.x + Math.cos(a) * 150, O.y + Math.sin(a) * 150, '');
            app.addEntity(p); return p;
        });
        for (let i = 0; i < 4; i++) app.addEntity(new Angle(bras[i], O, bras[(i + 1) % 4]));
        const croisement = app.entities.filter(e => e instanceof Angle).length;

        return { decalages, repris, partages, croisement };
    });

    console.log('\n=== un coin déjà codé n\'accepte pas un second angle ===');
    r.decalages.forEach((x) => {
        if (x.erreur) { ck('sommet décalé de ' + x.d + ' px', false, x.erreur); return; }
        ck('sommet décalé de ' + x.d + ' px : un seul angle',
           x.apres === 1, x.avant + ' avant, ' + x.apres + ' après');
    });

    console.log('\n=== mais le geste de l\'élève passe sur l\'angle qui est là ===');
    ck('un seul angle, et c\'est le sien — couleur et valeur reprises',
       r.repris.apres === 1 && r.repris.couleur === '#c0392b' && r.repris.valeur === true,
       JSON.stringify(r.repris));

    console.log('\n=== deux angles au même sommet, mais de côtés différents, vivent ===');
    r.partages.forEach((x) => {
        if (x.erreur) { ck(x.ph, false, x.erreur); return; }
        ck(x.ph, x.ok && x.angles >= 2, x.angles + ' angles');
    });
    ck('les quatre angles d\'un croisement restent quatre', r.croisement === 4,
       r.croisement + ' angles');

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
