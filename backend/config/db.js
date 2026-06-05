const mongoose = require('mongoose');


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connectup');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    
    // Provide helpful error message for Atlas IP whitelist issues
    if (error.message.includes('Atlas cluster') || error.message.includes('whitelist')) {
      console.error('\n⚠️  MongoDB Atlas IP Whitelist Issue Detected!');
      console.error('Your current IP address is not whitelisted in MongoDB Atlas.');
      console.error('To fix this:');
      console.error('1. Go to: https://cloud.mongodb.com/');
      console.error('2. Select your cluster');
      console.error('3. Click "Network Access" (or "Security" > "Network Access")');
      console.error('4. Click "Add IP Address"');
      console.error('5. Click "Add Current IP Address" or add "0.0.0.0/0" to allow all IPs (for development only)');
      console.error('6. Wait 1-2 minutes for changes to take effect');
      console.error('\n📖 More info: https://www.mongodb.com/docs/atlas/security-whitelist/\n');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;

