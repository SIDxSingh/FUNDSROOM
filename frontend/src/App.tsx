import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import ProductList from './pages/products/ProductList';
import StockMovementsPage from './pages/products/StockMovementsPage';
import ChallanList from './pages/challans/ChallanList';
import ChallanForm from './pages/challans/ChallanForm';
import ChallanDetail from './pages/challans/ChallanDetail';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              fontSize: '0.875rem',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/stock-movements" element={<StockMovementsPage />} />
            <Route path="/challans" element={<ChallanList />} />
            <Route path="/challans/new" element={<ChallanForm />} />
            <Route path="/challans/:id" element={<ChallanDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
