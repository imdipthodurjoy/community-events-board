import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        isActive: true,
        date: {
          gte: new Date(),
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Events API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load events.",
      },
      { status: 500 }
    );
  }
}