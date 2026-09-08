/* UNE AIDE QUI SE MONTRE AU LIEU DE SE LIRE.
 *
 * « Dans l'aide on pourrait avoir un mode démo où ça balaye les fonctions avec
 * une démo. » Puis, la première version vue tourner :
 *
 *   « Il faut montrer où on appuie sur l'icône, ce qui apparaît […] il faut
 *   montrer la plupart des outils, le crayon magique, les constructions
 *   magiques […] il faut faire rêver. »
 *
 *   « Pour les instruments, il faut montrer leur manipulation un par un. Il faut
 *   qu'ils soient la star. L'idée est vraiment de montrer LES OUTILS de
 *   Géomaster, pas de réaliser des figures. »
 *
 * Cette dernière phrase a défait la moitié du programme : cinq étapes montraient
 * de belles figures — l'hexagone, l'étoile, la rosace, le chat au compas — et
 * aucune ne montrait un outil. Ce qui reste ne montre que des OUTILS, et chaque
 * instrument a son étape à lui, où on le prend, on le déplace, on le tourne, et
 * où il sert.
 *
 * Rien n'y est simulé : aucune capture, aucun film, aucun faux bouton. La main de
 * la visite appuie sur les VRAIES icônes, écrit dans la VRAIE barre, trace sur la
 * VRAIE feuille — et prend les instruments par les VRAIES poignées, qu'elle
 * demande au logiciel lui-même (getHitZone) au lieu de les recopier.
 *
 * Ce que la sonde tient :
 *
 *   — le sommaire est écrit À PARTIR des étapes, pas recopié à côté. Une ligne
 *     ajoutée au programme s'ajoute toute seule à l'aide, et ne peut pas mentir ;
 *   — CHAQUE étape construit vraiment quelque chose ;
 *   — les QUATRE instruments ont chacun leur étape, et chacune le sort VRAIMENT
 *     et le manipule : mesuré, l'instrument bouge et tourne pour de bon ;
 *   — la main VA sur les icônes, et sur les VRAIES : chaque cible que la visite
 *     désigne doit exister dans la page. Une visite qui montre un bouton absent
 *     est pire qu'une visite absente ;
 *   — la médiatrice SE VOIT EN ENTIER. Mesuré avant : la figure occupait 1298 px
 *     de large pour 1292 px visibles, et ses arcs sortaient par le bas ;
 *   — la figure en cours est mise de côté et REMISE EN PLACE à la sortie, à
 *     l'objet près, avec le cadrage, la vitesse de rejeu et les réglages : une
 *     visite ne coûte pas son travail à qui la demande ;
 *   — pendant la visite, la SOURIS NE TOUCHE PLUS RIEN : un survol suffisait à
 *     faire glisser un instrument sous la main de la visite. Seuls la barre, son
 *     curseur et les touches du lecteur répondent ;
 *   — la barre NE CHANGE PLUS DE TAILLE : certaines étapes changent trois fois de
 *     phrase, et la barre montait et descendait sous le texte ;
 *   — AUCUN ZOOM AU SEIN D'UNE ÉTAPE : la vue est posée une fois, au plus, et ne
 *     bouge plus tant que l'étape dure ;
 *   — et l'on peut en sortir. La barre vit au-dessus de l'interface verrouillée
 *     par le rejeu — sans quoi une aide deviendrait une prison.
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
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) {}
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        /* Une demi-seconde après l'ouverture, l'application demande « une
           sauvegarde automatique a été trouvée, voulez-vous la restaurer ? ».
           Vider le magasin ne suffit pas : la sonde POSE une figure et
           l'enregistre, ce qui réécrit la sauvegarde avant que la question ne
           soit posée. Elle se posait donc DANS la même boîte que celle de la
           visite, et par-dessus : mesuré, une fois sur deux, « Confirmer »
           restaurait un brouillon au lieu de lancer la démonstration — et
           j'allais accuser le clic. Personne ne lance une visite guidée dans la
           demi-seconde qui suit l'ouverture ; on désamorce la question au lieu
           de compter les millisecondes. */
        window.app.checkAutoSave = () => {};
        /* La visite dure trois minutes, et c'est voulu : chaque geste doit se
           voir. Le lanceur, lui, tue toute sonde au bout de quatre minutes. On
           raccourcit donc les temps de PAUSE — ceux qui n'existent que pour
           laisser regarder — et rien d'autre : les gestes, les événements
           envoyés, les constructions et les rejeux se déroulent à leur vitesse
           normale. C'est bien la visite qu'on mesure, pas une maquette. */
        window.app._demoTempoFacteur = 0.28;
    });

    console.log('\n=== l\'onglet, et son sommaire écrit à partir des étapes ===');
    const onglet = await page.evaluate(() => {
        const app = window.app;
        const btns = [...document.querySelectorAll('.help-tab-btn')];
        const b = btns.find(x => /D[ée]mo/i.test(x.textContent));
        if (!b) return { absent: true };
        app.switchHelpTab('demo', b);
        const ol = document.getElementById('demoSommaire');
        const titres = app.demoEtapes().map(e => e.titre);
        return { visible: document.getElementById('tab-demo').style.display,
                 lignes: ol ? [...ol.children].map(li => li.textContent) : [],
                 titres };
    });
    ck('l\'aide a un onglet « Démonstration »', !onglet.absent);
    ck('  il s\'affiche', onglet.visible === 'block', onglet.visible);
    ck('  et son sommaire vient des étapes elles-mêmes',
       JSON.stringify(onglet.lignes) === JSON.stringify(onglet.titres),
       onglet.lignes.length + ' lignes pour ' + onglet.titres.length + ' étapes');
    ck('  la visite balaye largement le logiciel', onglet.titres.length >= 10,
       onglet.titres.length + ' étapes');
    /* LES OUTILS, PAS LES FIGURES. Chaque instrument doit avoir son étape à lui :
       une étape qui les sort tous les quatre à la file n'en montre aucun. */
    const instr = ['#btn-ruler', '#btn-setsquare', '#btn-protractor', '#btn-compass'];
    const chacun = await page.evaluate((ids) => {
        const src = window.app.demoEtapes().map(e => String(e.faire));
        return ids.map(id => ({ id, n: src.filter(t => t.includes(id)).length }));
    }, instr);
    ck('  chaque instrument a son étape, et une seule',
       chacun.every(x => x.n === 1),
       chacun.map(x => x.id.replace('#btn-', '') + '×' + x.n).join(' '));
    const manip = await page.evaluate(() => {
        const src = window.app.demoEtapes().map(e => String(e.faire)).join('\n');
        return { bouge: (src.match(/outilBouger/g) || []).length,
                 tourne: (src.match(/outilTourner/g) || []).length,
                 zone: (src.match(/outilZone/g) || []).length };
    });
    ck('  et on l\'y manipule : on le déplace, on le tourne, on s\'en sert',
       manip.bouge >= 4 && manip.tourne >= 3 && manip.zone >= 3,
       JSON.stringify(manip));

    console.log('\n=== la trousse se lit d\'un tenant ===');
    /* « Pour l'aide sur les instruments, il faut mettre les 4 instruments les uns
       à la suite des autres : l'équerre est toute seule en bas. » Elle l'était :
       on lisait le compas, le rapporteur, la règle, puis le stylo, le croquis et
       le document de fond — et l'équerre enfin, après trois blocs qui n'ont rien
       à voir. La sonde tient l'ordre ET la continuité : entre le premier et le
       dernier instrument, aucun autre bloc ne s'intercale. */
    const trousse = await page.evaluate(() => {
        const app = window.app;
        const b = [...document.querySelectorAll('.help-tab-btn')]
            .find(x => /instrument/i.test(x.textContent));
        app.switchHelpTab('tools', b || document.querySelector('.help-tab-btn'));
        const panneau = document.getElementById('tab-tools');
        const blocs = [...panneau.querySelectorAll('.help-tool-row')];
        const titre = (bl) => { const h = bl.querySelector('h4'); return h ? h.textContent.trim() : '?'; };
        const rangs = blocs.map((bl, i) => ({ i, titre: titre(bl),
            instrument: !!bl.querySelector('canvas[id^="helpCanvas"]') }));
        const dedans = rangs.filter(r => r.instrument).map(r => r.i);
        return { ordre: rangs.filter(r => r.instrument).map(r => r.titre),
                 premier: dedans[0], dernier: dedans[dedans.length - 1],
                 combien: dedans.length,
                 entre: rangs.filter(r => r.i > dedans[0] && r.i < dedans[dedans.length - 1]
                                       && !r.instrument).map(r => r.titre) };
    });
    ck('les quatre instruments sont là', trousse.combien === 4,
       trousse.ordre.join(' · '));
    ck('  et ils se suivent sans rien entre eux',
       trousse.entre.length === 0 && trousse.dernier - trousse.premier === 3,
       trousse.entre.length ? 'intercalé(s) : ' + trousse.entre.join(', ')
                            : 'blocs ' + trousse.premier + ' à ' + trousse.dernier);
    /* Et chacun montre son dessin : un bloc rangé au bon endroit mais vide ne
       vaut pas mieux qu'un bloc égaré. */
    await page.waitForTimeout(700);
    const dessins = await page.evaluate(() => {
        window.app.renderHelpTools();
        return ['Compass', 'Protractor', 'Ruler', 'SetSquare'].map(n => {
            const c = document.getElementById('helpCanvas' + n);
            if (!c) return { n, px: -1 };
            const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
            let px = 0;
            for (let i = 3; i < d.length; i += 4) if (d[i]) px++;
            return { n, px };
        });
    });
    ck('  et chacun est dessiné', dessins.every(d => d.px > 500),
       dessins.map(d => d.n + ' ' + d.px + ' px').join(', '));

    console.log('\n=== la main désigne des icônes qui EXISTENT ===');
    /* Les sélecteurs que la visite montre sont écrits en dur dans les étapes.
       Un bouton renommé, un onclick réécrit, et la main désignerait le vide en
       racontant qu'elle appuie : c'est exactement le genre de mensonge que
       cette visite existe pour ne pas faire. */
    const cibles = await page.evaluate(() => {
        const src = window.app.demoEtapes().map(e => String(e.faire)).join('\n');
        const sel = [...src.matchAll(/g\.viser\(\s*(?:outil|magie)\('([a-z_]+)'\)/g)]
            .map(m => /^magic_/.test(m[1])
                ? `.magic-grid-item[onclick="app.setTool('${m[1]}')"]`
                : `.tool-btn[onclick="app.setTool('${m[1]}')"]`);
        const ids = [...src.matchAll(/g\.viser\('(#[A-Za-z0-9_-]+)'/g)].map(m => m[1]);
        const tous = [...new Set([...sel, ...ids,
            '#btnConsigneEclair', '#ceGo', '#ceOutils', '#ceChamp'])];
        return tous.map(s => ({ s, la: !!document.querySelector(s) }));
    });
    const manquants = cibles.filter(c => !c.la);
    ck('chaque cible montrée existe dans la page', manquants.length === 0,
       cibles.length + ' cibles' + (manquants.length ? ' — absente(s) : '
        + manquants.map(c => c.s).join(', ') : ''));

    console.log('\n=== on met la figure de côté avant de partir ===');
    const avant = await page.evaluate(() => {
        const app = window.app;
        app.entities = []; app.historyPast = [];
        app.addEntity(new Point(300, 300, 'Z'));
        app.addEntity(new Point(600, 420, 'Y'));
        app.addEntity(new Segment(app.entities[0], app.entities[1], { color: '#000', width: 2 }));
        app.saveState();
        return { objets: app.entities.map(e => e.constructor.name + ':' + (e.label || '')),
                 vitesse: app.playbackSpeed,
                 style: JSON.stringify(app.globalStyle) };
    });
    await page.evaluate(() => window.app.demoDemarrer());
    /* On attend que la modale soit POSÉE — elle met son bouton au foyer en
       dernier — au lieu de compter les millisecondes : cliquer trop tôt ne
       déclenchait rien, et j'ai bien failli accuser le code. */
    await page.waitForFunction(() =>
        document.activeElement && document.activeElement.id === 'btnModalConfirm');
    const demande = await page.evaluate(() => ({
        modale: document.getElementById('customModal').style.display,
        texte: (document.getElementById('modalMessage') || {}).textContent || '' }));
    ck('sur une feuille occupée, on demande avant de l\'effacer',
       demande.modale === 'flex' && /mise de côté/.test(demande.texte),
       demande.texte.slice(0, 70));
    await page.click('#btnModalConfirm');
    await page.waitForTimeout(400);

    /* UN MOUCHARD SUR LA VUE. « Il ne faut pas qu'il y ait des zooms et des
       dézooms au sein d'une même étape » : on relève chaque cadrage distinct
       pendant l'étape, et l'on n'en tolère qu'un — celui qui pose la figure. */
    await page.evaluate(() => {
        const app = window.app;
        app._vues = [];
        const rendre = app.render.bind(app);
        app.render = function () {
            const v = Math.round(app.view.x) + '/' + Math.round(app.view.y)
                    + '/' + (app.view.zoom || 1).toFixed(3);
            if (app._vues && app._vues[app._vues.length - 1] !== v) app._vues.push(v);
            return rendre();
        };
        const jouer = app.demoJouer.bind(app);
        app.demoJouer = function (i) { app._vues = []; return jouer(i); };
        /* Le relevé ne commence qu'une fois l'étape a POSÉ SA VUE : demoJouer
           arrête d'abord le rejeu de l'étape PRÉCÉDENTE, ce qui redessine avec SON
           cadrage à elle — un relevé qui n'appartient pas à l'étape qu'on mesure.
           On se raccroche donc au geste qui pose la scène, et non à une valeur
           écrite en dur : elle a changé le jour où la visite s'est mise à tenir
           dans un téléphone, et la sonde comptait alors un cadrage de trop. */
        const scene = app.demoCadrerScene.bind(app);
        app.demoCadrerScene = function () { const r = scene(); app._vues = []; return r; };
        app._vuesUtiles = () => app._vues || [];
    });

    console.log('\n=== les étapes construisent vraiment ===');
    const total = onglet.titres.length;
    const vus = [];
    for (let k = 0; k < total; k++) {
        /* On attend que l'étape ait FINI ses gestes — elle pose alors son
           minuteur d'enchaînement — plutôt qu'un temps deviné : une étape qui
           trace un chat au compas ne dure pas ce que dure un clic. */
        /* On guette de PRÈS. À 500 ms d'intervalle, une étape raccourcie pouvait
           se terminer ET enchaîner sur la suivante entre deux coups d'œil : on
           mesurait alors une étape à peine commencée, et l'on croyait qu'elle
           n'avait rien construit. */
        let attente = 0;
        while (attente < 75000) {
            await page.waitForTimeout(160); attente += 160;
            const e = await page.evaluate(() => {
                const d = window.app._demo;
                return { i: d ? d.i : -1, pret: !!(d && d.fini) };
            });
            if (e.i !== k || e.pret) break;
        }
        const e = await page.evaluate(() => {
            const app = window.app;
            const boite = (app.canvas.parentElement || app.canvas).getBoundingClientRect();
            const b = app.getSceneBounds(false);
            const z = app.view.zoom || 1;
            const ecran = { x0: b.minX * z + app.view.x, y0: b.minY * z + app.view.y,
                            x1: b.maxX * z + app.view.x, y1: b.maxY * z + app.view.y };
            return { rang: document.getElementById('demoRang').textContent,
                     titre: document.getElementById('demoTitre').textContent,
                     dit: document.getElementById('demoDit').textContent,
                     barre: document.getElementById('demoBar').style.display,
                     objets: app.entities.filter(x => !(x instanceof ToolAnimation)).length,
                     encre: !!app.traitCroquis,
                     boucle: !!app.isLooping,
                     vues: app._vuesUtiles ? app._vuesUtiles().length : 0,
                     style: JSON.stringify(app.globalStyle),
                     /* Un instrument SORTI n'est pas un instrument MONTRÉ. On note
                        où toggleWidget l'aurait posé — au centre de ce qu'on voit —
                        et l'on regarde s'il en a bougé, ou s'il a tourné. */
                     outils: (() => {
                         const noms = { ruler: 'rulerWidget', setsquare: 'setSquareWidget',
                                        protractor: 'protractorWidget', compass: 'compassWidget' };
                         const c = (app.canvas.parentElement || app.canvas).getBoundingClientRect();
                         const z = app.view.zoom || 1;
                         const cx = (c.width / 2 - app.view.x) / z, cy = (c.height / 2 - app.view.y) / z;
                         return Object.entries(noms)
                             .filter(([n]) => app.activeWidgets && app.activeWidgets[n])
                             .map(([n, champ]) => {
                                 const w = app[champ];
                                 return { n, d: Math.round(Math.hypot(w.x - cx, w.y - cy)),
                                          a: +(Math.abs(w.angle || 0)).toFixed(2) };
                             });
                     })(),
                     dedans: ecran.x0 > -3 && ecran.y0 > -3
                          && ecran.x1 < boite.width + 3 && ecran.y1 < boite.height + 3,
                     cadre: [Math.round(ecran.x0), Math.round(ecran.y0),
                             Math.round(ecran.x1), Math.round(ecran.y1)],
                     vue: [Math.round(boite.width), Math.round(boite.height)] };
        });
        vus.push(e);
        ck('étape ' + e.rang + ' · ' + e.titre,
           e.barre === 'flex' && e.objets >= 3 && !!e.titre && !!e.dit,
           e.objets + ' objets');
        if (k < total - 1) { await page.evaluate(() => window.app.demoAller(1)); await page.waitForTimeout(500); }
    }
    ck('  les étapes ont des titres tous différents',
       new Set(vus.map(v => v.titre)).size === total,
       new Set(vus.map(v => v.titre)).size + ' titres distincts');
    /* LA MÉDIATRICE, EN ENTIER. Elle est la plus large de la visite : le segment,
       les quatre arcs qui débordent de part et d'autre, et la droite qui traverse
       tout. Si une figure de la visite doit sortir du cadre, c'est celle-là. */
    const dehors = vus.filter(v => !v.dedans);
    ck('  chaque figure tient dans ce qu\'on voit, en entier',
       dehors.length === 0,
       dehors.length ? dehors.map(v => v.titre + ' ' + JSON.stringify(v.cadre)
                                      + ' dans ' + JSON.stringify(v.vue)).join(' | ')
                     : vus.length + ' figures cadrées');
    /* UNE CONSTRUCTION MAGIQUE LAISSE LE REJEU EN BOUCLE, et c'est fait exprès :
       on la regarde se refaire autant de fois qu'on veut. Ce qui n'allait pas,
       c'est que la boucle DÉBORDAIT sur l'étape suivante — mesuré, à partir de la
       médiatrice magique, isPlaying ne retombait plus jamais et chaque étape
       butait sur la minute d'attente, la visite passant de trois minutes et demie
       à treize. La sonde ne demande donc pas qu'aucune étape ne boucle : elle
       demande que celles qui REJOUENT aient bel et bien fini. */
    const rejouent = await page.evaluate(() =>
        window.app.demoEtapes().map(e => /g\.rejeu\(/.test(String(e.faire))));
    const coincees = vus.filter((v, i) => rejouent[i] && v.boucle);
    ck('  une étape qui rejoue va jusqu\'au bout, sans hériter d\'une boucle',
       coincees.length === 0,
       rejouent.filter(Boolean).length + ' étapes rejouent'
       + (coincees.length ? ', coincée(s) : ' + coincees.map(v => v.titre).join(', ') : ''));
    /* Le trait à main levée n'est pas un objet, c'est de l'encre : vider la
       feuille ne l'effaçait pas, et le carré tremblé du crayon magique restait
       en travers de la rosace deux étapes plus loin. */
    ck('  et aucune ne garde l\'encre de la précédente',
       vus.filter(v => v.encre).length === 0);
    /* « Pour les instruments, il faut montrer leur MANIPULATION un par un. »
       Sorti et laissé au centre, un instrument n'est pas montré : il est posé.
       On exige qu'il ait bougé d'au moins 40 px, ou tourné d'au moins 0,1 rad. */
    const sortis = vus.flatMap((v, i) => v.outils.map(o => ({ ...o, etape: v.titre })));
    const inertes = sortis.filter(o => o.d < 40 && o.a < 0.1);
    /* La vue de départ compte pour un relevé ; un cadrage en ajoute un. Au-delà
       de deux, la figure a sauté sous les yeux au milieu de l'étape. */
    const remuantes = vus.filter(v => v.vues > 2);
    ck('  aucune étape ne zoome et dézoome sous les yeux',
       remuantes.length === 0,
       remuantes.length ? remuantes.map(v => v.titre + ' : ' + v.vues + ' cadrages').join(' | ')
                        : 'au plus ' + Math.max(...vus.map(v => v.vues)) + ' cadrage par étape');
    /* « De 2 à 3, remets un trait normal. » L'étape de la palette change le style
       du crayon pour de bon — la suivante ne doit pas en hériter. */
    const stylesDepart = await page.evaluate(() => window.app._demoStyleDepart || null);
    ck('  chaque étape repart avec le crayon de l\'utilisateur',
       vus.filter((v, i) => i > 1 && v.style !== vus[0].style).length === 0,
       vus.map(v => JSON.parse(v.style).color).filter((c, i, t) => t.indexOf(c) === i).join(' '));
    /* « On ne voit pas l'énoncé magique à la fin de la démo. » Le panneau ne
       s'ouvrait qu'une fois la figure finie, et la visite se terminait deux
       secondes plus tard en rendant la feuille : il passait sans qu'on ait le
       temps de le lire. Il s'ouvre maintenant AVANT, et se remplit sous les yeux. */
    const dernier = await page.evaluate(() => {
        const b = document.getElementById('instructionBox');
        const t = document.getElementById('enonceGenereTexte');
        const r = b ? b.getBoundingClientRect() : null;
        return { ouvert: !!(r && r.width > 40 && r.left < innerWidth && r.right > 0),
                 onglet: window.app._ongletEnonce,
                 lignes: t ? t.querySelectorAll('li').length : 0,
                 texte: t ? t.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : '' };
    });
    ck('  et la dernière étape MONTRE l\'énoncé relu, ouvert et rempli',
       dernier.ouvert && dernier.lignes >= 3,
       dernier.lignes + ' lignes, onglet « ' + dernier.onglet + ' » : ' + dernier.texte);
    ck('  chaque instrument sorti est VRAIMENT manipulé',
       sortis.length >= 4 && inertes.length === 0,
       sortis.map(o => o.n + ' ' + o.d + 'px/' + o.a + 'rad').join(', ')
       + (inertes.length ? ' — inerte(s) : ' + inertes.map(o => o.n).join(', ') : ''));

    /* La douzième étape finie, la visite se termine d'elle-même — c'est ce qu'on
       lui demande. Pour éprouver la barre, le voile et le curseur, il faut donc la
       relancer : on repart à la première étape. */
    /* Elle se termine d'elle-même : arrivée au bout de la dernière étape, elle
       range tout et s'efface. On l'y mène et l'on attend. */
    await page.evaluate((n) => window.app.demoVersEtape(String((n - 1) * 100)),
                        onglet.titres.length);
    let seule = false;
    for (let t = 0; t < 100 && !seule; t++) {
        await page.waitForTimeout(500);
        seule = await page.evaluate(() => !window.app._demo);
    }
    ck('la visite se termine d\'elle-même à la dernière étape', seule);

    await page.evaluate(() => {
        const app = window.app;
        app.demoDemarrer();
        const b = document.getElementById('btnModalConfirm');
        if (b && document.getElementById('customModal').style.display === 'flex') b.click();
    });
    await page.waitForTimeout(1200);

    console.log('\n=== pendant la visite, la souris ne touche plus rien ===');
    /* « La souris a une influence sur l'outil : quand on est en mode démo, il ne
       faut pas d'interactivité sauf avec le slider et les touches du lecteur. »
       Un simple survol suffisait à faire glisser une règle sous la main de la
       visite. On met la visite en pause — rien ne doit donc bouger tout seul — et
       l'on essaie de s'en mêler pour de bon. */
    await page.evaluate(() => window.app.demoPause());
    await page.waitForTimeout(400);
    const coin = await page.evaluate(() => {
        const c = document.getElementById('geoCanvas').getBoundingClientRect();
        return { x: c.left, y: c.top };
    });
    const feuilleAvant = await page.evaluate(() => ({
        n: window.app.entities.length, outil: window.app.currentTool,
        dessus: (() => { const el = document.elementFromPoint(240, 780);
                         return el ? (el.id || el.tagName) : null; })() }));
    for (const [x, y] of [[160, 760], [980, 170], [320, 240]]) {
        await page.mouse.move(coin.x + x, coin.y + y); await page.waitForTimeout(40);
        await page.mouse.down(); await page.waitForTimeout(40);
        await page.mouse.move(coin.x + x + 130, coin.y + y + 90); await page.waitForTimeout(40);
        await page.mouse.up(); await page.waitForTimeout(150);
    }
    await page.evaluate(() => {
        const b = document.querySelector('.tool-btn[onclick="app.setTool(\'polygon\')"]');
        const r = b.getBoundingClientRect();
        window.__cible = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    const cible = await page.evaluate(() => window.__cible);
    await page.mouse.click(cible.x, cible.y); await page.waitForTimeout(200);
    await page.keyboard.press('KeyC'); await page.waitForTimeout(200);
    const feuilleApres = await page.evaluate(() => ({
        n: window.app.entities.length, outil: window.app.currentTool }));
    ck('un voile couvre l\'interface', feuilleAvant.dessus === 'demoVoile',
       String(feuilleAvant.dessus));
    ck('  trois clics et glissés réels ne touchent pas la feuille',
       feuilleApres.n === feuilleAvant.n, feuilleAvant.n + ' → ' + feuilleApres.n + ' objets');
    ck('  ni le clic sur une icône, ni le raccourci clavier ne changent l\'outil',
       feuilleApres.outil === feuilleAvant.outil,
       feuilleAvant.outil + ' → ' + feuilleApres.outil);
    await page.evaluate(() => window.app.demoPause());
    await page.waitForTimeout(300);
    /* Mais le lecteur, lui, répond. */
    const avantFleche = await page.evaluate(() => window.app._demo.i);
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(900);
    const apresFleche = await page.evaluate(() => window.app._demo.i);
    ck('  les touches du lecteur, elles, répondent',
       apresFleche === avantFleche + 1,
       'étape ' + (avantFleche + 1) + ' → ' + (apresFleche + 1) + ' à la flèche droite');

    console.log('\n=== la barre ne change pas de taille ===');
    /* Une étape qui montre quatre gestes change quatre fois de phrase : la barre
       montait et descendait sous le texte, et l'œil suivait la barre au lieu de
       la figure. */
    const hauteurs = [];
    for (let i = 0; i < 8; i++) {
        hauteurs.push(await page.evaluate(() =>
            Math.round(document.getElementById('demoBar').getBoundingClientRect().height)));
        await page.waitForTimeout(600);
    }
    ck('elle garde la même hauteur d\'un bout à l\'autre',
       new Set(hauteurs).size === 1, [...new Set(hauteurs)].join(' / ') + ' px');

    console.log('\n=== le curseur va où l\'on veut ===');
    /* Douze étapes, c'est trop pour avancer une par une quand on cherche celle du
       compas. */
    await page.evaluate(() => {
        const c = document.getElementById('demoCurseur');
        c.value = '437'; window.app.demoVersEtape('437');
    });
    await page.waitForTimeout(900);
    const saute = await page.evaluate(() => ({
        i: window.app._demo ? window.app._demo.i : -1,
        rang: document.getElementById('demoRang').textContent,
        max: document.getElementById('demoCurseur').max,
        fond: document.getElementById('demoCurseur').style.background || '' }));
    ck('la barre a un curseur, et il mène à l\'étape voulue',
       saute.i === 4, JSON.stringify({ i: saute.i, rang: saute.rang }));
    /* « Mets les étapes par de petits traits, et on peut naviguer de façon fluide
       entre chaque étape ou au sein de l'étape. » Un cran par étape faisait sauter
       la pastille de douze en douze : elle compte en centièmes. */
    ck('  il compte en centièmes d\'étape, pas en étapes',
       parseInt(saute.max, 10) === onglet.titres.length * 100,
       '0 → ' + saute.max + ' pour ' + onglet.titres.length + ' étapes');
    /* Les jalons : un trait clair à chaque frontière. Sans eux, on glisse à
       l'aveugle sur une barre lisse. */
    const jalons = (saute.fond.match(/rgba\(255, ?255, ?255, ?0\.62\)/g) || []).length;
    ck('  et il porte un petit trait par étape',
       jalons >= (onglet.titres.length - 1) * 2,
       jalons / 2 + ' jalons pour ' + (onglet.titres.length - 1) + ' frontières');

    console.log('\n=== la pause SUSPEND, elle ne recommence pas ===');
    /* « Le bouton pause fait tout démarrer. » Elle coupait les minuteurs de
       l'étape en cours, et reprendre la rejouait depuis le début. On mesure ce
       qui compte : mise en pause au milieu d'un geste, la feuille NE SE VIDE PAS
       et l'étape ne repart pas de zéro. */
    await page.evaluate(() => window.app.demoVersEtape('0'));
    await page.waitForTimeout(6000);
    const avantPause = await page.evaluate(() => ({
        n: window.app.entities.length, i: window.app._demo.i }));
    await page.evaluate(() => window.app.demoPause());
    const enPause = await page.evaluate(() => ({
        pause: !!(window.app._demo && window.app._demo.pause),
        bouton: document.getElementById('demoPause').textContent }));
    ck('la pause se voit sur le bouton', enPause.pause && enPause.bouton === '▶',
       JSON.stringify(enPause));
    await page.waitForTimeout(2500);
    const pendant = await page.evaluate(() => ({
        n: window.app.entities.length, i: window.app._demo.i }));
    ck('  en pause, rien ne bouge et rien ne recommence',
       pendant.n === avantPause.n && pendant.i === avantPause.i,
       avantPause.n + ' objets → ' + pendant.n);
    await page.evaluate(() => window.app.demoPause());
    await page.waitForTimeout(2500);
    const apresPause = await page.evaluate(() => ({
        n: window.app.entities.length, i: window.app._demo.i }));
    ck('  et l\'on repart où l\'on s\'était arrêté, sans revenir au début',
       apresPause.i === avantPause.i && apresPause.n >= avantPause.n,
       avantPause.n + ' → ' + apresPause.n + ' objets, étape '
       + (apresPause.i + 1));

    await page.evaluate(() => window.app.demoArreter());
    await page.waitForTimeout(300);
    const apres = await page.evaluate(() => ({
        objets: window.app.entities.map(e => e.constructor.name + ':' + (e.label || '')),
        barre: document.getElementById('demoBar').style.display,
        main: document.getElementById('demoMain').style.display,
        verrou: !!window.app.isLocked,
        vitesse: window.app.playbackSpeed,
        style: JSON.stringify(window.app.globalStyle),
        vue: [window.app.view.x, window.app.view.y, window.app.view.zoom],
        instruments: Object.values(window.app.activeWidgets || {}).filter(Boolean).length,
        demo: !!window.app._demo }));
    ck('la barre disparaît', apres.barre === 'none', apres.barre);
    ck('  et la main aussi', apres.main === 'none', apres.main);
    ck('l\'interface est déverrouillée', apres.verrou === false);
    ck('les instruments sont rangés', apres.instruments === 0,
       apres.instruments + ' instrument(s) restés sur la feuille');
    ck('la vitesse de rejeu est rendue', apres.vitesse === avant.vitesse,
       avant.vitesse + ' → ' + apres.vitesse);
    /* L'étape de la palette change le style du trait POUR DE BON — c'est bien
       l'idée. On sortait donc de la visite avec un crayon bleu, en pointillés et
       deux fois trop épais, sans avoir rien demandé. */
    ck('le style du crayon est rendu', apres.style === avant.style,
       avant.style + ' → ' + apres.style);
    ck('le cadrage est rendu',
       JSON.stringify(apres.vue) === JSON.stringify([0, 0, 1]), JSON.stringify(apres.vue));
    ck('et la figure est rendue telle qu\'on l\'a trouvée',
       JSON.stringify(apres.objets) === JSON.stringify(avant.objets),
       JSON.stringify(avant.objets) + ' → ' + JSON.stringify(apres.objets));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    /* ================================================================
       ET SUR UN TÉLÉPHONE.

       « La présentation de l'aide et la démo aide est vraiment pas adapté au
       téléphone. » Trois défauts, dont un grave : la visite est COMPOSÉE pour une
       feuille de 1292 px de large, et un téléphone en montre 390 — la moitié des
       gestes tombaient hors champ, on regardait une feuille vide pendant que la
       main travaillait à côté. Les deux autres : les cinq onglets réclamaient
       413 px pour 354, et « Démonstration » — l'onglet de la visite, justement —
       était coupé au bord ; et l'aide des instruments débordait de 22 px.
       ================================================================ */
    console.log('\n=== et sur un téléphone ===');
    const tel = await nav.newPage({ viewport: { width: 390, height: 844 },
                                    isMobile: true, hasTouch: true });
    const errTel = [];
    tel.on('pageerror', e => errTel.push(e.message));
    await tel.goto(PAGE);
    await tel.waitForFunction(() => window.app);
    await tel.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) {}
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
        window.app._demoTempoFacteur = 0.28;
    });

    const onglets = await tel.evaluate(() => {
        window.app.toggleHelp();
        const btns = [...document.querySelectorAll('.help-tab-btn')];
        const bande = btns[0].parentElement;
        return { deborde: bande.scrollWidth > bande.clientWidth + 2,
                 coupes: btns.filter(b => b.getBoundingClientRect().right > innerWidth + 1)
                             .map(b => b.textContent.trim()),
                 rangs: new Set(btns.map(b => Math.round(b.getBoundingClientRect().top))).size };
    });
    ck('les cinq onglets tiennent dans l\'écran',
       !onglets.deborde && onglets.coupes.length === 0,
       onglets.coupes.length ? 'coupé(s) : ' + onglets.coupes.join(', ')
                             : onglets.rangs + ' rangées');

    /* Ce qu'on vient chercher dans l'onglet de la visite, c'est le bouton. */
    const bouton = await tel.evaluate(() => {
        const b = [...document.querySelectorAll('.help-tab-btn')].find(x => /D[ée]mo/i.test(x.textContent));
        window.app.switchHelpTab('demo', b);
        const p = document.getElementById('tab-demo');
        const bt = p.querySelector('button');
        const r = bt.getBoundingClientRect(), pr = p.getBoundingClientRect();
        return { texte: bt.textContent.trim().slice(0, 24),
                 dansLaVue: r.top >= pr.top - 1 && r.bottom <= pr.top + p.clientHeight + 1,
                 haut: Math.round(r.top - pr.top) };
    });
    ck('  et le bouton « Lancer » se voit sans faire défiler',
       bouton.dansLaVue, bouton.texte + ' à ' + bouton.haut + ' px du haut du panneau');

    /* Rien ne doit déborder à droite, dans aucun onglet. */
    const debords = await tel.evaluate(() => {
        const res = [];
        ['general', 'header', 'leftbar', 'tools', 'demo'].forEach(id => {
            const b = [...document.querySelectorAll('.help-tab-btn')]
                .find(x => (x.getAttribute('onclick') || '').includes("'" + id + "'"));
            window.app.switchHelpTab(id, b);
            const p = document.getElementById('tab-' + id);
            const large = document.querySelector('#helpModal .modal-box').clientWidth;
            let n = 0;
            p.querySelectorAll('*').forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.right > large + 2) n++;
            });
            if (n) res.push(id + ' (' + n + ')');
        });
        window.app.toggleHelp();
        return res;
    });
    ck('  et aucun onglet ne déborde de la boîte', debords.length === 0,
       debords.length ? debords.join(', ') : 'cinq onglets propres');

    /* LA VISITE SE JOUE DANS CE QU'ON VOIT. C'est le point qui comptait. */
    await tel.evaluate(() => window.app.demoDemarrer());
    await tel.waitForTimeout(700);
    const dedansTel = [];
    for (const k of [0, 4, 7, 9]) {
        await tel.evaluate((k) => window.app.demoVersEtape(String(k * 100)), k);
        let t = 0;
        while (t < 60000) {
            await tel.waitForTimeout(200); t += 200;
            const e = await tel.evaluate(() => { const d = window.app._demo;
                return { i: d ? d.i : -1, fini: !!(d && d.fini) }; });
            if (e.i !== k || e.fini) break;
        }
        dedansTel.push(await tel.evaluate(() => {
            const a = window.app;
            const c = (a.canvas.parentElement || a.canvas).getBoundingClientRect();
            const barre = document.getElementById('demoBar');
            const rb = barre.getBoundingClientRect();
            const enHaut = barre.classList.contains('en-haut');
            const b = a.getSceneBounds(false), z = a.view.zoom || 1;
            const x0 = b.minX * z + a.view.x, y0 = b.minY * z + a.view.y;
            const x1 = b.maxX * z + a.view.x, y1 = b.maxY * z + a.view.y;
            const hautLibre = enHaut ? rb.bottom - c.top : 0;
            const basLibre = enHaut ? c.height : rb.top - c.top;
            return { titre: document.getElementById('demoTitre').textContent,
                     zoom: +z.toFixed(2),
                     ok: x0 > -3 && x1 < c.width + 3 && y0 > hautLibre - 3 && y1 < basLibre + 3,
                     cadre: [Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1)] };
        }));
    }
    const perdues = dedansTel.filter(x => !x.ok);
    ck('la visite se joue ENTIÈREMENT dans les 390 px du téléphone',
       perdues.length === 0,
       perdues.length ? perdues.map(x => x.titre + ' ' + JSON.stringify(x.cadre)).join(' | ')
                      : 'zoom ' + dedansTel[0].zoom + ', quatre étapes vérifiées');
    /* La barre vit en bas, là où le téléphone range ses outils : elle doit
       s'écarter quand la visite désigne l'un d'eux. */
    const ecart = await tel.evaluate(async () => {
        const a = window.app;
        a.demoVersEtape('0');
        await new Promise(k => setTimeout(k, 1800));
        const barre = document.getElementById('demoBar');
        const el = document.querySelector('.tool-btn[onclick="app.setTool(\'point\')"]');
        const r = el.getBoundingClientRect(), rb = barre.getBoundingClientRect();
        return { chevauche: !(r.bottom < rb.top || r.top > rb.bottom),
                 enHaut: barre.classList.contains('en-haut') };
    });
    ck('  et la barre s\'écarte des icônes qu\'elle désigne',
       !ecart.chevauche, JSON.stringify(ecart));
    await tel.evaluate(() => window.app.demoArreter());
    ck('  aucune erreur JS sur téléphone', errTel.length === 0, errTel.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
