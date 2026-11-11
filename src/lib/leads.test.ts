import { describe, expect, it } from "vitest";
import { EMPTY_LEAD, formatPhone, validateLead, whatsappLink } from "./leads";

const valid = {
  ...EMPTY_LEAD,
  institutionName: "Hospital de Exemplo",
  contactName: "Dra. Fulana",
  email: "fulana@hospital.com.br",
  whatsapp: "(98) 98165-9576",
  sectors: ["uti" as const],
};

describe("cadastro de interesse", () => {
  it("aceita um cadastro completo", () => {
    expect(validateLead(valid)).toEqual({});
  });

  it("aponta cada campo obrigatório que falta", () => {
    const errors = validateLead(EMPTY_LEAD);
    expect(Object.keys(errors).sort()).toEqual(["contactName", "email", "institutionName", "sectors", "whatsapp"]);
  });

  it("recusa e-mail e telefone malformados e leitos fora da faixa", () => {
    expect(validateLead({ ...valid, email: "fulana@hospital" }).email).toBeTruthy();
    expect(validateLead({ ...valid, whatsapp: "98165-9576" }).whatsapp).toBeTruthy();
    expect(validateLead({ ...valid, bedsEstimate: "0" }).bedsEstimate).toBeTruthy();
    expect(validateLead({ ...valid, bedsEstimate: "30" }).bedsEstimate).toBeUndefined();
  });

  it("formata o telefone enquanto digita", () => {
    expect(formatPhone("98981659576")).toBe("(98) 98165-9576");
    expect(formatPhone("9832221111")).toBe("(98) 3222-1111");
    expect(formatPhone("98")).toBe("(98");
  });

  it("monta o link de WhatsApp com o código do país uma única vez", () => {
    expect(whatsappLink("98981659576")).toBe("https://wa.me/5598981659576");
    expect(whatsappLink("5598981659576")).toBe("https://wa.me/5598981659576");
  });
});
