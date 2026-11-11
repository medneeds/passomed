import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DepartmentProvider } from "./contexts/DepartmentContext";
import { HospitalProvider } from "./contexts/HospitalContext";
import { BrandingProvider, bootstrapBrandingFromCache } from "./contexts/BrandingContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/karla/300.css";
import "@fontsource/karla/400.css";
import "@fontsource/karla/500.css";
import "@fontsource/karla/600.css";
import "@fontsource/karla/700.css";
// Landing page fonts — escopadas via classes font-landing-display / font-landing-sans
import "@fontsource/dm-serif-display/400.css";
import "@fontsource/fira-sans/300.css";
import "@fontsource/fira-sans/400.css";
import "@fontsource/fira-sans/500.css";
import "@fontsource/fira-sans/600.css";
import "@fontsource/fira-sans/700.css";

// Marca em cache aplicada antes do primeiro render (sem piscar a marca padrão).
bootstrapBrandingFromCache();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <BrowserRouter>
      <AuthProvider>
        <HospitalProvider>
          <DepartmentProvider>
            <BrandingProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </BrandingProvider>
          </DepartmentProvider>
        </HospitalProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);
