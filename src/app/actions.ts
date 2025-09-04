'use server';

import webpush from 'web-push';

webpush.setVapidDetails(
    'mailto:cyberpiratexixi@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
);
// webpush.setVapidDetails(
//     'mailto:cyberpiratexixi@gmail.com',
//     process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
//     process.env.VAPID_PRIVATE_KEY!,
// );

let subscription: PushSubscription | null = null;

export async function subscribeUser(sub: PushSubscription) {
    subscription = sub;
    // In a production environment, you would want to store the subscription in a database
    // For example: await db.subscriptions.create({ data: sub })
    return { success: true };
}

export async function unsubscribeUser() {
    subscription = null;
    // In a production environment, you would want to remove the subscription from the database
    // For example: await db.subscriptions.delete({ where: { ... } })
    return { success: true };
}

export async function sendNotification(message: string) {
    if (!subscription) {
        throw new Error('No subscription available');
    }

    try {
        // Convert PushSubscription to the format expected by web-push
        const webPushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.getKey('p256dh')
                    ? Buffer.from(subscription.getKey('p256dh')!).toString('base64')
                    : '',
                auth: subscription.getKey('auth') ? Buffer.from(subscription.getKey('auth')!).toString('base64') : '',
            },
        };

        await webpush.sendNotification(
            webPushSubscription,
            JSON.stringify({
                title: 'Test Notification',
                body: message,
                icon: '/icon-192x192.png',
            }),
        );
        return { success: true };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error: 'Failed to send notification' };
    }
}
