
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateMeetingAgenda, MeetingContext } from '@/lib/meeting-copilot';

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
    const { context } = body as { context?: MeetingContext };

    // Generate agenda based on meeting type and context
    const agenda = await generateMeetingAgenda(
      meeting.meetingType,
      context || {}
    );

    // Update meeting with generated agenda
    const updatedMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: {
        agenda: agenda as any,
      },
    });

    return NextResponse.json({ 
      meeting: updatedMeeting,
      agenda,
    });
  } catch (error) {
    console.error('Error generating agenda:', error);
    return NextResponse.json(
      { error: 'Failed to generate agenda' },
      { status: 500 }
    );
  }
}
