// Le don. Une fenêtre qui demande de l'argent est la chose la plus facile à mal
// faire : trop tôt elle mendie, trop souvent elle harcèle, et elle n'a AUCUN
// moyen de savoir qui a déjà donné — pas de serveur, pas de compte, et PayPal ne
// dit rien au logiciel. Cette sonde garde les trois promesses faites à
// l'utilisateur : on ne demande qu'après avoir servi, jamais deux fois dans la
// même séance, et « j'ai déjà donné » est cru sur parole, pour de bon.
const { chromium, devices } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const errs = [];

  /* Un contexte = un navigateur neuf, mémoire locale vide. On garde le MÊME
     contexte pour enchaîner les ouvertures : c'est ce qui fait un utilisateur
     qui revient, et c'est exactement ce que le compteur doit mesurer. */
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));

  const ouvrir = async (suffixe) => {
    await p.goto(PAGE + (suffixe || ''));
    await p.waitForTimeout(1200);
  };
  const memoire = () => p.evaluate(() => ({
    ouvertures: +(localStorage.getItem('gm_ouvertures') || 0),
    etat: localStorage.getItem('gm_don_etat') || '',
    prochain: +(localStorage.getItem('gm_don_prochain') || 0),
    reports: +(localStorage.getItem('gm_don_reports') || 0),
  }));
  const fenetreOuverte = () => p.evaluate(() =>
    getComputedStyle(document.getElementById('donateModal')).display !== 'none');
  /* Le moment de valeur : un lien d'élève copié. Le geste vient d'aboutir. */
  const momentDeValeur = async () => {
    await p.evaluate(() => window.app.shareCurrentView());
    await p.waitForTimeout(1600);
  };

  console.log('\n=== on compte les fois où le logiciel a servi ===');
  await ouvrir();
  let m = await memoire();
  ck('une ouverture compte pour une', m.ouvertures === 1, JSON.stringify(m));
  await ouvrir();
  m = await memoire();
  ck('et la suivante pour deux', m.ouvertures === 2, JSON.stringify(m));
  ck('rien n\'est décidé d\'avance sur le don', m.etat === '' && m.reports === 0, JSON.stringify(m));

  console.log('\n=== les premières fois, on ne demande rien ===');
  /* Deux ouvertures : le logiciel n'a encore rien prouvé. Même après un vrai
     service rendu, la question ne se pose pas. */
  await momentDeValeur();
  ck('après deux ouvertures, un lien copié ne déclenche rien', !(await fenetreOuverte()));

  console.log('\n=== après dix, et seulement à un moment de valeur ===');
  await p.evaluate(() => localStorage.setItem('gm_ouvertures', '12'));
  await ouvrir();
  ck('au démarrage, la fenêtre ne s\'ouvre pas', !(await fenetreOuverte()));
  ck('  le compteur a bien avancé', (await memoire()).ouvertures === 13);
  await momentDeValeur();
  ck('mais un lien copié, oui : le geste vient d\'aboutir', await fenetreOuverte());

  console.log('\n=== jamais deux fois dans la même séance ===');
  /* On referme à la croix — donc sans répondre — et on refait un geste utile.
     Redemander dans la minute serait du harcèlement. */
  await p.evaluate(() => closeDonateModal());
  await momentDeValeur();
  ck('refermée sans répondre, elle ne revient pas de la séance', !(await fenetreOuverte()));

  console.log('\n=== « Plus tard » recule, puis vaut non ===');
  await ouvrir();
  await momentDeValeur();
  ck('à la séance suivante, elle revient', await fenetreOuverte());
  const avant = (await memoire()).ouvertures;
  await p.click('#donateModal .modal-buttons button:nth-of-type(1)');
  await p.waitForTimeout(200);
  m = await memoire();
  ck('elle se ferme', !(await fenetreOuverte()));
  ck('  et repousse la question de vingt ouvertures',
     m.reports === 1 && m.prochain === avant + 20, JSON.stringify({ avant, ...m }));
  await ouvrir();
  await momentDeValeur();
  ck('la fois d\'après, silence', !(await fenetreOuverte()));
  /* Vingt ouvertures plus tard, on a le droit de redemander UNE fois. */
  await p.evaluate(() => localStorage.setItem('gm_ouvertures',
    String(+localStorage.getItem('gm_don_prochain'))));
  await ouvrir();
  await momentDeValeur();
  ck('vingt ouvertures plus tard, une seconde fois', await fenetreOuverte());
  await p.click('#donateModal .modal-buttons button:nth-of-type(1)');
  await p.waitForTimeout(200);
  m = await memoire();
  ck('  « plus tard » deux fois, c\'est un non : on ne redemande plus',
     m.etat === 'refuse', JSON.stringify(m));
  await p.evaluate(() => localStorage.setItem('gm_ouvertures', '900'));
  await ouvrir();
  await momentDeValeur();
  ck('même neuf cents ouvertures plus tard', !(await fenetreOuverte()));

  console.log('\n=== « J\'ai déjà donné » est cru sur parole ===');
  /* LE POINT DE CONCEPTION. Le logiciel ne peut PAS vérifier : pas de serveur,
     pas de compte, PayPal ne lui dit rien. Demander une preuve serait mentir sur
     ce qu'on sait faire ; la seule réponse honnête est de croire, tout de suite
     et définitivement. */
  await p.evaluate(() => { localStorage.removeItem('gm_don_etat');
    localStorage.removeItem('gm_don_reports'); localStorage.removeItem('gm_don_prochain');
    localStorage.setItem('gm_ouvertures', '30'); });
  await ouvrir();
  await momentDeValeur();
  ck('la fenêtre est là', await fenetreOuverte());
  const dit = await p.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#donateModal .modal-buttons button, #donateModal .modal-buttons a'))
      .map(e => e.textContent.trim());
    return { boutons: b, petit: document.getElementById('donateModal').innerText.replace(/\s+/g, ' ') };
  });
  ck('  elle offre de dire qu\'on a déjà donné',
     dit.boutons.some(t => /déjà donné/i.test(t)), JSON.stringify(dit.boutons));
  ck('  et dit sans détour ce que ce bouton fait',
     /pour de bon/i.test(dit.petit), JSON.stringify(dit.petit.slice(0, 60)));
  await p.click('#donateModal .modal-buttons button:nth-of-type(2)');
  await p.waitForTimeout(200);
  m = await memoire();
  ck('aucune preuve n\'est demandée : la fenêtre se ferme',
     !(await fenetreOuverte()) && m.etat === 'fait', JSON.stringify(m));
  await p.evaluate(() => localStorage.setItem('gm_ouvertures', '500'));
  await ouvrir();
  await momentDeValeur();
  ck('et elle ne revient JAMAIS', !(await fenetreOuverte()), JSON.stringify(await memoire()));
  /* Mais le cœur reste : on peut vouloir redonner. */
  await p.click('#donateBtn, .top-btn[onclick*="openDonateModal"]');
  await p.waitForTimeout(300);
  ck('le cœur de la barre l\'ouvre quand même, pour qui veut redonner',
     await fenetreOuverte());

  console.log('\n=== partir vers PayPal vaut « j\'ai donné » ===');
  await p.evaluate(() => { localStorage.removeItem('gm_don_etat');
    localStorage.setItem('gm_ouvertures', '30'); });
  const lien = await p.evaluate(() => {
    const a = document.querySelector('#donateModal .modal-buttons a');
    return { href: a.getAttribute('href'), cible: a.getAttribute('target') };
  });
  ck('le bouton du don pointe bien vers PayPal',
     /paypal\.com\/donate/.test(lien.href) && lien.cible === '_blank', JSON.stringify(lien));
  await p.evaluate(() => window.app.donDejaFait(true));
  ck('  et l\'emprunter suffit : on ne redemandera pas',
     (await memoire()).etat === 'fait');

  console.log('\n=== la porte de sortie pour qui ne peut pas donner ===');
  /* Pour ce public, un collègue vaut un don — et ça ne coûte rien à celui qui
     n'a pas les moyens. Le bouton doit dire lui-même que c'est fait : un toast
     se perdrait derrière la fenêtre. */
  await p.evaluate(() => openDonateModal());
  await p.waitForTimeout(200);
  const partage = await p.evaluate(() => {
    const d = document.getElementById('donPartage');
    if (!d) return null;
    const r = d.getBoundingClientRect();
    return { texte: d.innerText.replace(/\s+/g, ' ').trim(), visible: r.width > 0 && r.height > 0 };
  });
  ck('elle propose d\'en parler à un collègue',
     partage && partage.visible && /coll[èe]gue/i.test(partage.texte), JSON.stringify(partage));
  await p.click('#donPartage button');
  await p.waitForTimeout(300);
  const copie = await p.evaluate(async () => ({
    dit: document.querySelector('#donPartage button').textContent.trim(),
    presse: await navigator.clipboard.readText().catch(() => ''),
  }));
  ck('le bouton dit lui-même que c\'est copié', /copi/i.test(copie.dit), JSON.stringify(copie.dit));
  ck('  et c\'est bien l\'adresse du logiciel',
     /index\.html$/.test(copie.presse) && !/\?/.test(copie.presse), JSON.stringify(copie.presse));

  console.log('\n=== l\'élève n\'a rien à financer ===');
  {
    const c2 = await b.newContext({ viewport: { width: 900, height: 700 },
      userAgent: devices['iPad (gen 7)'].userAgent });
    const q = await c2.newPage();
    q.on('pageerror', e => errs.push(e.message));
    await q.goto(PAGE + '?mode=lecture'); await q.waitForTimeout(1400);
    const eleve = await q.evaluate(() => ({
      compteur: localStorage.getItem('gm_ouvertures'),
      horsJeu: window.app.donHorsJeu(),
      peut: window.app.donPeutDemander(),
    }));
    ck('en mode lecture, rien n\'est compté ni demandé',
       !eleve.compteur && eleve.horsJeu && !eleve.peut, JSON.stringify(eleve));
    await c2.close();
  }

  console.log('\n=== et jamais par-dessus une autre fenêtre ===');
  await p.evaluate(() => { localStorage.removeItem('gm_don_etat');
    localStorage.setItem('gm_ouvertures', '30'); });
  await ouvrir();
  await p.evaluate(() => {
    document.getElementById('codeModal').style.display = 'flex';
    window.app.shareCurrentView();
  });
  await p.waitForTimeout(1600);
  const dessus = await fenetreOuverte();
  await p.evaluate(() => { document.getElementById('codeModal').style.display = 'none'; });
  ck('une fenêtre déjà ouverte a la priorité', !dessus);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
