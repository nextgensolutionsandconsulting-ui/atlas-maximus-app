
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const body = await request.json();
    const { speaker, content, isVoice } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const transcript = await prisma.meetingTranscript.create({
      data: {
        meetingId: params.id,
        speaker,
        content,
        isVoice: isVoice || false,
      },
    });

    // Update meeting status to IN_PROGRESS if it's still SCHEDULED
    if (meeting.status === 'SCHEDULED') {
      await prisma.meeting.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return NextResponse.json({ transcript }, { status: 201 });
  } catch (error) {
    console.error('Error adding transcript:', error);
    return NextResponse.json(
      { error: 'Failed to add transcript' },
      { status: 500 }
    );
  }
}
