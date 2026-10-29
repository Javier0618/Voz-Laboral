import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Loading } from './components/ui';
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
        <Route path="liquidacion" element={<Suspense fallback={<div className="page py-10"><Loading /></div>}><Liquidacion /></Suspense>} />
        <Route path="cuenta" element={<Account />} />
        <Route path="seguimiento/:token" element={<Tracking />} />
        <Route path="como-funciona" element={<About />} />
        <Route path="avisos" element={<Notifications />} />
        <Route path="cuenta/nueva-contrasena" element={<NewPasswordPage />} />
        <Route path="politicas/:slug" element={<PolicyPage />} />
        <Route path="moderacion" element={<Suspense fallback={<div className="page py-10"><Loading /></div>}><Admin /></Suspense>} />
        <Route path="moderacion/guias/:id" element={<Suspense fallback={<div className="page py-10"><Loading /></div>}><GuideEditor /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
