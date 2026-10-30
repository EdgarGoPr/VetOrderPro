import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AccountProvider } from './context/AccountContext';
import { ToastProvider } from './components/feedback/Toast';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Order Pages
import { OrdersListPage } from './pages/orders/OrdersListPage';
import { OrderFormPage } from './pages/orders/OrderFormPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';

// Catalog, Suppliers, Accounts & Profile Pages
import { CatalogPage } from './pages/catalog/CatalogPage';
import { SuppliersPage } from './pages/suppliers/SuppliersPage';
import { AccountsPage } from './pages/accounts/AccountsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AccountProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/recuperar" element={<ForgotPasswordPage />} />
              <Route path="/restablecer" element={<ResetPasswordPage />} />
              <Route path="/resetear" element={<ResetPasswordPage />} />

              {/* Protected Routes inside AppLayout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<OrdersListPage />} />
                <Route path="/pedidos" element={<Navigate to="/" replace />} />
                
                {/* Order creation routes */}
                <Route path="/pedido/nuevo" element={<OrderFormPage />} />
                <Route path="/pedidos/nuevo" element={<OrderFormPage />} />

                {/* Order editing routes */}
                <Route path="/pedido/:id/editar" element={<OrderFormPage />} />
                <Route path="/pedidos/:id/editar" element={<OrderFormPage />} />
                <Route path="/pedido/editar/:id" element={<OrderFormPage />} />

                {/* Order detail routes */}
                <Route path="/pedido/:id" element={<OrderDetailPage />} />
                <Route path="/pedidos/:id" element={<OrderDetailPage />} />

                {/* Catalog, Suppliers & Accounts */}
                <Route path="/proveedores" element={<SuppliersPage />} />
                <Route path="/catalogo" element={<CatalogPage />} />
                <Route path="/cuentas" element={<AccountsPage />} />
                <Route path="/perfil" element={<ProfilePage />} />

                {/* 404 handler inside layout */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </AccountProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
