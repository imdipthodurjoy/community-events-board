import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";

async function verifyAdmin(request) {
  const token = request.cookies.get("admin_token")?.value;

  if (!token || !process.env.JWT_SECRET) {
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

export async function GET(request) {
  try {
    const isAdmin = await verifyAdmin(request);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in as admin." },
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
    console.error("Admin events API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load events." },
      { status: 500 }
    );
  }
}