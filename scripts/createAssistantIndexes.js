/**
 * Creates indexes used by Assistant Search + Chat.
 *
 * Usage:
 *   node scripts/createAssistantIndexes.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const EXCLUDED_FILES = new Set(['Csu.js', 'Csu2.js']);
const EXCLUDED_MODELS = new Set(['Csu', 'Csu2']);

function getStringFields(model) {
  const fields = [];
  const schemaPaths = model.schema?.paths || {};
  for (const [fieldName, schemaType] of Object.entries(schemaPaths)) {
    if (fieldName === '_id' || fieldName === '__v' || fieldName.startsWith('_')) continue;

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
  return [...new Set(fields)];
}

async function ensureTextIndex(model) {
  const fields = getStringFields(model);
  if (!fields.length) return;

  const existing = await model.collection.indexes();
  const hasTextIndex = existing.some((index) =>
    Object.values(index.key || {}).some((value) => value === 'text')
  );
  if (hasTextIndex) return;

  const textSpec = {};
  fields.slice(0, 24).forEach((field) => {
    textSpec[field] = 'text';
  });

  if (!Object.keys(textSpec).length) return;

  try {
    await model.collection.createIndex(textSpec, {
      name: 'assistant_text_search',
      background: true,
      default_language: 'none',
      language_override: 'language'
    });
  } catch (error) {
    const message = String(error && error.message ? error.message : '');
    // Some legacy documents store unsupported language values (e.g. "Hindi").
    // Skip text index for that collection; regex fallback search still works.
    if (
      message.includes('language override unsupported') ||
      message.includes('unsupported language')
    ) {
      console.warn(`Skipped text index for ${model.modelName}: unsupported language override`);
      return;
    }
    throw error;
  }
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const modelsDir = path.join(__dirname, '..', 'models');
    const modelFiles = fs
      .readdirSync(modelsDir)
      .filter((file) => file.endsWith('.js') && !EXCLUDED_FILES.has(file));

    modelFiles.forEach((file) => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      require(path.join(modelsDir, file));
    });

    // Register assistant models so their schema indexes are synced as well.
    require('../models/AssistantChatSession');
    require('../models/AssistantChatMessage');

    const modelNames = mongoose.modelNames().filter((name) => !EXCLUDED_MODELS.has(name));
    for (const modelName of modelNames) {
      const model = mongoose.models[modelName];
      await ensureTextIndex(model);
      await model.syncIndexes();
      console.log(`Indexed: ${modelName}`);
    }

    console.log('Assistant indexes created successfully');
  } catch (error) {
    console.error('Assistant index creation failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
