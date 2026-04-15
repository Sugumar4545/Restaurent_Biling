import React from 'react';
import { Link } from 'react-router-dom';

const adminModules = [
  {
    path: '/admin/billing',
    title: 'Billing',
    icon: '💰',
    description: 'Convert orders to invoices, apply tax & discounts, print bills',
    color: 'bg-blue-500',
  },
  {
    path: '/admin/inventory',
    title: 'Inventory',
    icon: '📦',
    description: 'Manage stock levels, add/edit menu items, track availability',
    color: 'bg-green-500',
  },
  {
    path: '/admin/staff',
    title: 'Staff Management',
    icon: '👥',
    description: 'Manage workers, roles, attendance tracking',
    color: 'bg-purple-500',
  },
  {
    path: '/admin/reports',
    title: 'Reports',
    icon: '📊',
    description: 'Daily sales summary, top selling items, category analysis',
    color: 'bg-orange-500',
  },
];

function AdminPanel() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>

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
