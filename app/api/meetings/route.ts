
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (status) {
      where.status = status;
    }

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy: {
        scheduledFor: 'desc',
      },
      include: {
        transcripts: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      title,
      meetingType,
      scheduledFor,
      duration,
      attendees,
      location,
      sprintContext,
      piContext,
      jiraDatasetId,
    } = body;

    if (!title || !meetingType) {
      return NextResponse.json(
        { error: 'Title and meeting type are required' },
        { status: 400 }
      );
    }

    const meeting = await prisma.meeting.create({
      data: {
        userId: user.id,
        title,
        meetingType,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        duration,
        attendees: attendees || [],
        location,
        sprintContext,
        piContext,
        jiraDatasetId,
      },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}
