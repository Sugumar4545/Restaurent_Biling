import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';

function AdminPanel() {
  const { t } = useLanguage();

  const adminModules = [
    {
      path: '/admin/billing',
      title: t('billing'),
      icon: '\u{1F4B0}',
      description: t('billingDesc'),
      color: 'bg-blue-500',
    },
    {
      path: '/admin/inventory',
      title: t('inventory'),
      icon: '\u{1F4E6}',
      description: t('inventoryDesc'),
      color: 'bg-green-500',
    },
    {
      path: '/admin/staff',
      title: t('staff'),
      icon: '\u{1F465}',
      description: t('staffDesc'),
      color: 'bg-purple-500',
    },
    {
      path: '/admin/reports',
      title: t('reports'),
      icon: '\u{1F4CA}',
      description: t('reportsDesc'),
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('adminDashboard')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminModules.map((module) => (
          <Link
            key={module.path}
            to={module.path}
            className="card hover:shadow-xl hover:scale-[1.02] transition-all group"
          >
            <div className={`w-14 h-14 ${module.color} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
              {module.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{module.title}</h3>
            <p className="text-sm text-gray-500">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;
