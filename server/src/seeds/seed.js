const pool = require('../config/db');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed menu items
    const menuItems = [
      // Starters
      { name: 'Samosa', price: 40, category: 'Starters', stock_quantity: 100, image_url: '' },
      { name: 'Paneer Tikka', price: 180, category: 'Starters', stock_quantity: 50, image_url: '' },
      { name: 'Chicken 65', price: 220, category: 'Starters', stock_quantity: 40, image_url: '' },
      { name: 'Veg Spring Roll', price: 120, category: 'Starters', stock_quantity: 60, image_url: '' },
      { name: 'Fish Fry', price: 250, category: 'Starters', stock_quantity: 30, image_url: '' },
      // Main Course
      { name: 'Butter Chicken', price: 320, category: 'Main Course', stock_quantity: 30, image_url: '' },
      { name: 'Paneer Butter Masala', price: 260, category: 'Main Course', stock_quantity: 40, image_url: '' },
      { name: 'Chicken Biryani', price: 280, category: 'Main Course', stock_quantity: 50, image_url: '' },
      { name: 'Veg Biryani', price: 200, category: 'Main Course', stock_quantity: 50, image_url: '' },
      { name: 'Dal Makhani', price: 180, category: 'Main Course', stock_quantity: 40, image_url: '' },
      { name: 'Fish Curry', price: 300, category: 'Main Course', stock_quantity: 25, image_url: '' },
      { name: 'Mutton Rogan Josh', price: 380, category: 'Main Course', stock_quantity: 20, image_url: '' },
      // Breads
      { name: 'Butter Naan', price: 50, category: 'Breads', stock_quantity: 100, image_url: '' },
      { name: 'Garlic Naan', price: 60, category: 'Breads', stock_quantity: 80, image_url: '' },
      { name: 'Tandoori Roti', price: 30, category: 'Breads', stock_quantity: 100, image_url: '' },
      { name: 'Paratha', price: 50, category: 'Breads', stock_quantity: 80, image_url: '' },
      // Rice
      { name: 'Steamed Rice', price: 100, category: 'Rice', stock_quantity: 60, image_url: '' },
      { name: 'Jeera Rice', price: 130, category: 'Rice', stock_quantity: 50, image_url: '' },
      { name: 'Fried Rice', price: 160, category: 'Rice', stock_quantity: 50, image_url: '' },
      // Beverages
      { name: 'Masala Chai', price: 30, category: 'Beverages', stock_quantity: 200, image_url: '' },
      { name: 'Cold Coffee', price: 80, category: 'Beverages', stock_quantity: 100, image_url: '' },
      { name: 'Fresh Lime Soda', price: 60, category: 'Beverages', stock_quantity: 100, image_url: '' },
      { name: 'Mango Lassi', price: 90, category: 'Beverages', stock_quantity: 80, image_url: '' },
      { name: 'Buttermilk', price: 40, category: 'Beverages', stock_quantity: 100, image_url: '' },
      // Desserts
      { name: 'Gulab Jamun', price: 80, category: 'Desserts', stock_quantity: 60, image_url: '' },
      { name: 'Rasgulla', price: 80, category: 'Desserts', stock_quantity: 60, image_url: '' },
      { name: 'Kheer', price: 100, category: 'Desserts', stock_quantity: 40, image_url: '' },
      { name: 'Ice Cream', price: 120, category: 'Desserts', stock_quantity: 80, image_url: '' },
    ];

    for (const item of menuItems) {
      await client.query(
        `INSERT INTO menu_items (name, price, category, stock_quantity, image_url, is_available)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (name) DO NOTHING`,
        [item.name, item.price, item.category, item.stock_quantity, item.image_url]
      );
    }

    // Seed workers
    const workers = [
      { name: 'Rajesh Kumar', role: 'Admin', phone: '9876543210' },
      { name: 'Priya Sharma', role: 'Chef', phone: '9876543211' },
      { name: 'Arun Patel', role: 'Waiter', phone: '9876543212' },
      { name: 'Meena Devi', role: 'Waiter', phone: '9876543213' },
      { name: 'Suresh Reddy', role: 'Chef', phone: '9876543214' },
      { name: 'Lakshmi Nair', role: 'Staff', phone: '9876543215' },
    ];

    for (const worker of workers) {
      await client.query(
        `INSERT INTO workers (name, role, phone)
         VALUES ($1, $2, $3)
         ON CONFLICT (name, role) DO NOTHING`,
        [worker.name, worker.role, worker.phone]
      );
    }

    await client.query('COMMIT');
    console.log('Seed data inserted successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
