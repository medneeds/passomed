# Landing Page Comercial — PassoMed SaaS

Plano para construir a landing page de venda do PassoMed, com narrativa de copywriter sênior + estética da identidade visual já consolidada (verde esmeralda + dourado + logo P-cruz).

---

## 1. Posicionamento (a base de tudo)

Antes da página, precisamos travar 3 frases-âncora que vão guiar headline, seções e CTAs:

- **Categoria:** "Plataforma de gestão clínica de beira-leito para hospitais de média e alta complexidade."
- **Promessa única:** Substituir planilhas, papéis e WhatsApp por um mapa vivo do hospital — em tempo real, auditável e em conformidade com LGPD/CFM.
- **Por que agora:** UTIs/Urgências sobrecarregadas + exigência crescente de rastreabilidade clínica (auditoria 20 anos) + pressão por indicadores de desfecho.

Público-alvo principal: **Diretores Técnicos, Coordenadores de UTI/Urgência e Superintendentes Hospitalares**. Público secundário: gestores de qualidade e TI hospitalar.

---

## 2. Arquitetura da Landing (ordem das seções)

```text
01  Hero                  → Headline + sub + CTA + visual do mapa de leitos
02  Logos de prova social → "Em uso em hospitais X, Y, Z"
03  O problema            → 3 dores viscerais (passagem de plantão, regulação, auditoria)
04  A solução             → Mapa unificado: 1 frase + screenshot anotado
05  Como funciona         → 3 passos (Mapeia → Conduz → Audita)
06  Módulos               → Grid de 6-8 cards (UTI, Urgência, Protocolos, DHD, etc.)
07  Resultados            → Métricas (tempo de passagem, conformidade, mortalidade revisada)
08  Diferenciais          → 4 pilares: Tempo real, LGPD/CFM, Multi-unidade, Clínico-first
09  Depoimento âncora     → Quote de médico + foto + cargo
10  Segurança & Compliance→ Selo LGPD, auditoria imutável, RLS por unidade
11  Planos                → 3 tiers (Unidade / Hospital / Rede)
12  FAQ                   → 6-8 objeções reais
13  CTA final             → "Agendar demonstração"
14  Footer                → Institucional + LGPD + contato
```

---

## 3. Copy Framework (PAS + StoryBrand híbrido)

**Headline candidata #1:**
> "O hospital inteiro em uma tela. Cada leito, cada paciente, cada decisão — rastreável."

**Headline candidata #2:**
> "Pare de gerir leitos no WhatsApp. Comece a operar como um hospital de classe mundial."

**Sub-headline:**
> Plataforma clínica de beira-leito que unifica mapa de leitos, evolução, passagem de plantão e protocolos críticos — com auditoria LGPD/CFM nativa.

**CTAs:**
- Primário: **Agendar demonstração** (15 min)
- Secundário: **Ver tour de 2 minutos**

Tom de voz: técnico-confiável, sem jargão de marketing, com prova quantificada. Frases curtas. Verbos no presente. Zero "revolucionário/disruptivo".

---

## 4. Design System da Landing

Reusa os tokens já consolidados do app, só amplia para uso comercial:

- **Paleta:** Verde esmeralda profundo (`#064e3b → #0d7a5f`) + dourado (`#c9a84c`) como acento + off-white quente (`#f5f0e0`) para respiro.
- **Tipografia:** Display serif elegante para headline (ex: *Instrument Serif* ou *Fraunces*) + sans neutra para corpo (ex: *Inter Tight* ou *Geist*). Diferenciar da UI clínica do app, que é mais utilitária.
- **Composição:** Hero assimétrico, alta densidade nos módulos, respiro generoso nas seções de credibilidade. Nada de gradiente roxo genérico.
- **Movimento:** 1 animação-âncora no hero (mapa de leitos "ganhando vida"), micro-interações sutis em cards. Sem parallax exagerado.
- **Visual hero:** Screenshot real do mapa + anotações flutuantes (badge "Tempo real", indicador de leito vago, etc).

Antes de codar, vou rodar **3 direções visuais renderizadas** (escolha de paleta, tipografia e layout) para você travar a estética.

---

## 5. Assets necessários

| Asset | Origem |
| --- | --- |
| Screenshots reais (mapa, UTI, passagem, protocolos) | Capturar do app em ambiente demo |
| Logo P-cruz em variações (claro/escuro) | Já existe |
| Vídeo curto de tour (30-60s) | Pode ficar para fase 2 |
| Logos de hospitais parceiros | Você fornece |
| Foto/quote de médicos referência | Você fornece |
| Selos LGPD/conformidade | Designer cria |

---

## 6. Estrutura técnica

- **Rota nova:** `/` da landing fica em rota pública separada (`/landing` ou subdomínio `passomed.com.br` raiz), sem colidir com `/auth` e o app autenticado.
- **Stack:** mesma do app (React + Vite + Tailwind + shadcn) — sem framework novo.
- **SEO:** `<title>`, meta description, Open Graph dedicado, JSON-LD Organization + SoftwareApplication, sitemap.
- **Performance:** imagens em CDN (lovable-assets), fontes via @fontsource, lazy-load abaixo do hero.
- **Analytics:** placeholder para Plausible/GA + eventos nos CTAs (a definir depois).
- **Formulário de demo:** grava lead numa tabela `landing_leads` no Cloud (com RLS bloqueando leitura pública e edge function de notificação por e-mail).

---

## 7. Roadmap de execução (proposta em 4 fases)

**Fase 1 — Estratégia & copy (esta semana)**
- Validar posicionamento, headline e ordem das seções com você
- Escrever copy final de todas as seções

**Fase 2 — Direção visual**
- Rodar 3 direções renderizadas (paleta/tipografia/layout)
- Você escolhe 1, eu implemento o design system da landing

**Fase 3 — Implementação**
- Construir as 14 seções com copy final + screenshots reais
- Formulário de captura + persistência no backend
- SEO, OG, JSON-LD, sitemap

**Fase 4 — Polimento & publicação**
- Animação do hero, micro-interações
- Teste em mobile/tablet/desktop
- Publicação em `passomed.com.br` (já configurado como domínio)

---

## 8. Decisões que preciso de você antes de começar

1. **Headline preferida** entre as 2 candidatas (ou pedir mais opções).
2. **Modelo comercial:** vai ter preço público na página, "fale com vendas", ou os dois (planos visíveis + CTA de demo)?
3. **Provas sociais reais já disponíveis** (hospitais usando, depoimentos, métricas) — ou começamos com a página "honesta sem provas" e adicionamos depois?
4. **Idiomas:** PT-BR apenas, ou já preparar estrutura para EN/ES?

Quando você aprovar este plano, eu começo pela Fase 1 (copy completo) antes de tocar em qualquer código.
