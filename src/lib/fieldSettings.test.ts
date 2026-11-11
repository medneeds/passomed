import { describe, expect, it } from "vitest";
import { fieldCatalog, isFieldVisible, sanitizeHiddenFields } from "./fieldSettings";

describe("campos do leito por unidade", () => {
  it("usa o catálogo de internação para UTI e enfermaria", () => {
    expect(fieldCatalog("UTI").some((f) => f.key === "devices")).toBe(true);
    expect(fieldCatalog("ENFERMARIA").some((f) => f.key === "diet")).toBe(true);
    expect(fieldCatalog("URGÊNCIA E EMERGÊNCIA ADULTO").some((f) => f.key === "devices")).toBe(false);
  });

  it("campo nasce visível e some quando desligado naquele departamento", () => {
    const settings = { UTI: ["diet", "devices"] };
    expect(isFieldVisible({}, "UTI", "diet")).toBe(true);
    expect(isFieldVisible(settings, "UTI", "diet")).toBe(false);
    expect(isFieldVisible(settings, "ENFERMARIA", "diet")).toBe(true);
    expect(isFieldVisible(settings, "UTI", "pendencies")).toBe(true);
  });

  it("campo essencial nunca é escondido", () => {
    expect(isFieldVisible({ UTI: ["diagnoses"] }, "UTI", "diagnoses")).toBe(true);
    expect(sanitizeHiddenFields("UTI", ["diagnoses", "diet", "diet", "inexistente"])).toEqual(["diet"]);
  });
});
