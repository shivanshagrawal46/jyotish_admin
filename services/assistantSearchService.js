const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const EXCLUDED_MODEL_FILES = new Set([
  'Csu.js',
  'Csu2.js',
  'AssistantChatSession.js',
  'AssistantChatMessage.js'
]);

const EXCLUDED_MODEL_NAMES = new Set([
  'Csu',
  'Csu2',
  'AssistantChatSession',
  'AssistantChatMessage'
]);

const QUERY_CACHE_TTL_MS = 2 * 60 * 1000;
const QUERY_CACHE_MAX_ENTRIES = 500;
const MAX_TEXT_FIELDS_PER_MODEL = 18;
const TEXT_QUERY_MAX_TIME_MS = 500;
const REGEX_QUERY_MAX_TIME_MS = 350;
const MAX_TOKENS = 8;

let modelsInitialized = false;
let searchableModelNames = [];
const modelFieldCache = new Map();
const modelTextIndexCache = new Map();
const modelTextIndexCheckPromise = new Map();
const queryCache = new Map();

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function truncateText(value, maxLen = 240) {
  const text = normalizeSpace(value);
  if (!text) return '';
  return text.length <= maxLen ? text : `${text.slice(0, maxLen)}...`;
}

function tokenizeQuery(query) {
  const tokens = query
    .toLowerCase()
    .split(/[\s,.;:!?()[\]{}'"`~|/\\+-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  const unique = [...new Set(tokens)];
  unique.sort((a, b) => b.length - a.length);
  return unique.slice(0, MAX_TOKENS);
}

function buildCacheKey(query, limit, perModelLimit) {
  return `${query.toLowerCase()}::${limit}::${perModelLimit}`;
}

function getCachedQueryResult(query, limit, perModelLimit) {
  const key = buildCacheKey(query, limit, perModelLimit);
  const cached = queryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.ts > QUERY_CACHE_TTL_MS) {
    queryCache.delete(key);
    return null;
  }
  // keep hot keys alive in LRU order
  queryCache.delete(key);
  queryCache.set(key, cached);
  return cached.payload;
}

function setCachedQueryResult(query, limit, perModelLimit, payload) {
  const key = buildCacheKey(query, limit, perModelLimit);
  if (queryCache.has(key)) {
    queryCache.delete(key);
  }
  queryCache.set(key, { ts: Date.now(), payload });
  if (queryCache.size <= QUERY_CACHE_MAX_ENTRIES) return;

  const firstKey = queryCache.keys().next().value;
  if (firstKey) queryCache.delete(firstKey);
}

function initializeAllModels() {
  if (modelsInitialized) return;

  const modelsDir = path.join(__dirname, '..', 'models');
  const files = fs
    .readdirSync(modelsDir)
    .filter((file) => file.endsWith('.js') && !EXCLUDED_MODEL_FILES.has(file));

  for (const file of files) {
    const fullPath = path.join(modelsDir, file);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(fullPath);
  }

  searchableModelNames = mongoose
    .modelNames()
    .filter(isSearchableModelName)
    .sort((a, b) => a.localeCompare(b));

  modelsInitialized = true;
}

function isSearchableModelName(modelName) {
  return !EXCLUDED_MODEL_NAMES.has(modelName);
}

function extractSearchableStringFields(model) {
  if (modelFieldCache.has(model.modelName)) {
    return modelFieldCache.get(model.modelName);
  }

  const fields = [];
  const schemaPaths = model.schema?.paths || {};

  for (const [fieldName, schemaType] of Object.entries(schemaPaths)) {
    if (fieldName === '_id' || fieldName === '__v') continue;
    if (fieldName.startsWith('_')) continue;

    if (schemaType.instance === 'String') {
      fields.push(fieldName);
      continue;
    }

    if (
      schemaType.instance === 'Array' &&
      schemaType.caster &&
      schemaType.caster.instance === 'String'
    ) {
      fields.push(fieldName);
    }
  }

  const fieldPriority = [
    'title',
    'name',
    'hindiword',
    'englishword',
    'hinglishword',
    'meaning',
    'details',
    'description',
    'content',
    'search',
    'keywords',
    'notes',
    'month',
    'year',
    'date'
  ];

  const uniqueFields = [...new Set(fields)].sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    const aPriority = fieldPriority.findIndex((item) => aLower.includes(item));
    const bPriority = fieldPriority.findIndex((item) => bLower.includes(item));

    const aScore = aPriority === -1 ? 999 : aPriority;
    const bScore = bPriority === -1 ? 999 : bPriority;
    if (aScore !== bScore) return aScore - bScore;
    return a.length - b.length;
  });

  modelFieldCache.set(model.modelName, uniqueFields);
  return uniqueFields;
}

function getPrioritizedModels(query, allModelNames) {
  const text = query.toLowerCase();
  const priorityNames = new Set();

  const keywordToModels = [
    {
      keywords: ['rashifal', 'राशिफल', 'horoscope', 'zodiac'],
      models: ['RashifalDailyContent', 'RashifalMonthly', 'RashifalYearly', 'RashifalDailyDate']
    },
    {
      keywords: ['numerology', 'अंक', 'ank'],
      models: ['NumerologyDailyContent', 'NumerologyMonthly', 'NumerologyYearly', 'NumerologyDailyDate']
    },
    {
      keywords: ['learning', 'learn', 'सीख', 'jyotish learning'],
      models: ['LearningContent', 'LearningChapter', 'LearningCategory']
    },
    {
      keywords: ['festival', 'त्योहार', 'parv'],
      models: ['Festival']
    },
    {
      keywords: ['kosh', 'dictionary', 'शब्द', 'word meaning'],
      models: ['KoshContent', 'KoshSubCategory', 'KoshCategory']
    },
    {
      keywords: ['book', 'granth', 'ग्रंथ', 'chapter'],
      models: ['BookContent', 'BookChapter', 'BookName', 'GranthContent', 'GranthChapter', 'GranthName']
    }
  ];

  for (const mapping of keywordToModels) {
    const hit = mapping.keywords.some((keyword) => text.includes(keyword));
    if (!hit) continue;
    mapping.models.forEach((modelName) => priorityNames.add(modelName));
  }

  const orderedPriority = [...priorityNames].filter((name) => allModelNames.includes(name));
  const rest = allModelNames.filter((name) => !priorityNames.has(name));
  return [...orderedPriority, ...rest];
}

function extractSnippetsFromDocument(doc, fields, queryRegex, queryLower) {
  const snippets = {};
  let score = 0;

  for (const field of fields) {
    const value = doc[field];
    if (value == null) continue;

    let textValue = '';
    if (typeof value === 'string') {
      textValue = value;
    } else if (Array.isArray(value)) {
      textValue = value
        .filter((v) => typeof v === 'string' && v.trim())
        .join(' | ');
    }

    if (!textValue) continue;

    const normalized = normalizeSpace(textValue);
    if (!normalized) continue;

    if (queryRegex.test(normalized) || normalized.toLowerCase().includes(queryLower)) {
      snippets[field] = truncateText(normalized);
      score += field.toLowerCase().includes('title') || field.toLowerCase().includes('name') ? 5 : 2;
    }
  }

  return { snippets, score };
}

async function hasTextIndex(model) {
  if (modelTextIndexCache.has(model.modelName)) {
    return modelTextIndexCache.get(model.modelName);
  }

  if (modelTextIndexCheckPromise.has(model.modelName)) {
    return modelTextIndexCheckPromise.get(model.modelName);
  }

  const checkPromise = (async () => {
    try {
      const indexes = await model.collection.indexes();
      const hasIndex = indexes.some((index) =>
        Object.values(index.key || {}).some((value) => value === 'text')
      );
      modelTextIndexCache.set(model.modelName, hasIndex);
      return hasIndex;
    } catch (error) {
      modelTextIndexCache.set(model.modelName, false);
      return false;
    } finally {
      modelTextIndexCheckPromise.delete(model.modelName);
    }
  })();

  modelTextIndexCheckPromise.set(model.modelName, checkPromise);
  return checkPromise;
}

async function searchSingleModel(
  modelName,
  query,
  queryRegex,
  queryLower,
  tokenRegex,
  perModelLimit
) {
  const model = mongoose.models[modelName];
  if (!model) return [];

  const fields = extractSearchableStringFields(model);
  if (!fields.length) return [];
  const searchFields = fields.slice(0, MAX_TEXT_FIELDS_PER_MODEL);

  const projection = { _id: 1, id: 1 };
  searchFields.forEach((field) => {
    projection[field] = 1;
  });

  let docs = [];
  let strategy = 'regex';

  const modelHasTextIndex = await hasTextIndex(model);
  if (modelHasTextIndex) {
    try {
      docs = await model
        .find({ $text: { $search: query } }, { ...projection, score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(Math.max(perModelLimit, 1))
        .maxTimeMS(TEXT_QUERY_MAX_TIME_MS)
        .lean();
      if (docs.length) strategy = 'text';
    } catch (error) {
      docs = [];
    }
  }

  if (!docs.length) {
    const regexForQuery = tokenRegex || queryRegex;
    const orConditions = searchFields.map((field) => ({ [field]: regexForQuery }));
    try {
      docs = await model
        .find({ $or: orConditions }, projection)
        .limit(Math.max(perModelLimit * 2, 2))
        .maxTimeMS(REGEX_QUERY_MAX_TIME_MS)
        .lean();
    } catch (error) {
      docs = [];
    }
  }

  const hits = [];
  for (const doc of docs) {
    const extracted = extractSnippetsFromDocument(doc, searchFields, queryRegex, queryLower);
    const snippets = extracted.snippets;
    if (!Object.keys(snippets).length) continue;

    hits.push({
      model: modelName,
      documentId: String(doc.id || doc._id),
      strategy,
      snippets,
      score: extracted.score
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, perModelLimit);
}

async function searchInBatches(
  modelNames,
  query,
  queryRegex,
  queryLower,
  tokenRegex,
  limit,
  perModelLimit
) {
  const hits = [];
  const batchSize = 8;
  let searchedModels = 0;

  for (let i = 0; i < modelNames.length; i += batchSize) {
    const batch = modelNames.slice(i, i + batchSize);
    searchedModels += batch.length;
    const batchResults = await Promise.all(
      batch.map((modelName) =>
        searchSingleModel(modelName, query, queryRegex, queryLower, tokenRegex, perModelLimit)
      )
    );

    for (const modelHits of batchResults) {
      hits.push(...modelHits);
      if (hits.length >= limit) return hits.slice(0, limit);
    }
  }

  return { hits: hits.slice(0, limit), searchedModels };
}

async function searchAppContent(query, options = {}) {
  initializeAllModels();

  const normalizedQuery = normalizeSpace(query);
  const limit = Math.max(1, Math.min(Number(options.limit) || 12, 30));
  const perModelLimit = Math.max(1, Math.min(Number(options.perModelLimit) || 2, 5));

  if (!normalizedQuery) {
    return {
      query: '',
      found: false,
      totalMatches: 0,
      hits: [],
      searchedModels: 0
    };
  }

  const cached = getCachedQueryResult(normalizedQuery, limit, perModelLimit);
  if (cached) return { ...cached, cache: true };

  const orderedModels = getPrioritizedModels(normalizedQuery, searchableModelNames);
  const queryRegex = new RegExp(escapeRegex(normalizedQuery), 'i');
  const tokens = tokenizeQuery(normalizedQuery);
  const tokenRegex = tokens.length ? new RegExp(escapeRegex(tokens[0]), 'i') : queryRegex;
  const queryLower = normalizedQuery.toLowerCase();

  const searchResult = await searchInBatches(
    orderedModels,
    normalizedQuery,
    queryRegex,
    queryLower,
    tokenRegex,
    limit,
    perModelLimit
  );

  const sortedHits = searchResult.hits.sort((a, b) => b.score - a.score);
  const finalHits = sortedHits.map((hit) => ({
    model: hit.model,
    documentId: hit.documentId,
    strategy: hit.strategy,
    snippets: hit.snippets
  }));

  const payload = {
    query: normalizedQuery,
    found: finalHits.length > 0,
    totalMatches: finalHits.length,
    hits: finalHits,
    searchedModels: searchResult.searchedModels
  };

  setCachedQueryResult(normalizedQuery, limit, perModelLimit, payload);
  return payload;
}

module.exports = {
  searchAppContent
};
