/* UNE RÉPONSE EXACTE, ET À CÔTÉ DE LA QUESTION.
 *
 * Deux phrases d'un énoncé réel, et deux refus qui disaient vrai sans rien dire
 * d'utile. C'est la faute que ce dépôt traque depuis le début, sous une forme
 * plus sournoise que le mensonge : le logiciel ne prétend pas avoir fait ce
 * qu'il n'a pas fait, il répond juste à une autre question que celle posée.
 *
 * 1. « Trace un triangle RST tel que ST = 7,5 cm, RT = 5 cm et RT = 3,5 cm »
 *    RT est écrit DEUX FOIS — c'est [RS] qu'on voulait écrire la seconde fois.
 *    La seconde valeur écrasait la première sans un mot ; il ne restait que deux
 *    côtés, et la réponse était : « Avec deux longueurs, il me faut un angle. »
 *    Exact. Et elle envoie chercher un angle au lieu de la faute de frappe.
 *
 * 2. « Placer le point V tel que T soit le milieu de [UV] »
 *    Réponse : « Je ne connais pas V. » Exact aussi — et V est précisément le
 *    point qu'on demande de PLACER. C'est le défaut rapporté par un professeur
 *    sur les réseaux (« il ne connaît pas le point A ») : la phrase est lue
 *    comme un état de la figure au lieu d'un ordre. Toutes les autres tournures
 *    posent le milieu à partir des deux bouts ; celle-ci fait l'inverse, et
 *    c'est la symétrie centrale.
 *
 * CE QUE LA SONDE EXIGE, ET QUI VA PLUS LOIN QUE « ça marche » :
 *   — que le message NOMME la faute : le côté répété, ses deux valeurs, et le
 *     côté absent. Un refus qui ne dit pas quoi corriger ne vaut pas mieux que
 *     l'ancien ;
 *   — que V soit une RELATION et non une position : on tire U de 120 px, et T
 *     doit rester le milieu de [UV] au pixel près. Un point juste une fois est
 *     un point faux dès le premier glissement.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (n, ok, d) => { console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${n}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const page = await nav.newPage({ viewport: { width: 1400, height: 900 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForFunction(() => window.app);
    await page.waitForTimeout(800);
    await page.evaluate(() => {
        const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });

    const jouer = (phrases) => page.evaluate((phrases) => {
        const a = window.app;
        a.entities = []; if (a.cslOublier) a.cslOublier();
        const out = [];
        phrases.forEach(p => {
            let r;
            try { r = a.executerConsigneAvec(p, false); }
            catch (e) { r = { ok: false, message: 'EXCEPTION ' + e.message }; }
            out.push({ ok: !!(r && r.ok), message: (r && r.message) || '' });
        });
        return { out, points: a.entities.filter(e => e.constructor.name === 'Point').length };
    }, phrases);

    console.log('\n=== le côté écrit deux fois ===');
    const dup = await jouer(['Trace un triangle RST tel que ST = 7,5 cm, RT = 5 cm et RT = 3,5 cm']);
    const msg = dup.out[0].message;
    ck('la phrase est refusée', dup.out[0].ok === false, msg);
    ck('  et rien n\'est tracé', dup.points === 0, dup.points + ' point(s)');
    ck('  le message nomme le côté répété', /\[RT\]|\[TR\]/.test(msg), msg);
    ck('  et ses DEUX valeurs', /5 cm/.test(msg) && /3,5 cm/.test(msg), msg);
    ck('  et le côté qui manque', /\[RS\]|\[SR\]/.test(msg), msg);
    ck('  sans parler d\'angle, qui n\'a rien à voir', !/angle/i.test(msg), msg);
    /* La même phrase corrigée doit marcher : on ne refuse pas tout un genre. */
    const bon = await jouer(['Trace un triangle RST tel que ST = 7,5 cm, RT = 5 cm et RS = 3,5 cm']);
    ck('la phrase corrigée trace bien le triangle',
       bon.out[0].ok === true && bon.points === 3, JSON.stringify(bon.out[0]));
    /* Et répéter la MÊME longueur n'est pas une faute : se contredire en est une. */
    const redite = await jouer(['Trace un triangle RST tel que ST = 7,5 cm, RT = 5 cm, RS = 3,5 cm et RT = 5 cm']);
    ck('répéter la même longueur ne gêne pas', redite.out[0].ok === true,
       JSON.stringify(redite.out[0]));

    console.log('\n=== le milieu est donné, c\'est un bout qui manque ===');
    const inv = await jouer(['Place les points U et T',
                             'Placer le point V tel que T soit le milieu de [UV]']);
    ck('la phrase est comprise', inv.out[1].ok === true, inv.out[1].message);
    ck('  et le message dit la symétrie', /sym[ée]trique/i.test(inv.out[1].message),
       inv.out[1].message);
    const pose = await page.evaluate(() => {
        const a = window.app;
        const p = (n) => a.entities.find(e => e.constructor.name === 'Point' && e.label === n);
        const U = p('U'), T = p('T'), V = p('V');
        if (!U || !T || !V) return { erreur: 'il manque ' + (!U ? 'U' : !T ? 'T' : 'V') };
        const ecart = (A, B, C) => Math.hypot((A.x + C.x) / 2 - B.x, (A.y + C.y) / 2 - B.y);
        const avant = ecart(U, T, V);
        /* ON TIRE SUR U : la figure doit rester vraie. */
        U.x += 120; U.y -= 70;
        if (U.update) U.update();
        a.updateDependents();
        return { avant, apres: ecart(U, T, V),
                 V: { x: Math.round(V.x), y: Math.round(V.y) } };
    });
    if (pose.erreur) ck('V existe', false, pose.erreur);
    else {
        ck('T est le milieu de [UV], au pixel près', pose.avant < 0.5,
           pose.avant.toFixed(2) + ' px d\'écart');
        ck('  et il le reste quand on tire U de 120 px', pose.apres < 0.5,
           pose.apres.toFixed(2) + ' px d\'écart après le glissement');
    }
    /* On n'a pas cassé la tournure ordinaire, qui fait l'inverse. */
    const ord = await jouer(['Place les points A et B', 'Place le milieu I de [AB]']);
    ck('« Place le milieu I de [AB] » marche toujours',
       ord.out[1].ok === true && /milieu/i.test(ord.out[1].message), ord.out[1].message);
    const plur = await jouer(['Trace un triangle ABC', 'Place les milieux de chaque côté']);
    ck('et les milieux au pluriel aussi', plur.out[1].ok === true, plur.out[1].message);

    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})().catch(e => { console.log('\x1b[31mBOUM\x1b[0m ' + e.message); process.exit(1); });
