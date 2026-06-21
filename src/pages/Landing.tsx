import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, Shield, Bed, ClipboardList, Activity, Layers, Lock, ChevronDown, Repeat, LogIn } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlatformPreview } from "@/components/landing/PlatformPreview";
import logoP from "@/assets/logo-p-cross.png";
import logoFull from "@/assets/passomed-full-logo.png";

/**
 * Landing comercial do PassoMed (SaaS).
 * Tipografia escopada: font-landing-display (DM Serif Display) + font-landing-sans (Fira Sans).
 * Tokens semânticos da paleta Emerald Prestige reaproveitados do app.
 */

const CONTACT_HREF = `https://wa.me/5598981659576?text=${encodeURIComponent(
  "Olá, Artur! Gostaria de mais informações sobre o PassoMed."
)}`;
const AUTH_HREF = "/auth";

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="inline-block text-[0.72rem] md:text-xs font-landing-sans font-semibold uppercase tracking-[0.28em] text-gold">
    {children}
  </span>
);

/**
 * Reveal — fade + translate ao entrar no viewport. Anima uma vez.
 */
const Reveal = ({
  children,
  delay = 0,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header";
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <As
      ref={ref as never}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform-gpu transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </As>
  );
};

/**
 * SectionShell — layout horizontal no desktop amplo (xl+).
 * Eyebrow + título + subtítulo na coluna esquerda (sticky), conteúdo à direita.
 * No mobile/tablet, tudo empilha naturalmente.
 */
const SectionShell = ({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  align = "left",
  variant = "default",
  className = "",
  fullWidthContent = false,
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  align?: "left" | "center";
  variant?: "default" | "muted" | "emerald";
  className?: string;
  fullWidthContent?: boolean;
}) => {
  const isEmerald = variant === "emerald";
  const titleColor = isEmerald ? "text-primary-foreground" : "text-foreground";
  const subColor = isEmerald
    ? "text-primary-foreground/85"
    : "text-muted-foreground";
  const variantBg =
    variant === "muted"
      ? "bg-secondary/40 border-y border-border/60"
      : variant === "emerald"
      ? "relative overflow-hidden bg-gradient-emerald"
      : "";

  return (
    <section id={id} className={`${variantBg} ${className}`}>
      <div className="container py-20 md:py-28">
        <div
          className={
            fullWidthContent
              ? "space-y-12"
              : "grid gap-10 xl:grid-cols-12 xl:gap-16"
          }
        >
          <Reveal
            className={
              fullWidthContent
                ? `max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`
                : `xl:col-span-4 xl:sticky xl:top-28 xl:self-start ${
                    align === "center" ? "text-center xl:text-left" : ""
                  }`
            }
          >
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h2
              className={`mt-4 font-landing-display text-3xl sm:text-4xl xl:text-[2.75rem] leading-[1.05] tracking-tight ${titleColor}`}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className={`mt-5 text-base md:text-lg leading-relaxed max-w-xl ${subColor} ${
                  align === "center" ? "mx-auto xl:mx-0" : ""
                }`}
              >
                {subtitle}
              </p>
            )}
            <div className="mt-7 hidden xl:flex items-center gap-2 opacity-60">
              <img src={logoP} alt="" aria-hidden className="h-5 w-5 object-contain" />
              <span className="h-px w-12 bg-gold/40" />
            </div>
          </Reveal>

          <Reveal
            delay={120}
            className={fullWidthContent ? "w-full" : "xl:col-span-8"}
          >
            {children}
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default function Landing() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title =
      "PassoMed — Plataforma de passagem de plantão à beira leito";
    const desc =
      "O passômetro médico evoluiu. O PassoMed unifica mapa de leitos, decisões clínicas, passagem de plantão e protocolos da unidade em uma plataforma desenhada para a beira leito.";
    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("description", desc);
    setMeta("og:title", "PassoMed — Plataforma clínica à beira leito", "property");
    setMeta("og:description", desc, "property");
    setMeta("twitter:title", "PassoMed — Plataforma clínica à beira leito");
    setMeta("twitter:description", desc);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = "https://passomed.com.br/landing";

    const ldId = "landing-jsonld";
    let ld = document.getElementById(ldId) as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = ldId;
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "PassoMed",
      applicationCategory: "MedicalApplication",
      operatingSystem: "Web",
      description: desc,
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    });

    return () => {
      document.title = prevTitle;
      ld?.remove();
    };
  }, []);

  const scrollToPlatform = () => {
    document
      .getElementById("plataforma")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen scroll-smooth bg-background text-foreground font-landing-sans antialiased selection:bg-gold/30 selection:text-foreground">
      {/* ── NAV ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container flex h-16 items-center justify-between gap-4">
          <a href="/landing" className="flex items-center gap-2.5 group">
            <img
              src={logoP}
              alt=""
              aria-hidden
              className="h-8 w-8 object-contain transition-transform duration-500 ease-out group-hover:rotate-[3deg]"
            />
            <span className="font-landing-display text-2xl tracking-tight text-foreground leading-none">
              PassoMed
            </span>
            <span className="hidden sm:inline text-[0.6rem] uppercase tracking-[0.22em] text-gold border-l border-border pl-2 ml-1">
              Clinical
            </span>
          </a>
          <nav className="hidden lg:flex items-center gap-7 text-sm text-muted-foreground">
            <button onClick={scrollToPlatform} className="hover:text-foreground transition-colors">Plataforma</button>
            <a href="#modulos" className="hover:text-foreground transition-colors">Módulos</a>
            <a href="#diferenciais" className="hover:text-foreground transition-colors">Diferenciais</a>
            <a href="#contratar" className="hover:text-foreground transition-colors">Contratar</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <a
              href={AUTH_HREF}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3.5 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-medium text-foreground hover:border-primary/40 hover:bg-accent transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              Entrar
            </a>
            <a
              href={CONTACT_HREF}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 md:px-5 text-xs md:text-sm font-medium text-primary-foreground shadow-sm hover:shadow-glow transition-all"
            >
              Agendar demonstração
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* ── 01 HERO (split-screen) ──────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/40 -z-10" />
        <div className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-primary/8 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-gold/10 blur-3xl -z-10" />

        <div className="container py-20 md:py-24 space-y-14 md:space-y-16">
          <div className="max-w-4xl">
            <Eyebrow>Plataforma de passagem de plantão · à beira leito</Eyebrow>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              <Repeat className="h-3 w-3" />
              O passômetro médico evoluiu.
            </div>
            <h1 className="mt-6 font-landing-display text-[2.5rem] sm:text-5xl md:text-[3.5rem] xl:text-[4rem] leading-[1.02] tracking-tight text-foreground">
              Cada decisão clínica registrada.{" "}
              <span className="text-primary">Cada leito visto.</span>{" "}
              Cada plantão passado sem ruído.
            </h1>
            <p className="mt-7 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">
              O PassoMed transforma a passagem de plantão em um fluxo único: mapa de leitos, decisões clínicas, exames, plano terapêutico e protocolos da unidade — tudo na mesma tela em que o médico atende.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={CONTACT_HREF}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-7 py-3.5 text-sm md:text-base font-medium text-primary-foreground shadow-md hover:shadow-glow transition-all"
              >
                Agendar demonstração e conversa
                <ArrowRight className="h-4 w-4" />
              </a>
              <button
                onClick={scrollToPlatform}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-border bg-card px-7 py-3.5 text-sm md:text-base font-medium text-foreground hover:border-primary/40 hover:bg-accent transition-all"
              >
                Conhecer a plataforma
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Conversa de 20 minutos com a equipe. Sem SDR, sem formulário longo.
            </p>
          </div>

          {/* Mockup vivo do Mapa — full-width abaixo do bloco principal */}
          <div className="w-full">
            <PlatformPreview />
          </div>
        </div>
      </section>

      {/* ── 02 CREDIBILIDADE ─────────────────────────────────── */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="container py-8 md:py-10 grid md:grid-cols-3 gap-6 md:gap-12 text-center md:text-left">
          {[
            "Passagem de plantão segura e organizada",
            "Informações confiáveis registradas pelo próprio médico",
            "Isolamento de dados por unidade hospitalar",
          ].map((t) => (
            <div key={t} className="flex items-center justify-center md:justify-start gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-gold flex-shrink-0" />
              <p className="text-sm font-medium text-muted-foreground">{t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 03 PROBLEMA ─────────────────────────────────────── */}
      <SectionShell
        id="plataforma"
        eyebrow="O contexto"
        title={<>O dia a dia médico está espalhado em ferramentas que não foram feitas para a clínica.</>}
        subtitle="Três sintomas que aparecem em quase todo plantão — independentemente do porte da unidade."
      >
        <div className="grid sm:grid-cols-2 xl:grid-cols-1 gap-5">
          {[
            {
              n: "01",
              title: "Passagem de plantão fragmentada",
              body: "Caderno, WhatsApp, papel impresso, planilhas improvisadas e drives desorganizados convivendo no mesmo plantão. Cada turno reconstrói a informação do zero.",
            },
            {
              n: "02",
              title: "Gerenciamento clínico de leitos no escuro",
              body: "Sem visão única de quem está em qual leito, há quanto tempo, em que condição e com qual conduta vigente.",
            },
            {
              n: "03",
              title: "Ruído entre turnos",
              body: "Informação clínica relevante se perde entre quem entra e quem sai. O risco mora exatamente nesse intervalo.",
            },
          ].map((c) => (
            <article
              key={c.n}
              className="group relative rounded-2xl border border-border bg-card p-6 xl:p-7 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-landing-display text-3xl text-gold/80">{c.n}</span>
                <h3 className="font-landing-display text-xl text-foreground leading-snug">{c.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </article>
          ))}
        </div>
      </SectionShell>

      {/* ── 04 SOLUÇÃO ──────────────────────────────────────── */}
      <SectionShell
        variant="emerald"
        fullWidthContent
        eyebrow="A proposta"
        title={<>Um mapa vivo do seu setor hospitalar. Em tempo real.</>}
        subtitle="O PassoMed transforma cada leito do seu setor em um registro clínico vivo — da admissão ao desfecho. Deslize entre Urgência, UTI e Enfermaria."
      >
        <div className="relative">
          <PlatformPreview />
        </div>
      </SectionShell>

      {/* ── 05 COMO FUNCIONA ───────────────────────────────── */}
      <SectionShell
        eyebrow="Como funciona"
        title={<>Três movimentos, um único sistema.</>}
        subtitle="Do mapa à rendição do plantão — a operação inteira em um só fluxo."
      >
        <div className="grid sm:grid-cols-3 gap-6 lg:gap-8 relative">
          <div className="hidden sm:block absolute top-7 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          {[
            {
              step: "01",
              title: "Mapeia",
              body: "Cada setor, cada leito, cada paciente visíveis em uma única tela. UTI, enfermaria, urgência e emergência, observação — conforme a configuração da unidade.",
            },
            {
              step: "02",
              title: "Conduz & atualiza",
              body: "Decisões clínicas e atualizações registradas dentro do fluxo do plantão. Sem sair da tela do paciente.",
            },
            {
              step: "03",
              title: "Rende o plantão",
              body: "A passagem para o turno seguinte sai pronta, organizada e legível. O colega que entra começa onde o colega que sai parou.",
            },
          ].map((m) => (
            <div key={m.step} className="relative">
              <div className="relative inline-flex items-center justify-center h-14 w-14 rounded-full bg-card border-2 border-gold/60 font-landing-display text-lg text-gold shadow-sm">
                {m.step}
              </div>
              <h3 className="mt-5 font-landing-display text-2xl text-foreground">{m.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* ── 06 MÓDULOS ─────────────────────────────────────── */}
      <SectionShell
        id="modulos"
        variant="muted"
        eyebrow="Módulos"
        title={<>O que está incluído.</>}
        subtitle="Quatro frentes integradas — desenhadas para conviver no mesmo plantão, sem alternar sistemas."
      >
        <div className="grid sm:grid-cols-2 gap-5">
          {[
              { icon: Bed, title: "Mapa de leitos", body: "Visão única do setor em tempo real." },
              { icon: ClipboardList, title: "Passagem de plantão", body: "Registro estruturado da rendição do turno." },
              { icon: Activity, title: "Protocolos clínicos", body: "Adaptados por unidade hospitalar — apenas os que a unidade configurar." },
              { icon: Layers, title: "Movimentação de leitos", body: "Entradas, transferências e desfechos refletidos no mapa." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500">
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-landing-display text-xl text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* ── 07 O QUE MUDA ──────────────────────────────────── */}
      <SectionShell
        eyebrow="O que muda"
        title={<>O que muda quando o setor opera com o PassoMed.</>}
        subtitle="Dois efeitos que aparecem nas primeiras semanas de operação."
      >
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            { title: "Decisões mais rápidas", body: "Informação clínica acessível no momento em que precisa ser usada." },
            { title: "Plantões mais seguros", body: "Rendição organizada, legível e sem reconstrução manual a cada turno." },
          ].map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-7 lg:p-8 hover:-translate-y-0.5 hover:shadow-md transition-all duration-500">
              <h3 className="font-landing-display text-2xl md:text-3xl text-primary leading-tight">{p.title}</h3>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-muted-foreground italic">
          Quando tivermos métricas reais de clientes ativos, esta seção vira o resultado com números.
        </p>
      </SectionShell>

      {/* ── 08 DIFERENCIAIS ────────────────────────────────── */}
      <SectionShell
        id="diferenciais"
        variant="muted"
        eyebrow="Por que PassoMed é diferente"
        title={<>O que sustenta a escolha.</>}
        subtitle="Três princípios não-negociáveis na construção da plataforma."
      >
        <div className="grid sm:grid-cols-3 xl:grid-cols-1 gap-5">
          {[
              { title: "Beira leito, não retaguarda", body: "Desenhado para quem prescreve, evolui e passa o plantão. Não é um sistema administrativo adaptado." },
              { title: "Isolamento por unidade", body: "Cada hospital ou rede opera em dados próprios. Nada vaza entre instituições." },
              { title: "Conformidade desde a primeira linha", body: "LGPD e segurança como ponto de partida, não como remendo." },
          ].map((d) => (
            <div key={d.title} className="rounded-2xl border border-border bg-card p-6 xl:p-7 hover:border-primary/30 hover:shadow-md transition-all duration-500">
              <h3 className="font-landing-display text-xl text-foreground leading-snug">{d.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* ── 10 SEGURANÇA ───────────────────────────────────── */}
      <SectionShell
        eyebrow="Segurança & Compliance"
        title={<>Construído desde o primeiro dia para tratar dado clínico com a seriedade que ele exige.</>}
        subtitle="LGPD, isolamento por unidade e criptografia ponta a ponta — fundação, não checklist."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          {[
              { icon: Shield, title: "LGPD nativa", body: "Privacidade e direitos do titular implementados desde a fundação." },
              { icon: Lock, title: "Isolamento por unidade (RLS)", body: "Cada unidade só enxerga os próprios dados. Sempre." },
              { icon: Check, title: "Sessão controlada", body: "Timeout de inatividade e rastreamento de presença por usuário." },
              { icon: Shield, title: "Criptografia em trânsito e repouso", body: "Dado clínico protegido ponta a ponta." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all duration-500">
              <Icon className="h-5 w-5 text-primary" />
              <h4 className="mt-3 font-landing-sans font-semibold text-sm text-foreground">{title}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* ── 11 COMO CONTRATAR ──────────────────────────────── */}
      <SectionShell
        id="contratar"
        variant="muted"
        eyebrow="Como contratar"
        title={<>Três formatos, uma plataforma.</>}
        subtitle="Da unidade isolada à rede multi-hospitalar — o escopo se adapta, o produto é o mesmo."
      >
        <div className="grid sm:grid-cols-3 gap-5">
          {[
              { tier: "Unidade", body: "Para uma única unidade clínica (UTI, enfermaria, urgência ou observação)." },
              { tier: "Hospital", body: "Para a operação completa de um hospital com múltiplas unidades clínicas.", featured: true },
              { tier: "Rede", body: "Para grupos hospitalares com isolamento de dados por instituição." },
          ].map((p) => (
            <div
              key={p.tier}
              className={`rounded-2xl border p-6 xl:p-7 flex flex-col transition-all duration-500 ${
                p.featured
                  ? "border-gold/60 bg-card shadow-gold"
                  : "border-border bg-card hover:border-primary/30 hover:-translate-y-0.5"
              }`}
            >
              {p.featured && (
                <span className="self-start mb-3 text-[0.65rem] uppercase tracking-[0.22em] text-gold font-semibold">
                  Mais comum
                </span>
              )}
              <h3 className="font-landing-display text-2xl text-foreground">{p.tier}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground flex-1">{p.body}</p>
              <a
                href={CONTACT_HREF}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:shadow-glow transition-all"
              >
                Entre em contato
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* ── 12 FAQ ─────────────────────────────────────────── */}
      <SectionShell
        id="faq"
        eyebrow="Perguntas frequentes"
        title={<>O que costumam perguntar antes da primeira conversa.</>}
        subtitle="Se a sua dúvida não estiver aqui, é só escrever."
      >
        <Accordion type="single" collapsible className="w-full">
          {[
              {
                q: "O PassoMed substitui o prontuário eletrônico do hospital?",
                a: "Não. O PassoMed é uma camada clínica de beira leito que convive com o prontuário existente. Ele cobre o que prontuários administrativos não cobrem bem: mapa de leitos, passagem de plantão estruturada e protocolos clínicos da unidade.",
              },
              {
                q: "Como o PassoMed se integra ao sistema atual da unidade?",
                a: "Opera de forma autônoma na operação de beira leito da unidade. Integrações com sistemas hospitalares são desenhadas caso a caso conforme a maturidade da instituição.",
              },
              {
                q: "Quanto tempo leva para um setor entrar em operação?",
                a: "Por ser uma plataforma compacta e de giro rápido, uma unidade pode entrar em operação em poucos dias após a configuração inicial dos setores e usuários.",
              },
              {
                q: "Os dados do paciente ficam armazenados na plataforma?",
                a: "O PassoMed é compacto e de giro rápido, voltado à operação ativa do leito (da admissão ao desfecho). Não retém histórico clínico de longo prazo para fins de auditoria — isso permanece com o prontuário da instituição.",
              },
              {
                q: "Quem é o dono dos dados gerados na unidade?",
                a: "Os dados pertencem integralmente à instituição. O PassoMed apenas processa e disponibiliza dentro do escopo contratado, com isolamento por unidade.",
              },
              {
                q: "O PassoMed funciona em UTI, enfermaria e urgência ao mesmo tempo?",
                a: "Sim. Cada setor é configurado conforme a sua realidade (slots fixos em UTI, leitos dinâmicos em enfermaria, observação em urgência) e todos convivem no mesmo mapa.",
              },
          ].map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left font-landing-sans font-medium text-base text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SectionShell>

      {/* ── 13 CTA FINAL ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-emerald">
        <div className="container py-20 md:py-28 text-center">
          <Eyebrow>
            <span className="text-gold">Vamos conversar</span>
          </Eyebrow>
          <h2 className="mt-5 font-landing-display text-3xl sm:text-4xl md:text-5xl leading-[1.05] tracking-tight text-primary-foreground max-w-3xl mx-auto">
            Pronto para ver o seu setor em uma única tela?
          </h2>
          <p className="mt-6 text-base md:text-lg text-primary-foreground/85">
            20 minutos com a equipe demonstrativa.
          </p>
          <a
            href={CONTACT_HREF}
            className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-4 text-sm md:text-base font-semibold text-gold-foreground shadow-gold hover:brightness-110 transition-all"
          >
            Agendar conversa
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ── 14 FOOTER ──────────────────────────────────────── */}
      <footer className="border-t border-border bg-background">
        <div className="container py-12 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <img src={logoP} alt="" aria-hidden className="h-7 w-7 object-contain" />
              <span className="font-landing-display text-2xl text-foreground leading-none">PassoMed</span>
            </div>
            <p className="mt-4 text-muted-foreground max-w-xs">
              Plataforma clínica à beira leito. Desenhada para o médico que prescreve, evolui e passa o plantão.
            </p>
            <img
              src={logoFull}
              alt="PassoMed"
              className="mt-6 h-8 w-auto object-contain opacity-50 hidden md:block"
            />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Navegar</h4>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li><button onClick={scrollToPlatform} className="hover:text-foreground transition-colors">Plataforma</button></li>
              <li><a href="#modulos" className="hover:text-foreground transition-colors">Módulos</a></li>
              <li><a href="#diferenciais" className="hover:text-foreground transition-colors">Diferenciais</a></li>
              <li><a href="#contratar" className="hover:text-foreground transition-colors">Contratar</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Conformidade</h4>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>LGPD — Lei nº 13.709/2018</li>
              <li>Isolamento por unidade hospitalar</li>
              <li><a href={CONTACT_HREF} className="hover:text-foreground transition-colors">contato@passomed.com.br</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="container py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} PassoMed. Todos os direitos reservados.</span>
            <span>Brasil · pt-BR</span>
          </div>
        </div>
      </footer>
    </div>
  );
}