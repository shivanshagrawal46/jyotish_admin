const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fcmToken: { 
    type: String, 
    default: null,
    index: true 
  },
  notificationSettings: {
    pushEnabled: { type: Boolean, default: true },
    types: { 
      type: [String], 
      default: ['info', 'success', 'warning', 'error', 'announcement'],
      enum: ['info', 'success', 'warning', 'error', 'announcement']
    },
    frequency: { 
      type: String, 
      enum: ['instant', 'daily', 'weekly'], 
      default: 'instant' 
    },
    lastNotificationAt: { type: Date, default: null }
  },
  deviceInfo: {
    platform: { type: String, enum: ['android', 'ios', 'web'], default: 'android' },
    appVersion: { type: String, default: '1.0.0' },
    osVersion: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema); 