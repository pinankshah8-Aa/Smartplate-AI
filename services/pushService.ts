import webpush from 'web-push';
import mongoose from 'mongoose';
import PushSubscription from "@/models/PushSubscription";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@smartplate.ai';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export const sendPushNotification = async (userId: string, payload: { title: string, body: string }) => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured, skipping push notification.");
    return false;
  }

  try {
    const subscriptions = await PushSubscription.find({ userId, isActive: true });
    for (const sub of subscriptions) {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.keys.auth,
          p256dh: sub.keys.p256dh
        }
      };
      
      try {
        await webpush.sendNotification(pushConfig, JSON.stringify(payload));
      } catch (err: any) {
        if (err.statusCode === 410) {
          sub.isActive = false;
          await sub.save();
        } else {
          console.error('Error sending push notification', err);
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error fetching subscriptions for push', error);
    return false;
  }
};
