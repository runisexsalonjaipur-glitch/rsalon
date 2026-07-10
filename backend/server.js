const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const routes = require('./routes');
const { Service, Staff, Customer, Settings, setUseMock } = require('./models');

const app = express();

// Middleware — allow Vercel frontend + local dev
const allowedOrigins = [
  'https://rsalon-nine.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Also allow any vercel.app preview deployments
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(new Error('CORS not allowed: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Default base route
app.get('/', (req, res) => {
  res.json({ message: 'R Unisex Salon Management API is running' });
});

// Register routers
app.use('/api', routes);

// Auto-seeding logic
async function seedDatabase() {
  try {
    // 1. Seed default Settings
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      const defaultSettings = new Settings({
        salonName: 'R Unisex Salon',
        logo: '',
        currency: '₹',
        theme: 'light'
      });
      await defaultSettings.save();
      console.log('seeded: Default Settings created.');
    }

    // 2. Re-create deleted Staff if missing to restore entries
    const testStaff = await Staff.findById('6a4b42e5b6a004036a4bf283');
    if (!testStaff) {
      const newStaff = new Staff({
        _id: '6a4b42e5b6a004036a4bf283',
        name: 'AMAN SHARMA',
        phone: '9876543210',
        role: 'Stylist',
        status: 'active',
        salary: 15000,
        commission: 10
      });
      await newStaff.save();
      console.log('database: Restored deleted staff member AMAN SHARMA.');
    }

    // 3. Re-create deleted Service if missing to restore entries
    const testService = await Service.findById('6a4b42d0b6a004036a4bf282');
    if (!testService) {
      const newService = new Service({
        _id: '6a4b42d0b6a004036a4bf282',
        name: 'Hair Cut ( MEN )',
        price: 100,
        category: 'Hair Care',
        status: 'active'
      });
      await newService.save();
      console.log('database: Restored deleted service Hair Cut ( MEN ).');
    }

    // 4. Re-create Customer if missing to restore entries
    const testCustomer = await Customer.findById('6a4b43e2b6a004036a4bf284');
    if (!testCustomer) {
      const newCustomer = new Customer({
        _id: '6a4b43e2b6a004036a4bf284',
        name: 'kishan',
        phone: '4545454545'
      });
      await newCustomer.save();
      console.log('database: Restored customer kishan.');
    }

  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
}

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rsalon';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
  .then(async () => {
    console.log('MongoDB connection established successfully.');
    await seedDatabase();
    startServer();
  })
  .catch(async err => {
    console.warn('MongoDB connection failed. Switching to Local File-Based Mock Database...');
    setUseMock(true);
    await seedDatabase();
    startServer();
  });

function startServer() {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
