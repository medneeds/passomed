import { describe, expect, it } from "vitest";
import { formatBRL, friendlyCapacityError, monthlyCents, PRICE_PER_BED_CENTS } from "./billing";

const nbsp = (value: string) => value.split(String.fromCharCode(160)).join(" ");

describe("cobrança por leito", () => {
  it("cobra R$ 25 por leito", () => {
    expect(PRICE_PER_BED_CENTS).toBe(2500);
    expect(monthlyCents(10)).toBe(25000); // UTI de 10 leitos = R$ 250
    expect(monthlyCents(20)).toBe(50000); // UTI de 20 leitos = R$ 500
    expect(monthlyCents(5 + 10)).toBe(37500); // vermelha 5 + amarela 10 = R$ 375
  });

  it("não cobra valor negativo nem fração de leito", () => {
    expect(monthlyCents(-3)).toBe(0);
    expect(monthlyCents(10.9)).toBe(25000);
    expect(monthlyCents(Number.NaN)).toBe(0);
  });

  it("aceita preço negociado", () => {
    expect(monthlyCents(10, 2000)).toBe(20000);
  });

  it("formata em reais", () => {
    expect(nbsp(formatBRL(37500))).toBe("R$ 375");
    expect(nbsp(formatBRL(102500))).toBe("R$ 1.025");
    expect(nbsp(formatBRL(2550))).toBe("R$ 25,50");
  });

  it("traduz o erro da trava de leitos contratados", () => {
    expect(friendlyCapacityError("Limite de leitos contratados atingido: 11 configurados para 10 contratados."))
      .toMatch(/^Limite de leitos contratados/);
    expect(friendlyCapacityError(null)).toBe("Erro desconhecido");
  });
});
