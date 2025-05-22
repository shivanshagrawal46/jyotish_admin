require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createFirstAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if any user exists
        const existingUser = await User.findOne();
        if (existingUser) {
            console.log('Admin user already exists. Exiting...');
            process.exit(0);
        }

        // Create admin user
        const adminUsername = 'admin';
        const adminPassword = 'Admin@123'; // You should change this password after first login

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create user
        const adminUser = new User({
            username: adminUsername,
            password: hashedPassword
        });

        await adminUser.save();
        console.log('First admin user created successfully!');
        console.log('Username:', adminUsername);
        console.log('Password:', adminPassword);
        console.log('Please change this password after your first login!');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

createFirstAdmin(); 