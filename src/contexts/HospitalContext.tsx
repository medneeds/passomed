import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";

export interface State {
  id: string;
  name: string;
  abbreviation: string;
}

export interface HospitalUnit {
  id: string;
  name: string;
  state_id: string;
  address: string | null;
}

interface HospitalContextType {
  currentState: State | null;
  currentHospital: HospitalUnit | null;
  states: State[];
  hospitals: HospitalUnit[];
  isLoading: boolean;
  /** Operador da plataforma: atravessa instituições (implantação e suporte). */
  isPlatformAdmin: boolean;
  setCurrentHospital: (hospital: HospitalUnit) => void;
  fetchStatesAndHospitals: () => Promise<void>;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

const STORAGE_KEY_STATE = "selected_state_id";
const STORAGE_KEY_HOSPITAL = "selected_hospital_id";

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [currentState, setCurrentState] = useState<State | null>(null);
  const [currentHospital, setCurrentHospitalState] = useState<HospitalUnit | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [hospitals, setHospitals] = useState<HospitalUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const { user } = useAuth();

  const fetchStatesAndHospitals = async () => {
    try {
      setIsLoading(true);
      
      // Fetch states
      const { data: statesData, error: statesError } = await supabase
        .from('states')
        .select('*')
        .order('name');

      if (statesError) throw statesError;
      setStates(statesData || []);

      // Fetch hospitals
      const { data: hospitalsData, error: hospitalsError } = await supabase
        .from('hospital_units')
        .select('*')
        .order('name');

      if (hospitalsError) throw hospitalsError;

      // Usuário logado só enxerga (e alterna entre) as unidades a que está
      // vinculado; o operador da plataforma vê todas. Sem login (tela de
      // cadastro) a lista segue completa.
      let visibleHospitals = hospitalsData || [];
      let platformAdmin = false;
      if (user) {
        const { data: access, error: accessError } = await db.rpc("my_access");
        if (!accessError && access) {
          platformAdmin = !!access.is_platform_admin;
          if (!platformAdmin) {
            const allowed = new Set<string>(access.unit_ids || []);
            visibleHospitals = visibleHospitals.filter(h => allowed.has(h.id));
          }
        }
        // Se a função ainda não existe no banco (migração pendente), mantém
        // o comportamento antigo: lista completa, e a RLS decide o acesso.
      }
      setIsPlatformAdmin(platformAdmin);
      setHospitals(visibleHospitals);

      // Try to restore from localStorage or set default
      const storedStateId = localStorage.getItem(STORAGE_KEY_STATE);
      const storedHospitalId = localStorage.getItem(STORAGE_KEY_HOSPITAL);

      if (storedStateId && storedHospitalId) {
        const state = statesData?.find(s => s.id === storedStateId);
        const hospital = visibleHospitals.find(h => h.id === storedHospitalId);
        
        if (state && hospital) {
          setCurrentState(state);
          setCurrentHospitalState(hospital);
          setIsLoading(false);
          return;
        }
      }

      // Default: primeiro estado e primeira unidade disponíveis (whitelabel-agnostic).
      const defaultHospital = visibleHospitals[0];
      const defaultState = statesData?.find(s => s.id === defaultHospital?.state_id) ?? statesData?.[0];
      if (defaultState && defaultHospital) {
        setCurrentState(defaultState);
        setCurrentHospitalState(defaultHospital);
        localStorage.setItem(STORAGE_KEY_STATE, defaultState.id);
        localStorage.setItem(STORAGE_KEY_HOSPITAL, defaultHospital.id);
      } else if (user) {
        // Logado e sem unidade acessível: não mantém seleção de outra instituição.
        setCurrentHospitalState(null);
        localStorage.removeItem(STORAGE_KEY_HOSPITAL);
      }
    } catch (error) {
      console.error('Error fetching states and hospitals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentHospital = (hospital: HospitalUnit) => {
    setCurrentHospitalState(hospital);
    localStorage.setItem(STORAGE_KEY_HOSPITAL, hospital.id);
    
    // Update state based on hospital
    const state = states.find(s => s.id === hospital.state_id);
    if (state) {
      setCurrentState(state);
      localStorage.setItem(STORAGE_KEY_STATE, state.id);
    }
  };

  useEffect(() => {
    fetchStatesAndHospitals();
    // Refaz ao entrar/sair: a lista de unidades depende de quem está logado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <HospitalContext.Provider
      value={{
        currentState,
        currentHospital,
        states,
        hospitals,
        isLoading,
        isPlatformAdmin,
        setCurrentHospital,
        fetchStatesAndHospitals,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = useContext(HospitalContext);
  if (context === undefined) {
    throw new Error("useHospital must be used within a HospitalProvider");
  }
  return context;
}
