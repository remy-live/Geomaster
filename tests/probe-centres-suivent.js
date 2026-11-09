/* UN CENTRE DE TRIANGLE DOIT RESTER SON CENTRE QUAND ON TIRE UN SOMMET.
 *
 * « Normalement tu ne dois pas les perdre si tu construis l'orthocentre avec
 *   les perpendiculaires, car les points d'intersection suivent les
 *   mouvements. »
 *
 * C'ÉTAIT EXACT, ET LE LOGICIEL NE S'EN SERVAIT PAS. `poserCentre` finissait sur
 * un `new Point(o.x, o.y, nom)` SANS PARENTS : une coordonnée, pas une relation.
 * Mesuré sur un triangle ABC, le sommet A tiré de 150 px à la souris :
 *   · l'orthocentre finissait à 331,49 px de sa vraie place, et à 115,68 px et
 *     65,15 px de deux des trois hauteurs dont la réponse affirmait pourtant
 *     qu'il était le croisement ;
 *   · le cercle circonscrit avait son centre à 85,7 px du bon et son rayon faux
 *     de 42,9 px — il ne passait plus par aucun sommet ;
 *   · le cercle inscrit, centre à 74,3 px, rayon faux de 33,2 px — il coupait
 *     deux côtés ;
 *   · la droite d'Euler passait à 30,6 / 28,5 / 146,8 px des trois centres
 *     qu'elle prétend aligner ;
 *   · le cercle des neuf points : centre à 123,1 px, rayon faux de 21,6 px.
 *
 * TOUT ÉTAIT DÉJÀ LÀ. Mesuré également : les hauteurs, les médiatrices et les
 * médianes suivent le sommet qu'on tire (0 px), `getIntersections` croise les
 * perpendiculaires comme les segments, `Point.update` recalcule tout point dont
 * les deux parents sont des OBJETS, et la relation survit à l'enregistrement et
 * à la relecture (0 px). Les centres naissent donc du croisement de deux de ces
 * droites — tracées en mode détaillé, construites invisibles sinon.
 *
 * UNE SEULE FAMILLE NE SUIVAIT PAS : LES BISSECTRICES. Mesuré, 13,69 / 39,48 /
 * 73,76 px d'écart après le geste. Leur bout était calculé une fois pour toutes :
 * le sommet suivait la main, le bout restait planté, et la demi-droite ne
 * partageait plus l'angle en deux. Il porte maintenant une relation.
 *
 * LA SONDE NE MESURE PAS LES COORDONNÉES, ELLE MESURE LES PROPRIÉTÉS : le centre
 * du cercle circonscrit est à égale distance des trois sommets, celui du cercle
 * inscrit à égale distance des trois côtés, l'orthocentre sur les trois hauteurs.
 * Un point peut tomber juste par hasard sur une cible calculée de la même façon
 * que le logiciel la calcule ; il ne peut pas être équidistant de trois sommets
 * par hasard. Et elle tire le sommet À LA SOURIS : appeler `update()` à la main
 * mesurerait la relation sans mesurer le chemin qui l'emprunte.
 *
 * ENFIN ELLE COMPTE L'ENCRE. Les droites d'appui sont posées invisibles : si
 * elles se voyaient, on aurait réparé le point en abîmant la figure.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};
const d2 = (x) => Math.round(x * 100) / 100;

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

    /* Le triangle est posé à des places connues : une sonde qui tire un sommet
       doit savoir où elle appuie, et le triangle automatique bouge d'un appel à
       l'autre. */
    const poser = (phrase) => page.evaluate((ph) => {
        const a = window.app;
        a.entities = []; a.historyPast = []; a.historyFuture = [];
        a.activeTool = 'select';
        const A = new Point(420, 300, 'A'), B = new Point(360, 660, 'B'), C = new Point(880, 600, 'C');
        a.entities.push(A, B, C);
        [[A, B], [B, C], [C, A]].forEach(([p, q]) => a.addEntity(new Segment(p, q)));
        if (ph) a.executerConsigneAvec(ph, false);
        a.render();
        const r = a.canvas.getBoundingClientRect(), v = a.view;
        return { x: r.left + v.x + 420 * v.zoom, y: r.top + v.y + 300 * v.zoom };
    }, phrase);

    /* On tire A à la souris, comme un élève : 150 px à droite, 60 px en haut. */
    const tirerA = async (de) => {
        await page.mouse.move(de.x, de.y);
        await page.mouse.down();
        for (let k = 1; k <= 12; k++) {
            await page.mouse.move(de.x + 150 * k / 12, de.y - 60 * k / 12);
            await page.waitForTimeout(14);
        }
        await page.mouse.up();
        await page.waitForTimeout(200);
    };

    /* Les propriétés, relevées sur la figure telle qu'elle est après le geste. */
    const relever = () => page.evaluate(() => {
        const a = window.app;
        const P = (n) => a.entities.find(e => e instanceof Point && e.label === n);
        const A = P('A'), B = P('B'), C = P('C');
        const pts = a.entities.filter(e => e instanceof Point && e.label
            && !['A', 'B', 'C'].includes(e.label) && e.visible !== false);
        const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
        const auCote = (p, u, v) => {
            const ux = v.x - u.x, uy = v.y - u.y, l = Math.hypot(ux, uy);
            return Math.abs((p.x - u.x) * uy - (p.y - u.y) * ux) / l;
        };
        /* LA HAUTEUR ISSUE DE S EST PERPENDICULAIRE À (UV), et la distance d'un
           point à cette droite se prend DANS LA DIRECTION DE (UV). Première
           version de cette sonde : le produit en croix — qui mesure la distance
           à la PARALLÈLE au côté passant par le sommet. Elle a crié au défaut
           sur un orthocentre pile au croisement des trois hauteurs (219, 310,
           318 px annoncés), et elle m'a fait écrire de faux chiffres sur la
           version d'avant. Une sonde qui se trompe de droite accuse le juste. */
        const surHauteurs = (p) => [[A, B, C], [B, C, A], [C, A, B]]
            .map(([s, u, v]) => { const ux = v.x - u.x, uy = v.y - u.y, l = Math.hypot(ux, uy);
                return Math.abs((p.x - s.x) * ux + (p.y - s.y) * uy) / l; });
        const cercles = a.entities.filter(e => e.constructor.name === 'Circle').map(c => ({
            centre: { x: c.p1.x, y: c.p1.y }, rayon: dist(c.p1, c.p2) }));
        const droites = a.entities.filter(e => e.constructor.name === 'Line')
            .map(e => ({ p1: { x: e.p1.x, y: e.p1.y }, p2: { x: e.p2.x, y: e.p2.y } }));
        return {
            A: { x: A.x, y: A.y }, B: { x: B.x, y: B.y }, C: { x: C.x, y: C.y },
            noms: pts.map(p => p.label),
            points: pts.map(p => ({ label: p.label, x: p.x, y: p.y,
                parents: (p.parents || []).map(z => z ? z.constructor.name : '?'),
                auxSommets: [dist(p, A), dist(p, B), dist(p, C)],
                auxCotes: [auCote(p, A, B), auCote(p, B, C), auCote(p, C, A)],
                auxHauteurs: surHauteurs(p),
                auxMedianes: [[A, B, C], [B, C, A], [C, A, B]].map(([s, u, v]) => {
                    const m = { x: (u.x + v.x) / 2, y: (u.y + v.y) / 2 };
                    const ux = m.x - s.x, uy = m.y - s.y, l = Math.hypot(ux, uy);
                    return Math.abs((p.x - s.x) * uy - (p.y - s.y) * ux) / l; }) })),
            cercles, droites,
        };
    });
    const ecart = (liste) => Math.max(...liste) - Math.min(...liste);

    // ------------------------------------------------------------------
    console.log('\n=== l\'orthocentre reste au croisement des trois hauteurs ===');
    let de = await poser("Place l'orthocentre H du triangle ABC");
    let av = await relever();
    ck('H est construit : deux droites pour parents',
       av.points.length === 1 && av.points[0].parents.length === 2,
       av.points.length ? `parents = [${av.points[0].parents.join(', ')}]` : 'aucun point posé');
    await tirerA(de);
    let ap = await relever();
    ck('le sommet a bien bougé à la souris', Math.hypot(ap.A.x - av.A.x, ap.A.y - av.A.y) > 100,
       `A déplacé de ${d2(Math.hypot(ap.A.x - av.A.x, ap.A.y - av.A.y))} px`);
    if (ap.points.length === 1) {
        const h = ap.points[0].auxHauteurs;
        ck('H est sur les trois hauteurs', Math.max(...h) < 0.01,
           `écarts : ${h.map(d2).join(', ')} px`);
    } else ck('H est sur les trois hauteurs', false, 'point introuvable');

    console.log('\n=== le centre de gravité reste au croisement des médianes ===');
    de = await poser('Place le centre de gravité G du triangle ABC');
    await tirerA(de);
    ap = await relever();
    if (ap.points.length === 1) {
        const m = ap.points[0].auxMedianes;
        ck('G est sur les trois médianes', Math.max(...m) < 0.01,
           `écarts : ${m.map(d2).join(', ')} px`);
    } else ck('G est sur les trois médianes', false, 'point introuvable');

    console.log('\n=== le centre du cercle circonscrit reste à égale distance des sommets ===');
    de = await poser('Place le centre du cercle circonscrit O au triangle ABC');
    await tirerA(de);
    ap = await relever();
    if (ap.points.length === 1) {
        const s = ap.points[0].auxSommets;
        ck('O est à égale distance de A, B et C', ecart(s) < 0.01,
           `${s.map(d2).join(' / ')} px`);
    } else ck('O est à égale distance de A, B et C', false, 'point introuvable');

    console.log('\n=== le centre du cercle inscrit reste à égale distance des côtés ===');
    de = await poser('Place le centre du cercle inscrit I du triangle ABC');
    await tirerA(de);
    ap = await relever();
    if (ap.points.length === 1) {
        const c = ap.points[0].auxCotes;
        ck('I est à égale distance des trois côtés', ecart(c) < 0.01,
           `${c.map(d2).join(' / ')} px`);
    } else ck('I est à égale distance des trois côtés', false, 'point introuvable');

    console.log('\n=== le cercle circonscrit passe encore par les trois sommets ===');
    de = await poser('Trace le cercle circonscrit au triangle ABC');
    await tirerA(de);
    ap = await relever();
    if (ap.cercles.length === 1) {
        const c = ap.cercles[0];
        const d = [ap.A, ap.B, ap.C].map(s => Math.hypot(s.x - c.centre.x, s.y - c.centre.y) - c.rayon);
        ck('les trois sommets sont sur le cercle', Math.max(...d.map(Math.abs)) < 0.01,
           `écarts au cercle : ${d.map(d2).join(', ')} px`);
    } else ck('les trois sommets sont sur le cercle', false, `${ap.cercles.length} cercle(s)`);

    console.log('\n=== le cercle inscrit touche encore les trois côtés ===');
    de = await poser('Trace le cercle inscrit dans le triangle ABC');
    await tirerA(de);
    ap = await relever();
    if (ap.cercles.length === 1) {
        const c = ap.cercles[0];
        const cote = (u, v) => { const ux = v.x - u.x, uy = v.y - u.y, l = Math.hypot(ux, uy);
            return Math.abs((c.centre.x - u.x) * uy - (c.centre.y - u.y) * ux) / l; };
        const d = [cote(ap.A, ap.B), cote(ap.B, ap.C), cote(ap.C, ap.A)].map(x => x - c.rayon);
        ck('les trois côtés sont tangents au cercle', Math.max(...d.map(Math.abs)) < 0.01,
           `écarts : ${d.map(d2).join(', ')} px`);
    } else ck('les trois côtés sont tangents au cercle', false, `${ap.cercles.length} cercle(s)`);

    console.log('\n=== la droite d\'Euler passe encore par les trois centres ===');
    de = await poser("Trace la droite d'Euler du triangle ABC");
    await tirerA(de);
    ap = await relever();
    if (ap.droites.length === 1 && ap.points.length >= 3) {
        const e = ap.droites[0];
        const ux = e.p2.x - e.p1.x, uy = e.p2.y - e.p1.y, l = Math.hypot(ux, uy);
        const d = ap.points.map(p => Math.abs((p.x - e.p1.x) * uy - (p.y - e.p1.y) * ux) / l);
        ck('les trois centres sont sur la droite', Math.max(...d) < 0.01,
           `écarts : ${d.map(d2).join(', ')} px`);
        /* La propriété qui fait la droite d'Euler : OH = 3 × OG. */
        const [O, G, H] = ap.points;
        const og = Math.hypot(O.x - G.x, O.y - G.y), oh = Math.hypot(O.x - H.x, O.y - H.y);
        ck('et OH vaut toujours trois fois OG', og > 1 && Math.abs(oh / og - 3) < 0.001,
           `rapport mesuré : ${d2(oh / og)}`);
        /* CES DEUX MESURES PASSAIENT AU VERT SUR LA VERSION FAUTIVE, et pour la
           pire des raisons : les trois points ne bougeaient pas du tout. Une
           figure gelée reste alignée avec elle-même et garde ses rapports — elle
           a seulement cessé d'être celle du triangle. On exige donc de chacun des
           trois qu'il soit ENCORE le centre qu'il prétend être. */
        ck('O est encore à égale distance des trois sommets', ecart(O.auxSommets) < 0.01,
           `${O.auxSommets.map(d2).join(' / ')} px`);
        ck('G est encore sur les trois médianes', Math.max(...G.auxMedianes) < 0.01,
           `écarts : ${G.auxMedianes.map(d2).join(', ')} px`);
        ck('H est encore sur les trois hauteurs', Math.max(...H.auxHauteurs) < 0.01,
           `écarts : ${H.auxHauteurs.map(d2).join(', ')} px`);
    } else ck('les trois centres sont sur la droite', false,
              `${ap.droites.length} droite(s), ${ap.points.length} point(s)`);

    console.log('\n=== le cercle des neuf points en porte encore neuf ===');
    de = await poser('Trace le cercle des neuf points du triangle ABC');
    await tirerA(de);
    ap = await relever();
    if (ap.cercles.length === 1) {
        const c = ap.cercles[0];
        /* Le centre du cercle est l'un des points posés : on ne le compte pas
           parmi ceux qui doivent être SUR le cercle. */
        const sur = ap.points
            .map(p => Math.hypot(p.x - c.centre.x, p.y - c.centre.y))
            .filter(d => Math.abs(d - c.rayon) < 0.01).length;
        ck('neuf points sont sur le cercle', sur === 9,
           `${sur} sur ${ap.points.length} points posés, rayon ${d2(c.rayon)} px`);
    } else ck('neuf points sont sur le cercle', false, `${ap.cercles.length} cercle(s)`);

    console.log('\n=== les bissectrices restent des bissectrices ===');
    de = await poser('Trace les bissectrices du triangle ABC');
    await tirerA(de);
    const bis = await page.evaluate(() => {
        const a = window.app;
        const P = (n) => a.entities.find(e => e instanceof Point && e.label === n);
        const A = P('A'), B = P('B'), C = P('C');
        const rays = a.entities.filter(e => e.constructor.name === 'Ray');
        /* Une bissectrice de l'angle en S fait le même angle avec les deux côtés
           qui partent de S. On mesure cela, et non une position. */
        return rays.map(r => {
            const S = r.p1;
            const autres = [A, B, C].filter(p => p !== S);
            if (autres.length !== 2) return null;
            const ang = (p, q) => {
                let d = Math.atan2(p.y - S.y, p.x - S.x) - Math.atan2(q.y - S.y, q.x - S.x);
                while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
                return Math.abs(d) * 180 / Math.PI;
            };
            return Math.abs(ang(r.p2, autres[0]) - ang(r.p2, autres[1]));
        }).filter(v => v !== null);
    });
    ck('les trois partagent toujours leur angle en deux',
       bis.length === 3 && Math.max(...bis) < 0.001,
       bis.length ? `écarts : ${bis.map(x => Math.round(x * 1000) / 1000).join(', ')}°` : 'aucune demi-droite');

    // ------------------------------------------------------------------
    console.log('\n=== la figure n\'a pas changé : les appuis sont invisibles ===');
    const encre = async (phrase) => {
        await poser(phrase);
        return page.evaluate(() => {
            const a = window.app;
            a.render();
            const c = a.ctx, cv = a.canvas;
            const d = c.getImageData(0, 0, cv.width, cv.height).data;
            let n = 0;
            for (let i = 0; i < cv.width * cv.height; i++) {
                const k = i * 4;
                if (d[k + 3] > 60 && (d[k] + d[k + 1] + d[k + 2]) < 450) n++;
            }
            return n;
        });
    };
    const nu = await encre(null);
    const avecH = await encre("Place l'orthocentre H du triangle ABC");
    /* Deux hauteurs tracées d'un bord à l'autre de la feuille ajouteraient
       plusieurs milliers de pixels ; un point et sa lettre, quelques centaines. */
    ck('poser l\'orthocentre n\'ajoute qu\'un point à la figure', avecH - nu < 800,
       `${avecH - nu} pixels d'encre de plus (${nu} → ${avecH})`);

    // ------------------------------------------------------------------
    console.log('\n=== et la relation survit à l\'enregistrement ===');
    de = await poser("Place l'orthocentre H du triangle ABC");
    await page.evaluate(() => {
        const a = window.app;
        const json = JSON.stringify({ data: a.serialize() });
        /* `deserialize` REND la liste, il ne la pose pas : l'appeler sans prendre
           son résultat laisserait une feuille vide, où tout est vrai sans rien
           prouver. C'est le chemin de l'ouverture d'un fichier. */
        a.entities = a.deserialize(JSON.parse(json).data);
        a.render();
    });
    const relu = await relever();
    ck('H est encore là après relecture, et toujours construit',
       relu.points.length === 1 && relu.points[0].parents.length === 2,
       relu.points.length ? `parents = [${relu.points[0].parents.join(', ')}]` : 'point perdu');
    await tirerA(de);
    ap = await relever();
    if (ap.points.length === 1) {
        const h = ap.points[0].auxHauteurs;
        ck('et il suit encore le sommet qu\'on tire', Math.max(...h) < 0.01,
           `écarts aux trois hauteurs : ${h.map(d2).join(', ')} px`);
    } else ck('et il suit encore le sommet qu\'on tire', false, 'point introuvable');

    // ------------------------------------------------------------------
    /* LE LIEN DE PARTAGE RENDAIT DES PERPENDICULAIRES FAUSSES, et ce défaut-là
       précède tout le reste : la hauteur d'un triangle est bâtie sur une droite
       de référence SANS IDENTITÉ — un couple de points, pas un objet de la
       feuille. Le lien l'écrit donc par ses deux rangs, et il les posait dans les
       cases de `nomT` et `nomD`, deux crans trop tôt. Le résolveur relisait
       `nomDroite` et le premier rang : mesuré, les trois hauteurs revenaient
       « A⊥(AB) », « B⊥(AC) », « C⊥(AA) » — la première à 164° de [BC] au lieu de
       90°, la troisième perpendiculaire à une droite réduite à un point. */
    console.log('\n=== les hauteurs survivent au lien de partage ===');
    const parLien = async (phrase) => {
        await poser(phrase);
        return page.evaluate(() => {
            const a = window.app;
            const lien = a.getCompressedString();
            a.entities = []; a.historyPast = [];
            a.loadFromCompressedString(lien);
            a.render();
            const perp = a.entities.filter(e => e.constructor.name === 'PerpendicularLine');
            return { lien: lien.length, perp: perp.map(h => {
                const p2 = h.getDynamicP2();
                if (!p2 || !h.refLine || !h.refLine.p1 || !h.refLine.p2) return null;
                const ux = p2.x - h.p1.x, uy = p2.y - h.p1.y;
                const vx = h.refLine.p2.x - h.refLine.p1.x, vy = h.refLine.p2.y - h.refLine.p1.y;
                const a1 = Math.acos((ux * vx + uy * vy) / Math.hypot(ux, uy) / Math.hypot(vx, vy));
                return { nom: (h.p1.label || '·') + '⊥(' + (h.refLine.p1.label || '?')
                              + (h.refLine.p2.label || '?') + ')',
                         angle: Math.abs(a1 * 180 / Math.PI) };
            }) };
        });
    };
    const hl = await parLien('Trace les hauteurs du triangle ABC');
    /* ON EXIGE LE BON CÔTÉ, PAS SEULEMENT UN ANGLE DROIT. Une perpendiculaire
       relue avec une mauvaise référence fait quand même 90° avec cette
       référence : sur la version fautive, deux des trois passaient au vert, et
       seule la troisième — perpendiculaire à (AA), donc NaN — trahissait le
       défaut. La hauteur issue de A doit être perpendiculaire à (BC). */
    const attendu = { A: 'BC', B: 'CA', C: 'AB' };
    const bonnes = hl.perp.filter(x => {
        if (!x || !(Math.abs(x.angle - 90) < 0.01)) return false;
        const m = /^(.)⊥\((..)\)$/.exec(x.nom);
        if (!m) return false;
        const veut = attendu[m[1]];
        return veut && (m[2] === veut || m[2] === veut[1] + veut[0]);
    }).length;
    ck('les trois hauteurs reviennent perpendiculaires à LEUR côté', bonnes === 3,
       hl.perp.map(x => x ? `${x.nom} à ${d2(x.angle)}°` : 'droite perdue').join(' · '));

    console.log('\n=== et l\'orthocentre suit encore après un lien ===');
    de = await poser("Place l'orthocentre H du triangle ABC");
    await page.evaluate(() => {
        const a = window.app;
        const lien = a.getCompressedString();
        a.entities = []; a.historyPast = [];
        a.loadFromCompressedString(lien);
        a.render();
    });
    await tirerA(de);
    ap = await relever();
    if (ap.points.length === 1) {
        const h = ap.points[0].auxHauteurs;
        ck('H est encore sur les trois hauteurs', Math.max(...h) < 0.01,
           `écarts : ${h.map(d2).join(', ')} px`);
    } else ck('H est encore sur les trois hauteurs', false, 'point perdu par le lien');

    /* UN LIEN DE L'ENTRE-DEUX DOIT ENCORE S'OUVRIR. Celui-ci a été écrit par la
       version fautive — trois hauteurs sur le même triangle qu'ici — et il existe
       dans la nature. Le lecteur le repêche : sans cela, corriger le format
       aurait fait disparaître les perpendiculaires des liens déjà partagés. */
    console.log('\n=== un lien écrit par la version fautive s\'ouvre encore ===');
    const VIEUX_LIEN = 'HIewtg3ADNBlCMEAsAmGBmKMCCFr5gFp4A6AVgHYEJ0A2GW+iAITxnYmPKsQA5eGWC'
        + 'AGE2BTqUqwU+RDBkdicgtIiIFEDUXjL2qrZvFLxUBMuL4D6s2omXxCmzIvyTa2AGUAKgFEACh4AXLQAv'
        + 'F4ATgCGAMYApgAEADaxAM7xABaRAK4ALrFZ4WkAJlnxOeEAlpEAdgDmyfHYzMKwAGoAkj4A6oG6aigAn'
        + 'DK8AwNAA';
    const vieux = await page.evaluate((lien) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.loadFromCompressedString(lien);
        a.render();
        return a.entities.filter(e => e.constructor.name === 'PerpendicularLine').map(h => {
            const p2 = h.getDynamicP2();
            if (!p2 || !h.refLine || !h.refLine.p1 || !h.refLine.p2) return null;
            const ux = p2.x - h.p1.x, uy = p2.y - h.p1.y;
            const vx = h.refLine.p2.x - h.refLine.p1.x, vy = h.refLine.p2.y - h.refLine.p1.y;
            return Math.abs(Math.acos((ux * vx + uy * vy)
                / Math.hypot(ux, uy) / Math.hypot(vx, vy)) * 180 / Math.PI);
        });
    }, VIEUX_LIEN);
    ck('ses trois hauteurs sont là, et perpendiculaires',
       vieux.length === 3 && vieux.every(x => x !== null && Math.abs(x - 90) < 0.01),
       vieux.map(x => x === null ? 'perdue' : d2(x) + '°').join(', '));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
