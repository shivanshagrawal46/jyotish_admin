const admin = require('firebase-admin');

let isInitialized = false;

function initializeFirebase() {
    if (isInitialized) return;
    try {
        const serviceAccount = {
            type: 'service_account',
            project_id:                  process.env.FIREBASE_PROJECT_ID,
            private_key_id:              process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key:                 process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email:                process.env.FIREBASE_CLIENT_EMAIL,
            client_id:                   process.env.FIREBASE_CLIENT_ID,
            auth_uri:                    process.env.FIREBASE_AUTH_URI,
            token_uri:                   process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url:        process.env.FIREBASE_CLIENT_X509_CERT_URL,
            universe_domain:             process.env.FIREBASE_UNIVERSE_DOMAIN
        };
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
        });
        isInitialized = true;
        console.log('✅ Firebase Admin initialized');
    } catch (error) {
        console.error('❌ Firebase Admin init failed:', error.message);
        console.log('ℹ️  Notifications will be logged only (no actual push)');
    }
}

// ─── Build FCM data payload ────────────────────────────────────────────────────
function buildDataPayload(notification) {
    const base = {
        notificationId:  String(notification._id || ''),
        type:            notification.type           || 'info',
        priority:        notification.priority       || 'medium',
        targetAudience:  notification.targetAudience || 'all',
        scheduledAt:     notification.scheduledAt   ? new Date(notification.scheduledAt).toISOString() : '',
        expiresAt:       notification.expiresAt     ? new Date(notification.expiresAt).toISOString()   : '',
        // Legacy fields kept for backward compatibility
        actionUrl:       notification.actionUrl  || '',
        actionText:      notification.actionText || '',
        imageUrl:        notification.imageUrl   || ''
    };

    // Deep link navigation — core of content-linked notifications
    const dl = notification.deepLink;
    if (dl && dl.contentType) {
        base.hasDeepLink         = 'true';
        base.contentType         = dl.contentType         || '';
        base.screen              = dl.screen              || '';
        base.deepLinkUrl         = dl.deepLinkUrl         || '';
        base.contentId           = String(dl.contentId   || '');
        base.contentTitle        = dl.contentTitle        || '';
        base.categoryId          = String(dl.categoryId  || '');
        base.categoryName        = dl.categoryName        || '';
        base.subCategoryId       = String(dl.subCategoryId || '');
        base.subCategoryName     = dl.subCategoryName     || '';
        base.level3Id            = String(dl.level3Id    || '');
        base.level3Name          = dl.level3Name          || '';
        // E-Magazine specific
        base.writerName          = dl.writerName          || '';
        base.writerImage         = dl.writerImage         || '';
        base.subjectName         = dl.subjectName        || '';
        // Full navigation params as JSON string for Flutter to parse
        base.navigationParams    = JSON.stringify(dl.navigationParams || {});
        base.clickAction         = 'FLUTTER_NOTIFICATION_CLICK';
    } else {
        base.hasDeepLink  = 'false';
        base.contentType  = '';
        base.deepLinkUrl  = '';
        base.clickAction  = 'FLUTTER_NOTIFICATION_CLICK';
    }

    // FCM data values MUST be strings
    Object.keys(base).forEach(k => { base[k] = String(base[k]); });
    return base;
}

class FCMService {
    /**
     * Broadcast to all users via the 'all_users' FCM topic
     */
    static async sendToAll(notification) {
        initializeFirebase();

        const data = buildDataPayload(notification);

        if (!isInitialized) {
            console.log('📱 [PUSH SIMULATED] sendToAll:', {
                title: notification.title,
                body:  notification.message,
                deepLink: data.deepLinkUrl || '—'
            });
            return { success: true, message: 'Simulated (Firebase not configured)' };
        }

        const message = {
            notification: {
                title:    notification.title,
                body:     notification.message,
                imageUrl: notification.imageUrl || undefined
            },
            data,
            topic: 'all_users',
            android: {
                priority: data.priority === 'urgent' || data.priority === 'high' ? 'high' : 'normal',
                notification: {
                    icon:        'ic_notification',
                    color:       FCMService.getNotificationColor(notification.type),
                    sound:       'default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                    channelId:   'jyotish_default'
                }
            },
            apns: {
                payload: {
                    aps: {
                        alert: { title: notification.title, body: notification.message },
                        sound: 'default',
                        badge: 1,
                        category: 'CONTENT_NOTIFICATION'
                    }
                },
                headers: {
                    'apns-priority': data.priority === 'urgent' ? '10' : '5'
                }
            }
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('✅ FCM broadcast sent:', response);
            await FCMService.updateSentCount(notification._id);
            return { success: true, messageId: response };
        } catch (error) {
            console.error('❌ FCM broadcast failed:', error);
            throw error;
        }
    }

    /**
     * Send to a specific device token
     */
    static async sendToUser(userToken, notification) {
        initializeFirebase();

        const data = buildDataPayload(notification);

        if (!isInitialized) {
            console.log('📱 [PUSH SIMULATED] sendToUser:', { to: userToken, title: notification.title });
            return { success: true, message: 'Simulated' };
        }

        const message = {
            token: userToken,
            notification: {
                title:    notification.title,
                body:     notification.message,
                imageUrl: notification.imageUrl || undefined
            },
            data,
            android: {
                priority: 'high',
                notification: {
                    icon:  'ic_notification',
                    color: FCMService.getNotificationColor(notification.type),
                    sound: 'default',
                    channelId: 'jyotish_default'
                }
            }
        };

        try {
            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };
        } catch (error) {
            console.error('❌ sendToUser failed:', error);
            throw error;
        }
    }

    /**
     * Send to an FCM topic (e.g. premium_users)
     */
    static async sendToUserGroup(userGroup, notification) {
        initializeFirebase();
        if (!isInitialized) {
            console.log('📱 [PUSH SIMULATED] sendToTopic:', userGroup);
            return { success: true, message: 'Simulated' };
        }
        const message = {
            topic: userGroup,
            notification: { title: notification.title, body: notification.message },
            data: buildDataPayload(notification)
        };
        try {
            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };
        } catch (error) {
            console.error('❌ sendToTopic failed:', error);
            throw error;
        }
    }

    /**
     * Multicast to multiple device tokens
     */
    static async sendToMultipleUsers(userTokens, notification) {
        initializeFirebase();
        if (!isInitialized) {
            console.log('📱 [PUSH SIMULATED] multicast to', userTokens.length, 'users');
            return { success: true, message: 'Simulated' };
        }
        const message = {
            tokens: userTokens,
            notification: { title: notification.title, body: notification.message },
            data: buildDataPayload(notification)
        };
        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            return {
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount
            };
        } catch (error) {
            console.error('❌ multicast failed:', error);
            throw error;
        }
    }

    static async subscribeToTopic(userTokens, topic) {
        initializeFirebase();
        if (!isInitialized) {
            console.log('📱 [SIMULATED] subscribeToTopic:', topic);
            return { success: true };
        }
        try {
            const response = await admin.messaging().subscribeToTopic(userTokens, topic);
            return { success: true, response };
        } catch (error) {
            console.error('❌ subscribeToTopic failed:', error);
            throw error;
        }
    }

    static async unsubscribeFromTopic(userTokens, topic) {
        initializeFirebase();
        if (!isInitialized) return { success: true };
        try {
            const response = await admin.messaging().unsubscribeFromTopic(userTokens, topic);
            return { success: true, response };
        } catch (error) {
            console.error('❌ unsubscribeFromTopic failed:', error);
            throw error;
        }
    }

    static getNotificationColor(type) {
        const map = {
            info:         '#2196F3',
            success:      '#4CAF50',
            warning:      '#FF9800',
            error:        '#F44336',
            announcement: '#9C27B0',
            content:      '#FF6B35'
        };
        return map[type] || '#FF6B35';
    }

    static getAndroidPriority(priority) {
        return (priority === 'high' || priority === 'urgent') ? 'high' : 'normal';
    }

    static async updateSentCount(notificationId) {
        if (!notificationId || String(notificationId).startsWith('test-')) return;
        try {
            const Notification = require('../models/Notification');
            await Notification.findByIdAndUpdate(notificationId, { $inc: { sentCount: 1 } });
        } catch (err) {
            console.error('updateSentCount error:', err);
        }
    }
}

module.exports = FCMService;
