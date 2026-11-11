// Dados da empresa exibidos no rodapé e nas políticas (CDC art. 31, Decreto
// 7.962/2013 art. 2º e LGPD art. 9º). Fonte única: mude aqui e tudo atualiza.
export const COMPANY = {
  brand: "PassoMed",
  legalName: "MedNeeds LTDA",
  /** Formato 00.000.000/0000-00 */
  cnpj: "55.595.830/0001-09",
  /** Endereço da sede, com cidade/UF e CEP */
  address: "Rua das Laranjeiras, Q62 C20 - Jardim Renascença, São Luís/MA, CEP 65075-250",
  /** Canal de atendimento e de privacidade (encarregado/DPO) */
  contactEmail: "contato@passomed.com.br",
  /** Atendimento comercial por WhatsApp */
  supportWhatsapp: "(98) 98165-9576",
  supportWhatsappUrl: "https://wa.me/5598981659576",
  /** Encarregado pelo tratamento de dados pessoais (LGPD art. 41) */
  dpoName: "Artur Batista",
  site: "https://www.passomed.com.br",
  /** Grupo empresarial do qual o PassoMed faz parte */
  group: "Grupo MedNeeds",
  groupProducts: ["MedStation", "PassoMed", "Arsenal Med", "MedNeeds", "MedNeeds Organizações", "Arsen"],
} as const;

/** Data da última revisão das políticas — atualize ao mudar o texto. */
export const LEGAL_LAST_UPDATED = "11 de novembro de 2026";
