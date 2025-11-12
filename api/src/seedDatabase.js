/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const slugify = require('slugify');

// Load environment variables
dotenv.config({ path: '.env' });

// Import models
const User = require('./models/userModel');
const Employee = require('./models/employeeModel');
const Floor = require('./models/floorModel');
const Room = require('./models/roomModel');
const Order = require('./models/orderModel');
const Visitor = require('./models/visitorModel');
const Voucher = require('./models/voucherModel');

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log('✅ Connected to MongoDB for seeding...'))
  .catch((err) => console.log('❌ Connection failed:', err));

// ------------------- SAMPLE DATA ------------------- //

// USERS
const users = [
  {
    firstName: 'Sayan',
    lastName: 'Samui',
    address: 'Kolkata, India',
    email: 'sayan@example.com',
    username: 'sayansamui',
    password: 'Password123',
    passwordConfirm: 'Password123',
    role: 'admin',
  },
  {
    firstName: 'Riya',
    lastName: 'Das',
    address: 'Bangalore, India',
    email: 'riya@example.com',
    username: 'riyadas',
    password: 'Password123',
    passwordConfirm: 'Password123',
    role: 'user',
  },
  {
    firstName: 'Souresh',
    lastName: 'Mondal',
    address: 'Hyderabad, India',
    email: 'souresh@example.com',
    username: 'soureshmondal',
    password: 'Password123',
    passwordConfirm: 'Password123',
    role: 'owner',
  },
  {
    firstName: 'Ananya',
    lastName: 'Roy',
    address: 'Delhi, India',
    email: 'ananya@example.com',
    username: 'ananyaroy',
    password: 'Password123',
    passwordConfirm: 'Password123',
    role: 'user',
  },
  {
    firstName: 'Rahul',
    lastName: 'Sen',
    address: 'Pune, India',
    email: 'rahul@example.com',
    username: 'rahulsen',
    password: 'Password123',
    passwordConfirm: 'Password123',
    role: 'user',
  },
];

// FLOORS
const floors = [
  { number: 1, name: 'Ground Floor' },
  { number: 2, name: 'Second Floor' },
  { number: 3, name: 'Third Floor' },
  { number: 4, name: 'Fourth Floor' },
  { number: 5, name: 'Executive Floor' },
];

// ROOM TEMPLATES (slug will be added dynamically)
const roomTemplates = [
  {
    name: 'Conference Room Alpha',
    description: 'Spacious meeting room for 10 people.',
    roomFeatures: ['Projector', 'WiFi', 'AC', 'Whiteboard'],
    photos: ['alpha1.jpg', 'alpha2.jpg'],
    price: 1500,
    type: 'office',
  },
  {
    name: 'Coworking Space Beta',
    description: 'Shared workspace with great ambiance.',
    roomFeatures: ['WiFi', 'AC', 'Coffee Machine'],
    photos: ['beta1.jpg', 'beta2.jpg'],
    price: 1000,
    type: 'coworking-space',
  },
  {
    name: 'Private Office Delta',
    description: 'Compact private office for startups.',
    roomFeatures: ['WiFi', 'Desk', 'Chair', 'Locker'],
    photos: ['delta1.jpg', 'delta2.jpg'],
    price: 2500,
    type: 'office',
  },
  {
    name: 'Coworking Space Gamma',
    description: 'Open space with hot desks.',
    roomFeatures: ['WiFi', 'Printer', 'AC'],
    photos: ['gamma1.jpg', 'gamma2.jpg'],
    price: 900,
    type: 'coworking-space',
  },
  {
    name: 'Manager Office Omega',
    description: 'Luxurious office for executives.',
    roomFeatures: ['WiFi', 'AC', 'Mini Fridge', 'Conference Table'],
    photos: ['omega1.jpg', 'omega2.jpg'],
    price: 3500,
    type: 'office',
  },
];

// EMPLOYEES
const employees = [
  { salary: 25000, jobdesc: 'receptionist' },
  { salary: 15000, jobdesc: 'office-boy' },
  { salary: 18000, jobdesc: 'security' },
  { salary: 35000, jobdesc: 'customer-service' },
  { salary: 50000, jobdesc: 'owner' },
];

// VOUCHERS
const vouchers = [
  { code: 'WELCOME10', discount: 10 },
  { code: 'FESTIVE25', discount: 25 },
  { code: 'NEWYEAR50', discount: 50 },
  { code: 'MONSOON15', discount: 15 },
  { code: 'FLASH20', discount: 20 },
];

// ------------------- SEEDING LOGIC ------------------- //

const seedDatabase = async () => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Floor.deleteMany(),
      Room.deleteMany(),
      Employee.deleteMany(),
      Voucher.deleteMany(),
      Order.deleteMany(),
      Visitor.deleteMany(),
    ]);
    console.log('🧹 Cleared old data...');

    // Insert base data
    const createdUsers = await User.insertMany(users);
    const createdFloors = await Floor.insertMany(floors);

    // Add slug + floor ref for each room
    const rooms = roomTemplates.map((r) => ({
      ...r,
      slug: slugify(r.name, { lower: true }),
      floor:
        createdFloors[Math.floor(Math.random() * createdFloors.length)]._id,
    }));
    const createdRooms = await Room.insertMany(rooms);

    // Link employees to random users
    const employeeData = employees.map((e) => ({
      ...e,
      user: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
    }));
    const createdEmployees = await Employee.insertMany(employeeData);

    // Visitors linked to rooms
    const visitors = createdUsers.slice(0, 3).map((u, i) => ({
      firstName: u.firstName,
      lastName: u.lastName,
      address: u.address,
      email: `visitor${i + 1}@example.com`,
      purpose: 'Visit',
      room: createdRooms[Math.floor(Math.random() * createdRooms.length)]._id,
    }));
    await Visitor.insertMany(visitors);

    // Orders (future startDate to pass validation)
    const orders = [];
    for (let i = 0; i < 5; i++) {
      const startDate = new Date(Date.now() + (i + 1) * 3600000); // +1h, +2h etc
      const endDate = new Date(startDate.getTime() + 2 * 24 * 3600000); // +2 days
      orders.push({
        user: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        room: createdRooms[Math.floor(Math.random() * createdRooms.length)]._id,
        employee:
          createdEmployees[Math.floor(Math.random() * createdEmployees.length)]
            ._id,
        startDate,
        endDate,
        totalPrice: 1000 + i * 200,
      });
    }
    await Order.insertMany(orders);

    await Voucher.insertMany(vouchers);

    console.log('✅ Seed data inserted successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();
