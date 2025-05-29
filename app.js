require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const util = require('util');
util.isArray = Array.isArray;
const authRoutes = require('./routes/auth');
const koshCategoryRoutes = require('./routes/koshCategory');
const koshSubCategoryRoutes = require('./routes/koshSubCategory');
const koshContentRoutes = require('./routes/koshContent');
const mcqCategoryRoutes = require('./routes/mcqCategory');
const mcqMasterRoutes = require('./routes/mcqMaster');
const KoshCategory = require('./models/KoshCategory');
const KoshSubCategory = require('./models/KoshSubCategory');
const koshCategoryApi = require('./routes/api/koshCategory');
const koshSubCategoryApi = require('./routes/api/koshSubCategory');
const koshContentApi = require('./routes/api/koshContent');
const flash = require('connect-flash');
const mcqContentRouter = require('./routes/mcqContent');
const mcqApiRouter = require('./routes/api/mcq');
const aboutTeamRouter = require('./routes/aboutTeam');
const aboutUsRouter = require('./routes/aboutUs');
const aboutTeamApiRouter = require('./routes/api/aboutTeam');
const aboutUsApiRouter = require('./routes/api/aboutUs');
const mediaRouter = require('./routes/media');
const rashifalRouter = require('./routes/rashifal');
const numerologyRouter = require('./routes/numerology');
const rashifalApiRouter = require('./routes/api/rashifal');
const numerologyApiRouter = require('./routes/api/numerology');
const astroshopRouter = require('./routes/astroshop');
const astroshopApiRouter = require('./routes/api/astroshop');
const pujaRouter = require('./routes/puja');
const pujaApiRouter = require('./routes/api/puja');
const bookRouter = require('./routes/book');
const bookApiRouter = require('./routes/api/book');
const prashanYantraRouter = require('./routes/prashanYantra');
const hanumatJyotishRouter = require('./routes/hanumatJyotish');
const hanumatPrashanwaliRouter = require('./routes/hanumatPrashanwali');
const ankPrashanRouter = require('./routes/ankPrashan');
const karyaPrashanYantraRouter = require('./routes/karyaPrashanYantra');
const twentyPrashanYantraRouter = require('./routes/twentyPrashanYantra');
const sixtyFourPrashanYantraRouter = require('./routes/sixtyFourPrashanYantra');
const beejPrashanYantraRouter = require('./routes/beejPrashanYantra');
const prashanApiRouter = require('./routes/api/prashan');
const dashboardApiRouter = require('./routes/api/dashboard');
const eMagazineRouter = require('./routes/eMagazine');
const emagazineApiRouter = require('./routes/api/emagazine');
const karmkandCategoryRoutes = require('./routes/karmkandCategory');
const karmkandSubCategoryRoutes = require('./routes/karmkandSubCategory');
const karmkandContentRoutes = require('./routes/karmkandContent');
const karmkandApiRouter = require('./routes/api/karmkand');
const festivalRoutes = require('./routes/festival');
const festivalApiRouter = require('./routes/api/festival');
const celebrityKundliRoutes = require('./routes/celebrityKundli');
const celebrityKundliApiRouter = require('./routes/api/celebrityKundli');
const learningRoutes = require('./routes/learning');

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI);

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// Body parser
app.use(express.urlencoded({ extended: true }));

// Method Override middleware to enable DELETE and PUT methods
app.use(methodOverride('_method'));

// Trust proxy - Add this before session setup
app.set('trust proxy', 1);

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({ 
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: { 
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      secure: true, // Only use secure cookies in production
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    },
    proxy: true // Required for Nginx
  })
);

// Flash messages middleware
app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Middleware to fetch categories and subcategories for sidebar
app.use(async (req, res, next) => {
  try {
    const koshCategories = await KoshCategory.find().sort({ position: 1 });
    const koshSubCategories = await KoshSubCategory.find().sort({ position: 1 });
    // Map subcategories by parentCategory
    const koshSubCategoriesMap = {};
    koshCategories.forEach(cat => {
      koshSubCategoriesMap[cat._id] = koshSubCategories.filter(sub => String(sub.parentCategory) === String(cat._id));
    });
    res.locals.koshCategories = koshCategories;
    res.locals.koshSubCategoriesMap = koshSubCategoriesMap;
    next();
  } catch (err) {
    res.locals.koshCategories = [];
    res.locals.koshSubCategoriesMap = {};
    next();
  }
});

// Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Placeholder for login route
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', { username: req.session.username });
});

app.use('/', authRoutes);
app.use('/', koshCategoryRoutes);
app.use('/', koshSubCategoryRoutes);
app.use('/', koshContentRoutes);
app.use('/', mcqCategoryRoutes);
app.use('/', mcqMasterRoutes);

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/kosh-category', require('./routes/koshCategory'));
app.use('/kosh-subcategory', require('./routes/koshSubCategory'));
app.use('/kosh-content', require('./routes/koshContent'));
app.use('/mcq-category', require('./routes/mcqCategory'));
app.use('/mcq-master', require('./routes/mcqMaster'));
app.use('/mcq-content', mcqContentRouter);
app.use('/about-team', aboutTeamRouter);
app.use('/about-us', aboutUsRouter);

// Register routes
app.use('/api/aboutTeam', aboutTeamApiRouter);
app.use('/api/aboutUs', aboutUsApiRouter);
app.use('/media', mediaRouter);
app.use('/rashifal', rashifalRouter);
app.use('/numerology', numerologyRouter);
app.use('/api/rashifal', rashifalApiRouter);
app.use('/api/numerology', numerologyApiRouter);

// API Routes
app.use('/api/kosh-category', koshCategoryApi);
app.use('/api/kosh-subcategory', koshSubCategoryApi);
app.use('/api/kosh-content', koshContentApi);
app.use('/api/mcq', mcqApiRouter);

app.use('/astro-shop', astroshopRouter);
app.use('/api/astro-shop', astroshopApiRouter);

app.use('/puja', pujaRouter);
app.use('/api/puja', pujaApiRouter);

// Book routes
app.use('/book', bookRouter);
app.use('/api/book', bookApiRouter);

// E-Magazine routes
app.use('/e-magazine', eMagazineRouter);

// Prashan Yantra routes
app.use('/prashan-yantra', prashanYantraRouter);

// Hanumat Jyotish routes
app.use('/hanumat-jyotish', hanumatJyotishRouter);

// Hanumat Prashanwali routes
app.use('/hanumat-prashanwali', hanumatPrashanwaliRouter);

// Ank Prashan routes
app.use('/ank-prashan', ankPrashanRouter);

// Karya Prashan Yantra routes
app.use('/karya-prashan-yantra', karyaPrashanYantraRouter);

// Twenty Prashan Yantra routes
app.use('/twenty-prashan-yantra', twentyPrashanYantraRouter);

// Sixty Four Prashan Yantra routes
app.use('/sixty-four-prashan-yantra', sixtyFourPrashanYantraRouter);

// Beej Prashan Yantra routes
app.use('/beej-prashan-yantra', beejPrashanYantraRouter);

// Prashan API routes
app.use('/api/prashan', prashanApiRouter);

// Dashboard API routes
app.use('/api/dashboard', dashboardApiRouter);

// E-Magazine API routes
app.use('/api/emagazine', emagazineApiRouter);

// Karmkand category routes
app.use('/', karmkandCategoryRoutes);
app.use('/', karmkandSubCategoryRoutes);
app.use('/', karmkandContentRoutes);
app.use('/api/karmkand', karmkandApiRouter);

// Festival routes
app.use('/', festivalRoutes);
app.use('/api', festivalApiRouter);

// Celebrity Kundli routes
app.use('/', celebrityKundliRoutes);
app.use('/api', celebrityKundliApiRouter);

// Learning routes
app.use('/learning', learningRoutes);

const PORT = process.env.PORT ||5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 
