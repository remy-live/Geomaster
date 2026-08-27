#!/usr/bin/env node
/* Lance toutes les sondes et rend un verdict unique.
   Chaque sonde est un programme autonome : elle ouvre GéoMaster dans un vrai
   navigateur, se comporte comme un utilisateur, et sort en 0 si tout passe.
   On les exécute par paquets pour tenir le temps total, sans saturer la machine. */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DOSSIER = __dirname;
const PARALLELE = Math.max(2, Math.min(6, os.cpus().length - 1));
const DELAI = 240000;

const choisies = process.argv.slice(2);
const sondes = (choisies.length ? choisies : fs.readdirSync(DOSSIER)
  .filter(f => /^(probe|audit)-.*\.js$/.test(f)).sort());

const lancer = (nom) => new Promise((resolve) => {
  const t0 = Date.now();
  const p = spawn(process.execPath, [path.join(DOSSIER, nom)], {
    env: process.env, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let sortie = '';
  p.stdout.on('data', d => { sortie += d; });
  p.stderr.on('data', d => { sortie += d; });
  const minuteur = setTimeout(() => { p.kill('SIGKILL'); }, DELAI);
  p.on('close', (code) => {
    clearTimeout(minuteur);
    resolve({ nom, code, sortie, ms: Date.now() - t0 });
  });
});

(async () => {
  const debut = Date.now();
  const resultats = [];
  for (let i = 0; i < sondes.length; i += PARALLELE) {
    const lot = sondes.slice(i, i + PARALLELE);
    const r = await Promise.all(lot.map(lancer));
    r.forEach((x) => {
      resultats.push(x);
      const etat = x.code === 0 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      console.log(`${etat} ${x.nom.padEnd(28)} ${String(Math.round(x.ms / 100) / 10).padStart(5)} s`);
    });
  }
  const rouges = resultats.filter(x => x.code !== 0);
  if (rouges.length) {
    console.log('\n──────── détail des échecs ────────');
    rouges.forEach((x) => {
      console.log(`\n### ${x.nom}`);
      const lignes = x.sortie.split('\n');
      const utiles = lignes.filter(l => /✗|===|Error|error/.test(l));
      console.log((utiles.length ? utiles : lignes.slice(-25)).join('\n'));
    });
  }
  const s = Math.round((Date.now() - debut) / 1000);
  console.log(`\n${resultats.length - rouges.length}/${resultats.length} sondes vertes en ${s} s`);
  process.exit(rouges.length ? 1 : 0);
})();
