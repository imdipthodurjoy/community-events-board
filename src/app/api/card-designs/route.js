import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/user-auth";

const THEMES = ["default", "dark", "colorful"];
const ALLOWED_STICKERS = [
  "🎉",
  "🎵",
  "🍔",
  "⚽",
  "⭐",
];

export async function GET(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = Number(searchParams.get("eventId"));

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid event ID." },
        { status: 400 }
      );
    }

    const design = await prisma.eventCardDesign.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      design: design
        ? {
            theme: design.theme,
            stickers: design.stickers,
          }
        : {
            theme: "default",
            stickers: [],
          },
    });
  } catch (error) {
    console.error("Fetch card design error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load card design." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
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
    const theme = body.theme;
    const stickers = body.stickers;

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid event ID." },
        { status: 400 }
      );
    }

    if (!THEMES.includes(theme)) {
      return NextResponse.json(
        { success: false, message: "Invalid theme." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(stickers) ||
      stickers.length > 3 ||
      stickers.some((sticker) => !ALLOWED_STICKERS.includes(sticker)) ||
      new Set(stickers).size !== stickers.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Choose up to 3 valid, unique stickers.",
        },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found." },
        { status: 404 }
      );
    }

    const design = await prisma.eventCardDesign.upsert({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId,
        },
      },
      update: { theme, stickers },
      create: {
        userId: user.id,
        eventId,
        theme,
        stickers,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Card design saved.",
      design: {
        theme: design.theme,
        stickers: design.stickers,
      },
    });
  } catch (error) {
    console.error("Save card design error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save card design." },
      { status: 500 }
    );
  }
}