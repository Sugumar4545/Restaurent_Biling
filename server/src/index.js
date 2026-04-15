const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const workerRoutes = require('./routes/workerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// REST API Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Waiter sends a new order
  socket.on('NEW_ORDER', (order) => {
    console.log('New order received:', order.order_id);
    // Broadcast to all clients (kitchen, customer dashboard, admin)
    io.emit('NEW_ORDER', order);
  });

  // Kitchen updates order status
  socket.on('ORDER_STATUS_UPDATE', (data) => {
    console.log(`Order ${data.order_id} status updated to ${data.status}`);
    io.emit('ORDER_STATUS_UPDATE', data);
  });

  // Kitchen marks order as ready
  socket.on('ORDER_READY', (data) => {
    console.log(`Order ${data.order_id} is ready`);
    io.emit('ORDER_READY', data);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`POS Server running on port ${PORT}`);
});
