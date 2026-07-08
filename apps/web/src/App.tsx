import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import AppLayout from '@/components/Layout/AppLayout';

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<ProtectedRoute requireAuth={false}><LoginPage /></ProtectedRoute>} />
          <Route path="/register" element={<ProtectedRoute requireAuth={false}><RegisterPage /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/dashboards" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/ecommerce" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/academy" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/logistics" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/email" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/invoice" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/user" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/pages" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/auth" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/wizard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/modal" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/typography" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/icons" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;