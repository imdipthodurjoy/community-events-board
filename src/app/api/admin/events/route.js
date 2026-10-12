import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token || !process.env.JWT_SECRET || !process.env.ADMIN_EMAIL) {
    return false;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return (
      typeof decoded === "object" &&
      decoded.role === "ADMIN" &&
      decoded.email === process.env.ADMIN_EMAIL
    );
  } catch {
    return false;
  }
}

// GET: Fetch all events for admin
export async function GET() {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Admin Events GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load events." },
      { status: 500 }
    );
  }
}

// POST: Create a new event
export async function POST(request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      category,
      city,
      date,
      price,
      description,
      imageUrl,
      isActive,
    } = body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof category !== "string" ||
      !["Music", "Workshop", "Food", "Sports", "Kids"].includes(category) ||
      typeof city !== "string" ||
      !city.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !date ||
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide valid event details.",
        },
        { status: 400 }
      );
    }

    const eventDate = new Date(date);

    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid event date." },
        { status: 400 }
      );
    }

    if (
      imageUrl !== undefined &&
      imageUrl !== null &&
      typeof imageUrl !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Image URL must be text." },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        category,
        city: city.trim(),
        date: eventDate,
        price: Number(price),
        description: description.trim(),
        imageUrl: imageUrl?.trim() || null,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event created successfully.",
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin Events POST error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create event." },
      { status: 500 }
    );
  }
}




// PUT: Update an existing event
export async function PUT(request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      id,
      title,
      category,
      city,
      date,
      price,
      description,
      imageUrl,
      isActive,
    } = body;

    if (
      (typeof id !== "string" && typeof id !== "number") ||
      !String(id).trim() ||
      typeof title !== "string" ||
      !title.trim() ||
      !["Music", "Workshop", "Food", "Sports", "Kids"].includes(category) ||
      typeof city !== "string" ||
      !city.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !date ||
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      typeof isActive !== "boolean"
    ) {
      return NextResponse.json(
        { success: false, message: "Please provide valid event details." },
        { status: 400 }
      );
    }

    if (
      imageUrl !== undefined &&
      imageUrl !== null &&
      typeof imageUrl !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Image URL must be text." },
        { status: 400 }
      );
    }

    const eventDate = new Date(date);

    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid event date." },
        { status: 400 }
      );
    }

    const eventId = Number(id);

    if (!Number.isSafeInteger(eventId) || eventId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid event ID." },
        { status: 400 }
      );
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, message: "Event not found." },
        { status: 404 }
      );
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: title.trim(),
        category,
        city: city.trim(),
        date: eventDate,
        price: Number(price),
        description: description.trim(),
        imageUrl: imageUrl?.trim() || null,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event updated successfully.",
      event,
    });
  } catch (error) {
    console.error("Admin Events PUT error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update event." },
      { status: 500 }
    );
  }
}