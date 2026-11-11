import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import logoP from "@/assets/logo-p-cross.png";
import { SiteFooter } from "@/components/SiteFooter";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/config/company";

interface LegalLayoutProps {
  title: string;
  description: string;
  path: string;
  children: ReactNode;
}

/** Moldura simples e legível para Privacidade e Termos. */
export function LegalLayout({ title, description, path, children }: LegalLayoutProps) {
  const { hash } = useLocation();

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · ${COMPANY.brand}`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${COMPANY.site}${path}`;
    return () => {
      document.title = previous;
    };
  }, [title, description, path]);

  // Links como /privacidade#cookies: rola até a seção depois de montar.
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash, path]);

  return (
    <div className="flex min-h-screen flex-col bg-background font-landing-sans text-foreground antialiased">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-border/60">
        <div className="container flex h-16 items-center">
          <Link to="/" aria-label="PassoMed — página inicial" className="flex items-center gap-2.5">
            <img src={logoP} alt="" aria-hidden className="h-8 w-8 object-contain" />
            <span className="font-landing-display text-2xl leading-none tracking-tight">PassoMed</span>
          </Link>
        </div>
      </header>
      <main id="conteudo" className="container flex-1 py-10 md:py-16">
        <article className="mx-auto max-w-3xl">
          <h1 className="font-landing-display text-3xl tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Última atualização: {LEGAL_LAST_UPDATED}</p>
          <div className="mt-8 space-y-5 text-[0.95rem] leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:font-landing-display [&_h2]:text-2xl [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:font-semibold [&_table]:w-full [&_table]:text-sm [&_td]:border-b [&_td]:border-border/60 [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left [&_th]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
