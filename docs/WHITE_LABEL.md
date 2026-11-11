# PassoMed white label — como funciona e como operar

Branch `whitelabel`. Nada aqui foi aplicado na produção (branch `main`, publicada pelo Lovable).

## O que mudou

| Tema | Antes | Agora |
| --- | --- | --- |
| Marca | Fixa no código (`src/config/whitelabel.ts`); trocar de cliente = outra publicação | Vem do banco (`institution_branding`) e é aplicada em tempo de execução; uma publicação atende todas as instituições |
| Cores | Esmeralda fixa em ~130 pontos | Cinco variáveis CSS (`--brand-h`, `--brand-s`, `--brand-l`, `--brand-s-soft`, `--tint-h`) definem a paleta inteira; sem marca própria o resultado é idêntico ao anterior |
| Isolamento | `admin` enxergava e gerenciava todas as unidades e usuários | `admin` = coordenador das unidades a que está vinculado; só `platform_admins` atravessa instituições |
| Painel admin | Senha compartilhada `ADMIN1` no código | Acesso pelo papel do usuário, com rota protegida e checagem no banco |
| Leitos fixos | V01–V07, A01–A06, Z01–Z06, U01–U10 fixos no código e nos gatilhos | `sector_bed_capacities` por unidade, configurável no painel |
| Cobrança | Não existia | `bed_contracts` (leitos contratados × R$ 25), trava de quantitativo e `billing_invoices` |

## Papéis

- **Operador da plataforma** (`platform_admins`): implanta instituições, define contratos, vê todas as unidades. Os admins que já existiam viram operadores automaticamente (nada muda para eles).
- **Coordenador** (papel `admin` + vínculo em `user_hospital_assignments`): gerencia usuários, marca e quantitativo de leitos **da própria unidade**.
- **Demais papéis**: enxergam só as unidades a que estão vinculados, e só depois de aprovados.

## Implantar uma instituição

1. **Cadastrar unidades** (operador): Painel Admin → Cadastrar unidades.
2. **Contrato** (operador): Painel Admin → Instituições e receita → Contrato. Informe os leitos por setor; isso grava o quantitativo e o limite contratado. Situação "Ativo" passa a contar na receita e a gerar fatura.
3. **Coordenador**: crie o usuário em Gestão de usuários com a unidade selecionada e papel de coordenador.
4. **Marca** (coordenador ou operador): Painel Admin → Identidade visual — nome, endereço de acesso (`slug`), cores e logo.
5. **Endereço de acesso**: `https://<domínio>/auth?i=<slug>` abre a tela de entrada já com a marca. Com `VITE_BASE_DOMAIN=passomed.com.br`, `https://<slug>.passomed.com.br` faz o mesmo.

## Cobrança por leito

- Preço padrão: `PRICE_PER_BED_CENTS = 2500` (`src/lib/billing.ts` e `bed_contracts.price_per_bed_cents`).
- Conta leito **fixo configurado**; leito extra não entra.
- `enforce_contracted_beds` impede configurar mais leitos do que o contratado.
- `select public.generate_monthly_invoices();` gera a fatura do mês para cada contrato ativo (`billing_invoices`). A emissão de boleto/Pix e nota fiscal ainda não está integrada: `external_provider`/`external_id` estão reservados para isso.

## Publicar fora do Lovable

O `bun.lock` aponta para um registro privado do Lovable e o `package-lock.json` está desatualizado. Use sempre:

```sh
node scripts/install-pinned.mjs   # instala as versões exatas do bun.lock pelo npm público
npx vite build
```

Um `npm install` comum instala `@supabase/supabase-js` mais novo, que recusa reutilizar canais de tempo real e derruba o mapa. O `vercel.json` já usa o script.

Variáveis do build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`; opcionais `VITE_BASE_DOMAIN`, `VITE_DEMO_MODE=true`, `VITE_DEMO_PASSWORD`.

## Levar para a produção

1. Aplicar no banco de produção, em ordem, as migrações `20261111000100` a `20261111000500`. Todas são idempotentes; a `000100` reescreve políticas RLS, então faça antes um backup e rode `supabase/tests/tenant_isolation.sql` num ambiente de homologação.
2. Publicar as funções de borda alteradas (`admin-create-user`, `admin-update-user`, `reset-user-password`, `process-data-deletion`, `setup-legacy-passwords`).
3. Só então mesclar `whitelabel` em `main`: o front novo depende das tabelas e funções acima.

## Ambiente de demonstração

- Banco: projeto Supabase `passomed-demo` (`tvhjjfngwakfxemvipzv`), separado da produção.
- `supabase/demo/demo_seed.sql` cria `demo.reset()`: duas instituições fictícias (Hospital Demonstração e Hospital São Lucas), usuários por perfil e pacientes fictícios. Um agendamento (`pg_cron`, 04h de Brasília) roda `demo.reset()` toda noite.
- As senhas ficam em `demo.settings`, nunca no repositório.

## Testes

```sh
npx vitest run src/lib src/utils            # cores, cobrança, endereço, leito limpo, diff de paciente
```

`supabase/tests/tenant_isolation.sql`: 15 verificações de isolamento entre instituições, exercitando a RLS com usuários reais do ambiente de demonstração.

## O que ainda não veio do HapMap

Transferência UE→UTI "em trânsito", editores inline compartilhados, layout de celular, checklist/notas da unidade, relatório do paciente, motor de fichas em PDF, leitura de dados por IA e sessão por aba. Nenhum deles depende de dado da Hapvida, mas todos mexem em telas centrais e precisam de validação visual ponto a ponto.

## Pendências conhecidas

- Módulo de **enfermaria** não existe.
- Senhas de 6 caracteres (A–Z, 0–9): política herdada, fraca para um produto multi-instituição.
- `hospital_units` e `states` têm leitura pública (necessária para o cadastro); com muitas instituições, a lista de clientes fica visível a visitantes.
- `handle_new_user` ainda promove o nome de usuário `COORDENADOR` a admin (conta legada).
- Histórico do git contém uma migração com dados de pacientes reais de outro projeto (`20260427051129_…`); tornar o repositório privado não a remove do histórico.
