const mongoose = require('mongoose');

const assistantChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      trim: true,
      default: 'New Chat'
    },
    source: {
      type: String,
      enum: ['api', 'socket'],
      default: 'api'
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

assistantChatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('AssistantChatSession', assistantChatSessionSchema);
