/* LA ROSACE, ET LE « ? » QUI N'EXISTAIT PAS.
 *
 * Deux défauts signalés le même jour, sur la même capture d'écran :
 *
 *   « trace une rosace » → « Je n'ai pas compris. Le « ? » de la barre donne
 *   la liste de ce que je sais faire. »
 *
 * D'une part la rosace EXISTAIT — au bout d'un outil pris dans une grille de
 * figures — mais aucune phrase ne la déclenchait. D'autre part la barre où ce
 * refus s'affichait ne contenait AUCUN « ? » : la réponse envoyait l'élève
 * chercher un bouton qui n'était pas là.
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
  const b = await chromium.launch({ executablePath: process.env.GM_CHROME });
  const page = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE);
  await page.waitForFunction(() => window.app);

  console.log('\n=== « trace une rosace » trace une rosace ===');
  const jeux = await page.evaluate(() => {
    const app = window.app;
    const un = (ph, outils) => {
      app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
      let r; try { r = app.executerConsigneAvec(ph, !!outils); }
      catch (e) { r = { ok: false, message: 'EXCEPTION ' + e.message }; }
      const cercles = app.entities.filter(e => e instanceof Circle);
      const arcs = app.entities.filter(e => e instanceof Arc);
      const c = cercles[0];
      const R = c ? Math.hypot(c.p2.x - c.p1.x, c.p2.y - c.p1.y) : 0;
      /* Les centres des pétales sont-ils SUR le cercle, et en dépendent-ils ? */
      const dessus = arcs.every(a => Math.abs(
        Math.hypot(a.center.x - c.p1.x, a.center.y - c.p1.y) - R) < 0.5);
      const lies = arcs.every(a => a.center.parents && a.center.parents.length === 1);
      /* Même rayon partout : c'est ce qui fait que les pétales se referment. */
      const memeRayon = arcs.every(a => Math.abs(a.radius - R) < 0.5);
      return { ok: !!(r && r.ok), msg: (r && r.message) || '', astuce: (r && r.astuce) || '',
               arcs: arcs.length, cercles: cercles.length, dessus, lies, memeRayon,
               rayon: Math.round(R / 50 * 10) / 10,
               anim: app.entities.filter(e => e instanceof ToolAnimation).length };
    };
    return {
      simple: un('trace une rosace'),
      mesure: un('Trace une rosace de 4 cm'),
      huit: un('Trace une rosace à 8 pétales'),
      graine: un('Trace une graine de vie'),
      outils: un('trace une rosace', true),
    };
  });
  ck('« trace une rosace » est comprise', jeux.simple.ok, jeux.simple.msg);
  ck('  un cercle et SIX pétales',
     jeux.simple.cercles === 1 && jeux.simple.arcs === 6,
     jeux.simple.cercles + ' cercle, ' + jeux.simple.arcs + ' arcs');
  /* La leçon de la veille : un point posé sur un objet doit en DÉPENDRE, pas
     seulement tomber au bon endroit. */
  ck('  les centres des pétales sont SUR le cercle, et en dépendent',
     jeux.simple.dessus && jeux.simple.lies,
     'sur le cercle : ' + jeux.simple.dessus + ', liés : ' + jeux.simple.lies);
  ck('  tous les pétales ont le rayon du cercle', jeux.simple.memeRayon);
  ck('  et la bulle dit POURQUOI on ne mesure rien',
     /sixième report/.test(jeux.simple.astuce), jeux.simple.astuce.slice(0, 80));
  ck('le rayon se donne : « de 4 cm »', jeux.mesure.ok && jeux.mesure.rayon === 4,
     jeux.mesure.rayon + ' cm');
  ck('le nombre de pétales aussi : « à 8 pétales »',
     jeux.huit.ok && jeux.huit.arcs === 8, jeux.huit.arcs + ' pétales');
  ck('  et l\'on prévient que 8 ne se construit pas au compas seul',
     /ne retombent plus/.test(jeux.huit.astuce), jeux.huit.astuce.slice(0, 70));
  ck('« graine de vie » est le même motif, et le dit',
     jeux.graine.ok && jeux.graine.arcs === 6 && /graine de vie/i.test(jeux.graine.astuce),
     jeux.graine.astuce.slice(0, 70));
  ck('aux instruments, le compas fait le tour',
     jeux.outils.ok && jeux.outils.anim > 10, jeux.outils.anim + ' gestes d\'outil');
  ck('  et sans les instruments, aucun', jeux.simple.anim === 0,
     jeux.simple.anim + ' gestes');

  console.log('\n=== l\'énoncé relu la reconnaît COMME une rosace ===');
  /* Décrite arc par arc, elle donnait sept fois « Trace un arc de cercle de
     centre ? et de rayon 3 cm » : les centres des pétales n'ont pas de nom, et
     surtout la phrase ne disait pas où l'arc commence. */
  const relu = await page.evaluate(() => {
    const app = window.app;
    const mesurer = () => {
      const c = app.entities.find(e => e instanceof Circle);
      return { rayon: c ? Math.round(Math.hypot(c.p2.x - c.p1.x, c.p2.y - c.p1.y) / 50 * 10) / 10 : null,
               petales: app.entities.filter(e => e instanceof Arc).length,
               centre: c ? c.p1.label : null };
    };
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace une rosace de 4 cm', false);
    const avant = mesurer();
    const sans = app.programmeDeConstruction(false) || [];
    const avec = app.programmeDeConstruction(true) || [];
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    const refus = [];
    sans.forEach((l) => {
      const r = app.executerConsigneAvec(l, false);
      if (!r || !r.ok) refus.push(l + ' → ' + ((r && r.message) || 'rien'));
    });
    return { avant, sans, avec, apres: mesurer(), refus };
  });
  relu.sans.forEach((l, i) => console.log('  ' + (i + 1) + '. ' + l));
  ck('une phrase, pas sept arcs sans rapport', relu.sans.length === 2,
     relu.sans.length + ' lignes');
  ck('  et elle dit « rosace », avec ses pétales et son rayon',
     /rosace à 6 pétales, de centre A et de rayon 4 cm/.test(relu.sans[1] || ''),
     relu.sans[1]);
  ck('  plus un seul « de centre ? »', !/centre \?/.test(relu.sans.join(' ')),
     relu.sans.join(' | '));
  ck('REJOUÉE, elle redonne la même rosace', relu.refus.length === 0
     && JSON.stringify(relu.avant) === JSON.stringify(relu.apres),
     JSON.stringify(relu.avant) + ' → ' + JSON.stringify(relu.apres)
     + (relu.refus.length ? ' — refusé : ' + relu.refus.join(' | ') : ''));
  ck('aux instruments, c\'est le report du compas, et il dit pourquoi',
     relu.avec.some(l => /SANS CHANGER L'ÉCARTEMENT/.test(l))
     && relu.avec.some(l => /sixième report/.test(l)), relu.avec.join(' | '));

  console.log('\n=== au rejeu, le compas TOURNE et il DESSINE ===');
  /* « pour le cercle, le compas ne bouge pas ; pour les arcs à l'intérieur, il
     ne dessine rien, on voit que la fin de l'arc. »
     Deux causes, l'une et l'autre nées du choix de faire la rosace en VRAIES
     figures plutôt qu'en traces de compas :
       — le tracé progressif n'était affiché que devant un CompassArc ;
       — et le cercle était posé AVANT son animation, alors que le rejeu regarde
         l'objet qui SUIT.
     Mesuré sur la version précédente : 0 image où le compas dessine, et une
     amplitude de 239° pour six pétales et un tour complet. */
  const rejeu = await page.evaluate(async () => {
    const app = window.app;
    const suivi = [];
    const vraiRender = app.render.bind(app);
    app.render = function () {
      vraiRender();
      const w = app.compassWidget;
      if (app.isToolAnimating) {
        suivi.push({ angle: w ? Math.round(w.angle * 180 / Math.PI) : null,
                     dessine: !!app.ArcTracing });
      }
    };
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace une rosace de 3 cm', true);
    /* Chaque animation de tracé doit être suivie de la figure qu'elle trace :
       c'est là que le rejeu va chercher quoi dessiner. */
    const mal = [];
    app.entities.forEach((e, i) => {
      if (!(e instanceof ToolAnimation) || e.originalType !== 'trace') return;
      const suivant = app.entities[i + 1];
      if (!(suivant instanceof Arc || suivant instanceof Circle
            || suivant instanceof CompassArc)) {
        mal.push(suivant ? suivant.constructor.name : '(rien)');
      }
    });
    app.replayIndex = 0; app.fastForward(0);
    app.playStepLoop(0, app.entities.length);
    await new Promise(r => setTimeout(r, 9000));
    app.render = vraiRender;
    const angles = [...new Set(suivi.map(x => x.angle))];
    return { images: suivi.length, mal,
             dessinantes: suivi.filter(x => x.dessine).length,
             anglesDistincts: angles.length,
             amplitude: angles.length ? Math.max(...angles) - Math.min(...angles) : 0 };
  });
  ck('chaque tracé est suivi de la figure qu\'il trace', rejeu.mal.length === 0,
     rejeu.mal.length ? 'suivi de : ' + rejeu.mal.join(', ') : 'les 7');
  ck('LE COMPAS DESSINE pendant qu\'il tourne', rejeu.dessinantes > 40,
     rejeu.dessinantes + ' images sur ' + rejeu.images + ' (0 avant)');
  /* Un tour complet plus six pétales de 120° : l'aiguille en voit largement
     plus que les 239° d'avant, où seuls les DÉPLACEMENTS la faisaient tourner. */
  ck('  et il tourne vraiment : plus d\'un tour d\'amplitude',
     rejeu.amplitude > 360 && rejeu.anglesDistincts > 90,
     rejeu.amplitude + '° sur ' + rejeu.anglesDistincts + ' angles distincts');

  console.log('\n=== le « ? » que le refus promettait ===');
  const bouton = await page.evaluate(() => {
    const app = window.app;
    app.ouvrirConsigneEclair();
    const bt = document.getElementById('ceAideBtn');
    const rect = bt ? bt.getBoundingClientRect() : null;
    return { existe: !!bt, texte: bt ? bt.textContent.trim() : null,
             largeur: rect ? Math.round(rect.width) : 0,
             hauteur: rect ? Math.round(rect.height) : 0 };
  });
  ck('la barre éclair a bien un « ? »',
     bouton.existe && bouton.texte === '?', JSON.stringify(bouton));
  /* Au doigt comme à la souris, une commande se vise. */
  ck('  et il se vise : au moins 32 px', bouton.hauteur >= 32,
     bouton.largeur + '×' + bouton.hauteur + ' px');
  const clic = await page.evaluate(() => {
    document.getElementById('ceAideBtn').click();
    return { eclairFerme: !document.getElementById('consigneEclair').classList.contains('ouvert'),
             panneau: document.getElementById('instructionBox').style.display,
             aide: document.getElementById('consigneAide').style.display,
             exemples: document.querySelectorAll('#consigneAide a').length,
             rosaceDansLaListe: [...document.querySelectorAll('#consigneAide a')]
               .some(a => /rosace/i.test(a.textContent)),
             onglet: (document.querySelector('.enonce-onglets .actif') || {}).textContent };
  });
  ck('il ouvre vraiment la liste de ce que le logiciel sait faire',
     clic.eclairFerme && clic.panneau === 'flex' && clic.aide === 'block'
     && clic.exemples > 40, JSON.stringify(clic));
  ck('  sur l\'onglet « Consignes »', clic.onglet === 'Consignes', clic.onglet);
  ck('  et la rosace y figure', clic.rosaceDansLaListe);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
