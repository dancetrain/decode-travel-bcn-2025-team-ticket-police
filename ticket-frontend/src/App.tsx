import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { SupplierRegistration } from './pages/SupplierRegistration';
import { SupplierLogin } from './pages/SupplierLogin';
import { SupplierDashboard } from './pages/SupplierDashboard';
import { IssueTicket } from './pages/IssueTicket';
import { DistributorRegistration } from './pages/DistributorRegistration';
import { DistributorLogin } from './pages/DistributorLogin';
import { DistributorDashboard } from './pages/DistributorDashboard';
import { PointOfSale } from './pages/PointOfSale';
function ProtectedRoute({
  children,
  role
}: {
  children: React.ReactNode;
  role: 'supplier' | 'distributor';
}) {
  const {
    currentUser
  } = useApp();
  if (!currentUser || currentUser.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
function AuthenticatedRoute({
  children
}: {
  children: React.ReactNode;
}) {
  const {
    currentUser
  } = useApp();
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
function AppRoutes() {
  return <>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/supplier/register" element={<SupplierRegistration />} />
        <Route path="/supplier/login" element={<SupplierLogin />} />
        <Route path="/supplier/dashboard" element={<ProtectedRoute role="supplier">
              <SupplierDashboard />
            </ProtectedRoute>} />
        <Route path="/supplier/issue-ticket" element={<ProtectedRoute role="supplier">
              <IssueTicket />
            </ProtectedRoute>} />
        <Route path="/point-of-sale" element={<AuthenticatedRoute>
              <PointOfSale />
            </AuthenticatedRoute>} />
        <Route path="/distributor/register" element={<DistributorRegistration />} />
        <Route path="/distributor/login" element={<DistributorLogin />} />
        <Route path="/distributor/dashboard" element={<ProtectedRoute role="distributor">
              <DistributorDashboard />
            </ProtectedRoute>} />
      </Routes>
    </>;
}
export function App() {
  return <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>;
}