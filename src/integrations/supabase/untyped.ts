import { supabase } from "./client";

/**
 * Acesso sem tipagem gerada às tabelas e funções criadas pelas migrações
 * white label (sector_bed_capacities, institution_branding ampliada,
 * bed_contracts, billing_invoices, platform_admins e RPCs novas).
 *
 * O arquivo `types.ts` é gerado automaticamente a partir do banco; até ele
 * ser regenerado contra um banco com essas migrações, use `db` só para elas.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;
