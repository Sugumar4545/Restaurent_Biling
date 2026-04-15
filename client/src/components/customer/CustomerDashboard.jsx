import React, { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '../../utils/api';
import socket from '../../utils/socket';
import { useLanguage } from '../../utils/LanguageContext';

function CustomerDashboard() {
  const [orders, setOrders] = useState([]);
  const { t, language } = useLanguage();

  const loadOrders = useCallback(async () => {
    try {
      const data = await ordersApi.getActive();
      setOrders(data.filter((o) => o.status === 'Preparing' || o.status === 'Ready'));
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    socket.on('NEW_ORDER', () => loadOrders());
    socket.on('ORDER_STATUS_UPDATE', (updatedOrder) => {
      setOrders((prev) => {
        let updated = prev.map((o) =>
          o.order_id === updatedOrder.order_id ? updatedOrder : o
        );
        // Add if new and relevant
        if (!prev.find((o) => o.order_id === updatedOrder.order_id)) {
          if (['Preparing', 'Ready'].includes(updatedOrder.status)) {
            updated = [...updated, updatedOrder];
          }
        }
        // Remove if no longer active
        return updated.filter((o) => ['Preparing', 'Ready'].includes(o.status));
      });
    });

    socket.on('ORDER_READY', (order) => {
      setOrders((prev) => {
        const exists = prev.find((o) => o.order_id === order.order_id);
        if (exists) {
          return prev.map((o) => (o.order_id === order.order_id ? order : o));
        }
        return [...prev, order];
      });
    });

    const interval = setInterval(loadOrders, 15000);

    return () => {
      socket.off('NEW_ORDER');
      socket.off('ORDER_STATUS_UPDATE');
      socket.off('ORDER_READY');
      clearInterval(interval);
    };
  }, [loadOrders]);

  const preparingOrders = orders.filter((o) => o.status === 'Preparing');
  const readyOrders = orders.filter((o) => o.status === 'Ready');

  const getElapsedTime = (timestamp) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ${diffMins % 60}m`;
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-purple-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{'\u{1F37D}\u{FE0F}'}</span>
            <h1 className="text-2xl font-bold">{t('orderStatusBoard')}</h1>
          </div>
          <div className="text-lg font-mono">
            {new Date().toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Preparing */}
        <div className="flex-1 bg-gray-800 p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 rounded-full bg-yellow-400 animate-pulse"></div>
            <h2 className="text-xl font-bold text-yellow-400">
              {t('preparing').toUpperCase()} ({preparingOrders.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preparingOrders.map((order) => (
              <div
                key={order.order_id}
                className="bg-gray-700 rounded-xl p-4 border-l-4 border-yellow-400 animate-slide-in"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-yellow-300">{order.order_id}</h3>
                  <span className="text-sm text-gray-400">
                    {order.table_number ? `${t('table')} #${order.table_number}` : t('parcel')}
                  </span>
                </div>
                <div className="space-y-1">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="text-sm text-gray-300">
                      <span className="font-medium text-white">{item.quantity}x</span> {item.item_name}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {t('ordered')} {getElapsedTime(order.created_at)} {t('ago')}
                </div>
              </div>
            ))}
          </div>

          {preparingOrders.length === 0 && (
            <div className="text-center text-gray-500 py-16">
              <p className="text-5xl mb-3">{'\u{1F373}'}</p>
              <p className="text-lg">{t('noOrdersPreparing')}</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-1 bg-gray-600"></div>

        {/* Right: Ready */}
        <div className="flex-1 bg-gray-800 p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse"></div>
            <h2 className="text-xl font-bold text-green-400">
              {t('readyForPickup')} ({readyOrders.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readyOrders.map((order) => (
              <div
                key={order.order_id}
                className="bg-green-900/30 rounded-xl p-4 border-2 border-green-400 animate-slide-in"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-black text-green-300">{order.order_id}</h3>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                    READY
                  </span>
                </div>
                <div className="text-sm text-gray-400 mb-1">
                  {order.table_number ? `${t('table')} #${order.table_number}` : t('parcelOrder')}
                </div>
                <div className="space-y-1">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="text-sm text-gray-300">
                      <span className="font-medium text-white">{item.quantity}x</span> {item.item_name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {readyOrders.length === 0 && (
            <div className="text-center text-gray-500 py-16">
              <p className="text-5xl mb-3">{'\u{2705}'}</p>
              <p className="text-lg">{t('noOrdersReady')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
