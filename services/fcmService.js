const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to add your service account key)
let isInitialized = false;

function initializeFirebase() {
    if (!isInitialized) {
        try {
            // For now, we'll use a placeholder - you need to add your actual service account key
            const serviceAccount = {
                "type": "service_account",
                "project_id": "astrologyapp-462210",
                "private_key_id": "0c0a372751730f5c41de01fd2002f3b24e66fd05",
               "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCUtX2vgxfOVY36\n/3h7cWP0tKV13FqAnV5gt1y+YFNAWP4lWq6wNStlM1Ds24b4OdrVhIJ2yigZyUvQ\n2gdhO2oXTicuNNO9NDu3EPbiJunEwGOKecQ2qFOpI3rmNP8XVnmO8LWwRinKBzNt\nXDrubpeFDEY3gf3bBmQdxQgYDPvbLiQgc67eTaYmt3kAbpTVtGHQwOdxAdo+x5cn\nZT0WmoLbLnTXIoP+unTUqfisgeNBcrASkYU6GbkxMLLZAcc7tTqsHqYcwxutjo7W\nJzpdVa89SvMf4i8Ki1q2+EKXRE03rK+m86hzQrRujGHbj6W6OP6Giasd3lfiayIj\nE64uECPFAgMBAAECggEAAUY3MWpok+XN8ufpWXjHWr4z3xlC3vBvnIQNuSWRqQ7q\nKe9Hk8PM30/hLQ+/gxUvKnO5e3jwKYe8936aysBBKznJ96klDwK+0pWEYWaPIRa7\nSPaR/Mbp+px5eItdNo8Q48LtHPl+Rlh+nhII1j4Khy3A/0eaTDFsk7MPxpxRNIJY\nHbC27oxoMJD/8PFskpvlzl2dlIgzo9RR3ry42PLhItn3iXjQC/weeSnuBjti+LAo\nSERMJjPVQhkwoemku5NI0tgoWzPkWQ/ezTKmEaBwJfSibG+QRrdLqxousVwpZdmd\nIdWmszArK6YDWCQnX2nkw+Mht2bPeg6JNkCVnMWq+QKBgQDEJ41aed1HzTRCgmaE\ndHfUSZX7hjyqFuD/P1PX4TFn7gBXIpreJZ6mSj4xuijbfJBni+EFzM9V+1sSGhB2\nirQiI4yHC/MM3VaUfa8o/lBjcZkw9Eq5vA7YH2++26tHoTLwEtTnufSfxkUCh90b\nRzvNTsSLqOpG54Cp7pe7YQJLyQKBgQDCFECSMU4Ibu1iqQTnYDlwRXJJkNao+yGm\nRyXBl9j6iBXkhfzBe0dvmBpSScxh9MQO+J3YlZqPTrPAYYTLLawpwlvb94N9Q9SD\nEhmpFT7CodEdkzC37HumsF6OMrfJ09vNlOcVvOXUngOubFo2dx9MvrY47nbWgFyA\nIIT5qoweHQKBgQCbIQSjhzk/bcRkzSgynMGf/EpHT5RumAV9GCJA2vHt1cYjI1UD\nVxEvRgwF28owO0Ug/vkJUz6uK0mM+VwHxA5N6Xtb2lFv3SR57yQ18Vq2KsMSekEW\nvummdsYzVRsSXSQhxWLnmKMkMPOm2rg8uItNBXxfT0lopfGVcwJAyKm+MQKBgQCF\nc3eTDuQhWGVS2fXNQ5U7ZgVYIIf6WfShaXrEy60fWEP1h0xtnl9YlLZErwoisTO/\nN6USMIy+zdc8CdJOA3HGpSaU8nUvxVxzZBbQ9RLasnogY/2z+qBr1gqurKFD3rHd\ngu4DPIis0pqlbUv6955GHz0dmJuOk2UHlVTaeDMw4QKBgGMoOV4eA78xNiMM6w/p\nQoIc6uEU/cR8khgUVFruWFesd2QPT96Q7vR9KhC82fEbLLITY8zwccLOHKsAktPV\nGIgdhvA7vGv6Q3SUhaQ2ZomHjin9r15eKydtFQZ3x30p2ZWQoUqanWt2NbQpkl+o\nXle6QCsBKDeW3aZY1bNfBQ4e\n-----END PRIVATE KEY-----\n",
                "client_email": "firebase-adminsdk-fbsvc@astrologyapp-462210.iam.gserviceaccount.com",
                "client_id": "117224486117089611420",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/             firebase-adminsdk-fbsvc%40astrologyapp-462210.iam.gserviceaccount.com",
                "universe_domain": "googleapis.com"
            };

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
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
