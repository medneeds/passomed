import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { resolveInstitutionSlug } from "@/lib/institutionSlug";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/MainLayout";
import { PrivacyProvider } from "@/contexts/PrivacyContext";
import { PalliativeFarewellProvider } from "@/contexts/PalliativeFarewellContext";
import NotFound from "./pages/NotFound";
import { Suspense, lazy, useState } from "react";
import AuthPage from "./pages/AuthPage";
import Landing from "./pages/Landing";

import { AdminRoute } from "@/components/AdminRoute";
import { DemoBanner } from "@/components/DemoBanner";


import { GoProtectedRoute } from "./pages/go/GoProtectedRoute";

// Telas internas carregam sob demanda: a landing não baixa o código do sistema inteiro.
const Index = lazy(() => import("./pages/Index"));
const HandoversPage = lazy(() => import("./pages/HandoversPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const SepsisProtocolPage = lazy(() => import("./pages/SepsisProtocolPage"));
const UltrassomProtocolPage = lazy(() => import("./pages/UltrassomProtocolPage"));
const TomografiasPage = lazy(() => import("./pages/TomografiasPage"));
const HemoderivadosPage = lazy(() => import("./pages/HemoderivadosPage"));
const RegulacoesPage = lazy(() => import("./pages/RegulacoesPage"));
const OpmePage = lazy(() => import("./pages/OpmePage"));
const AltoCustoPage = lazy(() => import("./pages/AltoCustoPage"));
const SadtPage = lazy(() => import("./pages/SadtPage"));
const MovementsPage = lazy(() => import("./pages/MovementsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PriorizacaoCirurgicaPage = lazy(() => import("./pages/PriorizacaoCirurgicaPage"));
const ControleGlicemicoPage = lazy(() => import("./pages/ControleGlicemicoPage"));
const CuidadosPaliativosPage = lazy(() => import("./pages/CuidadosPaliativosPage"));
const FluxoPaliativacaoPage = lazy(() => import("./pages/FluxoPaliativacaoPage"));
const DhdDashboardPage = lazy(() => import("./pages/DhdDashboardPage"));
const DhdRegistrationPage = lazy(() => import("./pages/DhdRegistrationPage"));
const DhdHistoryPage = lazy(() => import("./pages/DhdHistoryPage"));
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage"));
const UserManagementPage = lazy(() => import("./pages/UserManagementPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const AdminStatesPage = lazy(() => import("./pages/AdminStatesPage"));
const AdminUnitsPage = lazy(() => import("./pages/AdminUnitsPage"));
const AdminCoordinatorsPage = lazy(() => import("./pages/AdminCoordinatorsPage"));
const AdminBedsPage = lazy(() => import("./pages/AdminBedsPage"));
const AdminFieldsPage = lazy(() => import("./pages/AdminFieldsPage"));
const AdminLeadsPage = lazy(() => import("./pages/AdminLeadsPage"));
const AdminBrandingPage = lazy(() => import("./pages/AdminBrandingPage"));
const AdminInstitutionsPage = lazy(() => import("./pages/AdminInstitutionsPage"));
const SepsisProtocolsAdminPage = lazy(() => import("./pages/SepsisProtocolsAdminPage"));
const StrokeProtocolsAdminPage = lazy(() => import("./pages/StrokeProtocolsAdminPage"));
const ChestPainProtocolsAdminPage = lazy(() => import("./pages/ChestPainProtocolsAdminPage"));
const GoAuthPage = lazy(() => import("./pages/go/GoAuthPage"));
const GoOverviewPage = lazy(() => import("./pages/go/GoOverviewPage"));
const GoConductorsPage = lazy(() => import("./pages/go/GoConductorsPage"));
const GoBedsPage = lazy(() => import("./pages/go/GoBedsPage"));
const GoIndicatorsPage = lazy(() => import("./pages/go/GoIndicatorsPage"));
const Privacidade = lazy(() => import("./pages/legal/Privacidade"));
const Termos = lazy(() => import("./pages/legal/Termos"));


const queryClient = new QueryClient();

/**
 * Endereço raiz. Quem está logado vai para o mapa; visitante vê a landing.
 * Se o endereço é de uma instituição (subdomínio ou ?i=), o visitante vai
 * direto para o login com a marca dela.
 */
function HomeRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (user) {
    return (
      <ProtectedRoute>
        <Index />
      </ProtectedRoute>
    );
  }
  if (resolveInstitutionSlug()) return <Navigate to={`/auth${location.search}`} replace />;
  return <Landing />;
}

const App = () => {
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  
  return (
    <QueryClientProvider client={queryClient}>
      <PrivacyProvider>
      <PalliativeFarewellProvider>
      <TooltipProvider>
        <DemoBanner />
        <Toaster />
        <Sonner />
        <Suspense fallback={null}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/" element={<HomeRoute />} />
        <Route
          path="/handovers"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <HandoversPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DocumentsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sepsis-protocol"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <SepsisProtocolPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/protocolo-us"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <UltrassomProtocolPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents/controle-glicemico"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <ControleGlicemicoPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/cuidados-paliativos"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <CuidadosPaliativosPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/fluxo-paliativacao"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <FluxoPaliativacaoPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/tomografias"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <TomografiasPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/hemoderivados"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <HemoderivadosPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/regulacoes"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <RegulacoesPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/opme"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <OpmePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/alto-custo"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <AltoCustoPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/sadt"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <SadtPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/priorizacao-cirurgica"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <PriorizacaoCirurgicaPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/movements"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <MovementsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dhd"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <DhdDashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dhd/cadastro"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <DhdRegistrationPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dhd/historico"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <DhdHistoryPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <AdminRoute>
              <AuditLogsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <AdminRoute>
              <UserManagementPage />
            </AdminRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <ProtectedRoute>
              <PrivacyPage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/beds" element={<AdminRoute><AdminBedsPage /></AdminRoute>} />
        <Route path="/admin/fields" element={<AdminRoute><AdminFieldsPage /></AdminRoute>} />
        <Route path="/admin/branding" element={<AdminRoute><AdminBrandingPage /></AdminRoute>} />
        <Route path="/admin/leads" element={<AdminRoute platformOnly><AdminLeadsPage /></AdminRoute>} />
        <Route path="/admin/institutions" element={<AdminRoute platformOnly><AdminInstitutionsPage /></AdminRoute>} />
        <Route
          path="/admin/states"
          element={
            <AdminRoute platformOnly>
              <AdminStatesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/units"
          element={
            <AdminRoute platformOnly>
              <AdminUnitsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/coordinators"
          element={
            <AdminRoute platformOnly>
              <AdminCoordinatorsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/sepsis-protocols"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <SepsisProtocolsAdminPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stroke-protocols"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <StrokeProtocolsAdminPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/chest-pain-protocols"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <ChestPainProtocolsAdminPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* PASSOMED GO — Módulo Operacional */}
        <Route path="/go/auth" element={<GoAuthPage />} />
        <Route path="/go" element={<GoProtectedRoute><GoOverviewPage /></GoProtectedRoute>} />
        <Route path="/go/conductors" element={<GoProtectedRoute><GoConductorsPage /></GoProtectedRoute>} />
        <Route path="/go/beds" element={<GoProtectedRoute><GoBedsPage /></GoProtectedRoute>} />
        <Route path="/go/indicators" element={<GoProtectedRoute><GoIndicatorsPage /></GoProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
        </Suspense>
    </TooltipProvider>
      </PalliativeFarewellProvider>
      </PrivacyProvider>
  </QueryClientProvider>
  );
};

export default App;
