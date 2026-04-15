import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useLanguage } from './utils/LanguageContext';
import WaiterInterface from './components/waiter/WaiterInterface';
import KitchenDisplay from './components/kitchen/KitchenDisplay';
import CustomerDashboard from './components/customer/CustomerDashboard';
import AdminPanel from './components/admin/AdminPanel';
import BillingPanel from './components/admin/BillingPanel';
import InventoryPanel from './components/admin/InventoryPanel';
import StaffPanel from './components/admin/StaffPanel';
import ReportsPanel from './components/admin/ReportsPanel';

function App() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

  const navItems = [
    { path: '/', label: t('waiter'), icon: '\u{1F4DD}', description: t('takeOrders') },
    { path: '/kitchen', label: t('kitchen'), icon: '\u{1F468}\u{200D}\u{1F373}', description: t('kitchenDisplay') },
    { path: '/customer', label: t('customer'), icon: '\u{1F4FA}', description: t('orderStatus') },
    { path: '/admin', label: t('admin'), icon: '\u{2699}\u{FE0F}', description: t('dashboard') },
    { path: '/admin/billing', label: t('billing'), icon: '\u{1F4B0}', description: t('invoices'), sub: true },
    { path: '/admin/inventory', label: t('inventory'), icon: '\u{1F4E6}', description: t('stock'), sub: true },
    { path: '/admin/staff', label: t('staff'), icon: '\u{1F465}', description: t('employees'), sub: true },
    { path: '/admin/reports', label: t('reports'), icon: '\u{1F4CA}', description: t('analytics'), sub: true },
  ];

  const isCustomerDisplay = location.pathname === '/customer';
  const isAdminSection = location.pathname.startsWith('/admin');

  const mainNavItems = navItems.filter((item) => !item.sub);
  const adminSubItems = navItems.filter((item) => item.sub);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {!isCustomerDisplay && (
        <aside
          className={`${
            collapsed ? 'w-20' : 'w-64'
          } bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl fixed h-screen z-40`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-lg shadow-lg flex-shrink-0">
              🍽️
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-300 to-yellow-200 bg-clip-text text-transparent">
                  {t('hotelName')}
                </h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t('posSystem')}</p>
              </div>
            )}
          </div>

          {/* Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mx-3 mt-3 mb-1 p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white text-xs flex items-center justify-center"
          >
            {collapsed ? '\u{2192}' : `\u{2190} ${t('collapse')}`}
          </button>

          {/* Main Nav */}
          <div className="px-3 mt-2">
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 px-3">
                {t('modules')}
              </p>
            )}
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : item.path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={`text-xl flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110'} transition-transform`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium leading-tight">{item.label}</p>
                        <p className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                          {item.description}
                        </p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin Sub-Nav */}
          {isAdminSection && (
            <div className="px-3 mt-4">
              {!collapsed && (
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 px-3">
                    {t('adminTools')}
                  </p>
              )}
              <nav className="space-y-1">
                {adminSubItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                          : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={`text-lg flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110'} transition-transform`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium leading-tight">{item.label}</p>
                          <p className={`text-[10px] ${isActive ? 'text-purple-200' : 'text-slate-500'}`}>
                            {item.description}
                          </p>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Bottom */}
          <div className="mt-auto px-3 pb-4">
            <div className={`border-t border-slate-700/50 pt-4 ${collapsed ? 'text-center' : ''}`}>
              {!collapsed ? (
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-green-400 font-medium">{t('systemOnline')}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{t('realtimeActive')}</p>
                </div>
              ) : (
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mx-auto"></div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ${
          isCustomerDisplay ? '' : collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {!isCustomerDisplay && (
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-3 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {navItems.find(
                    (item) => item.path === location.pathname
                  )?.label || t('dashboard')}
                </h2>
                <p className="text-xs text-gray-400">
                  {new Date().toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Language Toggle */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-3 py-1.5 rounded-full hover:from-indigo-100 hover:to-purple-100 transition-all"
                  title={t('language')}
                >
                  <span className="text-sm">{'\u{1F310}'}</span>
                  <span className="text-xs font-semibold text-indigo-700">
                    {language === 'en' ? 'EN' : '\u{0BA4}\u{0BAE}\u{0BBF}'}
                  </span>
                </button>
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600 font-medium">{t('live')}</span>
                </div>
              </div>
            </div>
          </header>
        )}

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
