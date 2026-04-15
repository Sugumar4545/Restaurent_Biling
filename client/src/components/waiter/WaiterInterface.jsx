import React, { useState, useEffect } from 'react';
import { menuApi, ordersApi, reportsApi } from '../../utils/api';
import socket from '../../utils/socket';
import { useLanguage } from '../../utils/LanguageContext';
import { getItemEmoji } from '../../utils/i18n';

const TABLES = Array.from({ length: 10 }, (_, i) => i + 1);

function WaiterInterface() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [topSellingNames, setTopSellingNames] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    loadMenu();
    loadCategories();
    loadTopSelling();
  }, []);

  const loadTopSelling = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await reportsApi.getTopSelling(today, 5);
      setTopSellingNames(data.map((d) => d.item_name));
    } catch (err) {
      // Top selling data is optional, fail silently
    }
  };

  const loadMenu = async () => {
    try {
      const items = await menuApi.getAll();
      setMenuItems(items);
    } catch (err) {
      console.error('Failed to load menu:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await menuApi.getCategories();
      setCategories(['All', ...cats]);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const filteredItems = menuItems
    .filter((item) => {
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch && item.is_available;
    })
    .sort((a, b) => {
      // Favourites first
      if (a.is_favourite && !b.is_favourite) return -1;
      if (!a.is_favourite && b.is_favourite) return 1;
      return 0;
    });

  const isTableRequired = orderType === 'dine-in' && !selectedTable;

  const getDiscountedPrice = (item) => {
    const discount = parseFloat(item.discount_percent) || 0;
    if (discount <= 0) return null;
    return parseFloat(item.price) * (1 - discount / 100);
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: 1,
          special_instructions: '',
        },
      ];
    });
  };

  const updateCartItem = (menuItemId, field, value) => {
    setCart((prev) =>
      prev.map((c) => (c.menu_item_id === menuItemId ? { ...c, [field]: value } : c))
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((c) => c.menu_item_id !== menuItemId));
  };

  const decrementQuantity = (menuItemId) => {
    setCart((prev) => {
      const item = prev.find((c) => c.menu_item_id === menuItemId);
      if (item && item.quantity <= 1) {
        return prev.filter((c) => c.menu_item_id !== menuItemId);
      }
      return prev.map((c) =>
        c.menu_item_id === menuItemId ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const sendToKitchen = async () => {
    if (cart.length === 0) return;
    if (orderType === 'dine-in' && !selectedTable) {
      setNotification({ type: 'error', message: t('selectTableFirst') });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        table_number: orderType === 'dine-in' ? selectedTable : null,
        items: cart,
        order_type: orderType,
        special_instructions: specialInstructions,
      };

      await ordersApi.create(orderData);

      setNotification({ type: 'success', message: t('orderSent') });
      setCart([]);
      setSpecialInstructions('');
      setSelectedTable(null);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to send order: ' + err.message });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 h-[calc(100vh-3.5rem)]">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-slide-in ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Order Type & Table Selection */}
        <div className="card mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setOrderType('dine-in')}
                className={`btn ${orderType === 'dine-in' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {'\u{1F37D}\u{FE0F}'} {t('dineIn')}
              </button>
              <button
                onClick={() => { setOrderType('parcel'); setSelectedTable(null); }}
                className={`btn ${orderType === 'parcel' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {'\u{1F4E6}'} {t('parcel')}
              </button>
            </div>

            {orderType === 'dine-in' && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600 self-center">{t('table')}:</span>
                {TABLES.map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => setSelectedTable(tbl)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                      selectedTable === tbl
                        ? 'bg-blue-600 text-white shadow-md scale-110'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table selection guard overlay */}
        {isTableRequired && (
          <div className="card mb-4 bg-amber-50 border-2 border-amber-300">
            <div className="flex items-center gap-3 text-amber-700">
              <span className="text-2xl">{'\u{26A0}\u{FE0F}'}</span>
              <p className="font-semibold">{t('selectTableToOrder')}</p>
            </div>
          </div>
        )}

        {/* Search & Categories */}
        <div className={`card mb-4 ${isTableRequired ? 'opacity-50 pointer-events-none' : ''}`}>
          <input
            type="text"
            placeholder={t('searchMenu')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input mb-3"
            disabled={isTableRequired}
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className={`flex-1 overflow-y-auto ${isTableRequired ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map((item) => {
              const discountedPrice = getDiscountedPrice(item);
              const isTopSelling = topSellingNames.includes(item.name);
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`card hover:shadow-lg hover:scale-[1.02] transition-all text-left group cursor-pointer relative ${
                    item.is_favourite ? 'ring-2 ring-orange-300 bg-orange-50/30' : ''
                  }`}
                  disabled={isTableRequired}
                >
                  <div className="flex flex-col h-full">
                    {/* Badges row */}
                    <div className="flex items-center gap-1 mb-1">
                      {item.is_favourite && (
                        <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {'\u{2B50}'} {t('favourite')}
                        </span>
                      )}
                      {isTopSelling && (
                        <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                          {'\u{1F525}'} {t('topSelling')}
                        </span>
                      )}
                    </div>
                    {/* Item icon + name */}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getItemEmoji(item.name)}</span>
                      <h3 className="font-semibold text-gray-800 text-sm">{item.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div>
                        {discountedPrice ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 line-through">{`\u{20B9}`}{parseFloat(item.price).toFixed(0)}</span>
                            <span className="text-lg font-bold text-green-600">{`\u{20B9}`}{discountedPrice.toFixed(0)}</span>
                            <span className="text-[10px] font-bold text-red-500">{parseFloat(item.discount_percent)}% {t('off')}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-green-600">{`\u{20B9}`}{parseFloat(item.price).toFixed(0)}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{t('stock')}: {item.stock_quantity}</span>
                    </div>
                    <div className="mt-2 text-center text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('addToOrder')}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center text-gray-400 py-12">{t('noItemsFound')}</div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-full lg:w-96 flex flex-col">
        <div className="card flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {t('currentOrder')}
              {selectedTable && orderType === 'dine-in' && (
                <span className="ml-2 text-sm font-normal text-blue-600">{t('table')} #{selectedTable}</span>
              )}
              {orderType === 'parcel' && (
                <span className="ml-2 text-sm font-normal text-orange-600">{t('parcel')}</span>
              )}
            </h2>
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-bold">
              {cart.length} {t('items')}
            </span>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p className="text-4xl mb-2">{'\u{1F6D2}'}</p>
                <p>{t('noItemsInCart')}</p>
                <p className="text-xs mt-1">{t('tapToAdd')}</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.menu_item_id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrementQuantity(item.menu_item_id)}
                        className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItem(item.menu_item_id, 'quantity', item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.menu_item_id)}
                        className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <input
                      type="text"
                      placeholder="Special instructions..."
                      value={item.special_instructions}
                      onChange={(e) =>
                        updateCartItem(item.menu_item_id, 'special_instructions', e.target.value)
                      }
                      className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 mr-2"
                    />
                    <span className="font-semibold text-sm text-green-600">
                      {'\u{20B9}'}{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
            <textarea
              placeholder={t('orderInstructions')}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="input text-sm resize-none h-16"
            />
            <div className="flex items-center justify-between text-lg font-bold">
              <span>{t('total')}:</span>
              <span className="text-green-600">{'\u{20B9}'}{cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={sendToKitchen}
              disabled={cart.length === 0 || loading}
              className={`w-full py-3 rounded-xl text-white font-bold text-lg transition-all ${
                cart.length === 0 || loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? t('sending') : `\u{1F514} ${t('sendToKitchen')}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WaiterInterface;
