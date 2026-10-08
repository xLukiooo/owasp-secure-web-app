import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingAnimation from './components/LoadingAnimation';
import { ensureCsrfToken } from './api/apiBase';
import { checkIsLoggedIn } from './api/auth';
import './App.css';

// Lazy loading stron - ładuje komponenty tylko wtedy, gdy są potrzebne.
const Home = lazy(() => import('./pages/Home'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ResetPasswordConfirm = lazy(() => import('./pages/ResetPasswordConfirm'));
const ActivateAccount = lazy(() => import('./pages/ActivateAccount'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ModeratorDashboard = lazy(() => import('./pages/ModeratorDashboard')); // Nowa strona dla moderatora

/**
 * Komponent PrivateRoute zabezpiecza dostęp do tras przeznaczonych dla zalogowanych użytkowników.
 * Renderuje zawartość, jeśli użytkownik jest zalogowany; w przeciwnym razie przekierowuje na stronę logowania.
 */
function PrivateRoute({ isLoggedIn, children }) {
  return isLoggedIn ? children : <Navigate to="/login" />;
}

/**
 * Główny komponent aplikacji.
 * Inicjalizuje token CSRF, sprawdza status autoryzacji (wraz z rolą użytkownika) oraz ustawia routing.
 * Nawigacja została przeniesiona do komponentu Home.
 */
function App() {
  // Stan przechowujący informacje o zalogowaniu i roli użytkownika.
  const [authStatus, setAuthStatus] = useState({ isLoggedIn: false, isModerator: false });
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await ensureCsrfToken();
        const authData = await checkIsLoggedIn();
        setAuthStatus(authData);
      } catch (error) {
        console.error('Błąd podczas inicjalizacji:', error);
      } finally {
        setCheckingAuth(false);
      }
    }
    init();
  }, []);

  if (checkingAuth) {
    return <LoadingAnimation />;
  }

  return (
    <Router>
      <div className="App" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <ErrorBoundary>
          <Suspense fallback={<LoadingAnimation />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login onLoginSuccess={setAuthStatus} />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-password/confirm" element={<ResetPasswordConfirm />} />
              <Route path="/activate" element={<ActivateAccount />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute isLoggedIn={authStatus.isLoggedIn}>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/moderator-dashboard" 
                element={
                  <PrivateRoute isLoggedIn={authStatus.isLoggedIn}>
                    {authStatus.isModerator ? <ModeratorDashboard /> : <Navigate to="/dashboard" />}
                  </PrivateRoute>
                } 
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
