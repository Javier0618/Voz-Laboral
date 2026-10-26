import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoadingState } from './components/States';
import Home from './pages/Home';
import Companies from './pages/Companies';
import CompanyProfile from './pages/CompanyProfile';
import Experiences from './pages/Experiences';
import { EmailConfirmed, RecoverPassword, ResetPassword, SignIn, SignUp } from './pages/account/AuthForms';
import { Contact, DataPolicy, Privacy, Rules, Terms } from './pages/legal/LegalPages';
import NotFound from './pages/NotFound';

// Las secciones que requieren sesión se cargan bajo demanda.
const Rights = lazy(() => import('./pages/Rights'));
const Share = lazy(() => import('./pages/Share'));
const Account = lazy(() => import('./pages/account/Account'));
const Admin = lazy(() => import('./pages/Admin'));

export function AppRoutes() {
  return (
    <Suspense fallback={<div className="container-page"><LoadingState /></div>}>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="empresas" element={<Companies />} />
        <Route path="empresas/:slug" element={<CompanyProfile />} />
        <Route path="experiencias" element={<Experiences />} />
        <Route path="derechos" element={<Rights />} />
        <Route path="compartir" element={<Share />} />
        <Route path="cuenta" element={<Account />} />
        <Route path="cuenta/ingresar" element={<SignIn />} />
        <Route path="cuenta/registro" element={<SignUp />} />
        <Route path="cuenta/confirmada" element={<EmailConfirmed />} />
        <Route path="cuenta/recuperar" element={<RecoverPassword />} />
        <Route path="cuenta/nueva-contrasena" element={<ResetPassword />} />
        <Route path="admin" element={<Admin />} />
        <Route path="politica-de-datos" element={<DataPolicy />} />
        <Route path="terminos" element={<Terms />} />
        <Route path="reglas" element={<Rules />} />
        <Route path="privacidad" element={<Privacy />} />
        <Route path="contacto" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
