#!/usr/bin/env node
// Hook PreToolUse: bloqueia `git commit` quando a branch atual é protegida.
// Recebe o payload do hook em stdin e responde com uma decisão de permissão.
// Ver .claude/settings.json e https://docs.claude.com/en/docs/claude-code/hooks

import { execFileSync } from "node:child_process";

const BRANCHES_PROTEGIDAS = new Set(["main", "master"]);

function lerStdin() {
  return new Promise((resolve) => {
    let dados = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (pedaco) => (dados += pedaco));
    process.stdin.on("end", () => resolve(dados));
  });
}

// Qualquer imprevisto libera o comando: a função do hook é barrar um caso
// específico, não derrubar o fluxo quando não consegue decidir.
function liberar() {
  process.exit(0);
}

const bruto = await lerStdin();

let payload;
try {
  payload = JSON.parse(bruto);
} catch {
  liberar();
}

const comando = payload?.tool_input?.command ?? "";

// Casa também dentro de comandos compostos: `cd projeto && git commit -m ...`
if (!/\bgit\s+commit\b/.test(comando)) liberar();

const diretorio = payload?.cwd ?? process.cwd();

let branch;
try {
  branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: diretorio,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  liberar(); // fora de um repositório git
}

if (!BRANCHES_PROTEGIDAS.has(branch)) liberar();

const motivo =
  `Commit direto na branch "${branch}" está bloqueado por hook do projeto.\n\n` +
  `Crie uma branch antes e repita o commit:\n` +
  `  git checkout -b <tipo>/<descricao>\n\n` +
  `Se o trabalho já foi commitado em ${branch} por engano, mova o commit sem ` +
  `perder alterações não commitadas:\n` +
  `  git branch <nova-branch> && git reset --keep HEAD~1 && git switch <nova-branch>`;

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: motivo,
    },
  }),
);
