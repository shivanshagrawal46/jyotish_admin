const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const BookCategory = require('../models/BookCategory');
const BookName = require('../models/BookName');
const BookChapter = require('../models/BookChapter');
const BookContent = require('../models/BookContent');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/books';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Main book page with navigation
router.get('/', (req, res) => {
    res.render('book/index', { activePage: 'book' });
});

// Book Category Routes
router.get('/category', async (req, res) => {
    try {
        const categories = await BookCategory.find().sort({ createdAt: -1 });
        res.render('book/category/index', { 
            categories,
            activePage: 'book',
            activeSection: 'category',
            activeTab: 'category'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add Category
router.get('/category/add', (req, res) => {
    res.render('book/category/add', {
        activePage: 'book',
        activeSection: 'category'
    });
});

router.post('/category/add', upload.single('cover_image'), async (req, res) => {
    try {
        const { name } = req.body;
        let cover_image = '';
        
        if (req.file) {
            cover_image = '/uploads/books/' + req.file.filename;
        }

        const category = new BookCategory({
            name,
            cover_image
        });

        await category.save();
        res.redirect('/book/category');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving category: ' + err.message);
    }
});

// Edit Category
router.get('/category/edit/:id', async (req, res) => {
    try {
        const category = await BookCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).send('Category not found');
        }
        res.render('book/category/edit', {
            category,
            activePage: 'book',
            activeSection: 'category'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/category/edit/:id', upload.single('cover_image'), async (req, res) => {
    try {
        const { name } = req.body;
        const updateData = { name };
        
        if (req.file) {
            updateData.cover_image = '/uploads/books/' + req.file.filename;
        }

        const category = await BookCategory.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!category) {
            return res.status(404).send('Category not found');
        }

        res.redirect('/book/category');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete Category
router.post('/category/delete/:id', async (req, res) => {
    try {
        const category = await BookCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).send('Category not found');
        }

        // Check if category has any books
        const hasBooks = await BookName.exists({ category: req.params.id });
        if (hasBooks) {
            return res.status(400).send('Cannot delete category with existing books');
        }

        await category.deleteOne();
        res.redirect('/book/category');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Book Name Routes
router.get('/name', async (req, res) => {
    try {
        const books = await BookName.find()
            .populate('category')
            .sort({ createdAt: -1 });
        const categories = await BookCategory.find();
        res.render('book/name/index', { 
            books,
            categories,
            activePage: 'book',
            activeSection: 'name',
            activeTab: 'name'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add Book
router.get('/name/add', async (req, res) => {
    try {
        const categories = await BookCategory.find().sort({ name: 1 });
        res.render('book/name/add', {
            categories,
            activePage: 'book',
            activeSection: 'name'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/name/add', upload.single('book_image'), async (req, res) => {
    try {
        const { name, category } = req.body;
        let book_image = '';
        
        if (req.file) {
            book_image = '/uploads/books/' + req.file.filename;
        }

        const book = new BookName({
            name,
            category,
            book_image
        });

        await book.save();
        res.redirect('/book/name');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving book: ' + err.message);
    }
});

// Edit Book
router.get('/name/edit/:id', async (req, res) => {
    try {
        const book = await BookName.findById(req.params.id);
        const categories = await BookCategory.find().sort({ name: 1 });
        
        if (!book) {
            return res.status(404).send('Book not found');
        }
        
        res.render('book/name/edit', {
            book,
            categories,
            activePage: 'book',
            activeSection: 'name'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/name/edit/:id', upload.single('book_image'), async (req, res) => {
    try {
        const { name, category } = req.body;
        const updateData = { name, category };
        
        if (req.file) {
            updateData.book_image = '/uploads/books/' + req.file.filename;
        }

        const book = await BookName.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!book) {
            return res.status(404).send('Book not found');
        }

        res.redirect('/book/name');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete Book
router.post('/name/delete/:id', async (req, res) => {
    try {
        const book = await BookName.findById(req.params.id);
        if (!book) {
            return res.status(404).send('Book not found');
        }

        // Check if book has any chapters
        const hasChapters = await BookChapter.exists({ book: req.params.id });
        if (hasChapters) {
            return res.status(400).send('Cannot delete book with existing chapters');
        }

        await book.deleteOne();
        res.redirect('/book/name');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Book Chapter Routes
router.get('/chapter', async (req, res) => {
    try {
        const chapters = await BookChapter.find()
            .populate('category')
            .populate('book')
            .sort({ createdAt: -1 });
        const categories = await BookCategory.find();
        const books = await BookName.find();
        res.render('book/chapter/index', { 
            chapters,
            categories,
            books,
            activePage: 'book',
            activeSection: 'chapter',
            activeTab: 'chapter'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add Chapter
router.get('/chapter/add', async (req, res) => {
    try {
        const categories = await BookCategory.find().sort({ name: 1 });
        const books = await BookName.find().sort({ name: 1 });
        res.render('book/chapter/add', {
            categories,
            books,
            activePage: 'book',
            activeSection: 'chapter'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/chapter/add', async (req, res) => {
    try {
        const { name, category, book } = req.body;

        const chapter = new BookChapter({
            name,
            category,
            book
        });

        await chapter.save();
        res.redirect('/book/chapter');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving chapter: ' + err.message);
    }
});

// Edit Chapter
router.get('/chapter/edit/:id', async (req, res) => {
    try {
        const chapter = await BookChapter.findById(req.params.id);
        const categories = await BookCategory.find().sort({ name: 1 });
        const books = await BookName.find().sort({ name: 1 });
        
        if (!chapter) {
            return res.status(404).send('Chapter not found');
        }
        
        res.render('book/chapter/edit', {
            chapter,
            categories,
            books,
            activePage: 'book',
            activeSection: 'chapter'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/chapter/edit/:id', async (req, res) => {
    try {
        const { name, category, book } = req.body;
        const chapter = await BookChapter.findByIdAndUpdate(
            req.params.id,
            { name, category, book },
            { new: true }
        );

        if (!chapter) {
            return res.status(404).send('Chapter not found');
        }

        res.redirect('/book/chapter');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete Chapter
router.post('/chapter/delete/:id', async (req, res) => {
    try {
        const chapter = await BookChapter.findById(req.params.id);
        if (!chapter) {
            return res.status(404).send('Chapter not found');
        }

        // Check if chapter has any content
        const hasContent = await BookContent.exists({ chapter: req.params.id });
        if (hasContent) {
            return res.status(400).send('Cannot delete chapter with existing content');
        }

        await chapter.deleteOne();
        res.redirect('/book/chapter');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Show all contents for a chapter
router.get('/chapter/:chapterId/contents', async (req, res) => {
    try {
        const contents = await BookContent.find({ chapter: req.params.chapterId })
            .populate('category')
            .populate('book')
            .populate('chapter');
        const chapter = await BookChapter.findById(req.params.chapterId)
            .populate('category')
            .populate('book');
        if (!chapter) {
            return res.status(404).send('Chapter not found');
        }
        res.render('book/chapter/contents', {
            contents,
            chapter,
            activePage: 'book',
            activeSection: 'chapter'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Book Content Routes
router.get('/content', async (req, res) => {
    try {
        const contents = await BookContent.find()
            .populate('category')
            .populate('book')
            .populate('chapter')
            .sort({ createdAt: -1 });
        const categories = await BookCategory.find();
        const books = await BookName.find();
        const chapters = await BookChapter.find();
        res.render('book/content/index', { 
            contents,
            categories,
            books,
            chapters,
            activePage: 'book',
            activeSection: 'content',
            activeTab: 'content'
        });
    } catch (error) {
        console.error('Error fetching contents:', error);
        res.status(500).send('Server error');
    }
});

// Add Content
router.get('/content/add', async (req, res) => {
    try {
        const categories = await BookCategory.find().sort({ name: 1 });
        const books = await BookName.find()
            .populate('category', '_id name')
            .sort({ name: 1 });
        const chapters = await BookChapter.find()
            .populate('book', '_id name')
            .sort({ name: 1 });
            
        res.render('book/content/add', { 
            categories, 
            books, 
            chapters,
            activePage: 'book',
            activeSection: 'content'
        });
    } catch (error) {
        console.error('Error fetching data for content form:', error);
        res.status(500).send('Server error');
    }
});

router.post('/content/add', upload.array('images', 10), async (req, res) => {
    try {
        const { 
            category, book, chapter, 
            title_hn, title_en, title_hinglish,
            meaning, details, extra, video_links 
        } = req.body;
        
        // Process video links
        const videoLinksArray = video_links ? video_links.split('\n').map(link => link.trim()).filter(link => link) : [];
        
        // Process uploaded images
        const imageLinks = req.files ? req.files.map(file => `/uploads/books/${file.filename}`) : [];

        const content = new BookContent({
            category,
            book,
            chapter,
            title_hn,
            title_en,
            title_hinglish,
            meaning,
            details,
            extra,
            images: imageLinks,
            video_links: videoLinksArray
        });

        await content.save();
        res.redirect('/book/content');
    } catch (error) {
        console.error('Error saving content:', error);
        res.status(500).send('Server error');
    }
});

// Edit Content
router.get('/content/edit/:id', async (req, res) => {
    try {
        const content = await BookContent.findById(req.params.id);
        const categories = await BookCategory.find().sort({ name: 1 });
        const books = await BookName.find()
            .populate('category', '_id name')
            .sort({ name: 1 });
        const chapters = await BookChapter.find()
            .populate('book', '_id name')
            .sort({ name: 1 });
        
        if (!content) {
            return res.status(404).send('Content not found');
        }
        
        res.render('book/content/edit', {
            content,
            categories,
            books,
            chapters,
            activePage: 'book',
            activeSection: 'content'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/content/edit/:id', upload.array('images', 10), async (req, res) => {
    try {
        const { 
            category, book, chapter, 
            title_hn, title_en, title_hinglish,
            meaning, details, extra, video_links 
        } = req.body;

        // Process video links
        const videoLinksArray = video_links ? video_links.split('\n').map(link => link.trim()).filter(link => link) : [];
        
        // Process uploaded images
        const imageLinks = req.files ? req.files.map(file => `/uploads/books/${file.filename}`) : [];

        const updateData = {
            category,
            book,
            chapter,
            title_hn,
            title_en,
            title_hinglish,
            meaning,
            details,
            extra,
            video_links: videoLinksArray
        };

        // Only update images if new ones were uploaded
        if (imageLinks.length > 0) {
            updateData.images = imageLinks;
        }

        const content = await BookContent.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!content) {
            return res.status(404).send('Content not found');
        }

        res.redirect('/book/content');
    } catch (err) {
        console.error('Error updating content:', err);
        // If there's an error, try to redirect to the edit page with error message
        const content = await BookContent.findById(req.params.id);
        if (content) {
            const categories = await BookCategory.find().sort({ name: 1 });
            const books = await BookName.find()
                .populate('category', '_id name')
                .sort({ name: 1 });
            const chapters = await BookChapter.find()
                .populate('book', '_id name')
                .sort({ name: 1 });
            
            res.render('book/content/edit', {
                content,
                categories,
                books,
                chapters,
                activePage: 'book',
                activeSection: 'content',
                error: 'Error updating content. Please try again.'
            });
        } else {
            res.redirect('/book/content');
        }
    }
});

// Delete Content
router.post('/content/delete/:id', async (req, res) => {
    try {
        const content = await BookContent.findById(req.params.id);
        if (!content) {
            return res.status(404).send('Content not found');
        }

        await content.deleteOne();
        res.redirect('/book/content');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Handle Excel upload for chapters
router.post('/chapter/upload-excel', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.render('book/chapter/index', {
                chapters: await BookChapter.find().populate('category').populate('book').sort({ createdAt: -1 }),
                categories: await BookCategory.find(),
                books: await BookName.find(),
                activePage: 'book',
                activeSection: 'chapter',
                activeTab: 'chapter',
                error: 'Please upload an Excel file.'
            });
        }

        const workbook = xlsx.readFile(req.file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const chapters = [];
        for (const row of data) {
            if (!row.Category || !row.Book || !row.Name) {
                continue; // Skip rows with missing required fields
            }

            // Find category and book by name
            const category = await BookCategory.findOne({ name: row.Category });
            const book = await BookName.findOne({ name: row.Book });

            if (!category || !book) {
                continue; // Skip if category or book not found
            }

            // Create a new chapter instance to trigger the auto-increment
            const chapter = new BookChapter({
                category: category._id,
                book: book._id,
                name: row.Name
            });

            chapters.push(chapter);
        }

        if (chapters.length > 0) {
            // Save chapters one by one to ensure proper ID generation
            for (const chapter of chapters) {
                await chapter.save();
            }
            // Delete the uploaded file
            fs.unlinkSync(req.file.path);
            res.redirect('/book/chapter');
        } else {
            res.render('book/chapter/index', {
                chapters: await BookChapter.find().populate('category').populate('book').sort({ createdAt: -1 }),
                categories: await BookCategory.find(),
                books: await BookName.find(),
                activePage: 'book',
                activeSection: 'chapter',
                activeTab: 'chapter',
                error: 'No valid chapter data found in the Excel file.'
            });
        }
    } catch (err) {
        console.error('Error processing Excel file:', err);
        res.render('book/chapter/index', {
            chapters: await BookChapter.find().populate('category').populate('book').sort({ createdAt: -1 }),
            categories: await BookCategory.find(),
            books: await BookName.find(),
            activePage: 'book',
            activeSection: 'chapter',
            activeTab: 'chapter',
            error: 'Error processing Excel file. Please check the file format.'
        });
    }
});

// Handle Excel upload for content
router.post('/content/upload-excel', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.render('book/content/index', {
                contents: await BookContent.find().populate('category').populate('book').populate('chapter').sort({ createdAt: -1 }),
                categories: await BookCategory.find(),
                books: await BookName.find(),
                chapters: await BookChapter.find(),
                activePage: 'book',
                activeSection: 'content',
                activeTab: 'content',
                error: 'Please upload an Excel file.'
            });
        }

        const workbook = xlsx.readFile(req.file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.render('book/content/index', {
                contents: await BookContent.find().populate('category').populate('book').populate('chapter').sort({ createdAt: -1 }),
                categories: await BookCategory.find(),
                books: await BookName.find(),
                chapters: await BookChapter.find(),
                activePage: 'book',
                activeSection: 'content',
                activeTab: 'content',
                error: 'Excel file is empty or has no data rows.'
            });
        }

        // Check for required headers
        const requiredHeaders = ['Category', 'Book', 'Chapter', 'Title (Hindi)', 'Title (English)', 'Title (Hinglish)', 'Meaning', 'Details'];
        const firstRow = data[0];
        const missingHeaders = requiredHeaders.filter(header => !(header in firstRow));
        
        if (missingHeaders.length > 0) {
            fs.unlinkSync(req.file.path);
            return res.render('book/content/index', {
                contents: await BookContent.find().populate('category').populate('book').populate('chapter').sort({ createdAt: -1 }),
                categories: await BookCategory.find(),
                books: await BookName.find(),
                chapters: await BookChapter.find(),
                activePage: 'book',
                activeSection: 'content',
                activeTab: 'content',
                error: `Missing required column headers: ${missingHeaders.join(', ')}. Please ensure your Excel file has the correct headers.`
            });
        }

        const contents = [];
        const errors = [];
        let processedRows = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel row number (accounting for header row)

            // Check for missing required fields
            const missingFields = [];
            if (!row.Category) missingFields.push('Category');
            if (!row.Book) missingFields.push('Book');
            if (!row.Chapter) missingFields.push('Chapter');
            if (!row['Title (Hindi)']) missingFields.push('Title (Hindi)');
            if (!row['Title (English)']) missingFields.push('Title (English)');
            if (!row['Title (Hinglish)']) missingFields.push('Title (Hinglish)');
            if (!row.Meaning) missingFields.push('Meaning');
            if (!row.Details) missingFields.push('Details');

            if (missingFields.length > 0) {
                errors.push(`Row ${rowNumber}: Missing required fields: ${missingFields.join(', ')}`);
                continue;
            }

            // Find category, book, and chapter by name
            const category = await BookCategory.findOne({ name: row.Category });
            const book = await BookName.findOne({ name: row.Book });
            const chapter = await BookChapter.findOne({ name: row.Chapter });

            const notFound = [];
            if (!category) notFound.push(`Category: "${row.Category}"`);
            if (!book) notFound.push(`Book: "${row.Book}"`);
            if (!chapter) notFound.push(`Chapter: "${row.Chapter}"`);

            if (notFound.length > 0) {
                errors.push(`Row ${rowNumber}: Not found in database: ${notFound.join(', ')}`);
                continue;
            }

            // Process video links if present
            const videoLinks = row['Video Links'] ? 
                row['Video Links'].split(',').map(link => link.trim()).filter(link => link) : 
                [];

            contents.push({
                category: category._id,
                book: book._id,
                chapter: chapter._id,
                title_hn: row['Title (Hindi)'],
                title_en: row['Title (English)'],
                title_hinglish: row['Title (Hinglish)'],
                meaning: row.Meaning,
                details: row.Details,
                extra: row.Extra || '',
                video_links: videoLinks
            });
            processedRows++;
        }

        // Delete the uploaded file
        fs.unlinkSync(req.file.path);

        if (contents.length > 0) {
            await BookContent.insertMany(contents);
            const successMessage = `Successfully imported ${contents.length} records.`;
            const errorMessage = errors.length > 0 ? ` However, ${errors.length} rows had errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}` : '';
            
            return res.render('book/content/index', {
                contents: await BookContent.find().populate('category').populate('book').populate('chapter').sort({ createdAt: -1 }),
                categories: await BookCategory.find(),
                books: await BookName.find(),
                chapters: await BookChapter.find(),
                activePage: 'book',
                activeSection: 'content',
                activeTab: 'content',
                success: successMessage + errorMessage
            });
        } else {
            return res.render('book/content/index', {
                contents: await BookContent.find().populate('category').populate('book').populate('chapter').sort({ createdAt: -1 }),
                categories: await BookCategory.find(),
                books: await BookName.find(),
                chapters: await BookChapter.find(),
                activePage: 'book',
                activeSection: 'content',
                activeTab: 'content',
                error: `No valid content data found. Errors: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? '...' : ''}`
            });
        }
    } catch (err) {
        console.error('Error processing Excel file:', err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.render('book/content/index', {
            contents: await BookContent.find().populate('category').populate('book').populate('chapter').sort({ createdAt: -1 }),
            categories: await BookCategory.find(),
            books: await BookName.find(),
            chapters: await BookChapter.find(),
            activePage: 'book',
            activeSection: 'content',
            activeTab: 'content',
            error: `Error processing Excel file: ${err.message}. Please check the file format and try again.`
        });
    }
});

// Export Excel template for book content
router.get('/content/export-excel', async (req, res) => {
    try {
        // Create a new workbook
        const workbook = xlsx.utils.book_new();
        
        // Create sample data with proper headers
        const sampleData = [
            {
                'Category': 'Vedic',
                'Book': 'Rigveda',
                'Chapter': 'Chapter 1',
                'Title (Hindi)': 'श्लोक १',
                'Title (English)': 'Shloka 1',
                'Title (Hinglish)': 'Shloka 1',
                'Meaning': 'This is the meaning of the shloka',
                'Details': 'Detailed explanation of the shloka content',
                'Extra': 'Additional information (optional)',
                'Video Links': 'https://youtube.com/video1,https://youtube.com/video2'
            },
            {
                'Category': 'Vedic',
                'Book': 'Rigveda',
                'Chapter': 'Chapter 1',
                'Title (Hindi)': 'श्लोक २',
                'Title (English)': 'Shloka 2',
                'Title (Hinglish)': 'Shloka 2',
                'Meaning': 'This is the meaning of the second shloka',
                'Details': 'Detailed explanation of the second shloka content',
                'Extra': 'Additional information (optional)',
                'Video Links': 'https://youtube.com/video3'
            }
        ];

        // Create worksheet
        const worksheet = xlsx.utils.json_to_sheet(sampleData);
        
        // Add the worksheet to workbook
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Book Content Template');
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="book_content_template.xlsx"');
        
        // Write the workbook to response
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);
        
    } catch (err) {
        console.error('Error creating Excel template:', err);
        res.status(500).send('Error creating Excel template');
    }
});

module.exports = router; 