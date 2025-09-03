import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { wallet_address } = json;

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { wallet_address },
      update: {}, // No updates if exists
      create: {
        wallet_address,
        // Optional: Set default values for new users
        display_name: `User ${wallet_address.slice(0, 6)}`,
      },
    });

    return NextResponse.json({
      user,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
