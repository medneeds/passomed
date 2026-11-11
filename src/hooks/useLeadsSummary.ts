import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { db } from "@/integrations/supabase/untyped";
import { useHospital } from "@/contexts/HospitalContext";

export interface LeadsSummary {
  total: number;
  new: number;
  today: number;
  last_7_days: number;
  beds_in_pipeline: number;
}

const POLL_MS = 60_000;

/**
 * Resumo dos cadastros da landing para o operador da plataforma.
 * Reconsulta a cada minuto e avisa na tela quando chega cadastro novo.
 */
export function useLeadsSummary({ notify = false }: { notify?: boolean } = {}) {
  const { isPlatformAdmin } = useHospital();
  const [summary, setSummary] = useState<LeadsSummary | null>(null);
  const lastTotal = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!isPlatformAdmin) return;
    const { data, error } = await db.rpc("sales_leads_summary");
    if (error || !data) return;
    const next = data as LeadsSummary;
    if (notify && lastTotal.current !== null && next.total > lastTotal.current) {
      const arrived = next.total - lastTotal.current;
      toast.info(arrived === 1 ? "Chegou um cadastro novo pela landing." : `Chegaram ${arrived} cadastros novos pela landing.`, {
        action: { label: "Ver", onClick: () => window.location.assign(`${import.meta.env.BASE_URL}admin/leads`) },
        duration: 10_000,
      });
    }
    lastTotal.current = next.total;
    setSummary(next);
  }, [isPlatformAdmin, notify]);

  useEffect(() => {
    if (!isPlatformAdmin) {
      setSummary(null);
      return;
    }
    refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [isPlatformAdmin, refresh]);

  return { summary, refresh };
}
