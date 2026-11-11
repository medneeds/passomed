import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

/**
 * Rota do painel administrativo. Substitui a antiga senha compartilhada:
 * entra quem tem papel de coordenador (admin); telas de implantação exigem
 * ainda ser operador da plataforma. O banco repete a checagem em cada tabela
 * (RLS), então esconder a tela é conveniência, não a barreira.
 */
export function AdminRoute({ children, platformOnly = false }: { children: ReactNode; platformOnly?: boolean }) {
  return (
    <ProtectedRoute>
      <AdminGate platformOnly={platformOnly}>{children}</AdminGate>
    </ProtectedRoute>
  );
}

function AdminGate({ children, platformOnly }: { children: ReactNode; platformOnly: boolean }) {
  const { role, loading } = useAuth();
  const { isPlatformAdmin, isLoading } = useHospital();
  if (loading || isLoading) return null;
  if (role !== "admin") return <Navigate to="/" replace />;
  if (platformOnly && !isPlatformAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
