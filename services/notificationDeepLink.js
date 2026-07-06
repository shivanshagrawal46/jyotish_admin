// Shared deep-link builder for notifications. Used by both the legacy EJS admin
// route (routes/notifications.js) and the React admin API (routes/api/adminNotifications.js)
// so the deep-link format stays identical everywhere.
const EMagazine = require('../models/EMagazine');

const SECTION_SCREENS = {
  kosh: 'KoshContentDetail',
  karmkand: 'KarmkandContentDetail',
  book: 'BookContentDetail',
  muhurat: 'MuhuratDetail',
  rashifal_daily: 'RashifalDailyDetail',
  numerology_daily: 'NumerologyDailyDetail',
  festival: 'FestivalDetail',
  emagazine: 'EMagazineDetail',
  youtube: 'YouTubeDetail',
};

async function buildDeepLink(body) {
  const {
    dl_contentType,
    dl_categoryId,
    dl_categoryName,
    dl_subCategoryId,
    dl_subCategoryName,
    dl_level3Id,
    dl_level3Name,
    dl_contentId,
    dl_contentTitle,
  } = body;

  if (!dl_contentType || !dl_contentId) return null;

  const screen = SECTION_SCREENS[dl_contentType] || null;
  let deepLinkUrl = '';
  let writerName = null;
  let writerImage = null;
  let subjectName = null;
  let categoryName = dl_categoryName || null;
  let subCategoryName = dl_subCategoryName || null;

  if (dl_contentType === 'emagazine' && dl_contentId) {
    const mag = await EMagazine.findById(dl_contentId)
      .populate('category', 'name')
      .populate('subject', 'name')
      .populate('writer', 'name image')
      .lean();
    if (mag) {
      categoryName = mag.category?.name || null;
      subjectName = mag.subject?.name || null;
      writerName = mag.writer?.name || null;
      writerImage = mag.writer?.image || null;
    }
  }

  switch (dl_contentType) {
    case 'kosh':
    case 'karmkand':
      deepLinkUrl = `jyotishapp://${dl_contentType}/${dl_categoryId}/${dl_subCategoryId}/${dl_contentId}`;
      break;
    case 'book':
      deepLinkUrl = `jyotishapp://book/${dl_categoryId}/${dl_subCategoryId}/${dl_level3Id}/${dl_contentId}`;
      break;
    case 'muhurat':
      deepLinkUrl = `jyotishapp://muhurat/${dl_categoryId}/${dl_contentId}`;
      break;
    case 'rashifal_daily':
      deepLinkUrl = `jyotishapp://rashifal/daily/${dl_categoryId}/${dl_contentId}`;
      break;
    case 'numerology_daily':
      deepLinkUrl = `jyotishapp://numerology/daily/${dl_categoryId}/${dl_contentId}`;
      break;
    case 'festival':
      deepLinkUrl = `jyotishapp://festival/${dl_contentId}`;
      break;
    case 'emagazine':
      deepLinkUrl = `jyotishapp://emagazine/${dl_contentId}`;
      break;
    case 'youtube':
      deepLinkUrl = `jyotishapp://youtube/${dl_contentId}`;
      break;
  }

  const navigationParams = {
    section: dl_contentType,
    screen,
    contentId: dl_contentId,
    contentTitle: dl_contentTitle || null,
  };
  if (dl_categoryId) navigationParams.categoryId = dl_categoryId;
  if (categoryName) navigationParams.categoryName = categoryName;
  if (dl_subCategoryId) navigationParams.subCategoryId = dl_subCategoryId;
  if (subCategoryName) navigationParams.subCategoryName = subCategoryName;
  if (dl_level3Id) navigationParams.level3Id = dl_level3Id;
  if (dl_level3Name) navigationParams.level3Name = dl_level3Name;
  if (writerName) navigationParams.writerName = writerName;
  if (writerImage) navigationParams.writerImage = writerImage;
  if (subjectName) navigationParams.subjectName = subjectName;

  const result = {
    contentType: dl_contentType,
    categoryId: dl_categoryId || null,
    categoryName,
    subCategoryId: dl_subCategoryId || null,
    subCategoryName,
    level3Id: dl_level3Id || null,
    level3Name: dl_level3Name || null,
    contentId: dl_contentId,
    contentTitle: dl_contentTitle || null,
    deepLinkUrl,
    screen,
    navigationParams,
  };
  if (writerName) result.writerName = writerName;
  if (writerImage) result.writerImage = writerImage;
  if (subjectName) result.subjectName = subjectName;
  return result;
}

module.exports = { buildDeepLink, SECTION_SCREENS };
