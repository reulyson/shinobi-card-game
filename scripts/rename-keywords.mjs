/**
 * Renomeia identificadores antigos de Keyword → nomes da UI (uma execução).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const PAIRS = [
  ['Visão Aguçada', 'Sensor'],
  ['Ataque Rápido', 'Ágil'],
  ['Ataque Duplo', 'Veloz'],
  ['Escudo de Feitiço', 'Anulação'],
  ['Não Bloqueia', 'Indefeso'],
  ['Sobrepujar', 'Perfurante'],
  ['Regeneração', 'Regenerar'],
  ['Aperfeiçoar', 'Treinamento'],
  ['Desafiador', 'Provocar'],
  ['Assustador', 'Intimidação'],
  ['Formidável', 'Muralha'],
  ['Vulnerável', 'Exposto'],
  ['Destinado', 'Determinação'],
  ['Elusivo', 'Furtivo'],
  ['Barreira', 'Esquiva'],
  ['Robusto', 'Resistente'],
  ['Imortal', 'Renascer'],
  ['Efêmero', 'Clone'],
  ['Sintonia', 'Concentrar'],
  ['Auxiliar', 'Apoio'],
  ['Imbuir', 'Ressonância'],
  ['Evoluir', 'Despertar'],
  ['Sagrado', 'Legado'],
  ['Imóvel', 'Imobilizado'],
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist') continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function replaceInFile(file) {
  let s = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [from, to] of PAIRS) {
    for (const q of ["'", '"']) {
      const a = `${q}${from}${q}`;
      const b = `${q}${to}${q}`;
      if (s.includes(a)) {
        s = s.split(a).join(b);
        changed = true;
      }
    }
    const esc = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keyRe = new RegExp(`\\b${esc}:`, 'g');
    if (keyRe.test(s)) {
      s = s.replace(keyRe, `${to}:`);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(file, s, 'utf8');
  return changed;
}

const files = [...walk(path.join(ROOT, 'src')), ...walk(path.join(ROOT, 'tests'))];
let n = 0;
for (const f of files) {
  if (replaceInFile(f)) {
    n += 1;
    console.log(path.relative(ROOT, f));
  }
}
console.log(`Updated ${n} files`);