import { useLocation } from "react-router-dom";

/**
 * Faixa fixa do ambiente de demonstração. Só aparece quando o build é
 * publicado com VITE_DEMO_MODE=true — nunca em produção.
 */
export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === "true";

export function DemoBanner() {
  const { pathname } = useLocation();
  if (!IS_DEMO || pathname === "/landing") return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-2 pb-[max(0.375rem,env(safe-area-inset-bottom))] print:hidden"
    >
      <span className="rounded-full border border-amber-300 bg-amber-50/95 px-3 py-1 text-[11px] font-medium text-amber-900 shadow-sm backdrop-blur">
        Ambiente de demonstração · dados fictícios · reiniciado todas as noites
      </span>
    </div>
  );
}
