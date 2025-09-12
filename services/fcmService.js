const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to add your service account key)
let isInitialized = false;

function initializeFirebase() {
    if (!isInitialized) {
        try {
            // Use environment variables for Firebase configuration
            const serviceAccount = {
                "type": "service_account",
                "project_id": process.env.FIREBASE_PROJECT_ID,
                "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
                "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                "client_email": process.env.FIREBASE_CLIENT_EMAIL,
                "client_id": process.env.FIREBASE_CLIENT_ID,
                "auth_uri": process.env.FIREBASE_AUTH_URI,
                "token_uri": process.env.FIREBASE_TOKEN_URI,
                "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
                "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
                "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN
            };

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
            
            isInitialized = true;
            console.log('Firebase Admin initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase Admin:', error);
            // For development, we'll continue without Firebase
            console.log('Continuing without Firebase - notifications will be logged only');
        }
    }
}

class FCMService {
    /**
     * Send notification to all users (broadcast)
     */
    static async sendToAll(notification) {
        initializeFirebase();
        
        if (!isInitialized) {
            console.log('📱 PUSH NOTIFICATION (Simulated):', {
                title: notification.title,
                body: notification.message,
                type: notification.type,
                priority: notification.priority
            });
            return { success: true, message: 'Notification logged (Firebase not configured)' };
        }

        try {
            const message = {
                notification: {
                    title: notification.title,
                    body: notification.message,
                    imageUrl: notification.imageUrl || undefined
                },
                data: {
                    type: notification.type || 'info',
                    priority: notification.priority || 'medium',
                    targetAudience: notification.targetAudience || 'all',
                    actionUrl: notification.actionUrl || '',
                    actionText: notification.actionText || '',
                    notificationId: notification._id.toString(),
                    scheduledAt: notification.scheduledAt ? notification.scheduledAt.toISOString() : '',
                    expiresAt: notification.expiresAt ? notification.expiresAt.toISOString() : ''
                },
                topic: 'all_users', // Send to all users subscribed to this topic
                android: {
                    notification: {
                        icon: 'ic_notification',
                        color: this.getNotificationColor(notification.type),
                        priority: this.getAndroidPriority(notification.priority),
                        sound: 'default',
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: notification.title,
                                body: notification.message
                            },
                            sound: 'default',
                            badge: 1,
                            category: 'NOTIFICATION_CATEGORY'
                        }
                    }
                }
            };

            const response = await admin.messaging().send(message);
            console.log('✅ Push notification sent successfully:', response);
            
            // Update sent count in database
            await this.updateSentCount(notification._id);
            
            return { success: true, messageId: response };
        } catch (error) {
            console.error('❌ Error sending push notification:', error);
            throw error;
        }
    }

    /**
     * Send notification to specific user by FCM token
     */
    static async sendToUser(userToken, notification) {
        initializeFirebase();
        
        if (!isInitialized) {
            console.log('📱 PUSH NOTIFICATION (Simulated):', {
                to: userToken,
                title: notification.title,
                body: notification.message
            });
            return { success: true, message: 'Notification logged (Firebase not configured)' };
        }

        try {
            const message = {
                token: userToken,
                notification: {
                    title: notification.title,
                    body: notification.message,
                    imageUrl: notification.imageUrl || undefined
                },
                data: {
                    type: notification.type || 'info',
                    priority: notification.priority || 'medium',
                    actionUrl: notification.actionUrl || '',
                    actionText: notification.actionText || '',
                    notificationId: notification._id.toString()
                },
                android: {
                    notification: {
                        icon: 'ic_notification',
                        color: this.getNotificationColor(notification.type),
                        priority: this.getAndroidPriority(notification.priority)
                    }
                }
            };

            const response = await admin.messaging().send(message);
            console.log('✅ Push notification sent to user:', response);
            
            return { success: true, messageId: response };
        } catch (error) {
            console.error('❌ Error sending push notification to user:', error);
            throw error;
        }
    }

    /**
     * Send notification to specific user group
     */
    static async sendToUserGroup(userGroup, notification) {
        initializeFirebase();
        
        if (!isInitialized) {
            console.log('📱 PUSH NOTIFICATION (Simulated):', {
                to: userGroup,
                title: notification.title,
                body: notification.message
            });
            return { success: true, message: 'Notification logged (Firebase not configured)' };
        }

        try {
            const message = {
                topic: userGroup, // e.g., 'premium_users', 'free_users'
                notification: {
                    title: notification.title,
                    body: notification.message
                },
                data: {
                    type: notification.type || 'info',
                    priority: notification.priority || 'medium',
                    targetAudience: userGroup
                }
            };

            const response = await admin.messaging().send(message);
            console.log('✅ Push notification sent to group:', userGroup, response);
            
            return { success: true, messageId: response };
        } catch (error) {
            console.error('❌ Error sending push notification to group:', error);
            throw error;
        }
    }

    /**
     * Send notification to multiple users
     */
    static async sendToMultipleUsers(userTokens, notification) {
        initializeFirebase();
        
        if (!isInitialized) {
            console.log('📱 PUSH NOTIFICATION (Simulated):', {
                to: userTokens.length + ' users',
                title: notification.title,
                body: notification.message
            });
            return { success: true, message: 'Notification logged (Firebase not configured)' };
        }

        try {
            const message = {
                tokens: userTokens,
                notification: {
                    title: notification.title,
                    body: notification.message
                },
                data: {
                    type: notification.type || 'info',
                    priority: notification.priority || 'medium'
                }
            };

            const response = await admin.messaging().sendMulticast(message);
            console.log('✅ Push notification sent to multiple users:', response);
            
            return { 
                success: true, 
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses
            };
        } catch (error) {
            console.error('❌ Error sending push notification to multiple users:', error);
            throw error;
        }
    }

    /**
     * Get notification color based on type
     */
    static getNotificationColor(type) {
        const colors = {
            'info': '#2196F3',
            'success': '#4CAF50',
            'warning': '#FF9800',
            'error': '#F44336',
            'announcement': '#9C27B0'
        };
        return colors[type] || '#2196F3';
    }

    /**
     * Get Android priority based on notification priority
     */
    static getAndroidPriority(priority) {
        const priorities = {
            'low': 'low',
            'medium': 'default',
            'high': 'high',
            'urgent': 'high'
        };
        return priorities[priority] || 'default';
    }

    /**
     * Update sent count in database
     */
    static async updateSentCount(notificationId) {
        try {
            const Notification = require('../models/Notification');
            await Notification.findByIdAndUpdate(
                notificationId,
                { $inc: { sentCount: 1 } }
            );
        } catch (error) {
            console.error('Error updating sent count:', error);
        }
    }

    /**
     * Subscribe user to topic
     */
    static async subscribeToTopic(userTokens, topic) {
        initializeFirebase();
        
        if (!isInitialized) {
            console.log('📱 TOPIC SUBSCRIPTION (Simulated):', { userTokens, topic });
            return { success: true };
        }

        try {
            const response = await admin.messaging().subscribeToTopic(userTokens, topic);
            console.log('✅ Users subscribed to topic:', topic, response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ Error subscribing to topic:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe user from topic
     */
    static async unsubscribeFromTopic(userTokens, topic) {
        initializeFirebase();
        
        if (!isInitialized) {
            console.log('📱 TOPIC UNSUBSCRIPTION (Simulated):', { userTokens, topic });
            return { success: true };
        }

        try {
            const response = await admin.messaging().unsubscribeFromTopic(userTokens, topic);
            console.log('✅ Users unsubscribed from topic:', topic, response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ Error unsubscribing from topic:', error);
            throw error;
        }
    }
}

module.exports = FCMService;
