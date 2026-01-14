import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';

dotenv.config();

/**
 * Test MongoDB connection and basic operations
 */
async function testDatabase() {
  try {
    console.log('🔍 Testing MongoDB connection...\n');

    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/zendo';
    await mongoose.connect(mongoURI);

    console.log('✅ MongoDB Connected successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}\n`);

    // Test: Count documents
    const orderCount = await Order.countDocuments();
    console.log(`📦 Total orders in database: ${orderCount}`);

    // Test: Find last 3 orders
    const lastOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name phone city productName createdAt')
      .lean();

    if (lastOrders.length > 0) {
      console.log('\n📋 Last 3 orders:');
      lastOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. ${order.name}`);
        console.log(`   Phone: ${order.phone}`);
        console.log(`   City: ${order.city}`);
        console.log(`   Product: ${order.productName}`);
        console.log(`   Date: ${new Date(order.createdAt).toLocaleString('fr-FR')}`);
      });
    } else {
      console.log('\n📋 No orders found in database');
    }

    // Test: Database stats
    const dbStats = await mongoose.connection.db.stats();
    console.log('\n📊 Database Statistics:');
    console.log(`   Collections: ${dbStats.collections}`);
    console.log(`   Data size: ${(dbStats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`   Storage size: ${(dbStats.storageSize / 1024).toFixed(2)} KB`);

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run test
testDatabase();
