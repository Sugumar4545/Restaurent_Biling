import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../utils/api';
import socket from '../../utils/socket';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function BillingPanel() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [taxPercent, setTaxPercent] = useState(5);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadOrders();

    socket.on('NEW_ORDER', () => loadOrders());
    socket.on('ORDER_STATUS_UPDATE', () => loadOrders());

    return () => {
      socket.off('NEW_ORDER');
      socket.off('ORDER_STATUS_UPDATE');
    };
  }, []);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getActive();
      // Also get today's paid orders
      const today = new Date().toISOString().split('T')[0];
      const allToday = await ordersApi.getAll({ date: today });
      // Combine active + paid orders, remove duplicates
      const combined = [...data];
      for (const order of allToday) {
        if (!combined.find((o) => o.order_id === order.order_id)) {
          combined.push(order);
        }
      }
      setOrders(combined);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const handleBillOrder = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const result = await ordersApi.bill(selectedOrder.order_id, {
        tax_percent: taxPercent,
        discount_amount: discountAmount,
      });
      setSelectedOrder(result);
      setNotification({ type: 'success', message: 'Order billed successfully!' });
      loadOrders();
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to bill order: ' + err.message });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Use dynamic values for unpaid orders, DB values for paid orders
    const subtotal = parseFloat(order.total_amount);
    const pdfTax = order.status === 'Paid'
      ? parseFloat(order.tax_amount || 0)
      : (subtotal * taxPercent) / 100;
    const pdfDiscount = order.status === 'Paid'
      ? parseFloat(order.discount_amount || 0)
      : discountAmount;
    const pdfTotal = order.status === 'Paid'
      ? parseFloat(order.final_amount)
      : subtotal + pdfTax - pdfDiscount;

    // Header
    doc.setFontSize(20);
    doc.text('Restaurant POS', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Tax Invoice', pageWidth / 2, 27, { align: 'center' });

    // Order details
    doc.setFontSize(11);
    doc.text(`Order ID: ${order.order_id}`, 14, 40);
    doc.text(`Date: ${new Date(order.created_at).toLocaleString('en-IN')}`, 14, 47);
    doc.text(
      order.table_number ? `Table: #${order.table_number}` : 'Type: Parcel',
      14, 54
    );
    doc.text(`Status: ${order.status}`, 14, 61);

    // Items table
    const tableData = order.items.map((item) => [
      item.item_name,
      item.quantity.toString(),
      `₹${parseFloat(item.price).toFixed(2)}`,
      `₹${(item.quantity * parseFloat(item.price)).toFixed(2)}`,
    ]);

    doc.autoTable({
      startY: 68,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Totals - use computed values that match the on-screen display
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 14, finalY);
    doc.text(`Tax: ₹${pdfTax.toFixed(2)}`, 14, finalY + 7);
    doc.text(`Discount: ₹${pdfDiscount.toFixed(2)}`, 14, finalY + 14);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: ₹${pdfTotal.toFixed(2)}`, 14, finalY + 24);

    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for dining with us!', pageWidth / 2, finalY + 40, {
      align: 'center',
    });

    doc.save(`invoice-${order.order_id}.pdf`);
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: 'bg-red-100 text-red-700',
      Preparing: 'bg-yellow-100 text-yellow-700',
      Ready: 'bg-blue-100 text-blue-700',
      Paid: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-4 h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row gap-4">
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-slide-in ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Orders List */}
      <div className="flex-1 flex flex-col min-w-0">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Orders</h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          {orders.map((order) => (
            <button
              key={order.order_id}
              onClick={() => {
                setSelectedOrder(order);
                setDiscountAmount(0);
              }}
              className={`w-full text-left card hover:shadow-md transition-all ${
                selectedOrder?.order_id === order.order_id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{order.order_id}</h3>
                  <p className="text-xs text-gray-500">
                    {order.table_number ? `Table #${order.table_number}` : 'Parcel'} |{' '}
                    {new Date(order.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                  <p className="text-sm font-bold mt-1">₹{parseFloat(order.final_amount).toFixed(2)}</p>
                </div>
              </div>
            </button>
          ))}
          {orders.length === 0 && (
            <div className="text-center text-gray-400 py-12">No orders today</div>
          )}
        </div>
      </div>

      {/* Billing Detail */}
      <div className="w-full lg:w-[420px]">
        <div className="card h-full flex flex-col">
          {selectedOrder ? (
            <>
              <h2 className="text-lg font-bold mb-4">Invoice - {selectedOrder.order_id}</h2>

              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Table:</span>
                  <span className="font-medium">
                    {selectedOrder.table_number ? `#${selectedOrder.table_number}` : 'Parcel'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time:</span>
                  <span className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500">Item</th>
                      <th className="text-center py-2 text-gray-500">Qty</th>
                      <th className="text-right py-2 text-gray-500">Price</th>
                      <th className="text-right py-2 text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items &&
                      selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2">{item.item_name}</td>
                          <td className="py-2 text-center">{item.quantity}</td>
                          <td className="py-2 text-right">₹{parseFloat(item.price).toFixed(2)}</td>
                          <td className="py-2 text-right font-medium">
                            ₹{(item.quantity * parseFloat(item.price)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Billing Controls */}
              {selectedOrder.status !== 'Paid' && (
                <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium w-20">Tax %:</label>
                    <input
                      type="number"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="input w-24 text-sm"
                      min="0"
                      max="28"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium w-20">Discount:</label>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="input w-24 text-sm"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <span>₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax ({taxPercent}%):</span>
                  <span>
                    ₹{selectedOrder.status === 'Paid'
                      ? parseFloat(selectedOrder.tax_amount).toFixed(2)
                      : ((parseFloat(selectedOrder.total_amount) * taxPercent) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount:</span>
                  <span>
                    -₹{selectedOrder.status === 'Paid'
                      ? parseFloat(selectedOrder.discount_amount).toFixed(2)
                      : discountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-green-600">
                    ₹{selectedOrder.status === 'Paid'
                      ? parseFloat(selectedOrder.final_amount).toFixed(2)
                      : (
                          parseFloat(selectedOrder.total_amount) +
                          (parseFloat(selectedOrder.total_amount) * taxPercent) / 100 -
                          discountAmount
                        ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                {selectedOrder.status !== 'Paid' && (
                  <button
                    onClick={handleBillOrder}
                    disabled={loading}
                    className="flex-1 btn btn-success"
                  >
                    {loading ? 'Processing...' : 'Mark as Paid'}
                  </button>
                )}
                <button
                  onClick={() => generatePDF(selectedOrder)}
                  className="flex-1 btn btn-primary"
                >
                  Download Invoice
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-5xl mb-3">💰</p>
                <p>Select an order to generate bill</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BillingPanel;
