import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const KEY = "passomed.cookie-notice.v1";

/**
 * Aviso de cookies das páginas públicas. O site só usa armazenamento
 * estritamente necessário (sem análise nem anúncios de terceiros), então este
 * aviso é informativo, não um pedido de consentimento. Se algum dia entrar
 * pixel ou ferramenta de análise, trocar por um banner com opção de recusar.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!localStorage.getItem(KEY));
    } catch {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      /* sem armazenamento: só fecha */
    }
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-16 z-50 mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-foreground shadow-xl sm:flex-row sm:items-center"
    >
      <p className="flex-1 leading-relaxed">
        Usamos apenas armazenamento necessário para o site funcionar, sem cookies de anúncios ou de análise.{" "}
        <Link to="/privacidade#cookies" className="font-medium underline underline-offset-4">
          Saiba mais
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="min-h-11 shrink-0 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
      >
        Entendi
      </button>
    </div>
  );
}
