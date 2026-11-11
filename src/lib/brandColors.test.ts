import { describe, expect, it } from "vitest";
import {
  brandCssVars, brandHexTones, contrastRatio, DEFAULT_BRAND, hexToHsl, hslToHex, isHexColor, workingPrimary,
} from "./brandColors";

describe("brandColors", () => {
  it("valida cores hexadecimais", () => {
    expect(isHexColor("#12305C")).toBe(true);
    expect(isHexColor("12305c")).toBe(true);
    expect(isHexColor("#123")).toBe(false);
    expect(isHexColor("azul")).toBe(false);
    expect(isHexColor(null)).toBe(false);
  });

  it("converte hex ↔ HSL sem perder a cor", () => {
    expect(hexToHsl("#ff0000")).toEqual({ h: 0, s: 100, l: 50 });
    expect(hexToHsl("#ffffff")).toEqual({ h: 0, s: 0, l: 100 });
    expect(hslToHex({ h: 0, s: 100, l: 50 })).toBe("#ff0000");
    // HSL é arredondado para inteiros: a volta fica a no máximo 2 níveis por canal.
    const back = hslToHex(hexToHsl("#12305c"));
    [1, 3, 5].forEach((i) => {
      expect(Math.abs(parseInt(back.slice(i, i + 2), 16) - parseInt("#12305c".slice(i, i + 2), 16))).toBeLessThanOrEqual(2);
    });
  });

  it("sem cor da instituição, mantém exatamente o padrão PassoMed", () => {
    expect(brandCssVars(null)).toEqual(DEFAULT_BRAND.vars);
    expect(brandCssVars("não é cor")).toEqual(DEFAULT_BRAND.vars);
    expect(brandHexTones(null)).toEqual({ deep: "#13315e", mid: "#173c73", bright: "#1b4788" });
    // o padrão é legível com texto branco
    expect(contrastRatio(brandHexTones(null).bright, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("usa o matiz da instituição em toda a paleta", () => {
    const vars = brandCssVars("#064E3B");
    expect(vars["--brand-h"]).toBe(String(hexToHsl("#064E3B").h));
    expect(vars["--tint-h"]).toBe(vars["--brand-h"]);
    expect(vars["--gold"]).toBeUndefined();
    expect(brandCssVars("#064E3B", "#C9A227")["--gold"]).toMatch(/^\d+ \d+% \d+%$/);
  });

  it.each(["#ffe600", "#00d4ff", "#ff7ab8", "#ffffff", "#7cfc00", "#1a73e8", "#000000"])(
    "garante texto branco legível sobre a cor principal (%s)",
    (hex) => {
      const { deep, bright } = brandHexTones(hex);
      // AA para texto normal é 4,5:1; o tom mais claro do gradiente ainda passa.
      expect(contrastRatio(deep, "#ffffff")).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(bright, "#ffffff")).toBeGreaterThanOrEqual(4.5);
      expect(workingPrimary(hex).l).toBeLessThanOrEqual(30);
    },
  );
});
