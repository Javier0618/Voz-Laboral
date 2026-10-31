import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Loading } from './components/ui';
import { CalcMeta } from './components/CalcMeta';
import Home from './pages/Home';
import Companies from './pages/Companies';
import CompanyProfile from './pages/CompanyProfile';
import Experiences from './pages/Experiences';
import Rights, { RightsArticle } from './pages/Rights';
import Share from './pages/Share';
import Tracking from './pages/Tracking';
import About from './pages/About';
import ExperienceDetail from './pages/ExperienceDetail';
import Notifications from './pages/Notifications';
import Account, { NewPasswordPage } from './pages/Account';
import Claim from './pages/Claim';
import PolicyPage, { NotFound } from './pages/Policies';

// El panel de moderación se carga aparte: no forma parte del área pública.
const Admin = lazy(() => import('./pages/Admin'));
const GuideEditor = lazy(() => import('./pages/GuideEditor'));
const Liquidacion = lazy(() => import('./pages/Liquidacion'));
const CalculadorasIndex = lazy(() => import('./pages/calculadoras/Index'));
const Administrativos = lazy(() => import('./pages/calculadoras/Administrativos'));
const TurnosPage = lazy(() => import('./pages/calculadoras/Turnos'));
const PorDias = lazy(() => import('./pages/calculadoras/PorDias'));
const PrimaPage = lazy(() => import('./pages/calculadoras/Prima'));
const PrestacionServiciosPage = lazy(() => import('./pages/calculadoras/PrestacionServicios'));

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="page py-10"><Loading /></div>}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="empresas" element={<Companies />} />
        <Route path="empresas/:slug" element={<CompanyProfile />} />
        <Route path="empresas/:slug/reclamacion" element={<Claim />} />
        <Route path="experiencias" element={<Experiences />} />
        <Route path="experiencias/:id" element={<ExperienceDetail />} />
        <Route path="derechos" element={<Rights />} />
        <Route path="derechos/:slug" element={<RightsArticle />} />
        <Route path="compartir" element={<Share />} />
        <Route path="liquidacion" element={<LazyPage><CalcMeta path="/liquidacion"><Liquidacion /></CalcMeta></LazyPage>} />
        <Route path="calculadoras" element={<LazyPage><CalculadorasIndex /></LazyPage>} />
        <Route path="calculadoras/administrativos" element={<LazyPage><Administrativos /></LazyPage>} />
        <Route path="calculadoras/operativos" element={<LazyPage><CalcMeta path="/calculadoras/operativos"><TurnosPage tipo="operativos" /></CalcMeta></LazyPage>} />
        <Route path="calculadoras/vigilantes" element={<LazyPage><CalcMeta path="/calculadoras/vigilantes"><TurnosPage tipo="vigilantes" /></CalcMeta></LazyPage>} />
        <Route path="calculadoras/por-dias" element={<LazyPage><PorDias /></LazyPage>} />
        <Route path="calculadoras/prima" element={<LazyPage><CalcMeta path="/calculadoras/prima"><PrimaPage /></CalcMeta></LazyPage>} />
        <Route path="calculadoras/prestacion-servicios" element={<LazyPage><CalcMeta path="/calculadoras/prestacion-servicios"><PrestacionServiciosPage /></CalcMeta></LazyPage>} />
        <Route path="calculadoras/liquidacion" element={<LazyPage><CalcMeta path="/liquidacion"><Liquidacion /></CalcMeta></LazyPage>} />
        <Route path="cuenta" element={<Account />} />
        <Route path="seguimiento/:token" element={<Tracking />} />
        <Route path="como-funciona" element={<About />} />
        <Route path="avisos" element={<Notifications />} />
        <Route path="cuenta/nueva-contrasena" element={<NewPasswordPage />} />
        <Route path="politicas/:slug" element={<PolicyPage />} />
        <Route path="moderacion" element={<LazyPage><Admin /></LazyPage>} />
        <Route path="moderacion/guias/:id" element={<LazyPage><GuideEditor /></LazyPage>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
