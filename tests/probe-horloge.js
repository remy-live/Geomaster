// UNE PETITE HORLOGE, OPTIONNELLE ET DISCRÈTE.
//
// « J'aimerais bien aussi rajouter une petite horloge optionnelle, très
// discrète. » Optionnelle veut dire qu'elle ne paraît QUE si on la demande :
// elle ne coûte rien à ceux qui n'en veulent pas, et pas un bouton de plus dans
// une bande d'en-tête déjà longue de 1028 px pour 390 px visibles au téléphone.
// On la demande par une phrase, comme tout le reste du logiciel.
//
// Ce que la sonde refuse de croire sur parole : qu'elle dise l'heure JUSTE (et
// non une heure plausible), qu'elle ne mange aucune commande voisine, qu'elle
// survive au rechargement, et qu'elle n'écrive pas dans la page soixante fois
// par minute pour n'afficher que des minutes.
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
    const d = new Date(), deux = (n) => (n < 10 ? '0' : '') + n;
    return { vue: getComputedStyle(el).display !== 'none', texte: el.textContent,
             attendu: deux(d.getHours()) + ':' + deux(d.getMinutes()),
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

    console.log('\n=== elle ne paraît que si on la demande ===');
    const z = await page.evaluate(LIRE);
    ck("elle existe dans la page", z !== null);
    ck('mais elle est rangée au départ', z && z.vue === false, JSON.stringify(z));

    const r1 = await page.evaluate(() => { const r = window.app.executerConsigneAvec("Affiche l'horloge", false);
        return { ok: !!(r && r.ok), msg: (r && r.message) || '' }; });
    ck("« Affiche l'horloge » est comprise", r1.ok && /horloge/i.test(r1.msg), JSON.stringify(r1));
    const a = await page.evaluate(LIRE);
    ck('elle paraît', a.vue === true, JSON.stringify([a.x, a.y, a.w, a.h]));
    /* L'HEURE JUSTE, pas une heure plausible : on la compare à celle du
       navigateur, lue dans la même seconde. */
    ck("et elle dit l'heure JUSTE", a.texte === a.attendu, `${a.texte} contre ${a.attendu}`);
    ck('elle reste discrète', a.w < 110 && a.h < 30, `${a.w} × ${a.h} px`);

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
    ck('après rechargement, elle est toujours là', ap.vue === true, JSON.stringify(ap));
    ck("et toujours à l'heure", ap.texte === ap.attendu, `${ap.texte} contre ${ap.attendu}`);

    console.log('\n=== un clic la range, une phrase aussi ===');
    await page.locator('#gmHorloge').click();
    await page.waitForTimeout(200);
    const c = await page.evaluate(LIRE);
    ck('le clic la range', c.vue === false && c.memoire === 'non', JSON.stringify(c));
    const r2 = await page.evaluate(() => { const r = window.app.executerConsigneAvec("Affiche l'horloge", false);
        return !!(r && r.ok); });
    ck('la phrase la ramène', r2 === true && (await page.evaluate(LIRE)).vue === true);
    const r3 = await page.evaluate(() => { const r = window.app.executerConsigneAvec("Cache l'horloge", false);
        return { ok: !!(r && r.ok), msg: (r && r.message) || '' }; });
    ck("« Cache l'horloge » la range aussi", r3.ok && !(await page.evaluate(LIRE)).vue,
       JSON.stringify(r3));

    console.log("\n=== elle n'écrit pas soixante fois par minute ===");
    const ecritures = await page.evaluate(async () => {
        window.app.executerConsigneAvec("Affiche l'horloge", false);
        const el = document.getElementById('gmHorloge');
        let n = 0;
        const obs = new MutationObserver(() => { n++; });
        obs.observe(el, { childList: true, characterData: true, subtree: true });
        await new Promise(k => setTimeout(k, 4000));
        obs.disconnect();
        return n;
    });
    ck("quatre secondes d'horloge n'écrivent rien dans la page", ecritures === 0,
       ecritures + ' écriture(s) en 4 s — une par minute suffit');

    console.log('\n=== au téléphone, elle ne casse pas la bande ===');
    const tel = await b.newContext({ viewport: { width: 390, height: 844 } });
    const pt = await tel.newPage();
    await pt.goto(PAGE); await pt.waitForFunction(() => window.app);
    await pt.waitForTimeout(1200);
    const t = await pt.evaluate(() => {
        window.app.executerConsigneAvec("Affiche l'horloge", false);
        const el = document.getElementById('gmHorloge');
        const r = el.getBoundingClientRect();
        const btn = document.getElementById('btnToutesCommandes');
        const q = btn ? btn.getBoundingClientRect() : null;
        return { w: Math.round(r.width), vue: getComputedStyle(el).display !== 'none',
                 commandes: q ? Math.round(q.left) : null,
                 recouvre: q ? !(r.right <= q.left || r.left >= q.right) : false };
    });
    ck("elle reste visible et plus petite qu'au bureau", t.vue === true && t.w > 0 && t.w < 90,
       t.w + ' px');
    ck('et elle ne passe pas sous le bouton « toutes les commandes »', t.recouvre === false,
       JSON.stringify(t));
    await tel.close();

    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await b.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
