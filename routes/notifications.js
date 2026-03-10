const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const requireAuth = require('../middleware/requireAuth');
const FCMService = require('../services/fcmService');

// ─── Deep link builder ────────────────────────────────────────────────────────
const SECTION_SCREENS = {
    kosh:             'KoshContentDetail',
    karmkand:         'KarmkandContentDetail',
    book:             'BookContentDetail',
    muhurat:          'MuhuratDetail',
    rashifal_daily:   'RashifalDailyDetail',
    numerology_daily: 'NumerologyDailyDetail',
    festival:         'FestivalDetail'
};

function buildDeepLink(body) {
    const {
        dl_contentType,
        dl_categoryId,   dl_categoryName,
        dl_subCategoryId,dl_subCategoryName,
        dl_level3Id,     dl_level3Name,
        dl_contentId,    dl_contentTitle
    } = body;

    if (!dl_contentType || !dl_contentId) return null;

    const screen = SECTION_SCREENS[dl_contentType] || null;
    let deepLinkUrl = '';

    switch (dl_contentType) {
        case 'kosh':
        case 'karmkand':
            deepLinkUrl = `jyotishapp://${dl_contentType}/${dl_categoryId}/${dl_subCategoryId}/${dl_contentId}`;
            break;
        case 'book':
            // category / book / chapter / content
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
    }

    const navigationParams = {
        section: dl_contentType,
        screen,
        contentId: dl_contentId,
        contentTitle: dl_contentTitle || null
    };
    if (dl_categoryId)    navigationParams.categoryId    = dl_categoryId;
    if (dl_categoryName)  navigationParams.categoryName  = dl_categoryName;
    if (dl_subCategoryId) navigationParams.subCategoryId = dl_subCategoryId;
    if (dl_subCategoryName) navigationParams.subCategoryName = dl_subCategoryName;
    if (dl_level3Id)      navigationParams.level3Id      = dl_level3Id;
    if (dl_level3Name)    navigationParams.level3Name    = dl_level3Name;

    return {
        contentType:     dl_contentType,
        categoryId:      dl_categoryId    || null,
        categoryName:    dl_categoryName  || null,
        subCategoryId:   dl_subCategoryId || null,
        subCategoryName: dl_subCategoryName || null,
        level3Id:        dl_level3Id      || null,
        level3Name:      dl_level3Name    || null,
        contentId:       dl_contentId,
        contentTitle:    dl_contentTitle  || null,
        deepLinkUrl,
        screen,
        navigationParams
    };
}

// ─── Shared render helper ─────────────────────────────────────────────────────
function renderForm(res, { notification = null, formAction, formTitle, error = null, username }) {
    res.render('notifications/form', {
        notification,
        username,
        activePage: 'notifications',
        activeCategory: null,
        activeSubCategory: null,
        koshCategories: [],
        mcqCategories: [],
        formAction,
        formTitle,
        error
    });
}

// ─── Admin web routes ─────────────────────────────────────────────────────────

// GET /notifications — paginated list
router.get('/', requireAuth, async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip  = (page - 1) * limit;

        // Filter by section if requested
        const filter = {};
        if (req.query.section) filter['deepLink.contentType'] = req.query.section;

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .populate('createdBy', 'username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments(filter)
        ]);

        res.render('notifications/index', {
            notifications,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            filterSection: req.query.section || '',
            username: req.session.username,
            activePage: 'notifications',
            activeCategory: null,
            activeSubCategory: null,
            koshCategories: [],
            mcqCategories: [],
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.render('notifications/index', {
            notifications: [],
            currentPage: 1,
            totalPages: 0,
            total: 0,
            filterSection: '',
            username: req.session.username,
            activePage: 'notifications',
            activeCategory: null,
            activeSubCategory: null,
            koshCategories: [],
            mcqCategories: [],
            success: null,
            error: 'Error fetching notifications'
        });
    }
});

// GET /notifications/add
router.get('/add', requireAuth, (req, res) => {
    renderForm(res, {
        formAction: '/notifications/add',
        formTitle: 'Send New Notification',
        username: req.session.username
    });
});

// GET /notifications/edit/:id
router.get('/edit/:id', requireAuth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.redirect('/notifications?error=Notification+not+found');
        renderForm(res, {
            notification,
            formAction: `/notifications/edit/${req.params.id}`,
            formTitle: 'Edit Notification',
            username: req.session.username
        });
    } catch (err) {
        console.error('Error fetching notification:', err);
        res.redirect('/notifications?error=Error+fetching+notification');
    }
});

// POST /notifications/add
router.post('/add', requireAuth, async (req, res) => {
    const { title, message, type, priority, targetAudience, isActive,
            scheduledAt, expiresAt, actionUrl, actionText, imageUrl } = req.body;

    if (!title || !message) {
        return renderForm(res, {
            notification: req.body,
            formAction: '/notifications/add',
            formTitle: 'Send New Notification',
            username: req.session.username,
            error: 'Title and message are required'
        });
    }

    try {
        const deepLink = buildDeepLink(req.body);

        const notification = await Notification.create({
            title,
            message,
            type:           type           || (deepLink ? 'content' : 'info'),
            priority:       priority       || 'medium',
            targetAudience: targetAudience || 'all',
            isActive:       isActive === 'on' || isActive === true,
            scheduledAt:    scheduledAt ? new Date(scheduledAt) : new Date(),
            expiresAt:      expiresAt   ? new Date(expiresAt)   : null,
            actionUrl:      (!deepLink && actionUrl)  ? actionUrl  : null,
            actionText:     (!deepLink && actionText) ? actionText : null,
            imageUrl:       imageUrl || null,
            deepLink,
            createdBy: null
        });

        try {
            await FCMService.sendToAll(notification);
            console.log('✅ Push sent for notification:', notification._id);
        } catch (pushErr) {
            console.error('❌ Push failed:', pushErr);
        }

        res.redirect('/notifications?success=Notification+created+and+sent+to+all+users');
    } catch (err) {
        console.error('Error creating notification:', err);
        renderForm(res, {
            notification: req.body,
            formAction: '/notifications/add',
            formTitle: 'Send New Notification',
            username: req.session.username,
            error: 'Error creating notification: ' + err.message
        });
    }
});

// POST /notifications/edit/:id
router.post('/edit/:id', requireAuth, async (req, res) => {
    const { title, message, type, priority, targetAudience, isActive,
            scheduledAt, expiresAt, actionUrl, actionText, imageUrl } = req.body;

    if (!title || !message) {
        return renderForm(res, {
            notification: { ...req.body, _id: req.params.id },
            formAction: `/notifications/edit/${req.params.id}`,
            formTitle: 'Edit Notification',
            username: req.session.username,
            error: 'Title and message are required'
        });
    }

    try {
        const deepLink = buildDeepLink(req.body);

        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            {
                title,
                message,
                type:           type           || (deepLink ? 'content' : 'info'),
                priority:       priority       || 'medium',
                targetAudience: targetAudience || 'all',
                isActive:       isActive === 'on' || isActive === true,
                scheduledAt:    scheduledAt ? new Date(scheduledAt) : new Date(),
                expiresAt:      expiresAt   ? new Date(expiresAt)   : null,
                actionUrl:      (!deepLink && actionUrl)  ? actionUrl  : null,
                actionText:     (!deepLink && actionText) ? actionText : null,
                imageUrl:       imageUrl || null,
                deepLink
            },
            { new: true }
        );

        if (!notification) return res.redirect('/notifications?error=Notification+not+found');

        try {
            await FCMService.sendToAll(notification);
        } catch (pushErr) {
            console.error('❌ Push failed:', pushErr);
        }

        res.redirect('/notifications?success=Notification+updated+and+resent');
    } catch (err) {
        console.error('Error updating notification:', err);
        res.redirect('/notifications?error=Error+updating+notification');
    }
});

// POST /notifications/delete/:id
router.post('/delete/:id', requireAuth, async (req, res) => {
    try {
        const n = await Notification.findByIdAndDelete(req.params.id);
        if (!n) return res.redirect('/notifications?error=Notification+not+found');
        res.redirect('/notifications?success=Notification+deleted');
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.redirect('/notifications?error=Error+deleting+notification');
    }
});

// POST /notifications/toggle/:id
router.post('/toggle/:id', requireAuth, async (req, res) => {
    try {
        const n = await Notification.findById(req.params.id);
        if (!n) return res.redirect('/notifications?error=Notification+not+found');
        n.isActive = !n.isActive;
        await n.save();
        res.redirect(`/notifications?success=Notification+${n.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
        console.error('Error toggling notification:', err);
        res.redirect('/notifications?error=Error+toggling+notification');
    }
});

// POST /notifications/resend/:id  — resend existing notification
router.post('/resend/:id', requireAuth, async (req, res) => {
    try {
        const n = await Notification.findById(req.params.id);
        if (!n) return res.redirect('/notifications?error=Notification+not+found');
        await FCMService.sendToAll(n);
        res.redirect('/notifications?success=Notification+resent+to+all+users');
    } catch (err) {
        console.error('Error resending notification:', err);
        res.redirect('/notifications?error=Error+resending+notification');
    }
});

// ─── Public API for Flutter app ──────────────────────────────────────────────

// GET /notifications/api/active — fetch active notifications for mobile
router.get('/api/active', async (req, res) => {
    try {
        const { targetAudience = 'all', limit = 50, section } = req.query;

        const query = {
            isActive: true,
            scheduledAt: { $lte: new Date() },
            $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
        };

        if (targetAudience !== 'all') query.targetAudience = { $in: ['all', targetAudience] };
        if (section) query['deepLink.contentType'] = section;

        const notifications = await Notification.find(query)
            .select('title message type priority targetAudience actionUrl actionText imageUrl deepLink scheduledAt createdAt')
            .sort({ priority: -1, createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ success: true, data: notifications, count: notifications.length });
    } catch (err) {
        console.error('Error fetching active notifications:', err);
        res.status(500).json({ success: false, error: 'Error fetching notifications' });
    }
});

// POST /notifications/api/read/:id — increment readCount
router.post('/api/read/:id', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { $inc: { readCount: 1 } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error marking as read' });
    }
});

// POST /notifications/api/open/:id — track notification opens (deep link taps)
router.post('/api/open/:id', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { $inc: { openCount: 1 } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error tracking open' });
    }
});

// POST /notifications/api/register-token — subscribe device to FCM topic
router.post('/api/register-token', async (req, res) => {
    try {
        const { fcmToken, platform = 'android', appVersion = '1.0.0', osVersion = '' } = req.body;
        if (!fcmToken) return res.status(400).json({ success: false, error: 'fcmToken is required' });

        await FCMService.subscribeToTopic([fcmToken], 'all_users');

        res.json({
            success: true,
            message: 'Device registered for push notifications',
            deviceInfo: { platform, appVersion, osVersion }
        });
    } catch (err) {
        console.error('Error registering FCM token:', err);
        res.status(500).json({ success: false, error: 'Failed to register device' });
    }
});

// POST /notifications/api/send-test
router.post('/api/send-test', async (req, res) => {
    try {
        const testNotification = {
            _id: 'test-' + Date.now(),
            title: 'Test Notification',
            message: req.body.message || 'Test push from admin panel',
            type: 'info',
            priority: 'medium',
            targetAudience: 'all',
            scheduledAt: new Date(),
            actionUrl: '', actionText: '', imageUrl: '',
            deepLink: null
        };
        await FCMService.sendToAll(testNotification);
        res.json({ success: true, message: 'Test notification sent' });
    } catch (err) {
        console.error('Error sending test:', err);
        res.status(500).json({ success: false, error: 'Error sending test notification' });
    }
});

module.exports = router;
