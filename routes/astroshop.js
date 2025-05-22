const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const AstroShopCategory = require('../models/AstroShopCategory');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.use(bodyParser.urlencoded({ extended: true }));

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/astroshop';
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

// Astro Shop main page
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Items per page
    const skip = (page - 1) * limit;

    // Get total count of products
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    // Get products for current page
    const products = await Product.find()
      .populate('category')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.render('astroshop/index', {
      products,
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Categories page
router.get('/categories', async (req, res) => {
  const categories = await AstroShopCategory.find().sort({ created_at: -1 });
  res.render('astroshop/categories', { categories });
});

// Add Category form
router.get('/categories/add', (req, res) => {
  res.render('astroshop/add-category');
});

// Handle Add Category POST
router.post('/categories/add', async (req, res) => {
  try {
    const { name } = req.body;
    const category = new AstroShopCategory({ name });
    await category.save();
    res.redirect('/astro-shop/categories');
  } catch (err) {
    res.status(500).send('Error saving category: ' + err.message);
  }
});

// Add Product form
router.get('/add', async (req, res) => {
  const categories = await AstroShopCategory.find().sort({ name: 1 });
  res.render('astroshop/add', { categories });
});

// Handle Add Product POST
router.post('/add', upload.array('images', 10), async (req, res) => {
  try {
    const {
      title,
      category,
      short_description,
      full_description,
      price,
      original_price,
      discount_percentage,
      stock_quantity,
      is_active,
      promo_note,
      offers
    } = req.body;

    // Images: get file paths
    let imagesArr = [];
    if (req.files && req.files.length > 0) {
      imagesArr = req.files.map(f => '/uploads/products/' + f.filename);
    }

    // Parse offers (array of objects)
    let offersArr = [];
    if (offers) {
      if (Array.isArray(offers)) {
        offersArr = offers;
      } else if (typeof offers === 'object') {
        offersArr = Object.values(offers);
      }
    }
    offersArr = offersArr.map(o => ({
      title: o.title || '',
      description: o.description || '',
      code: o.code || '',
      type: o.type || 'custom'
    }));

    const product = new Product({
      title,
      category,
      short_description,
      full_description,
      price,
      original_price,
      discount_percentage,
      stock_quantity,
      is_active: is_active === 'on' || is_active === true,
      promo_note,
      images: imagesArr,
      offers: offersArr
    });
    await product.save();
    res.redirect('/astro-shop');
  } catch (err) {
    res.status(500).send('Error saving product: ' + err.message);
  }
});

module.exports = router; 