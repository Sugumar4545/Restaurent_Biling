import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import WaiterInterface from './components/waiter/WaiterInterface';
import KitchenDisplay from './components/kitchen/KitchenDisplay';
import CustomerDashboard from './components/customer/CustomerDashboard';
import AdminPanel from './components/admin/AdminPanel';
import BillingPanel from './components/admin/BillingPanel';
import InventoryPanel from './components/admin/InventoryPanel';
import StaffPanel from './components/admin/StaffPanel';
import ReportsPanel from './components/admin/ReportsPanel';

const navItems = [
  { path: '/', label: 'Waiter', icon: '📝', color: 'blue' },
  { path: '/kitchen', label: 'Kitchen', icon: '👨‍🍳', color: 'orange' },
  { path: '/customer', label: 'Customer Display', icon: '📺', color: 'green' },
  { path: '/admin', label: 'Admin', icon: '⚙️', color: 'purple' },
];

function App() {
  const location = useLocation();

  // Hide nav on customer display (full screen)
  const isCustomerDisplay = location.pathname === '/customer';

  return (
    <div className="min-h-screen bg-gray-50">
      {!isCustomerDisplay && (
        <nav className="bg-white shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍽️</span>
                <h1 className="text-xl font-bold text-gray-800">RestaurantPOS</h1>
              </div>
              <div className="flex gap-1">
                {navItems.map((item) => {
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className={isCustomerDisplay ? '' : 'max-w-7xl mx-auto'}>
        <Routes>
          <Route path="/" element={<WaiterInterface />} />
          <Route path="/kitchen" element={<KitchenDisplay />} />
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/billing" element={<BillingPanel />} />
          <Route path="/admin/inventory" element={<InventoryPanel />} />
          <Route path="/admin/staff" element={<StaffPanel />} />
          <Route path="/admin/reports" element={<ReportsPanel />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
