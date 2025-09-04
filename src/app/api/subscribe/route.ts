import { subscribeUser } from '@/app/actions/push';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const subscription = await req.json();
    await subscribeUser(subscription);
    return NextResponse.json({ success: true });
}
