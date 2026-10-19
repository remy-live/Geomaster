// LA DATE DE PÂQUES SE CALCULE — et le calcul doit être prouvé, pas cru.
//
// Pâques est le dimanche qui suit la première pleine lune après l'équinoxe de
// printemps. D'une année à l'autre l'écart atteint cinq semaines : le 28 mars
// en 2027, le 16 avril en 2028. Une table figée ferait donc paraître le décor
// au mauvais moment une année sur deux, et personne ne s'en apercevrait avant
// le jour même.
//
// La sonde ne se contente PAS de comparer à une liste de dates : une liste
// recopiée de mémoire peut être fausse, et l'on aurait alors deux erreurs qui
// se valident l'une l'autre. Elle vérifie d'abord DEUX THÉORÈMES, qui ne
// dépendent d'aucune mémoire et valent pour toute année :
//   — Pâques est TOUJOURS un dimanche ;
//   — Pâques tombe TOUJOURS entre le 22 mars et le 25 avril.
// Les dates connues ne viennent qu'ensuite, en confirmation.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

// Dimanches de Pâques du calendrier grégorien, pour confirmation.
const CONNUES = {
  2020: '04-12', 2021: '04-04', 2022: '04-17', 2023: '04-09', 2024: '03-31',
  2025: '04-20', 2026: '04-05', 2027: '03-28', 2028: '04-16', 2029: '04-01',
  2030: '04-21', 2031: '04-13', 2032: '03-28', 2033: '04-17', 2034: '04-09',
  2035: '03-25',
};

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  const page = await (await b.newContext({ viewport: { width: 1100, height: 800 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE);
  await page.waitForFunction(() => window.app);
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

  console.log('\n=== LES DEUX THÉORÈMES, SUR CINQ SIÈCLES ===');
  const th = await page.evaluate(() => {
    const out = { pasDimanche: [], horsFenetre: [], n: 0 };
    for (let y = 1700; y <= 2200; y++) {
      const d = window.GM_PAQUES(y);
      out.n++;
      if (d.getDay() !== 0) out.pasDimanche.push(y + ' → ' + d.toDateString());
      const m = d.getMonth() + 1, j = d.getDate();
      const tot = m * 100 + j;
      if (tot < 322 || tot > 425) out.horsFenetre.push(y + ' → ' + m + '-' + j);
    }
    return out;
  });
  ck(`Pâques est toujours un dimanche (${th.n} années)`, th.pasDimanche.length === 0,
     th.pasDimanche.slice(0, 3).join(' ; '));
  ck('Pâques tombe toujours entre le 22 mars et le 25 avril',
     th.horsFenetre.length === 0, th.horsFenetre.slice(0, 3).join(' ; '));

  console.log('\n=== ET LES DATES CONNUES LE CONFIRMENT ===');
  const r = await page.evaluate((CONNUES) => {
    const o = [];
    for (const y of Object.keys(CONNUES)) {
      const d = window.GM_PAQUES(+y);
      o.push({ y, attendu: CONNUES[y],
               obtenu: String(d.getMonth() + 1).padStart(2, '0') + '-'
                     + String(d.getDate()).padStart(2, '0') });
    }
    return o;
  }, CONNUES);
  const faux = r.filter(x => x.attendu !== x.obtenu);
  ck(`les ${r.length} dimanches de Pâques connus tombent juste`, faux.length === 0,
     faux.map(x => `${x.y} : attendu ${x.attendu}, obtenu ${x.obtenu}`).join(' ; '));
  console.log('     ' + r.map(x => x.y + ' ' + x.obtenu).join('  '));

  console.log('\n=== LA FENÊTRE DU DÉCOR SUIT LA FÊTE ===');
  const f = await page.evaluate(() => {
    const t = (window.GM_DECORS || []).find(x => x.mobile);
    if (!t) return null;
    const app = window.app;
    const o = [];
    for (const y of [2026, 2027, 2028, 2029]) {
      const p = window.GM_PAQUES(y);
      const b = app.decorBornes(t, new Date(y, 5, 1));
      o.push({ y, paques: String(p.getMonth() + 1).padStart(2, '0') + '-'
                         + String(p.getDate()).padStart(2, '0'), du: b.du, au: b.au });
    }
    return { cle: t.cle, avant: t.avant, apres: t.apres, o };
  });
  if (!f) {
    console.log('  (aucune fête mobile dans la table pour l\'instant — rien à vérifier ici)');
  } else {
    f.o.forEach(x => console.log(`     ${x.y} : Pâques le ${x.paques}, décor du ${x.du} au ${x.au}`));
    // LA FENÊTRE DOIT BOUGER AVEC LA FÊTE, et contenir le jour même.
    const bougent = new Set(f.o.map(x => x.du)).size > 1;
    ck('la fenêtre change d\'une année à l\'autre', bougent,
       bougent ? '' : 'elle est figée — le comput ne sert à rien');
    const contient = f.o.every(x => x.du <= x.paques && x.paques <= x.au);
    ck('la fenêtre contient le dimanche de Pâques', contient);
    // ET LE DÉCOR DOIT PARAÎTRE CE JOUR-LÀ, ET PAS L'ANNÉE SUIVANTE AU MÊME
    // QUANTIÈME : c'est tout l'intérêt, et c'est ce qu'une table figée ratait.
    const essai = await page.evaluate(({ cle, o }) => {
      const app = window.app;
      const voir = (y, mmjj) => {
        const [m, j] = mmjj.split('-').map(Number);
        const t = app.decorDuJour(new Date(y, m - 1, j));
        return t ? t.cle : null;
      };
      const a = o[1], b = o[2];       // 2027 puis 2028
      return { leJour: voir(a.y, a.paques),
               memeQuantiemeAnneeSuivante: voir(b.y, a.paques),
               paquesSuivant: voir(b.y, b.paques) };
    }, f);
    ck('le décor paraît le dimanche de Pâques 2027', essai.leJour === f.cle, String(essai.leJour));
    ck('il paraît aussi le dimanche de Pâques 2028', essai.paquesSuivant === f.cle,
       String(essai.paquesSuivant));
    ck('mais PAS le 28 mars 2028, qui n\'est plus Pâques',
       essai.memeQuantiemeAnneeSuivante !== f.cle,
       essai.memeQuantiemeAnneeSuivante === f.cle
         ? 'la fenêtre est restée collée au quantième — c\'est le défaut qu\'on voulait éviter'
         : 'rien ce jour-là');
  }

  if (errs.length) ck('aucune erreur JS', false, errs[0].slice(0, 90));
  await b.close();
  console.log(fail ? `\n${fail} échec(s)` : '\nTout passe.');
  process.exit(fail ? 1 : 0);
})();
