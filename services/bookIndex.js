// Builds a printed-book style index (table of contents) for a book: chapters,
// the topics inside each chapter, and the page number every one of them starts
// on. Page numbers are derived purely from the stored content, so nobody has to
// enter them in the admin panel and the same data always yields the same result.

// A page holds this much plain text. Tuned for a typical mobile reader page.
const DEFAULT_CHARS_PER_PAGE = 1800;
// Vertical space an image is assumed to take, expressed in "characters".
const DEFAULT_IMAGE_CHARS = 900;
// Space taken by a topic heading plus the blank line after it.
const HEADING_CHARS = 120;
// A topic never starts inside this last sliver of a page; it moves to the next
// one instead, the way a typesetter avoids orphan headings.
const ORPHAN_GUARD_CHARS = 200;

function plainTextLength(html) {
  if (!html) return 0;
  return String(html)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

function pickTitle(topic) {
  return topic.title_hn || topic.title_en || topic.title_hinglish || 'Untitled';
}

// Imported books contain placeholder rows with no title, no body and no images.
// They are not part of the printed book, so they are left out of the index and
// take up no pages.
function isEmptyTopic(topic) {
  if (topic.title_hn || topic.title_en || topic.title_hinglish) return false;
  if ((topic.images || []).length) return false;
  return !plainTextLength(topic.meaning) && !plainTextLength(topic.details) && !plainTextLength(topic.extra);
}

// Tracks a running cursor through the book and hands out page ranges.
function createPaginator({ charsPerPage, imageChars }) {
  let page = 1;
  let used = 0; // characters already placed on the current page

  return {
    // Force the next block onto a fresh page (chapters open on their own page).
    breakPage() {
      if (used > 0) {
        page += 1;
        used = 0;
      }
    },
    // Place `weight` characters and report which pages they landed on.
    place(weight) {
      if (used > 0 && charsPerPage - used < ORPHAN_GUARD_CHARS) {
        page += 1;
        used = 0;
      }
      const startPage = page;
      let remaining = Math.max(weight, 1);
      const spaceLeft = charsPerPage - used;

      if (remaining <= spaceLeft) {
        used += remaining;
      } else {
        remaining -= spaceLeft;
        const extraPages = Math.ceil(remaining / charsPerPage);
        page += extraPages;
        used = remaining - (extraPages - 1) * charsPerPage;
      }
      return { startPage, endPage: page };
    },
    currentPage() {
      return page;
    },
    lastUsedPage() {
      return used > 0 ? page : Math.max(page - 1, 0);
    },
  };
}

/**
 * Compute the index for one book.
 *
 * @param {Object} params
 * @param {Object} params.book                 lean BookName document
 * @param {Array<Object>} params.chapters      lean chapters, already in reading order
 * @param {Array<Object>} params.contents      lean contents for the whole book, in reading order
 * @param {number} [params.charsPerPage]
 * @param {number} [params.imageChars]
 * @param {boolean} [params.includeFrontMatter] count acknowledgement pages before chapter 1
 * @param {Set<string>} [params.purchasedIds] BookContent _ids the caller has paid for
 */
function buildBookIndex({
  book,
  chapters = [],
  contents = [],
  charsPerPage = DEFAULT_CHARS_PER_PAGE,
  imageChars = DEFAULT_IMAGE_CHARS,
  includeFrontMatter = true,
  purchasedIds = null,
} = {}) {
  const paginator = createPaginator({ charsPerPage, imageChars });

  const byChapter = new Map();
  let skippedEmpty = 0;
  contents.forEach((c) => {
    if (isEmptyTopic(c)) {
      skippedEmpty += 1;
      return;
    }
    const key = String(c.chapter);
    if (!byChapter.has(key)) byChapter.set(key, []);
    byChapter.get(key).push(c);
  });

  const frontMatter = [];
  if (includeFrontMatter && book && (book.acknowledgement_content || book.acknowledgement_title)) {
    const weight =
      HEADING_CHARS +
      plainTextLength(book.acknowledgement_title) +
      plainTextLength(book.acknowledgement_content);
    const { startPage, endPage } = paginator.place(weight);
    frontMatter.push({
      type: 'acknowledgement',
      title: book.acknowledgement_title || 'Acknowledgement',
      page: startPage,
      start_page: startPage,
      end_page: endPage,
      page_count: endPage - startPage + 1,
    });
  }

  const indexedChapters = chapters.map((chapter, chapterIdx) => {
    paginator.breakPage();
    const chapterStart = paginator.currentPage();
    const topics = (byChapter.get(String(chapter._id)) || []).map((topic, topicIdx) => {
      const weight =
        HEADING_CHARS +
        plainTextLength(pickTitle(topic)) +
        plainTextLength(topic.meaning) +
        plainTextLength(topic.details) +
        plainTextLength(topic.extra) +
        (topic.images || []).length * imageChars;
      const { startPage, endPage } = paginator.place(weight);
      return {
        _id: topic._id,
        id: topic.id,
        topic_no: topicIdx + 1,
        sequence: topic.sequence ?? 0,
        title: pickTitle(topic),
        title_hn: topic.title_hn || '',
        title_en: topic.title_en || '',
        title_hinglish: topic.title_hinglish || '',
        page: startPage,
        start_page: startPage,
        end_page: endPage,
        page_count: endPage - startPage + 1,
        payment: !!topic.payment,
        amount: topic.amount || 0,
        // What the app posts to /api/purchase as contentId for this topic.
        content_id: String(topic._id),
        // A paid topic is unlocked only for a caller who has bought it. With no
        // email/phone supplied, every paid topic reads as locked.
        locked: !!topic.payment && !(purchasedIds && purchasedIds.has(String(topic._id))),
        purchased: !topic.payment || !!(purchasedIds && purchasedIds.has(String(topic._id))),
      };
    });

    // A chapter with no topics still occupies its opening page.
    const chapterEnd = topics.length ? topics[topics.length - 1].end_page : chapterStart;
    if (!topics.length) paginator.place(HEADING_CHARS);

    return {
      _id: chapter._id,
      id: chapter.id,
      chapter_no: chapterIdx + 1,
      name: chapter.name,
      page: chapterStart,
      start_page: chapterStart,
      end_page: chapterEnd,
      page_count: chapterEnd - chapterStart + 1,
      topic_count: topics.length,
      paid_topic_count: topics.filter((t) => t.payment).length,
      locked_topic_count: topics.filter((t) => t.locked).length,
      topics,
    };
  });

  return {
    total_pages: paginator.lastUsedPage(),
    total_chapters: indexedChapters.length,
    total_topics: indexedChapters.reduce((sum, ch) => sum + ch.topic_count, 0),
    skipped_empty_topics: skippedEmpty,
    purchase: (() => {
      const paid = indexedChapters.flatMap((ch) => ch.topics).filter((t) => t.payment);
      const locked = paid.filter((t) => t.locked);
      return {
        // false when the caller sent no email/phone, so the app knows the lock
        // flags are the "not signed in" view rather than a real entitlement.
        identified: !!purchasedIds,
        paid_topics: paid.length,
        purchased_topics: paid.length - locked.length,
        locked_topics: locked.length,
        // Cost of everything still locked, for an "unlock all" price.
        locked_amount: locked.reduce((sum, t) => sum + (t.amount || 0), 0),
      };
    })(),
    settings: { chars_per_page: charsPerPage, image_chars: imageChars },
    front_matter: frontMatter,
    chapters: indexedChapters,
  };
}

// Flattens the index into printed-index rows, ready to render as a list.
function flattenIndex(index) {
  const rows = [];
  index.front_matter.forEach((fm) => {
    rows.push({ type: fm.type, level: 0, label: fm.title, page: fm.page });
  });
  index.chapters.forEach((ch) => {
    rows.push({
      type: 'chapter',
      level: 0,
      label: ch.name,
      chapter_no: ch.chapter_no,
      page: ch.page,
    });
    ch.topics.forEach((t) => {
      rows.push({
        type: 'topic',
        level: 1,
        label: t.title,
        chapter_no: ch.chapter_no,
        topic_no: t.topic_no,
        page: t.page,
        payment: t.payment,
        amount: t.amount,
        locked: t.locked,
        purchased: t.purchased,
        content_id: t.content_id,
      });
    });
  });
  return rows;
}

/**
 * Loads a book's chapters/contents in reading order and returns its index.
 * Models are injected so the same logic can serve Granths later.
 */
async function loadBookIndex({ book, ChapterModel, ContentModel, ...options }) {
  const [chapters, contents] = await Promise.all([
    ChapterModel.find({ book: book._id }).sort({ id: 1, createdAt: 1 }).lean(),
    ContentModel.find({ book: book._id })
      .select('id chapter title_hn title_en title_hinglish meaning details extra images payment amount sequence')
      .sort({ sequence: 1, createdAt: 1 })
      .lean(),
  ]);
  return buildBookIndex({ book, chapters, contents, ...options });
}

module.exports = {
  buildBookIndex,
  flattenIndex,
  loadBookIndex,
  plainTextLength,
  DEFAULT_CHARS_PER_PAGE,
  DEFAULT_IMAGE_CHARS,
};
