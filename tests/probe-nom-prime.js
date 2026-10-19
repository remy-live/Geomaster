// LE NOM DEMANDÉ EST-IL LE NOM POSÉ ?
//
// Un logiciel de construction qui baptise un point autrement qu'on le lui a
// demandé, SANS LE DIRE, fabrique des énoncés qui mentent : la ligne suivante
// parlera d'un point qui n'existe pas, et l'on cherchera la faute trois lignes
// plus bas, loin de la cause.
//
// Le défaut trouvé : « Place les milieux A' de [IJ], B' de [IK]… » posait A et
// B. Le message disait « Milieux : A, B » — donc la vérité sur ce qu'il avait
// FAIT, mais jamais qu'il avait IGNORÉ les noms demandés. Au singulier,
// « Place le milieu M' de [AB] », le nom était tenu : seul le pluriel mentait.
// La cause tenait en une frontière de mot : /\b[A-Z]'{0,2}\b/ exige une
// frontière APRÈS l'apostrophe, or ni ' ni l'espace ne sont des caractères de
// mot — il n'y en a donc jamais, et A' ne pouvait matcher que A.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

// prépa, phrase, noms attendus
const CAS = [
  ['Place les points A et B tels que AB = 6 cm',
   "Place le milieu M' de [AB]", ["M'"], 'un milieu primé, au singulier'],
  ['Place les points A, B et C tels que AB = 6 cm, AC = 5 cm et BC = 4 cm',
   "Place les milieux P' de [AB] et Q' de [AC]", ["P'", "Q'"],
   'DEUX milieux primés : c’est ici que l’apostrophe se perdait'],
  ['Place les points A, B et C tels que AB = 6 cm, AC = 5 cm et BC = 4 cm',
   "Place les milieux I de [AB] et J de [AC]", ['I', 'J'],
   'deux milieux sans apostrophe : la forme courante ne doit pas casser'],
  ['Place les points A, B et C tels que AB = 6 cm, AC = 5 cm et BC = 4 cm',
   "Placer E le milieu de [AB], F le milieu de [AC]", ['E', 'F'],
   'la forme « E le milieu de », celle des énoncés réels'],
  ['Place les points A, B, C et D tels que AB = 6 cm, AC = 5 cm, AD = 4 cm et BC = 4 cm',
   "Place les milieux A' de [AB], B' de [AC] et C' de [AD]", ["A'", "B'", "C'"],
   'trois milieux primés, dont A’ homonyme d’un point existant'],
  ['Place les points A et B tels que AB = 6 cm',
   "Place un point C' sur [AB] tel que AC' = 2 cm", ["C'"], 'un point primé posé sur un segment'],
];

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  const page = await (await b.newContext({ viewport: { width: 1200, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE);
  await page.waitForFunction(() => window.app);
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

  const r = await page.evaluate((CAS) => {
    const app = window.app;
    try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
    const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
    app.checkAutoSave = () => {};
    const noms = () => app.entities.filter(e => e.constructor.name === 'Point')
      .map(e => e.label || e.name || '?');
    const out = [];
    for (const [prep, phrase, veut, quoi] of CAS) {
      app.entities = []; if (app.cslOublier) app.cslOublier();
      try { app.executerConsigneAvec(prep, false); } catch (e) { void e; }
      const avant = noms();
      let x; try { x = app.executerConsigneAvec(phrase, false); }
      catch (e) { out.push({ phrase, veut, quoi, boum: e.message }); continue; }
      const reste = avant.slice();
      const neufs = noms().filter(n => {
        const i = reste.indexOf(n);
        if (i >= 0) { reste.splice(i, 1); return false; }
        return true;
      });
      out.push({ phrase, veut, quoi, ok: !!(x && x.ok),
                 msg: ((x && (x.message || x.erreur)) || '').slice(0, 80), neufs });
    }
    return out;
  }, CAS);

  console.log('\n=== LE NOM DEMANDÉ EST-IL LE NOM POSÉ ? ===');
  r.forEach(o => {
    if (o.boum) { ck(o.quoi, false, 'BOUM ' + o.boum.slice(0, 70)); return; }
    const tenus = o.veut.every(v => o.neufs.includes(v));
    ck(o.quoi, tenus, tenus ? `posé : ${o.neufs.join(', ')}`
       : `demandé ${o.veut.join(', ')} — POSÉ ${o.neufs.join(', ') || '(rien)'} ; le logiciel répond « ${o.msg} »`);
  });

  // ET LA PHRASE SUIVANTE DOIT POUVOIR S'EN SERVIR. C'est là que le défaut se
  // voyait vraiment : trois lignes plus bas, sur un « Je ne connais pas H' ».
  console.log('\n=== ET LA LIGNE SUIVANTE RETROUVE CES POINTS ===');
  const suite = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; if (app.cslOublier) app.cslOublier();
    const lignes = [
      'Trace un octogone régulier ABCDEFGH inscrit dans un cercle de rayon 7 cm',
      'Trace [IA], [IB], [IC], [ID], [IE], [IF], [IG] et [IH]',
      "Place les milieux J de [IA], K de [IB], L de [IC], M de [ID], N de [IE], P de [IF], Q de [IG] et R de [IH]",
      "Place les milieux A' de [IJ], B' de [IK], C' de [IL], D' de [IM], E' de [IN], F' de [IP], G' de [IQ] et H' de [IR]",
      "Trace la ligne polygonale A'B'C'D'E'F'G'H'A'",
    ];
    const j = [];
    for (const p of lignes) {
      const n0 = app.entities.length;
      let x; try { x = app.executerConsigneAvec(p, false); }
      catch (e) { j.push({ ok: false, nes: 0, msg: 'BOUM ' + e.message }); continue; }
      j.push({ ok: !!(x && x.ok), nes: app.entities.length - n0,
               msg: ((x && (x.message || x.erreur)) || '').slice(0, 80) });
    }
    return j;
  });
  ck('les huit milieux primés sont posés', suite[3] && suite[3].ok && suite[3].nes === 8,
     suite[3] ? `${suite[3].nes} objets — « ${suite[3].msg} »` : 'rien');
  ck("la ligne polygonale A'B'…H'A' les retrouve",
     suite[4] && suite[4].ok && suite[4].nes >= 8,
     suite[4] ? `${suite[4].nes} objets — « ${suite[4].msg} »` : 'rien');

  if (errs.length) ck('aucune erreur JS', false, errs[0].slice(0, 90));
  await b.close();
  console.log(fail ? `\n${fail} échec(s)` : '\nTout passe.');
  process.exit(fail ? 1 : 0);
})();
