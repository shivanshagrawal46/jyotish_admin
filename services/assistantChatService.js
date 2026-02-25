const https = require('https');
const mongoose = require('mongoose');
const AssistantChatSession = require('../models/AssistantChatSession');
const AssistantChatMessage = require('../models/AssistantChatMessage');
const { searchAppContent } = require('./assistantSearchService');

const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4.1-nano';
const MAX_CONTEXT_MESSAGES = 5;
const MAX_OPENAI_CALLS_PER_QUESTION = 1;
const REDIRECT_MESSAGE =
  'For personalized kundli analysis, please consult Samta AI or Guruji inside the app.';

const ASSISTANT_UNAVAILABLE_MESSAGE =
  'Assistant is temporarily unavailable. Please try again in a few moments.';

function isOpenAIQuotaOrRateError(message) {
  if (!message || typeof message !== 'string') return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('exceeded') ||
    lower.includes('insufficient_quota') ||
    lower.includes('billing')
  );
}

function toUserFacingError(error) {
  const msg = error && error.message ? error.message : String(error);

  // Always log the real error for debugging (server logs / console)
  console.error('[Assistant] Error:', msg);
  if (error && error.stack) {
    console.error('[Assistant] Stack:', error.stack);
  }

  if (isOpenAIQuotaOrRateError(msg)) {
    const userError = new Error(ASSISTANT_UNAVAILABLE_MESSAGE);
    userError.originalMessage = msg;
    return userError;
  }
  const out = error instanceof Error ? error : new Error(msg);
  out.originalMessage = out.originalMessage || msg;
  return out;
}

const SYSTEM_PROMPT = `
You are Astro Assistant, an AI helper inside an astrology mobile application.

The user may speak in English, Hindi, or Hinglish. Understand intent in all three.
Reply in the same language as the user whenever possible.

Rules:
1) APP DATA
- Backend already searched the app database and provided APP_SEARCH_CONTEXT.
- If APP_SEARCH_CONTEXT has relevant hits (found: true, hits array not empty), use that data to answer. Return only the relevant part.
- If APP_SEARCH_CONTEXT has no relevant data (found: false or empty hits), answer from your general astrology knowledge. Do NOT say "not in database" or "not available" — answer helpfully yourself.
- Never invent or fake app-specific content (e.g. do not make up today's rashifal). If you have no app data, answer generally.

2) GENERAL ASTROLOGY KNOWLEDGE
- If the user asks general educational astrology questions, answer simply.
- Do NOT provide personal predictions.

3) PERSONAL KUNDLI/FUTURE REQUESTS (STRICT BLOCK)
- If user asks personal kundli, marriage timing, career prediction, future prediction, or personal horoscope analysis,
  always reply exactly:
  "${REDIRECT_MESSAGE}"

4) SAFETY
- Never assume birth details.
- Never bypass redirect.
- If uncertain, choose redirect.
- Keep responses concise and polite.
`.trim();

// App catalog: what we have in the app/database (for "what do we have" type questions)
const APP_CATALOG = [
  'Kosh (Kosh / शब्दकोश)',
  'Karmkand (कर्मकांड)',
  'Granth (ग्रंथ / Books)',
  'Astroshop',
  'E-Pooja (E Pooja / पूजा)',
  'Talk to Guruji',
  'Samta AI',
  'E-Magazine (E Magazine)',
  'Ankjyotish (अंक ज्योतिष / Numerology)',
  'Hastrekha (हस्तरेखा / Palmistry)',
  'Kundli (कुंडली)',
  'Kundli Match (कुंडली मिलान)',
  'Prashan Yantra (प्रश्न यंत्र)',
  'MCQ (Quiz)',
  'Rashifal (राशिफल / Horoscope)',
  'Ankfal (अंकफल / Numerology predictions)',
  'Learning (Jyotish learning content)',
  'Festivals (त्योहार)',
  'Muhurat (मुहूर्त)',
  'Divine Quotes / Divine Sanskrit',
  'Celebrity Kundli',
  'Puja (पूजा)',
  'YouTube content',
  'Books & Chapters'
];

const APP_CATALOG_INSTRUCTION = `
When the user asks what is in the app, what we have, what categories/sections exist, or what is in the database (in any language: English, Hindi, Hinglish), use the APP_CATALOG list above.
Reply in the same language as the user. List or briefly describe these sections; do not invent new ones.`;

const PERSONAL_PREDICTION_PATTERNS = [
  /kundli/i,
  /birth chart/i,
  /personal horoscope/i,
  /future prediction/i,
  /predict my future/i,
  /marriage timing/i,
  /career prediction/i,
  /will i marry/i,
  /mera future/i,
  /meri shaadi/i,
  /shaadi kab/i,
  /meri kundli/i,
  /मेरा भविष्य/i,
  /मेरी शादी/i,
  /कुंडली/i,
  /भविष्यवाणी/i
];

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function parseJsonSafely(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function isPersonalPredictionRequest(message) {
  const text = normalizeSpace(message);
  if (!text) return false;
  return PERSONAL_PREDICTION_PATTERNS.some((pattern) => pattern.test(text));
}

function isLikelyAppDataQuery(message) {
  const text = normalizeSpace(message).toLowerCase();
  if (!text) return false;

  const appDataPatterns = [
    /rashifal/,
    /राशिफल/,
    /zodiac/,
    /today.*prediction/,
    /app (data|content|info|information)/,
    /learning content/,
    /granth/,
    /kosh/,
    /festival/,
    /muhurat/,
    /numerology/,
    /book/,
    /daily horoscope/,
    /monthly horoscope/,
    /yearly horoscope/
  ];

  return appDataPatterns.some((pattern) => pattern.test(text));
}

function isCatalogQuery(message) {
  const text = normalizeSpace(message);
  if (!text || text.length < 3) return false;
  const lower = text.toLowerCase();

  const catalogPatterns = [
    /what(\s+all)?\s+(do\s+we\s+have|is\s+in|are\s+in|content)/i,
    /what(\s+all)?\s+(we\s+have|you\s+have)/i,
    /what('s|s)\s+in\s+(the\s+)?(app|database)/i,
    /(app|database)\s+(me|main)\s+kya\s+(hai|hain|milkar)/i,
    /(app|database)\s+mein\s+kya\s+kya\s+hai/i,
    /kya\s+kya\s+hai\s+(app|database)/i,
    /(app|database)\s+ke\s+andar\s+kya/i,
    /categories?\s+(we\s+have|in\s+app|list)/i,
    /sections?\s+(we\s+have|in\s+app|list)/i,
    /list\s+(of\s+)?(categories|sections|content|features)/i,
    /(sabhi|sare)\s+categories?\s+batao/i,
    /app\s+me\s+kya\s+kya\s+hai/i,
    /हमारे\s+(पास|डेटाबेस|ऐप)\s+में\s+क्या/i,
    /ऐप\s+में\s+क्या\s+क्या\s+है/i,
    /डेटाबेस\s+में\s+क्या\s+है/i,
    /कैटगरी\s+क्या\s+क्या\s+है/i,
    /सभी\s+सेक्शन\s+बताओ/i,
    /content\s+kya\s+kya\s+hai/i,
    /features?\s+(of\s+)?(app|this\s+app)/i,
    /batao\s+(app|database)\s+me\s+kya\s+kya/i,
    /humare\s+app\s+me\s+kya\s+hai/i,
    /sections?\s+batao/i,
    /sab\s+categories?\s+(batao|list)/i,
    /available\s+(content|sections|categories)/i
  ];

  return catalogPatterns.some((pattern) => pattern.test(text));
}

function buildCatalogContext() {
  return [
    'APP_CATALOG (sections/categories in our app and database):',
    JSON.stringify(APP_CATALOG, null, 2),
    APP_CATALOG_INSTRUCTION
  ].join('\n');
}

function buildAppSearchContext(searchResult, appDataLikely) {
  const compactHits = (searchResult.hits || []).slice(0, 10).map((hit) => ({
    model: hit.model,
    documentId: hit.documentId,
    snippets: hit.snippets
  }));

  return [
    'APP_SEARCH_CONTEXT:',
    JSON.stringify(
      {
        appDataLikely,
        found: !!searchResult.found,
        totalMatches: searchResult.totalMatches || 0,
        hits: compactHits
      },
      null,
      2
    ),
    'Instruction: Use only this context for app-data answers.'
  ].join('\n');
}

function buildSessionTitle(message) {
  const text = normalizeSpace(message);
  if (!text) return 'New Chat';
  return text.length <= 60 ? text : `${text.slice(0, 60)}...`;
}

function updateSessionActivity(sessionId) {
  return AssistantChatSession.findByIdAndUpdate(
    sessionId,
    { $set: { lastMessageAt: new Date() } },
    { new: false }
  );
}

async function getOrCreateSession(userId, sessionId, source, firstMessage) {
  if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
    const existing = await AssistantChatSession.findOne({ _id: sessionId, userId });
    if (existing) return existing;
  }

  return AssistantChatSession.create({
    userId,
    source: source === 'socket' ? 'socket' : 'api',
    title: buildSessionTitle(firstMessage)
  });
}

function saveChatMessage({ sessionId, userId, role, content, toolName = null, metadata = {} }) {
  return AssistantChatMessage.create({
    sessionId,
    userId,
    role,
    content,
    toolName,
    metadata
  });
}

async function fetchRecentContextMessages(sessionId, limit = MAX_CONTEXT_MESSAGES) {
  const docs = await AssistantChatMessage.find({ sessionId, role: { $in: ['user', 'assistant'] } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return docs.reverse().map((doc) => ({
    role: doc.role,
    content: doc.content
  }));
}

function postJsonToOpenAI(pathname, payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing in environment.');
  }

  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: pathname,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          const parsed = parseJsonSafely(raw, null);
          if (res.statusCode >= 400) {
            const message =
              parsed?.error?.message || `OpenAI request failed with status ${res.statusCode}`;
            // Debug: log OpenAI error details
            console.error('[Assistant] OpenAI API error:', {
              statusCode: res.statusCode,
              message,
              code: parsed?.error?.code,
              type: parsed?.error?.type
            });
            return reject(new Error(message));
          }
          if (!parsed) {
            console.error('[Assistant] Invalid OpenAI response (no JSON). Raw length:', raw?.length);
            return reject(new Error('Invalid OpenAI response payload.'));
          }
          resolve(parsed);
        });
      }
    );

    req.setTimeout(30000, () => {
      req.destroy(new Error('OpenAI request timeout.'));
    });

    req.on('error', (error) => reject(error));
    req.write(body);
    req.end();
  });
}

async function runOpenAI(messages, options = {}) {
  const guard = options.callGuard;
  if (!guard) {
    throw new Error('OpenAI call guard is required.');
  }
  guard.count += 1;
  if (guard.count > MAX_OPENAI_CALLS_PER_QUESTION) {
    throw new Error('OpenAI single-call policy violation: more than one AI call attempted.');
  }

  const payload = {
    model: MODEL_NAME,
    temperature: 0.2,
    max_tokens: options.maxTokens || 450,
    messages
  };

  return postJsonToOpenAI('/v1/chat/completions', payload);
}

async function generateAssistantReply(userMessage, recentMessages) {
  console.log('[Assistant] generateAssistantReply start, message length:', (userMessage || '').length);

  const callGuard = { count: 0 };
  const appDataLikely = isLikelyAppDataQuery(userMessage);

  let searchResult = { found: false, hits: [], totalMatches: 0 };
  try {
    searchResult = await searchAppContent(userMessage, { limit: 12 });
  } catch (searchErr) {
    // Search failure must not block reply: continue with empty context, one AI call only
    console.warn('[Assistant] Search failed, using empty context:', searchErr && searchErr.message);
    if (searchErr && searchErr.stack) {
      console.warn('[Assistant] Search stack:', searchErr.stack);
    }
  }

  const searchContext = buildAppSearchContext(searchResult, appDataLikely);
  const includeCatalog = isCatalogQuery(userMessage);
  const catalogContext = includeCatalog ? buildCatalogContext() : null;

  const inputMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: searchContext },
    ...(catalogContext ? [{ role: 'system', content: catalogContext }] : []),
    ...recentMessages,
    { role: 'user', content: userMessage }
  ];

  console.log('[Assistant] Calling OpenAI, model:', MODEL_NAME);
  const completion = await runOpenAI(inputMessages, { maxTokens: 450, callGuard });
  let finalReply = normalizeSpace(completion?.choices?.[0]?.message?.content);
  console.log('[Assistant] OpenAI responded, reply length:', (finalReply || '').length);
  // When search found nothing, we already passed that in context; AI answers from general knowledge. No override.

  return {
    reply: finalReply,
    usedSearch: true,
    searchFound: searchResult.found,
    searchQuery: userMessage,
    aiApiCalls: callGuard.count
  };
}

async function processAssistantChat({ userId, message, sessionId, source = 'api' }) {
  const normalizedUserId = normalizeSpace(userId);
  const normalizedMessage = normalizeSpace(message);

  if (!normalizedUserId) {
    throw new Error('userId is required.');
  }
  if (!normalizedMessage) {
    throw new Error('message is required.');
  }

  const session = await getOrCreateSession(
    normalizedUserId,
    sessionId,
    source,
    normalizedMessage
  );
  const recentMessages = await fetchRecentContextMessages(session._id, MAX_CONTEXT_MESSAGES);

  await saveChatMessage({
    sessionId: session._id,
    userId: normalizedUserId,
    role: 'user',
    content: normalizedMessage
  });

  if (isPersonalPredictionRequest(normalizedMessage)) {
    await saveChatMessage({
      sessionId: session._id,
      userId: normalizedUserId,
      role: 'assistant',
      content: REDIRECT_MESSAGE,
      metadata: { blockedByPolicy: true }
    });
    await updateSessionActivity(session._id);

    return {
      sessionId: String(session._id),
      reply: REDIRECT_MESSAGE,
      usedSearch: false,
      redirected: true
    };
  }

  let aiResult;
  try {
    aiResult = await generateAssistantReply(normalizedMessage, recentMessages);
  } catch (err) {
    throw toUserFacingError(err);
  }

  const finalReply =
    normalizeSpace(aiResult.reply) || 'I am sorry, I could not process that right now.';

  await saveChatMessage({
    sessionId: session._id,
    userId: normalizedUserId,
    role: 'assistant',
    content: finalReply,
    metadata: {
      usedSearch: aiResult.usedSearch,
      searchFound: aiResult.searchFound,
      searchQuery: aiResult.searchQuery,
      aiApiCalls: aiResult.aiApiCalls
    }
  });

  await updateSessionActivity(session._id);

  return {
    sessionId: String(session._id),
    reply: finalReply,
    usedSearch: aiResult.usedSearch,
    aiApiCalls: aiResult.aiApiCalls,
    redirected: false
  };
}

module.exports = {
  processAssistantChat
};
