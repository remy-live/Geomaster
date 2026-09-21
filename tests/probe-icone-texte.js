/* L'ICÔNE DU TEXTE APPARTIENT ENFIN À SA FAMILLE.
 *
 * « Je trouve que l'icône du texte n'est pas très parlante, fais-m'en une
 *   cohérente. »
 *
 * CE QUI CLOCHAIT, MESURÉ. Toute la barre d'outils est dessinée AU TRAIT :
 * stroke="currentColor", épaisseur 2, fill="none". L'icône du texte était la
 * seule faite d'une LETTRE COMPOSÉE — un <text> rempli — et, avec la flèche du
 * pointeur, l'une des deux seules sans stroke. Une lettre composée ne suit pas
 * l'épaisseur de ses voisines, ne se règle pas, et dépend d'une police présente ;
 * agrandie, le A tombait en masse pleine au milieu d'un alphabet de traits fins.
 * S'y ajoutaient un petit carré flottant en haut à droite et un point que la
 * jambe du A avalait : deux détails qui ne disaient rien et se lisaient comme des
 * poussières à 24 px.
 *
 * CE QUI NE CLOCHAIT PAS, ET QU'IL FALLAIT MESURER AVANT DE L'ÉCRIRE. À l'œil,
 * l'ancienne icône paraissait « plus lourde » ; la part d'encre dit le
 * contraire : 4,9 % de la vignette contre 5,6 % pour le T, dans une famille qui
 * va de 5,6 à 9,6 %. Ce n'était donc pas une question de quantité d'encre mais de
 * RÉPARTITION — une masse pleine contre des traits. La sonde ne prétend donc rien
 * sur la part d'encre : elle tient la règle de dessin, qui est vraie.
 *
 * LE T À EMPATTEMENTS est le signe universel de l'écriture. Ses deux crochets du
 * haut comptent : sans eux, un T nu se confond avec le ⊥ de la perpendiculaire,
 * deux boutons plus haut dans la même colonne — mêmes deux traits, une barre et
 * un fût. La sonde compare donc les deux vignettes au pixel.
 *
 * Et l'aide en ligne montre la MÊME icône : elle sert à retrouver un bouton du
 * doigt, elle ne peut pas en montrer un autre.
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

    console.log('\n=== toute la barre est dessinée au trait ===');
    const famille = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('.tool-btn')].filter(b => b.querySelector('svg'));
        return btns.map((b) => {
            const s = b.querySelector('svg');
            return { nom: b.getAttribute('aria-label') || b.getAttribute('data-tooltip') || '?',
                     lettres: s.querySelectorAll('text').length,
                     stroke: s.getAttribute('stroke'),
                     epaisseur: s.getAttribute('stroke-width'),
                     fill: s.getAttribute('fill') };
        });
    });
    const lettres = famille.filter(r => r.lettres);
    ck('aucune icône n\'est une lettre composée',
       lettres.length === 0, lettres.map(r => r.nom).join(', ') || 'aucune');
    /* La flèche du pointeur est pleine, et c'est juste : un curseur EST une forme
       pleine. On la nomme, pour que le jour où une deuxième apparaît, la sonde le
       dise au lieu de la laisser passer. */
    const pleines = famille.filter(r => r.fill === 'currentColor').map(r => r.nom);
    ck('la seule icône pleine reste la flèche du pointeur',
       pleines.length === 1 && /Déplacer/.test(pleines[0]), pleines.join(', ') || 'aucune');
    const sansTrait = famille.filter(r => r.stroke !== 'currentColor').map(r => r.nom);
    ck('  et toutes les autres portent le trait de la famille',
       sansTrait.length === 1 && /Déplacer/.test(sansTrait[0]), sansTrait.join(', ') || 'aucune');

    console.log('\n=== celle du texte en fait partie ===');
    const texte = famille.find(r => /Texte/.test(r.nom));
    ck('le bouton texte existe toujours', !!texte, texte ? texte.nom : '(introuvable)');
    ck('  il est au trait, épaisseur 2, sans remplissage',
       !!texte && texte.stroke === 'currentColor' && texte.epaisseur === '2' && texte.fill === 'none',
       JSON.stringify(texte));

    console.log('\n=== et l\'aide montre la même ===');
    const memes = await page.evaluate(() => {
        const btn = document.querySelector('.tool-btn[onclick="app.setTool(\'text\')"]');
        const svgBtn = btn && btn.querySelector('svg');
        /* L'aide range ses vignettes dans .help-item-icon ; la bonne est celle dont
           la description commence par « Texte ». */
        const rangee = [...document.querySelectorAll('.help-item-row')].find((r) => {
            const d = r.querySelector('.help-item-desc strong');
            return d && d.textContent.trim() === 'Texte';
        });
        const svgAide = rangee && rangee.querySelector('.help-item-icon svg');
        const trace = (s) => s ? [...s.querySelectorAll('path,line,circle,rect,text')]
            .map(e => e.tagName + ':' + (e.getAttribute('d') || e.textContent || '')).join(' | ') : null;
        return { barre: trace(svgBtn), aide: trace(svgAide) };
    });
    ck('l\'aide en ligne porte la vignette du texte', !!memes.aide, memes.aide || '(introuvable)');
    ck('  et c\'est exactement le même dessin que dans la barre',
       !!memes.barre && memes.barre === memes.aide,
       memes.barre === memes.aide ? memes.barre : `barre ${memes.barre} ≠ aide ${memes.aide}`);

    /* LE T ET LE ⊥ SONT VOISINS DANS LA MÊME COLONNE, et faits des deux mêmes
       traits : une barre et un fût. C'est la seule confusion possible, donc la
       seule qu'il faille mesurer. */
    console.log('\n=== on ne le confond pas avec la perpendiculaire ===');
    const ecart = await page.evaluate(async () => {
        const png = async (sel) => {
            const b = document.querySelector(sel);
            if (!b) return null;
            const s = b.querySelector('svg').cloneNode(true);
            s.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            s.setAttribute('width', '48'); s.setAttribute('height', '48');
            s.setAttribute('stroke', '#000');
            const src = 'data:image/svg+xml;charset=utf-8,'
                + encodeURIComponent(new XMLSerializer().serializeToString(s));
            return new Promise((res) => {
                const im = new Image();
                im.onload = () => {
                    const c = document.createElement('canvas'); c.width = 48; c.height = 48;
                    const x = c.getContext('2d');
                    x.fillStyle = '#fff'; x.fillRect(0, 0, 48, 48);
                    x.drawImage(im, 0, 0, 48, 48);
                    res(x.getImageData(0, 0, 48, 48).data);
                };
                im.onerror = () => res(null);
                im.src = src;
            });
        };
        const a = await png('.tool-btn[onclick="app.setTool(\'text\')"]');
        const b = await png('.tool-btn[onclick="app.setTool(\'perpendicular\')"]');
        if (!a || !b) return null;
        let encre = 0, differe = 0;
        for (let i = 0; i < a.length; i += 4) {
            const na = a[i] < 170, nb = b[i] < 170;
            if (na || nb) encre++;
            if (na !== nb) differe++;
        }
        return { differe, encre, pc: Math.round(differe / Math.max(1, encre) * 100) };
    });
    ck('les deux vignettes sont bien deux dessins',
       !!ecart && ecart.pc >= 50,
       ecart ? `${ecart.pc} % des pixels encrés diffèrent (${ecart.differe} sur ${ecart.encre})` : 'mesure impossible');

    console.log('\n=== et le bouton fait toujours son travail ===');
    const clic = await page.evaluate(() => {
        const btn = document.querySelector('.tool-btn[onclick="app.setTool(\'text\')"]');
        btn.click();
        return { outil: window.app.currentTool,
                 curseur: window.app.canvas.style.cursor,
                 allume: btn.classList.contains('active'),
                 titre: btn.getAttribute('data-tooltip') };
    });
    ck('un clic prend l\'outil texte', clic.outil === 'text', clic.outil);
    ck('  avec le curseur de frappe', clic.curseur === 'text', clic.curseur);
    ck('  le bouton s\'allume', clic.allume === true, String(clic.allume));
    ck('  et l\'infobulle dit toujours ce qu\'il fait',
       /Texte/.test(clic.titre || '') && /Renommer/.test(clic.titre || ''), clic.titre);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
