/* LE CRAYON NE QUITTE JAMAIS LA RÈGLE.
 *
 * « Parfois quand tu traces une droite, la règle est trop courte, le crayon est
 *   dans le vide. Que suggères-tu ? »
 * « Logiquement, dans la réalité, ce serait [le glissement], et pour la droite
 *   on trace le début et après elle apparaît. Si le trait est trop long, on
 *   trace la longueur de la règle puis on fait glisser la règle, mais pas à
 *   fleur. »
 *
 * MESURÉ AVANT. La règle fait 400 px, soit 8 cm. Un côté de carré de 12 cm en
 * fait 600 : le crayon sortait de 200 px. Et la parallèle courait sur 1 400 px
 * le long d'une équerre de 400 — trois fois et demie trop loin. Celle-là, c'est
 * la correction précédente qui l'avait introduite : en faisant enfin TRACER la
 * parallèle, on avait choisi d'étendre le trait de ±700 px pour qu'il naisse
 * d'un bout et coure jusqu'à l'autre. Un geste absent réparé par un geste
 * impossible.
 *
 * DEUX RÈGLES, TIRÉES DE CE QU'ON FAIT SUR UNE FEUILLE.
 *
 * 1. UNE DROITE NE SE TRACE JAMAIS EN ENTIER. On fait un trait de la longueur de
 *    la règle, on la lève, et la convention fait le reste. Le crayon parcourt
 *    donc la portée de l'instrument, pas plus — et la droite paraît entière
 *    ensuite. C'est le cas où l'on ne glisse PAS, et c'est ce qui évite que
 *    l'animation ne s'éternise.
 *
 * 2. UN SEGMENT TROP LONG SE TRACE EN PLUSIEURS FOIS. On trace ce que la règle
 *    couvre, on la fait glisser, on continue. Et PAS À FLEUR : elle se repose en
 *    chevauchant ce qu'on vient de tracer — trois centimètres, un quart de sa
 *    longueur. La raison est géométrique avant d'être esthétique : à fleur, rien
 *    ne garantit que la suite du trait soit dans le prolongement.
 *
 * CE QUE LA SONDE TIENT, ET POURQUOI C'EST CELA QU'IL FAUT MESURER.
 *
 * L'invariant n'est pas « il y a des glissements » — c'est que le crayon RESTE
 * SUR L'INSTRUMENT. La sonde parcourt donc l'animation de bout en bout, cent
 * images, et à chacune calcule l'abscisse du crayon DEPUIS L'ORIGINE DE LA
 * RÈGLE, telle qu'elle est posée à cet instant. Elle doit rester entre 0 et la
 * portée. Un plan juste avec une pose fausse passerait toutes les vérifications
 * de comptage et échouerait ici.
 *
 * Elle tient aussi deux choses qu'on ne pense pas à vérifier : que le crayon ne
 * RECULE jamais — un trait qu'on refait à l'envers n'est pas un trait qu'on
 * prolonge — et que la dernière pose se cale sur la FIN du trait, pour que la
 * règle ne dépasse pas dans le vide au dernier coup.
 *
 * Et le compte des glissements, mesuré sur des carrés de plus en plus grands :
 * 8 cm aucun, 12 cm un, 18 cm deux. Une feuille A4 fait 21 cm de large.
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
        /* Les instruments doivent exister : c'est leur largeur qui donne la
           portée, et elle est lue par le plan. */
        ['ruler', 'setsquare'].forEach(w => {
            if (!window.app.activeWidgets[w]) window.app.toggleWidget(w);
        });
    });

    /* On déroule l'animation à la main, cent images, et l'on regarde où est le
       crayon PAR RAPPORT À L'INSTRUMENT tel qu'il est posé à cet instant. */
    const derouler = (phrase, prep, genreVoulu) => page.evaluate(([phrase, prep, genreVoulu]) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        (prep || []).forEach(x => a.executerConsigneAvec(x, true));
        a.executerConsigneAvec(phrase, true);
        /* LA PERPENDICULAIRE TRACE D'ABORD UN TRAIT D'AIDE en pointillés, de C
           jusqu'à la droite, AVANT la perpendiculaire elle-même. Prendre le
           premier tracé venu, c'est mesurer ce trait-là — un segment — et
           conclure que la droite n'en est pas une. On dit donc ce qu'on veut
           regarder. */
        let i = -1;
        a.entities.forEach((e, k) => {
            if (i >= 0 || !(e instanceof ToolAnimation) || e.originalType !== 'trace') return;
            const c = a.entities[k + 1];
            if (!a.planRegle(e, c)) return;
            if (genreVoulu && c.constructor.name !== genreVoulu) return;
            i = k;
        });
        if (i < 0) return { erreur: 'aucun tracé à la règle' + (genreVoulu ? ' vers ' + genreVoulu : '') };
        const anim = a.entities[i], cible = a.entities[i + 1];
        const plan = a.planRegle(anim, cible);
        const w = (anim.widgetType === 'ruler') ? a.rulerWidget : a.setSquareWidget;
        let plusLoin = -1e9, plusPres = 1e9, recule = 0, dernier = -1e9;
        let finPose = null;
        for (let k = 0; k <= 100; k++) {
            const t = k / 100;
            a.replayIndex = i; a.isToolAnimating = true; a.currentAnimProgress = t;
            a.applyInterpolation(anim, t);
            const et = a.etapeRegle(plan, t);
            if (et.crayon < dernier - 0.5) recule++;
            dernier = et.crayon;
            const c = plan.point(et.crayon);
            const s = (c.x - w.x) * Math.cos(w.angle) + (c.y - w.y) * Math.sin(w.angle);
            if (s > plusLoin) plusLoin = s;
            if (s < plusPres) plusPres = s;
            if (t === 1) finPose = et.pose;
        }
        a.isToolAnimating = false; a.currentAnimProgress = undefined;
        return {
            genre: cible.constructor.name,
            longueur: plan.L, portee: plan.portee, passes: plan.passes,
            infinie: plan.infinie, plusLoin, plusPres, recule,
            /* La dernière pose doit se caler sur la fin : sinon la règle dépasse
               dans le vide au dernier coup de crayon. */
            debordeALaFin: plan.passes > 1 ? (finPose + plan.portee) - plan.sB : 0,
        };
    }, [phrase, prep || null, genreVoulu || null]);

    console.log('\n=== le crayon reste sur l\'instrument, à chaque image ===');
    const CAS = [
        ['triangle 5/4/3', 'Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm', null],
        ['carré de 12 cm', 'Trace un carré ABCD de 12 cm de côté', null],
        ['carré de 18 cm', 'Trace un carré ABCD de 18 cm de côté', null],
        ['parallèle', 'Trace la parallèle à (AB) passant par C', ['Place les points A, B et C'], 'ParallelLine'],
        ['perpendiculaire', 'Trace la perpendiculaire à (AB) passant par C', ['Place les points A, B et C'], 'PerpendicularLine'],
        ['trait d\'aide en pointillés', 'Trace la perpendiculaire à (AB) passant par C', ['Place les points A, B et C'], 'Segment'],
    ];
    const mesures = {};
    for (const [nom, phrase, prep, genre] of CAS) {
        const r = await derouler(phrase, prep, genre);
        mesures[nom] = r;
        if (r.erreur) { ck(nom, false, r.erreur); continue; }
        ck(nom, r.plusLoin <= r.portee + 2,
           `crayon au plus loin ${Math.round(r.plusLoin)} px sur ${r.portee}`
           + (r.plusLoin > r.portee + 2 ? ` — DÉPASSE de ${Math.round(r.plusLoin - r.portee)}` : ''));
        ck('  et jamais en arrière de la règle', r.plusPres >= -2,
           Math.round(r.plusPres) + ' px');
        ck('  et il n\'a jamais reculé', r.recule === 0,
           r.recule ? r.recule + ' retours en arrière' : 'toujours en avant');
    }

    console.log('\n=== une droite se trace d\'un seul coup de règle ===');
    ['parallèle', 'perpendiculaire'].forEach(nom => {
        const r = mesures[nom];
        if (!r || r.erreur) { ck(nom, false, (r && r.erreur) || 'absent'); return; }
        ck(nom + ' : une seule passe, aucun glissement',
           r.infinie && r.passes === 1, `${r.passes} passe(s), infinie=${r.infinie}`);
        ck('  et son trait ne dépasse pas la portée de l\'instrument',
           r.longueur <= r.portee + 2,
           `${Math.round(r.longueur)} px sur ${r.portee} (1 400 px avant)`);
    });

    console.log('\n=== un segment trop long se trace en plusieurs fois ===');
    const attendu = [[8, 1], [12, 2], [18, 3], [24, 5]];
    for (const [cm, passes] of attendu) {
        const r = await derouler(`Trace un carré ABCD de ${cm} cm de côté`, null);
        if (r.erreur) { ck(`carré de ${cm} cm`, false, r.erreur); continue; }
        ck(`carré de ${cm} cm : ${passes - 1} glissement(s)`,
           r.passes === passes,
           `${Math.round(r.longueur)} px → ${r.passes} passe(s), ${r.passes - 1} glissement(s)`);
        ck('  le crayon reste sur la règle du début à la fin',
           r.plusLoin <= r.portee + 2 && r.plusPres >= -2,
           `${Math.round(r.plusPres)} à ${Math.round(r.plusLoin)} px sur ${r.portee}`);
        if (r.passes > 1) {
            /* Au dernier coup, la règle ne doit pas dépasser dans le vide : sa
               dernière pose se cale sur la fin du trait. */
            ck('  et la dernière pose se cale sur la fin du trait',
               Math.abs(r.debordeALaFin) < 2, Math.round(r.debordeALaFin) + ' px de débord');
        }
    }

    console.log('\n=== le chevauchement est bien un chevauchement ===');
    /* PAS À FLEUR : la deuxième pose doit recouvrir ce qui vient d'être tracé.
       À fleur, rien ne garantirait que la suite soit dans le prolongement — la
       raison est géométrique, pas décorative. */
    const chev = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        a.executerConsigneAvec('Trace un carré ABCD de 12 cm de côté', true);
        let i = -1;
        a.entities.forEach((e, k) => {
            if (i < 0 && e instanceof ToolAnimation && e.originalType === 'trace'
                && a.planRegle(e, a.entities[k + 1])) i = k;
        });
        const anim = a.entities[i];
        const plan = a.planRegle(anim, a.entities[i + 1]);
        /* Fin de la première passe, puis pose de la seconde. */
        const finPasse1 = a.etapeRegle(plan, 1 / plan.passes - 0.001);
        const poseePasse2 = a.etapeRegle(plan, 1 / plan.passes + 0.25 / plan.passes);
        a.isToolAnimating = false; a.currentAnimProgress = undefined;
        return { traceApres1: finPasse1.crayon, pose2: poseePasse2.pose, portee: plan.portee };
    });
    const recouvrement = chev.traceApres1 - chev.pose2;
    ck('la deuxième pose recouvre le trait déjà fait',
       recouvrement > 20, Math.round(recouvrement) + ' px de recouvrement');
    /* Au moins les 3 cm demandés — souvent plus, car la DERNIÈRE pose se cale sur
       la fin du trait pour ne pas dépasser dans le vide, et ce recalage ne peut
       qu'augmenter le recouvrement. */
    ck('  au moins les 3 cm demandés, jamais moins',
       recouvrement >= 148 && recouvrement < chev.portee,
       (recouvrement / 50).toFixed(1) + ' cm sur ' + (chev.portee / 50).toFixed(0) + ' cm de règle');

    console.log('\n=== et l\'animation dure plus longtemps quand elle trace plus ===');
    const duree = await page.evaluate(() => {
        const a = window.app;
        const mesurer = (ph) => {
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            a.executerConsigneAvec(ph, true);
            let i = -1;
            a.entities.forEach((e, k) => {
                if (i < 0 && e instanceof ToolAnimation && e.originalType === 'trace'
                    && a.planRegle(e, a.entities[k + 1])) i = k;
            });
            if (i < 0) return 0;
            return a.planRegle(a.entities[i], a.entities[i + 1]).passes;
        };
        return { court: mesurer('Trace un carré ABCD de 6 cm de côté'),
                 long: mesurer('Trace un carré ABCD de 18 cm de côté') };
    });
    ck('un trait court tient en une passe, un long en trois',
       duree.court === 1 && duree.long === 3,
       `6 cm : ${duree.court} · 18 cm : ${duree.long}`);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
