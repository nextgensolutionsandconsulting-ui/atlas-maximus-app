
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateMeetingNotes } from '@/lib/meeting-copilot';

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
      include: {
        transcripts: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Generate meeting notes based on transcripts
    const notes = generateMeetingNotes(
      meeting.meetingType,
      meeting.transcripts,
      meeting.actionItems as any[] || [],
      meeting.decisions as any[] || []
    );

    // Update meeting with generated notes
    const updatedMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: {
        notes,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        transcripts: true,
      },
    });

    return NextResponse.json({ 
      meeting: updatedMeeting,
      notes,
    });
  } catch (error) {
    console.error('Error generating notes:', error);
    return NextResponse.json(
      { error: 'Failed to generate notes' },
      { status: 500 }
    );
  }
}
