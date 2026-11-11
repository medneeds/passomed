import { describe, expect, it } from "vitest";
import {
  annualCents, billableBeds, firstYearCents, formatBRL, friendlyCapacityError, monthlyCents,
  PRICE_PER_BED_CENTS, SETUP_FEE_CENTS, setupFeeCents,
} from "./billing";

const nbsp = (value: string) => value.split(String.fromCharCode(160)).join(" ");

describe("cobrança por leito", () => {
  it("cobra R$ 29,90 por leito ao mês", () => {
    expect(PRICE_PER_BED_CENTS).toBe(2990);
    expect(monthlyCents(10)).toBe(29900); // UTI de 10 leitos = R$ 299
    expect(monthlyCents(20)).toBe(59800); // UTI de 20 leitos = R$ 598
    expect(monthlyCents(5 + 10)).toBe(44850); // vermelha 5 + observação 10 = R$ 448,50
  });

  it("não cobra valor negativo nem fração de leito", () => {
    expect(monthlyCents(-3)).toBe(0);
    expect(monthlyCents(10.9)).toBe(29900);
    expect(monthlyCents(Number.NaN)).toBe(0);
  });

  it("aceita preço negociado (fundadores a R$ 25)", () => {
    expect(monthlyCents(10, 2500)).toBe(25000);
  });

  it("aplica o mínimo de 10 leitos", () => {
    expect(billableBeds(5)).toBe(10);
    expect(billableBeds(10)).toBe(10);
    expect(billableBeds(23)).toBe(23);
    expect(billableBeds(0)).toBe(0); // sem leitos, nada a faturar
  });

  it("plano anual: paga 10 meses", () => {
    expect(annualCents(10)).toBe(299000); // R$ 2.990
    expect(annualCents(20)).toBe(598000);
  });

  it("implantação de R$ 990, isenta no anual", () => {
    expect(SETUP_FEE_CENTS).toBe(99000);
    expect(setupFeeCents("monthly")).toBe(99000);
    expect(setupFeeCents("annual")).toBe(0);
  });

  it("primeiro ano de uma UTI de 10 leitos", () => {
    expect(firstYearCents(10, "monthly")).toBe(12 * 29900 + 99000); // R$ 4.578
    expect(firstYearCents(10, "annual")).toBe(299000); // R$ 2.990
    expect(firstYearCents(10, "monthly") - firstYearCents(10, "annual")).toBe(158800); // economia de R$ 1.588
    expect(firstYearCents(0, "monthly")).toBe(0);
  });

  it("formata em reais", () => {
    expect(nbsp(formatBRL(29900))).toBe("R$ 299");
    expect(nbsp(formatBRL(2990))).toBe("R$ 29,90");
    expect(nbsp(formatBRL(44850))).toBe("R$ 448,50");
    expect(nbsp(formatBRL(102500))).toBe("R$ 1.025");
    expect(nbsp(formatBRL(2550))).toBe("R$ 25,50");
  });

  it("traduz o erro da trava de leitos contratados", () => {
    expect(friendlyCapacityError("Limite de leitos contratados atingido: 11 configurados para 10 contratados."))
      .toMatch(/^Limite de leitos contratados/);
    expect(friendlyCapacityError(null)).toBe("Erro desconhecido");
  });
});
