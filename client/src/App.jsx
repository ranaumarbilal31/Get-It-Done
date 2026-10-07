import React, { useEffect, useState, useMemo, startTransition, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

import { StaticRouter } from 'react-router-dom';
import { RouteDataContext } from './routeData';
import PageMeta from './components/PageMeta';
import { useAuth } from './context/AuthContext';
import { Loading } from './components/UI';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AccountPage from './pages/AccountPage';
import AccountSecurityPage from './pages/AccountSecurityPage';
import InfoPage from './pages/InfoPage';
import HomePage from './pages/HomePage';
import BrowseTasksPage from './pages/BrowseTasksPage';
import TaskDetailSSR from './pages/TaskDetailPage';
const TaskDetailPage = TaskDetailSSR;
import PostTaskSSR from './pages/PostTaskPage';
const PostTaskPage = PostTaskSSR;
import ProfileSSR from './pages/ProfilePage';
const ProfilePage = ProfileSSR;
import AdminSSR from './pages/AdminPage';
const AdminPage = import.meta.env.SSR ? AdminSSR : lazy(() => import('./pages/AdminPage'));
import LoginSSR from './pages/LoginPage';
const LoginPage = LoginSSR;
import RegisterSSR from './pages/RegisterPage';
const RegisterPage = RegisterSSR;
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AboutPage from './pages/AboutPage';
import TrustSafetyPage from './pages/TrustSafetyPage';
import FaqPage from './pages/FaqPage';

function Guard({ admin, children }) {
  const { loading, user, isAdmin } = useAuth();
  if (loading) return <Loading>Checking your session…</Loading>;
  if (!user)
    return (
      <div className="page-container">
        <h1>Sign in to continue</h1>
        <a className="button" href="/login">
          Log in
        </a>
      </div>
    );
  if (admin && !isAdmin)
    return (
      <div className="page-container">
        <h1>Access restricted</h1>
        <p>This page is for marketplace administrators.</p>
      </div>
    );
  return children;
}
function NavigationEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
export default function App({ url, initialData = {} }) {
  const Router = url ? StaticRouter : BrowserRouter;
  const [routeData, setRouteData] = useState(initialData);
  const context = useMemo(
    () => ({ ...routeData, setRouteData: (data) => startTransition(() => setRouteData(data)) }),
    [routeData],
  );
  return (
    <Router location={url}>
      <RouteDataContext.Provider value={context}>
        <NavigationEffects />
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <div className="flex flex-col min-h-screen">
                <a className="skip-link" href="#main-content">
                  Skip to content
                </a>
                <Navbar />
                <main id="main-content" className="flex-1">
                  <PageMeta />
                  <Suspense fallback={<Loading>Opening page…</Loading>}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/tasks" element={<BrowseTasksPage />} />
                      <Route path="/tasks/:id" element={<TaskDetailPage />} />
                      <Route path="/post-task" element={<PostTaskPage />} />
                      <Route
                        path="/profile"
                        element={
                          <Guard>
                            <ProfilePage />
                          </Guard>
                        }
                      />
                      <Route path="/users/:userId" element={<ProfilePage />} />
                      <Route
                        path="/admin"
                        element={
                          <Guard admin>
                            <AdminPage />
                          </Guard>
                        }
                      />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route
                        path="/account"
                        element={
                          <Guard>
                            <AccountPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="/change-password"
                        element={
                          <Guard>
                            <AccountSecurityPage kind="change-password" />
                          </Guard>
                        }
                      />
                      {[
                        'verify-email',
                        'resend-verification',
                        'forgot-password',
                        'reset-password',
                      ].map((kind) => (
                        <Route
                          key={kind}
                          path={'/' + kind}
                          element={<AccountSecurityPage key={kind} kind={kind} />}
                        />
                      ))}
                      <Route path="/payments" element={<InfoPage kind="payments" />} />
                      <Route path="/dispute-policy" element={<InfoPage kind="disputes" />} />
                      <Route path="/how-it-works" element={<InfoPage kind="how" />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/trust-safety" element={<TrustSafetyPage />} />
                      <Route path="/faq" element={<FaqPage />} />
                      <Route
                        path="*"
                        element={
                          <div className="page-container">
                            <span className="eyebrow">404</span>
                            <h1>This task took a wrong turn.</h1>
                            <p>We could not find that page.</p>
                            <a href="/tasks" className="button">
                              Browse tasks
                            </a>
                          </div>
                        }
                      />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </RouteDataContext.Provider>
    </Router>
  );
}
