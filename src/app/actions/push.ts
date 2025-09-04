'use server';

import webpush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateKey = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails('mailto:youremail@example.com', publicKey, privateKey);

// sementara simpan di memory
let subscriptions: any[] = [];

export async function subscribeUser(sub: any) {
    subscriptions.push(sub);
    return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
    subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
    return { success: true };
}

export async function sendNotification(message: string) {
    if (subscriptions.length === 0) {
        throw new Error('No subscriptions available');
    }

    try {
        await Promise.all(
            subscriptions.map((sub) =>
                webpush
                    .sendNotification(
                        sub,
                        JSON.stringify({
                            title: 'Test Notification',
                            body: message,
                            icon: '/icon-192x192.png',
                        }),
                    )
                    .catch((err) => {
                        console.error('Push error:', err);
                    }),
            ),
        );
        return { success: true };
    } catch (err) {
        console.error('Error sending push notification:', err);
        return { success: false, error: 'Failed to send notification' };
    }
}
