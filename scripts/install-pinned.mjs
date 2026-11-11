#!/usr/bin/env node
/**
 * Instala as dependências nas MESMAS versões que o Lovable usa.
 *
 * Por que existe: a fonte da verdade das versões é o `bun.lock`, mas ele
 * aponta para um registro privado do Lovable (inacessível fora de lá), e o
 * `package-lock.json` do repositório está desatualizado. Um `npm install`
 * comum pegaria as versões mais novas de cada faixa — e isso já quebrou o
 * mapa (supabase-js mais novo recusa reutilizar canais de tempo real).
 *
 * O que faz: lê do `bun.lock` a versão exata de cada dependência direta do
 * `package.json` e instala exatamente essas, pelo registro público do npm.
 * Não altera package.json nem os lockfiles.
 *
 * Uso (Vercel, CI ou máquina local):  node scripts/install-pinned.mjs
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const lock = readFileSync("bun.lock", "utf8");

const direct = { ...pkg.dependencies, ...pkg.devDependencies };
const pinned = [];
const missing = [];

for (const name of Object.keys(direct)) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  // Linha do bloco "packages":   "nome": ["nome@1.2.3", ...
  const match = lock.match(new RegExp(`^\\s*"${escaped}": \\["${escaped}@([^"]+)"`, "m"));
  if (match && /^\d/.test(match[1])) pinned.push(`${name}@${match[1]}`);
  else missing.push(name);
}

if (missing.length > 0) {
  console.error(`Sem versão no bun.lock para: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Instalando ${pinned.length} dependências nas versões do bun.lock…`);
const result = spawnSync(
  "npm",
  ["install", "--no-save", "--no-package-lock", "--legacy-peer-deps", "--no-audit", "--no-fund", ...pinned],
  { stdio: "inherit", shell: process.platform === "win32" },
);
process.exit(result.status ?? 1);
