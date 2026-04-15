import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function ReportsPanel() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailySales, setDailySales] = useState(null);
  const [topSelling, setTopSelling] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);

  useEffect(() => {
    loadReports();
  }, [date]);

  const loadReports = async () => {
    try {
      const [sales, top, category, hourly] = await Promise.all([
        reportsApi.getDailySales(date),
        reportsApi.getTopSelling(date),
        reportsApi.getByCategory(date),
        reportsApi.getHourly(date),
      ]);
      setDailySales(sales);
      setTopSelling(top);
      setCategoryData(category);
      setHourlyData(
        hourly.map((h) => ({
          ...h,
          hour: `${String(h.hour).padStart(2, '0')}:00`,
          revenue: parseFloat(h.revenue),
        }))
      );
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-48"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {dailySales && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-3xl font-bold text-gray-800">{dailySales.total_orders}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Net Sales</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{parseFloat(dailySales.net_sales).toFixed(0)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Dine-in / Parcel</p>
            <p className="text-2xl font-bold text-blue-600">
              {dailySales.dine_in_orders} / {dailySales.parcel_orders}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Paid Orders</p>
            <p className="text-3xl font-bold text-purple-600">{dailySales.paid_orders}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items Chart */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Selling Items</h3>
          {topSelling.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSelling}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="item_name" fontSize={11} angle={-30} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_quantity" name="Quantity Sold" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-400 py-12">No sales data for this date</div>
          )}
        </div>

        {/* Sales by Category Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sales by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ category, percent }) =>
                    `${category} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                  nameKey="category"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${parseFloat(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-400 py-12">No category data for this date</div>
          )}
        </div>

        {/* Hourly Sales Line Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Hourly Sales Trend</h3>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="order_count"
                  name="Orders"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-400 py-12">No hourly data for this date</div>
          )}
        </div>

        {/* Top Selling Table */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Details</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2">#</th>
                <th className="text-left py-3 px-2">Item Name</th>
                <th className="text-right py-3 px-2">Qty Sold</th>
                <th className="text-right py-3 px-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topSelling.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-2 text-gray-400">{idx + 1}</td>
                  <td className="py-2 px-2 font-medium">{item.item_name}</td>
                  <td className="py-2 px-2 text-right">{item.total_quantity}</td>
                  <td className="py-2 px-2 text-right font-medium text-green-600">
                    ₹{parseFloat(item.total_revenue).toFixed(2)}
                  </td>
                </tr>
              ))}
              {topSelling.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">
                    No sales data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReportsPanel;
