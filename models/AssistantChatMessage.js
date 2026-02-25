const mongoose = require('mongoose');

const assistantChatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssistantChatSession',
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'tool', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    toolName: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

assistantChatMessageSchema.index({ sessionId: 1, createdAt: -1 });
assistantChatMessageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AssistantChatMessage', assistantChatMessageSchema);
