import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/user-auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const reminders = await prisma.eventReminder.findMany({
      where: { userId: user.id },
      select: { eventId: true },
    });

    return NextResponse.json({
      success: true,
      reminders: reminders.map((reminder) => reminder.eventId),
    });
  } catch (error) {
    console.error("Fetch reminders error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load reminders." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const eventId = Number(body.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid event ID." },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, isActive: true, date: true },
    });

    if (!event || !event.isActive || new Date(event.date) <= new Date()) {
      return NextResponse.json(
        { success: false, message: "This event is unavailable for reminders." },
        { status: 404 }
      );
    }

    const existing = await prisma.eventReminder.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId,
        },
      },
    });

    if (existing) {
      await prisma.eventReminder.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({
        success: true,
        active: false,
        message: "Reminder removed.",
      });
    }

    await prisma.eventReminder.create({
      data: {
        userId: user.id,
        eventId,
      },
    });

    return NextResponse.json({
      success: true,
      active: true,
      message: "Reminder saved.",
    });
  } catch (error) {
    console.error("Update reminder error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update reminder." },
      { status: 500 }
    );
  }
}