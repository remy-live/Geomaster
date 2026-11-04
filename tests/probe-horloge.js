// UNE PETITE HORLOGE, OPTIONNELLE ET DISCRÈTE — ET UNE ICÔNE POUR LA TROUVER.
//
// « J'aimerais bien aussi rajouter une petite horloge optionnelle, très
// discrète. » Elle ne s'allumait d'abord que par une phrase — « Affiche
// l'horloge » — pour ne pas ajouter un bouton à une bande d'en-tête déjà longue
// de 1028 px pour 390 px visibles au téléphone. La question suivante a réglé le
// débat : « Où est l'horloge ? » Une porte qu'on ne trouve pas n'est pas une
// porte. Elle a donc son icône.
//
// MAIS PAS DEUX BOUTONS POUR AUTANT : c'est LE MÊME qui porte le petit cadran
// quand l'heure est rangée et l'heure quand elle est affichée. L'en-tête ne
// grandit que d'un cadran, et la classe top-btn le fait paraître dans « toutes
// les commandes » — c'est par là qu'on le trouve au téléphone, où la bande
// déborde.
//
// Ce que la sonde refuse de croire sur parole : que l'icône soit VRAIMENT là au
// premier chargement (sans phrase, sans réglage), qu'un clic dessus donne
// l'heure JUSTE et non une heure plausible, qu'un second clic la range et rende
// le cadran, que le choix survive au rechargement, qu'elle ne mange aucune
// commande voisine, et qu'elle n'écrive pas dans la page soixante fois par
// minute pour n'afficher que des minutes.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;

let fail = 0;
const ck = (n, ok, d) => { console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${n}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

const LIRE = () => {
    const el = document.getElementById('gmHorloge');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cad = el.querySelector('.gm-cadran');
    const heure = el.querySelector('.gm-heure');
    /* DEUX HEURES ATTENDUES, ET C'EST EXACT. L'horloge n'écrit QUE lorsque les
       minutes changent ; si la minute tourne entre son écriture et notre
       lecture, comparer à l'heure d'APRÈS la déclare fausse alors qu'elle est
       juste. Mesuré une fois pour de vrai : « 20:08 contre 20:09 ». On relève
       donc l'heure AVANT et APRÈS avoir lu le texte, et l'on accepte l'une ou
       l'autre : si la minute n'a pas tourné, les deux sont égales et le
       contrôle reste exact à la minute près. Une horloge arrêtée ou décalée
       d'une heure échoue toujours. */
    const deux = (n) => (n < 10 ? '0' : '') + n;
    const quelleHeure = () => { const d = new Date();
        return deux(d.getHours()) + ':' + deux(d.getMinutes()); };
    const avantLecture = quelleHeure();
    const texteLu = heure ? heure.textContent : el.textContent;
    const apresLecture = quelleHeure();
    return { bouton: getComputedStyle(el).display !== 'none',
             cadran: !!cad && getComputedStyle(cad).display !== 'none',
             vue: el.classList.contains('vue'),
             texte: texteLu,
             juste: texteLu === avantLecture || texteLu === apresLecture,
             attendu: avantLecture === apresLecture ? avantLecture
                                                    : avantLecture + ' ou ' + apresLecture,
             x: Math.round(r.left), y: Math.round(r.top),
             w: Math.round(r.width), h: Math.round(r.height),
             memoire: (() => { try { return localStorage.getItem('gm_horloge'); } catch (e) { return null; } })() };
};

(async () => {
    const b = await chromium.launch({ executablePath: NAVIGATEUR });
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForFunction(() => window.app);
    await page.waitForTimeout(800);
    await page.evaluate(() => { const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {}; });

    console.log('\n=== une icône, et pas une heure imposée ===');
    const z = await page.evaluate(LIRE);
    ck("elle existe dans la page", z !== null);
    ck("son icône est là dès le premier chargement", z && z.bouton === true && z.cadran === true,
       JSON.stringify(z));
    ck("mais l'heure, elle, n'est pas affichée", z && z.vue === false && z.texte === '',
       JSON.stringify([z && z.vue, z && z.texte]));
    /* UNE ICÔNE, PAS UNE BANNIÈRE : rangée, elle ne prend pas plus de place
       qu'un bouton d'en-tête. */
    ck("et elle ne prend qu'une place de bouton", z && z.w <= 36 && z.h <= 36,
       `${z && z.w} × ${z && z.h} px`);

    console.log("\n=== un clic sur l'icône donne l'heure ===");
    await page.locator('#gmHorloge').click();
    await page.waitForTimeout(200);
    const a = await page.evaluate(LIRE);
    ck("l'heure paraît", a.vue === true && a.texte !== '', JSON.stringify([a.x, a.y, a.w, a.h]));
    /* L'HEURE JUSTE, pas une heure plausible : on la compare à celle du
       navigateur, lue dans la même seconde. */
    ck("et c'est l'heure JUSTE", a.juste === true, `${a.texte} contre ${a.attendu}`);
    ck('le cadran laisse la place à l\'heure', a.cadran === false, String(a.cadran));
    ck('elle reste discrète', a.w < 110 && a.h < 40, `${a.w} × ${a.h} px`);

    console.log("\n=== elle ne mange aucune commande ===");
    const voisins = await page.evaluate(() => {
        const r = document.getElementById('gmHorloge').getBoundingClientRect();
        const lire = (x, y) => { const e = document.elementFromPoint(x, y);
            return e ? (e.closest('[id]') ? e.closest('[id]').id : e.tagName) : 'rien'; };
        /* Toutes les commandes de l'en-tête répondent-elles encore ? */
        const btns = [...document.querySelectorAll('header button[id]')]
            .filter(x => x.offsetParent !== null)
            .map(x => { const q = x.getBoundingClientRect();
                return { id: x.id, sous: lire(q.left + q.width / 2, q.top + q.height / 2) }; });
        return { surElle: lire(r.left + r.width / 2, r.top + r.height / 2),
                 volees: btns.filter(x => x.sous !== x.id && x.sous !== 'gmHorloge'
                    && !document.getElementById(x.id).contains(document.getElementById(x.sous) || document.body)) };
    });
    ck("c'est bien elle sous elle-même", voisins.surElle === 'gmHorloge', voisins.surElle);
    ck("et aucune commande de l'en-tête n'est recouverte", voisins.volees.length === 0,
       JSON.stringify(voisins.volees.slice(0, 3)));

    console.log('\n=== elle revient comme on l\'avait laissée ===');
    ck('le choix est retenu', a.memoire === 'oui', String(a.memoire));
    await page.reload(); await page.waitForFunction(() => window.app);
    await page.waitForTimeout(900);
    const ap = await page.evaluate(LIRE);
    ck('après rechargement, l\'heure est toujours là', ap.vue === true, JSON.stringify(ap));
    ck("et toujours à l'heure", ap.juste === true, `${ap.texte} contre ${ap.attendu}`);

    console.log('\n=== un second clic la range, une phrase aussi ===');
    await page.locator('#gmHorloge').click();
    await page.waitForTimeout(200);
    const c = await page.evaluate(LIRE);
    ck('le clic range l\'heure et rend le cadran',
       c.vue === false && c.texte === '' && c.cadran === true && c.memoire === 'non', JSON.stringify(c));
    const r2 = await page.evaluate(() => { const r = window.app.executerConsigneAvec("Affiche l'horloge", false);
        return { ok: !!(r && r.ok), msg: (r && r.message) || '' }; });
    ck("« Affiche l'horloge » marche encore", r2.ok && /horloge/i.test(r2.msg)
       && (await page.evaluate(LIRE)).vue === true, JSON.stringify(r2));
    const r3 = await page.evaluate(() => { const r = window.app.executerConsigneAvec("Cache l'horloge", false);
        return { ok: !!(r && r.ok), msg: (r && r.message) || '' }; });
    ck("« Cache l'horloge » la range aussi", r3.ok && !(await page.evaluate(LIRE)).vue,
       JSON.stringify(r3));

    console.log("\n=== elle n'écrit pas soixante fois par minute ===");
    /* ON COMPTE LES ÉCRITURES, PAS LES SECONDES. La borne juste n'est pas
       « zéro » : si la minute change pendant les quatre secondes qu'on observe,
       UNE écriture est due — c'est même tout ce qu'on demande à une horloge. La
       sonde a d'ailleurs rougi comme cela, une fois sur dix, pour avoir exigé
       zéro en traversant un changement de minute. On relève donc la minute avant
       et après, et l'on exige exactement ce que le temps écoulé justifie. */
    const ecritures = await page.evaluate(async () => {
        window.app.executerConsigneAvec("Affiche l'horloge", false);
        const el = document.getElementById('gmHorloge');
        const minute = () => new Date().getMinutes();
        const avant = minute();
        let n = 0;
        const obs = new MutationObserver(() => { n++; });
        obs.observe(el, { childList: true, characterData: true, subtree: true });
        await new Promise(k => setTimeout(k, 4000));
        obs.disconnect();
        return { n, tourne: minute() !== avant };
    });
    const du = ecritures.tourne ? 1 : 0;
    ck("quatre secondes d'horloge n'écrivent que ce qu'elles doivent", ecritures.n === du,
       `${ecritures.n} écriture(s) pour ${du} due(s)`
       + (ecritures.tourne ? ' — la minute a changé pendant la mesure' : " — la minute n'a pas changé"));

    console.log('\n=== au téléphone, on la trouve dans « toutes les commandes » ===');
    const tel = await b.newContext({ viewport: { width: 390, height: 844 } });
    const pt = await tel.newPage();
    await pt.goto(PAGE); await pt.waitForFunction(() => window.app);
    await pt.waitForTimeout(1200);
    const t = await pt.evaluate(() => {
        const el = document.getElementById('gmHorloge');
        const r = el.getBoundingClientRect();
        const btn = document.getElementById('btnToutesCommandes');
        const q = btn ? btn.getBoundingClientRect() : null;
        window.app.ouvrirToutesLesCommandes();
        const cellules = [...document.querySelectorAll('#tiroirOutilsGrille *')]
            .filter(x => /heure|horloge/i.test(x.textContent || '') && x.children.length === 0);
        return { w: Math.round(r.width), bouton: getComputedStyle(el).display !== 'none',
                 dansLaGrille: cellules.length,
                 recouvre: q ? !(r.right <= q.left || r.left >= q.right) : false };
    });
    ck("l'icône au téléphone : visible, petite, et assez grande pour le doigt", t.bouton === true && t.w >= 32 && t.w <= 36,
       t.w + ' px');
    ck('et elle ne passe pas sous le bouton « toutes les commandes »', t.recouvre === false,
       JSON.stringify(t));
    ck('« toutes les commandes » la propose', t.dansLaGrille > 0,
       t.dansLaGrille + ' cellule(s) « Afficher l\'heure »');
    await tel.close();

    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await b.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
