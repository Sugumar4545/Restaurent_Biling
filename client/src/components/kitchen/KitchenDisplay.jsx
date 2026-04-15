import React, { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '../../utils/api';
import socket from '../../utils/socket';

function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all'); // all, Pending, Preparing, Ready

  const loadOrders = useCallback(async () => {
    try {
      const data = await ordersApi.getActive();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    // Listen for new orders
    socket.on('NEW_ORDER', (order) => {
      setOrders((prev) => {
        const exists = prev.find((o) => o.order_id === order.order_id);
        if (exists) return prev;
        return [...prev, order];
      });
      // Play notification sound
      playNotificationSound();
    });

    // Listen for status updates
    socket.on('ORDER_STATUS_UPDATE', (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.order_id === updatedOrder.order_id ? updatedOrder : o))
          .filter((o) => ['Pending', 'Preparing', 'Ready'].includes(o.status))
      );
    });

    // Refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000);

    return () => {
      socket.off('NEW_ORDER');
      socket.off('ORDER_STATUS_UPDATE');
      clearInterval(interval);
    };
  }, [loadOrders]);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => { oscillator.stop(); audioCtx.close(); }, 200);
    } catch (e) {
      // Audio not available
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const getElapsedTime = (timestamp) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'border-red-500 bg-red-50';
      case 'Preparing': return 'border-yellow-500 bg-yellow-50';
      case 'Ready': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-red-500 text-white';
      case 'Preparing': return 'bg-yellow-500 text-white';
      case 'Ready': return 'bg-green-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getTimeBadgeColor = (timestamp) => {
    const diffMins = Math.floor((new Date() - new Date(timestamp)) / 60000);
    if (diffMins > 15) return 'bg-red-100 text-red-700';
    if (diffMins > 10) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const filteredOrders = orders.filter((o) =>
    filter === 'all' ? true : o.status === filter
  );

  // Sort: Pending first, then Preparing, then Ready
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const statusOrder = { Pending: 0, Preparing: 1, Ready: 2 };
    const statusDiff = (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.created_at) - new Date(b.created_at);
  });

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const preparingCount = orders.filter((o) => o.status === 'Preparing').length;
  const readyCount = orders.filter((o) => o.status === 'Ready').length;

  return (
    <div className="p-4 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Kitchen Display System</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilter('Pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'Pending' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('Preparing')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'Preparing' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-600'
            }`}
          >
            Preparing ({preparingCount})
          </button>
          <button
            onClick={() => setFilter('Ready')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'Ready' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600'
            }`}
          >
            Ready ({readyCount})
          </button>
        </div>
      </div>

      {/* Order Cards Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedOrders.map((order) => (
            <div
              key={order.order_id}
              className={`rounded-xl border-l-4 shadow-md p-4 ${getStatusColor(order.status)} ${
                order.status === 'Pending' ? 'animate-pulse-border border-2' : ''
              }`}
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-sm text-gray-800">{order.order_id}</h3>
                  <p className="text-xs text-gray-500">
                    {order.table_number ? `Table #${order.table_number}` : 'Parcel'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTimeBadgeColor(order.created_at)}`}>
                    {getElapsedTime(order.created_at)}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1 mb-3">
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{item.quantity}x</span>{' '}
                      <span>{item.item_name}</span>
                      {item.special_instructions && (
                        <p className="text-xs text-orange-600 italic ml-4">
                          {item.special_instructions}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {order.special_instructions && (
                <div className="text-xs text-orange-600 italic border-t border-gray-200 pt-2 mb-3">
                  Note: {order.special_instructions}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {order.status === 'Pending' && (
                  <button
                    onClick={() => updateStatus(order.order_id, 'Preparing')}
                    className="flex-1 btn btn-warning text-sm py-2"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'Preparing' && (
                  <button
                    onClick={() => updateStatus(order.order_id, 'Ready')}
                    className="flex-1 btn btn-success text-sm py-2"
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === 'Ready' && (
                  <div className="flex-1 text-center py-2 text-green-600 font-bold text-sm">
                    Waiting for pickup
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {sortedOrders.length === 0 && (
          <div className="text-center text-gray-400 py-20">
            <p className="text-6xl mb-4">👨‍🍳</p>
            <p className="text-xl">No active orders</p>
            <p className="text-sm mt-2">Orders will appear here in real-time</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default KitchenDisplay;
