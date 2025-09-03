import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get user's files
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');

    if (!userAddress) {
      return NextResponse.json({ error: 'User address is required' }, { status: 400 });
    }

    const files = await prisma.userFile.findMany({
      where: { user_address: userAddress },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching user files:', error);
    return NextResponse.json({ error: 'Failed to fetch user files' }, { status: 500 });
  }
}

// Add new file
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userAddress, fileName, fileType } = body;

    if (!userAddress || !fileName || !fileType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const file = await prisma.userFile.create({
      data: {
        user_address: userAddress,
        file_name: fileName,
        file_type: fileType,
      },
    });

    return NextResponse.json(file);
  } catch (error) {
    console.error('Error creating user file:', error);
    return NextResponse.json({ error: 'Failed to create user file' }, { status: 500 });
  }
}

// Delete file
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    await prisma.userFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user file:', error);
    return NextResponse.json({ error: 'Failed to delete user file' }, { status: 500 });
  }
}
