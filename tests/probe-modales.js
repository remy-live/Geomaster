// Le patron des modales. Le voile, la boîte et les boutons étaient déjà
// communs ; la largeur, la couleur du titre et le paragraphe d'attaque, non —
// chaque fenêtre les choisissait dans son propre style=. Cette sonde garde le
// patron : elle vérifie que les treize fenêtres le suivent, et qu'aucune ne
// recommence à décider dans son coin.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  console.log('\n=== les treize fenêtres suivent le même patron ===');
  const etat = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.modal-overlay[id]').forEach(m => {
      const box = m.querySelector('.modal-box');
      if (!box) return;
      const h3 = box.querySelector(':scope > h3, :scope > .modal-text > h3, :scope > div > h3');
      out.push({
        id: m.id,
        boxStyle: (box.getAttribute('style') || '').trim(),
        titreStyle: h3 ? (h3.getAttribute('style') || '').trim() : '',
        titreClasse: h3 ? h3.className : '(pas de titre)',
      });
    });
    return out;
  });
  console.log('  ' + etat.map(e => e.id).join(', '));
  ck('aucune boîte ne fixe sa largeur dans un style en ligne',
     etat.every(e => !/width/.test(e.boxStyle)),
     etat.filter(e => /width/.test(e.boxStyle)).map(e => `${e.id} : ${e.boxStyle}`).join(' | '));
  ck('aucun titre ne fixe sa couleur ni sa marge dans un style en ligne',
     etat.every(e => !/color|margin/.test(e.titreStyle)),
     etat.filter(e => /color|margin/.test(e.titreStyle)).map(e => `${e.id} : ${e.titreStyle}`).join(' | '));
  const titres = etat.filter(e => e.titreClasse !== '(pas de titre)');
  ck('les titres portent tous la classe du patron, sans exception',
     titres.every(e => /modal-titre/.test(e.titreClasse)),
     titres.filter(e => !/modal-titre/.test(e.titreClasse)).map(e => `${e.id} : ${e.titreClasse}`).join(' | '));

  console.log('\n=== et le patron dit bien ce qu\'il doit dire ===');
  const regles = await page.evaluate(() => {
    const d = document.createElement('div');
    d.className = 'modal-box';
    const h = document.createElement('h3');
    h.className = 'modal-titre';
    d.appendChild(h); document.body.appendChild(d);
    const bleu = getComputedStyle(h).color, marge = getComputedStyle(h).marginTop;
    h.className = 'modal-titre rouge'; const rouge = getComputedStyle(h).color;
    h.className = 'modal-titre violet'; const violet = getComputedStyle(h).color;
    const p = document.createElement('p'); p.className = 'modal-intro';
    d.appendChild(p);
    const cp = getComputedStyle(p);
    const r = { bleu, rouge, violet, marge,
                intro: [cp.fontSize, cp.color, cp.textAlign].join(' ') };
    d.remove();
    return r;
  });
  console.log('  ' + JSON.stringify(regles));
  ck('le titre est collé en haut de la boîte', regles.marge === '0px', regles.marge);
  ck('les trois couleurs de titre sont distinctes',
     new Set([regles.bleu, regles.rouge, regles.violet]).size === 3,
     [regles.bleu, regles.rouge, regles.violet].join(' / '));
  ck('le paragraphe d\'attaque est petit, gris et aligné à gauche',
     /13px/.test(regles.intro) && /left/.test(regles.intro), regles.intro);

  console.log('\n=== chaque fenêtre garde la largeur qu\'elle avait ===');
  /* Les largeurs sont sorties du HTML pour la feuille de style : elles doivent
     valoir exactement ce qu'elles valaient, sinon le rangement a coûté un
     changement invisible à la relecture mais bien réel à l'écran. */
  const attendu = { helpModal: 850, pagesModal: 720, recordPreviewModal: 700, biblioModal: 640,
                    pdfSelectorModal: 500, codeModal: 460, qrModal: 420, donateModal: 420 };
  const mesure = await page.evaluate((att) => {
    const out = {};
    for (const id of Object.keys(att)) {
      const m = document.getElementById(id);
      if (!m) { out[id] = null; continue; }
      m.style.display = 'flex';
      out[id] = Math.round(parseFloat(getComputedStyle(m.querySelector('.modal-box')).width));
      m.style.display = 'none';
    }
    return out;
  }, attendu);
  console.log('  ' + JSON.stringify(mesure));
  for (const [id, w] of Object.entries(attendu)) {
    ck(`  ${id} fait ${w} px`, mesure[id] === w, String(mesure[id]));
  }

  console.log('\n=== une modale ne dépasse jamais de l\'écran ===');
  /* Le min-width de 300 px l'emporte toujours sur un max-width : c'est ce qui la
     faisait déborder des petits téléphones, et la règle qui lève ce plancher
     sous 700 px doit rester. */
  for (const L of [1400, 700, 360, 320]) {
    await page.setViewportSize({ width: L, height: 800 });
    await page.waitForTimeout(150);
    const trop = await page.evaluate(() => {
      const mauvaises = [];
      document.querySelectorAll('.modal-overlay[id]').forEach(m => {
        m.style.display = 'flex';
        const b = m.querySelector('.modal-box').getBoundingClientRect();
        if (b.width > innerWidth + 1 || b.left < -1 || b.right > innerWidth + 1)
          mauvaises.push(`${m.id} ${Math.round(b.width)}`);
        m.style.display = 'none';
      });
      return mauvaises;
    });
    ck(`à ${L} px de large, aucune ne déborde`, trop.length === 0, trop.join(' | '));
  }
  await page.setViewportSize({ width: 1400, height: 1000 });

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
