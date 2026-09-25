/* LES SYMBOLES MATHÉMATIQUES : SOUS LE DOIGT, ET JUSQU'AU BOUT DE LA CHAÎNE.
 *
 * « Il n'y a pas le symbole "n'appartient pas" pour le texte. »
 * « Je trouve ça galère de taper pour avoir un symbole, on pourrait pas avoir
 *   quelque chose de plus pratique ? »
 *
 * Deux phrases, et la seconde est la vraie. Le composeur connaît ∉ depuis
 * toujours — \notin est dans sa table —, mais il fallait le SAVOIR : l'aide aux
 * formules offrait ∈ sans ∉ et ≤ sans ≥, et le bouton de la barre du texte qui
 * s'appelle « Ouvrir le Clavier Mathématique » ouvrait quarante-huit touches de
 * lettres et de chiffres, SANS UN SEUL symbole mathématique. On ne devine pas
 * une syntaxe qu'on ne nous montre pas.
 *
 * TROIS RÉPONSES, de la plus pratique à la plus discrète :
 *
 *   — une PAGE DE SYMBOLES sur le clavier, atteinte par la touche à gauche de
 *     la barre d'espace, là où les téléphones mettent « 123 ». Quarante
 *     symboles, un appui. Aucun bouton de plus à l'écran : la touche existe à
 *     l'intérieur d'un clavier qu'on ouvrait déjà ;
 *   — les deux vignettes qui manquaient à l'aide aux formules, ∉ et ≥ ;
 *   — et la chaîne entière vérifiée derrière, car un symbole qu'on pose et qui
 *     disparaît à l'export ne vaut pas mieux qu'un symbole absent.
 *
 * LES SYMBOLES S'INSÈRENT TELS QUELS, et non sous leur commande. Écrire
 * « \notin » ferait basculer TOUTE la ligne en composition mathématique — « le
 * point A n'appartient pas à (d) » y perdrait son allure de phrase. C'est
 * mesuré ici : le caractère se pose dans du texte ordinaire comme dans une
 * formule.
 *
 * CE QUE LA CHAÎNE A RÉVÉLÉ, en la suivant jusqu'au bout :
 *
 * L'EXPORT TIKZ détruisait TOUTE formule. Il protégeait chaque caractère
 * spécial par une barre oblique, d'un bloc — or « \\ » ne protège pas la barre
 * oblique en LaTeX : c'est un SAUT DE LIGNE. Compilé pour voir, plutôt que
 * raisonné :
 *
 *     A \notin D                  → « Anotin D »
 *     \frac{a}{b} \le 30\degree   → « frac{a}{b}le 30degree »
 *     (AB) \parallel (CD)         → « (AB)parallel (CD) »
 *
 * Une formule de GéoMaster EST du LaTeX à trois commandes près ; elle part donc
 * en mode mathématique telle quelle. Cette sonde ne relit pas le .tex — elle
 * vérifie ce qui distingue un export juste d'un export faux : le mode
 * mathématique, la barre oblique restée simple, et les trois commandes
 * traduites, dont \par, que LaTeX connaît et qui est un changement de
 * paragraphe.
 *
 * LE PDF, LUI, NE PORTE AUCUN SYMBOLE, et c'est le seul point qui n'est pas
 * réparé : la police embarquée est Instrument Sans, qui a les lettres et les
 * accents mais pas les mathématiques. À l'écran et dans le SVG cela ne se voit
 * pas — le navigateur remplace le glyphe manquant, caractère par caractère.
 * jsPDF n'a aucun repli : il écrit le glyphe « absent », qui ne dessine RIEN.
 * Mesuré : « A ∉ D » sort « A   D », et l'export annonçait « ✅ PDF vectoriel
 * exporté ! ». Embarquer une police de symboles est une décision de poids de
 * fichier ; en attendant, LE LOGICIEL NE DIT PLUS QU'IL A EXPORTÉ CE QU'IL A
 * LAISSÉ TOMBER — il nomme les symboles perdus et renvoie au SVG ou au TikZ.
 * C'est cette honnêteté-là que la sonde tient, et elle la tient dans les deux
 * sens : la fenêtre ne doit pas s'ouvrir sur une figure sans symbole.
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
    const ctx = await nav.newContext({ viewport: { width: 1400, height: 950 }, acceptDownloads: true });
    const page = await ctx.newPage();
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    const propre = () => page.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });
    await propre();

    /* ============================================================
       1. LE CLAVIER MATHÉMATIQUE EST MATHÉMATIQUE
       ============================================================ */
    console.log('\n=== le « clavier mathématique » porte enfin des mathématiques ===');
    const clavier = await page.evaluate(() => {
        const a = window.app;
        const lire = () => [...document.querySelectorAll('#virtualKeyboard .vk-btn')]
            .map(b => b.innerText);
        a.vkMath = false; a.renderKeyboard();
        const lettres = lire();
        a.vkMath = true; a.renderKeyboard();
        const maths = lire();
        a.vkMath = false; a.renderKeyboard();
        const connus = new Set(Object.values(GmFormule.SYMBOLES));
        const symboles = maths.filter(t => t.length === 1 && connus.has(t));
        return {
            lettresOntDesSymboles: lettres.filter(t => t.length === 1 && connus.has(t)).length,
            nSymboles: symboles.length,
            /* aucun symbole que le composeur ne saurait dessiner : la liste du
               clavier est tirée de la sienne, elle ne peut pas diverger */
            etrangers: maths.filter(t => t.length === 1 && t.charCodeAt(0) > 0x2010
                && !connus.has(t) && t !== '⌫' && t !== '⇧'),
            aNotin: maths.includes('∉'), aGe: maths.includes('≥'), aIn: maths.includes('∈'),
            bascule: maths.includes('ABC') && lettres.includes('∉≤π'),
            /* la majuscule n'a rien à faire sur la page des symboles */
            shiftSurLettres: lettres.includes('⇧'), shiftSurMaths: maths.includes('⇧'),
        };
    });
    ck('la page des lettres n\'en portait aucun', clavier.lettresOntDesSymboles === 0,
       String(clavier.lettresOntDesSymboles));
    ck('la page des symboles en porte quarante', clavier.nSymboles >= 40,
       clavier.nSymboles + ' symboles');
    ck('  tous connus du composeur', clavier.etrangers.length === 0,
       clavier.etrangers.join(' ') || 'aucun étranger');
    ck('  dont ∈, ∉ et ≥', clavier.aIn && clavier.aNotin && clavier.aGe);
    ck('  la bascule va dans les deux sens', clavier.bascule);
    ck('  et la majuscule ne traîne pas sur les symboles',
       clavier.shiftSurLettres && !clavier.shiftSurMaths);

    /* LE GESTE ENTIER, à la souris : outil texte, clic, clavier, deux appuis.
       Une touche peut exister et n'écrire nulle part — c'est arrivé au clavier
       virtuel, dont les touches perdaient le focus du champ. */
    console.log('\n=== et deux appuis suffisent à poser le symbole ===');
    const pose = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.vkMath = false; a.renderKeyboard();
        a.setTool('text');
        const r = a.canvas.getBoundingClientRect();
        return { x: r.left + 400 * a.view.zoom + a.view.x,
                 y: r.top + 300 * a.view.zoom + a.view.y };
    });
    await page.mouse.click(pose.x, pose.y);
    await page.waitForTimeout(250);
    const frappe = await page.evaluate(() => {
        const a = window.app;
        const g = document.getElementById('ghostTextInput');
        if (!g || g.style.display !== 'block') return { champ: false };
        a.toggleVirtualKeyboard();
        const vk = document.getElementById('virtualKeyboard');
        const appui = (libelle) => {
            const b = [...vk.querySelectorAll('.vk-btn')].find(x => x.innerText === libelle);
            if (!b) return false;
            g.focus();
            b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            return true;
        };
        const ok1 = appui('∉≤π');
        const ok2 = appui('∉');
        return { champ: true, bascule: ok1, touche: ok2, ecrit: g.innerText };
    });
    ck('le champ de texte est ouvert', frappe.champ);
    ck('  la bascule répond', !!frappe.bascule);
    ck('  la touche ∉ écrit dans le champ', frappe.ecrit === '∉',
       JSON.stringify(frappe.ecrit));
    await page.evaluate(() => {
        const a = window.app;
        if (a.validerTexteFantome) a.validerTexteFantome();
        a.setTool('select');
    });

    /* ============================================================
       2. L'AIDE AUX FORMULES : LES PAIRES SONT COMPLÈTES
       ============================================================ */
    console.log('\n=== l\'aide aux formules ne coupe plus les paires en deux ===');
    const aide = await page.evaluate(() => {
        const a = window.app;
        a.basculerAideFormule(true);
        const g = document.getElementById('aideFormuleGrille');
        const tuiles = [...(g ? g.children : [])].map(b => ({
            syn: b.title,
            /* une vignette est DESSINÉE par le composeur lui-même : une syntaxe
               qu'il ne comprend pas donnerait un canevas vide */
            encre: (() => {
                const cv = b.querySelector('canvas');
                if (!cv || !cv.width) return 0;
                const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
                let n = 0;
                for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 40) n++;
                return n;
            })(),
        }));
        a.fermerAideFormule();
        return tuiles;
    });
    const syn = aide.map(t => t.syn);
    ck('∈ a désormais son ∉', syn.includes('\\in') && syn.includes('\\notin'));
    ck('≤ a désormais son ≥', syn.includes('\\le') && syn.includes('\\ge'));
    ck('  et chaque vignette est vraiment dessinée',
       aide.every(t => t.encre > 10),
       aide.filter(t => t.encre <= 10).map(t => t.syn).join(' ') || 'toutes');
    const notin = aide.find(t => t.syn === '\\notin'), inn = aide.find(t => t.syn === '\\in');
    ck('  et ∉ porte bien un trait de plus que ∈',
       !!notin && !!inn && notin.encre > inn.encre,
       notin && inn ? `${inn.encre} px → ${notin.encre} px` : '');

    /* ============================================================
       3. LA CHAÎNE ENTIÈRE : ÉCRAN, SVG, LIEN, FICHIER
       ============================================================ */
    console.log('\n=== le symbole tient sur toute la chaîne ===');
    const chaine = await page.evaluate(() => {
        const a = window.app;
        const poser = (txt) => {
            a.entities = []; a.historyPast = [];
            a.addEntity(new TextLabel(400, 300, txt));
        };
        const encre = () => {
            a.render();
            const d = a.canvas.getContext('2d').getImageData(380, 270, 220, 60).data;
            let n = 0;
            for (let i = 0; i < d.length; i += 4) {
                if (d[i + 3] > 40 && !(d[i] > 230 && d[i + 1] > 230 && d[i + 2] > 230)) n++;
            }
            return n;
        };
        poser('A \\in D'); const eIn = encre();
        poser('A \\notin D'); const eNotin = encre();
        const svg = a.generateSVGString(false, 'text').includes('∉');
        const lien = (() => {
            const c = a.getCompressedString();
            const gard = a.entities.slice();
            a.entities = []; a.loadFromCompressedString(c);
            const t = a.entities.find(e => e instanceof TextLabel);
            const v = t ? t.text : '';
            a.entities = gard;
            return v;
        })();
        const json = (() => {
            const j = a.serialize();
            const t = a.deserialize(j).find(e => e instanceof TextLabel);
            return t ? t.text : '';
        })();
        /* et le caractère POSÉ AU CLAVIER, qui n'est pas une commande */
        poser('A ∉ D');
        return { eIn, eNotin, svg, lien, json,
                 encreLitterale: encre(),
                 svgLitteral: a.generateSVGString(false, 'text').includes('∉') };
    });
    ck('à l\'écran, ∉ dessine plus que ∈', chaine.eNotin > chaine.eIn,
       `${chaine.eIn} px → ${chaine.eNotin} px`);
    ck('le SVG porte le caractère', chaine.svg);
    ck('le lien compact le rend intact', chaine.lien === 'A \\notin D', chaine.lien);
    ck('le fichier .json aussi', chaine.json === 'A \\notin D', chaine.json);
    ck('et le caractère posé au clavier se dessine pareil',
       chaine.encreLitterale > chaine.eIn && chaine.svgLitteral,
       chaine.encreLitterale + ' px');

    /* ============================================================
       4. L'EXPORT TIKZ : UNE FORMULE RESTE UNE FORMULE
       ============================================================ */
    console.log('\n=== le TikZ n\'écrase plus les formules ===');
    const tikz = await page.evaluate(() => {
        const a = window.app;
        const noeud = (txt) => {
            a.entities = []; a.historyPast = [];
            a.addEntity(new TextLabel(400, 300, txt));
            const l = a.genererTikZ().split('\n').find(x => /node\[anchor/.test(x)) || '';
            return (l.match(/\{(.*)\};$/) || ['', ''])[1];
        };
        return {
            notin: noeud('A \\notin D'),
            frac: noeud('\\frac{a}{b} \\le 30\\degree'),
            par: noeud('(AB) \\par (CD)'),
            litteral: noeud('A ∉ D'),
            texte: noeud('Aire : 100 % de plus'),
            accents: noeud('\\frac{a}{b} unités'),
        };
    });
    ck('la formule part en mode mathématique', tikz.notin === '$A \\notin D$', tikz.notin);
    ck('  la barre oblique reste simple', !/\\\\[A-Za-z]/.test(tikz.notin));
    ck('  \\degree devient ce que LaTeX comprend',
       tikz.frac === '$\\frac{a}{b} \\le 30^{\\circ}$', tikz.frac);
    ck('  \\par, qui coupe un paragraphe en LaTeX, devient \\parallel',
       tikz.par.includes('\\parallel') && !/\\par[^a]/.test(tikz.par), tikz.par);
    ck('  et les accents, interdits en mode mathématique, sont à l\'abri',
       /\\mbox\{unités\}/.test(tikz.accents), tikz.accents);
    ck('un symbole tapé tel quel retrouve sa commande',
       tikz.litteral === 'A $\\notin$ D', tikz.litteral);
    ck('un texte ordinaire reste du texte, % protégé',
       tikz.texte === 'Aire : 100 \\% de plus', tikz.texte);

    /* ============================================================
       5. LE PDF DIT CE QU'IL NE SAIT PAS ÉCRIRE
       C'est le seul maillon non réparé : la police embarquée n'a pas les
       symboles. Ce qui est réparé, c'est le silence.
       ============================================================ */
    console.log('\n=== et le PDF ne se vante plus de ce qu\'il laisse tomber ===');
    for (const [titre, textes, attendu] of [
        ['avec des symboles', ['A \\notin D', 'a \\ge b'], true],
        ['avec le symbole tapé tel quel', ['A ∉ D'], true],
        ['sans symbole, mais avec des accents', ['Périmètre : 12 cm'], false],
    ]) {
        await page.evaluate((textes) => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            textes.forEach((t, i) => a.addEntity(new TextLabel(200, 200 + i * 70, t)));
            if (a.closeModal) a.closeModal();
        }, textes);
        const dl = page.waitForEvent('download', { timeout: 90000 });
        await page.evaluate(() => window.app.exportPDF(false, 'vector'));
        await dl;
        await page.waitForTimeout(200);
        const r = await page.evaluate(() => {
            const m = document.getElementById('customModal');
            return { ouverte: !!(m && getComputedStyle(m).display !== 'none'),
                     texte: (document.getElementById('modalMessage') || {}).innerText || '' };
        });
        ck(titre + ' : ' + (attendu ? 'le PDF le dit' : 'rien à signaler'),
           r.ouverte === attendu, r.ouverte ? r.texte.split('\n')[0] : 'aucune fenêtre');
        if (attendu) {
            ck('    il nomme le symbole perdu', /∉/.test(r.texte));
            ck('    et dit par où le conserver', /SVG/.test(r.texte) && /TikZ/.test(r.texte));
        }
        await page.evaluate(() => { if (window.app.closeModal) window.app.closeModal(); });
    }

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
