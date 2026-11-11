import { describe, expect, it } from "vitest";
import { isValidSlug, resolveInstitutionSlug, slugFromHostname } from "./institutionSlug";

describe("endereço da instituição", () => {
  it("valida o formato do slug", () => {
    expect(isValidSlug("saolucas")).toBe(true);
    expect(isValidSlug("hospital-central-2")).toBe(true);
    expect(isValidSlug("-comeca-com-hifen")).toBe(false);
    expect(isValidSlug("Com Espaço")).toBe(false);
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("<script>")).toBe(false);
  });

  it("lê o subdomínio só do domínio base configurado", () => {
    expect(slugFromHostname("saolucas.passomed.com.br", "passomed.com.br")).toBe("saolucas");
    expect(slugFromHostname("passomed.com.br", "passomed.com.br")).toBeNull();
    expect(slugFromHostname("www.passomed.com.br", "passomed.com.br")).toBeNull();
    expect(slugFromHostname("a.b.passomed.com.br", "passomed.com.br")).toBeNull();
    expect(slugFromHostname("passomed-demo.vercel.app", "passomed.com.br")).toBeNull();
    expect(slugFromHostname("saolucas.passomed.com.br", undefined)).toBeNull();
  });

  it("prioriza o parâmetro ?i= e ignora valor inválido", () => {
    localStorage.clear();
    sessionStorage.clear();
    expect(resolveInstitutionSlug({ search: "?i=SaoLucas", hostname: "localhost" }, undefined)).toBe("saolucas");
    // lembrado só nesta aba
    expect(resolveInstitutionSlug({ search: "", hostname: "localhost" }, undefined)).toBe("saolucas");
    sessionStorage.clear();
    // aba nova no endereço puro: marca padrão da plataforma
    expect(resolveInstitutionSlug({ search: "", hostname: "localhost" }, undefined)).toBeNull();
    expect(resolveInstitutionSlug({ search: "?i=../../x", hostname: "localhost" }, undefined)).toBeNull();
  });
});
