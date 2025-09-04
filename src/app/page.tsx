'use client';

import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check, Download, Send, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { sendNotification, subscribeUser, unsubscribeUser } from './actions/push';

// Import actions dari file asli Anda

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastSent, setLastSent] = useState('');

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            registerServiceWorker();
        }
    }, []);

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            });
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    }

    async function subscribeToPush() {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
            });
            setSubscription(sub);
            const serializedSub = sub.toJSON(); // 🔹 toJSON lebih aman
            await subscribeUser(serializedSub);
            console.log('Subscribed:', serializedSub);
        } catch (error) {
            console.error('Push subscription failed:', error);
            alert('Failed to subscribe to push notifications. Please check if VAPID keys are configured.');
        }
        setIsLoading(false);
    }

    async function unsubscribeFromPush() {
        setIsLoading(true);
        if (subscription) {
            await subscription.unsubscribe();
            await unsubscribeUser(subscription.endpoint); // 🔹 kirim endpoint ke server
        }
        setSubscription(null);
        setIsLoading(false);
    }

    async function sendTestNotification() {
        if (subscription && message.trim()) {
            setIsLoading(true);
            await sendNotification(message);
            setLastSent(message);
            setMessage('');
            setIsLoading(false);
        }
    }

    if (!isSupported) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                <X className="mx-auto mb-3 h-12 w-12 text-red-400" />
                <h3 className="mb-2 text-lg font-semibold text-red-800">Browser Not Supported</h3>
                <p className="text-red-600">Push notifications are not supported in this browser.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 text-center">
                <div
                    className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-300 ${
                        subscription ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                >
                    {subscription ? (
                        <Bell className="h-8 w-8 text-green-600" />
                    ) : (
                        <BellOff className="h-8 w-8 text-gray-400" />
                    )}
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">Push Notifications</h3>
                <div
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                        subscription ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                    <div className={`mr-2 h-2 w-2 rounded-full ${subscription ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {subscription ? 'Connected' : 'Disconnected'}
                </div>
            </div>

            {subscription ? (
                <div className="space-y-4">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="mb-2 flex items-center">
                            <Check className="mr-2 h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Successfully subscribed!</span>
                        </div>
                        <p className="text-xs text-green-600">You will receive push notifications from this app.</p>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Test Message</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Enter your notification message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <Send className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                        </div>
                    </div>

                    {lastSent && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <p className="text-xs font-medium text-blue-600">Last sent:</p>
                            <p className="truncate text-sm text-blue-800">"{lastSent}"</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={sendTestNotification}
                            disabled={isLoading || !message.trim()}
                            className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Sending...
                                </div>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Test
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={unsubscribeFromPush}
                            disabled={isLoading}
                            variant="outline"
                            className="border-red-300 px-4 py-3 text-red-600 transition-all duration-200 hover:border-red-400 hover:bg-red-50"
                        >
                            <BellOff className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                        <p className="mb-3 text-sm text-gray-600">
                            Enable push notifications to receive real-time updates and alerts.
                        </p>
                        <ul className="space-y-1 text-xs text-gray-500">
                            <li>• Get instant notifications</li>
                            <li>• Stay updated with latest news</li>
                            <li>• Never miss important alerts</li>
                        </ul>
                    </div>

                    <Button
                        onClick={subscribeToPush}
                        disabled={isLoading}
                        className="w-full transform rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-4 font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:from-blue-700 hover:to-purple-700"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Subscribing...
                            </div>
                        ) : (
                            <>
                                <Bell className="mr-2 h-5 w-5" />
                                Enable Notifications
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}

function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstallTip, setShowInstallTip] = useState(false);

    useEffect(() => {
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }, []);

    if (isStandalone) {
        return (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-green-800">App Installed!</h3>
                <p className="text-sm text-green-600">You're running the PWA version.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
                    <Download className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">Install PWA</h3>
                <p className="text-sm text-gray-600">Get the full app experience</p>
            </div>

            <div className="space-y-4">
                <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
                    <h4 className="mb-2 font-semibold text-gray-800">Benefits:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                        <li className="flex items-center">
                            <Check className="mr-2 h-3 w-3 flex-shrink-0 text-green-500" />
                            Works offline
                        </li>
                        <li className="flex items-center">
                            <Check className="mr-2 h-3 w-3 flex-shrink-0 text-green-500" />
                            Faster loading
                        </li>
                        <li className="flex items-center">
                            <Check className="mr-2 h-3 w-3 flex-shrink-0 text-green-500" />
                            Native app feel
                        </li>
                        <li className="flex items-center">
                            <Check className="mr-2 h-3 w-3 flex-shrink-0 text-green-500" />
                            Push notifications
                        </li>
                    </ul>
                </div>

                <Button
                    onClick={() => setShowInstallTip(true)}
                    className="w-full transform rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 py-4 font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:from-purple-700 hover:to-blue-700"
                >
                    <Smartphone className="mr-2 h-5 w-5" />
                    Add to Home Screen
                </Button>

                {(isIOS || showInstallTip) && (
                    <div className="animate-fadeIn rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <h4 className="mb-2 flex items-center font-semibold text-blue-800">
                            <Smartphone className="mr-2 h-4 w-4" />
                            Installation Guide
                        </h4>
                        {isIOS ? (
                            <div className="space-y-2 text-sm text-blue-700">
                                <p>On iOS Safari:</p>
                                <ol className="ml-2 list-inside list-decimal space-y-1">
                                    <li>
                                        Tap the Share button{' '}
                                        <span className="rounded bg-blue-100 px-1 font-mono">⎋</span>
                                    </li>
                                    <li>
                                        Select "Add to Home Screen"{' '}
                                        <span className="rounded bg-blue-100 px-1 font-mono">➕</span>
                                    </li>
                                    <li>Tap "Add" to confirm</li>
                                </ol>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm text-blue-700">
                                <p>On Chrome/Edge:</p>
                                <ol className="ml-2 list-inside list-decimal space-y-1">
                                    <li>Look for the install prompt</li>
                                    <li>Or use browser menu → "Install app"</li>
                                    <li>Click "Install" to confirm</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Home() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="animate-blob absolute top-20 left-20 h-72 w-72 rounded-full bg-blue-400 opacity-20 mix-blend-multiply blur-3xl filter" />
                <div className="animate-blob animation-delay-2000 absolute top-40 right-20 h-72 w-72 rounded-full bg-purple-400 opacity-20 mix-blend-multiply blur-3xl filter" />
                <div className="animate-blob animation-delay-4000 absolute bottom-20 left-40 h-72 w-72 rounded-full bg-pink-400 opacity-20 mix-blend-multiply blur-3xl filter" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-8 p-4">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="bg-opacity-10 border-opacity-20 mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-white bg-white backdrop-blur-sm">
                        <Bell className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-4xl font-bold text-transparent text-white md:text-5xl">
                        PWA Testing Hub
                    </h1>
                    <p className="mb-4 text-lg text-gray-300">Test Push Notifications & PWA Installation</p>
                    <div className="bg-opacity-10 border-opacity-20 inline-flex items-center rounded-full border border-white bg-white px-4 py-2 backdrop-blur-sm">
                        <div className="mr-3 h-2 w-2 animate-pulse rounded-full bg-green-400" />
                        {/* <span className="font-mono text-sm text-gray-300">{currentTime.toLocaleTimeString()}</span> */}
                    </div>
                </div>

                {/* Main Cards */}
                <div className="flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
                    <div className="flex flex-1 justify-center">
                        <PushNotificationManager />
                    </div>
                    <div className="flex flex-1 justify-center">
                        <InstallPrompt />
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <p className="mb-2 text-sm text-gray-400">Built with React & Tailwind CSS</p>
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                        <span>PWA Ready</span>
                        <span>•</span>
                        <span>Push Notifications</span>
                        <span>•</span>
                        <span>Offline Support</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
