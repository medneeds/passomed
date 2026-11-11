import { Link } from "react-router-dom";
import { COMPANY } from "@/config/company";

/**
 * Rodapé das páginas públicas: identificação da empresa (Decreto 7.962/2013),
 * links das políticas e aviso de escopo da ferramenta.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  const link = "underline-offset-4 hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline";
  return (
    <div className="border-t border-border/60">
      <div className="container flex flex-col gap-4 py-8 text-xs text-muted-foreground">
        <nav aria-label="Políticas e informações legais">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li><Link to="/termos" className={link}>Termos de Uso</Link></li>
            <li><Link to="/privacidade" className={link}>Política de Privacidade</Link></li>
            <li><Link to="/privacidade#cookies" className={link}>Cookies</Link></li>
          </ul>
        </nav>
        <div className="space-y-1 leading-relaxed">
          <p>
            © {year} {COMPANY.brand} · {COMPANY.legalName} · CNPJ {COMPANY.cnpj}. Todos os direitos reservados.
          </p>
          <p>{COMPANY.address}</p>
          <p>
            Contato:{" "}
            <a href={`mailto:${COMPANY.contactEmail}`} className={link}>{COMPANY.contactEmail}</a>
            {" "}· WhatsApp:{" "}
            <a href={COMPANY.supportWhatsappUrl} target="_blank" rel="noopener noreferrer" className={link}>{COMPANY.supportWhatsapp}</a>
            {" "}· Encarregado de dados (DPO): {COMPANY.dpoName}
          </p>
          <p>
            O PassoMed é uma ferramenta de apoio ao registro de pendências, programações e planos terapêuticos. Não
            substitui a passagem de plantão presencial à beira-leito nem o prontuário, e a decisão clínica é sempre
            da equipe assistente.
          </p>
          <p>PassoMed e Clinical Pass são marcas de {COMPANY.legalName}. Reprodução do conteúdo sem autorização é proibida.</p>
        </div>
      </div>
    </div>
  );
}
