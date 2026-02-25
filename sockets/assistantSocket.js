const { processAssistantChat } = require('../services/assistantChatService');

const TOKEN_EMIT_INTERVAL_MS = 22;

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitReplyForTyping(text) {
  if (!text) return [];
  // Stream by words (with spaces preserved) for smooth typing UI.
  return text.match(/\S+\s*|\s+/g) || [text];
}

function buildEmitTargets(socket, userId) {
  const room = userId ? `assistant_user_${normalizeSpace(userId)}` : null;
  const emit = (event, payload) => {
    socket.emit(event, payload);
    if (room) {
      socket.to(room).emit(event, payload);
    }
  };

  return { room, emit };
}

async function emitTokenStream(emit, requestId, sessionId, fullText) {
  const tokens = splitReplyForTyping(fullText);

  emit('assistant:stream:start', {
    success: true,
    requestId,
    sessionId,
    totalTokens: tokens.length
  });

  for (let index = 0; index < tokens.length; index += 1) {
    emit('assistant:token', {
      success: true,
      requestId,
      sessionId,
      index,
      token: tokens[index],
      done: false
    });
    await sleep(TOKEN_EMIT_INTERVAL_MS);
  }

  emit('assistant:token', {
    success: true,
    requestId,
    sessionId,
    index: tokens.length,
    token: '',
    done: true
  });

  emit('assistant:stream:end', {
    success: true,
    requestId,
    sessionId
  });
}

function registerAssistantSocketHandlers(io) {
  const namespace = io.of('/assistant');

  namespace.on('connection', (socket) => {
    socket.on('assistant:join', (payload = {}, ack) => {
      const userId = normalizeSpace(payload.userId);
      if (userId) socket.join(`assistant_user_${userId}`);
      if (typeof ack === 'function') {
        ack({ success: true, joined: !!userId });
      }
    });

    socket.on('assistant:message', async (payload = {}, ack) => {
      const requestId =
        payload.requestId || `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const userId = normalizeSpace(payload.userId);
      const { emit } = buildEmitTargets(socket, userId);

      if (typeof ack === 'function') {
        ack({ success: true, accepted: true, requestId });
      }

      setImmediate(async () => {
        try {
          const result = await processAssistantChat({
            userId,
            message: payload.message,
            sessionId: payload.sessionId,
            source: 'socket'
          });

          const streamTokens = payload.streamTokens !== false;
          if (streamTokens && result.reply) {
            await emitTokenStream(emit, requestId, result.sessionId, result.reply);
          }

          emit('assistant:response', {
            success: true,
            requestId,
            data: result
          });
        } catch (error) {
          emit('assistant:error', {
            success: false,
            requestId,
            error: error.message || 'Failed to process socket chat message.'
          });
        }
      });
    });
  });
}

module.exports = {
  registerAssistantSocketHandlers
};
