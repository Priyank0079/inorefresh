const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/inorfresh');
  const Notification = require('./backend/dist/models/Notification').default;
  const notifs = await Notification.find({ recipientType: { $in: ['Admin', 'All'] } }).sort({ createdAt: -1 }).limit(5);
  console.log(notifs);
  process.exit(0);
}

test();
