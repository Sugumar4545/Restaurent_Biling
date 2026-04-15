import React, { useState, useEffect } from 'react';
import { menuApi } from '../../utils/api';

function InventoryPanel() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock_quantity: '',
    is_available: true,
    image_url: '',
  });

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  const loadItems = async () => {
    try {
      const data = await menuApi.getAll();
      setItems(data);
    } catch (err) {
      console.error('Failed to load items:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await menuApi.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await menuApi.update(editingItem.id, {
          ...formData,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
        });
        notify('success', 'Item updated successfully!');
      } else {
        await menuApi.create({
          ...formData,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
        });
        notify('success', 'Item created successfully!');
      }
      resetForm();
      loadItems();
      loadCategories();
    } catch (err) {
      notify('error', 'Failed to save item: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await menuApi.delete(id);
      notify('success', 'Item deleted!');
      loadItems();
    } catch (err) {
      notify('error', 'Failed to delete: ' + err.message);
    }
  };

  const handleStockUpdate = async (id, newStock) => {
    try {
      await menuApi.updateStock(id, newStock);
      loadItems();
    } catch (err) {
      notify('error', 'Failed to update stock');
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      stock_quantity: item.stock_quantity.toString(),
      is_available: item.is_available,
      image_url: item.image_url || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: '',
      price: '',
      category: '',
      stock_quantity: '',
      is_available: true,
      image_url: '',
    });
  };

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredItems = items.filter(
    (item) => selectedCategory === 'All' || item.category === selectedCategory
  );

  const lowStockItems = items.filter((item) => item.stock_quantity < 10);

  return (
    <div className="p-4">
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-slide-in ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="btn btn-primary"
        >
          + Add Item
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-red-700 mb-2">Low Stock Alert</h3>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span key={item.id} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                {item.name}: {item.stock_quantity} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="font-bold text-lg mb-4">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                list="categories"
                required
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="input"
                min="0"
                required
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Available</span>
              </label>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn btn-success">
                {editingItem ? 'Update' : 'Add Item'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            selectedCategory === 'All'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat} ({items.filter((i) => i.category === cat).length})
          </button>
        ))}
      </div>

      {/* Items Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2">Name</th>
              <th className="text-left py-3 px-2">Category</th>
              <th className="text-right py-3 px-2">Price</th>
              <th className="text-center py-3 px-2">Stock</th>
              <th className="text-center py-3 px-2">Status</th>
              <th className="text-center py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium">{item.name}</td>
                <td className="py-3 px-2 text-gray-500">{item.category}</td>
                <td className="py-3 px-2 text-right font-medium">₹{parseFloat(item.price).toFixed(2)}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleStockUpdate(item.id, Math.max(0, item.stock_quantity - 1))}
                      className="w-6 h-6 rounded bg-gray-200 text-xs hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span
                      className={`font-bold ${
                        item.stock_quantity < 10 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {item.stock_quantity}
                    </span>
                    <button
                      onClick={() => handleStockUpdate(item.id, item.stock_quantity + 1)}
                      className="w-6 h-6 rounded bg-gray-200 text-xs hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      item.is_available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.is_available ? 'Available' : 'Out of Stock'}
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <button
                    onClick={() => startEdit(item)}
                    className="text-blue-600 hover:text-blue-800 mr-3 text-xs font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventoryPanel;
