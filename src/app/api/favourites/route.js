import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/user-auth";

const ALLOWED_CATEGORIES = [
  "Music",
  "Workshop",
  "Food",
  "Sports",
  "Kids",
];

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please login first." },
        { status: 401 }
      );
    }

    const favourites = await prisma.userFavouriteCategory.findMany({
      where: { userId: user.id },
      select: { category: true },
      orderBy: { category: "asc" },
    });

    return NextResponse.json({
      success: true,
      categories: favourites.map((item) => item.category),
    });
  } catch (error) {
    console.error("Get favourites error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load favourite categories." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please login first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const categories = body.categories;

    if (
      !Array.isArray(categories) ||
      categories.some(
        (category) =>
          typeof category !== "string" ||
          !ALLOWED_CATEGORIES.includes(category)
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid categories." },
        { status: 400 }
      );
    }

    const uniqueCategories = [...new Set(categories)];

    await prisma.$transaction(async (tx) => {
      await tx.userFavouriteCategory.deleteMany({
        where: { userId: user.id },
      });

      if (uniqueCategories.length > 0) {
        await tx.userFavouriteCategory.createMany({
          data: uniqueCategories.map((category) => ({
            userId: user.id,
            category,
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Favourite categories saved successfully.",
      categories: uniqueCategories,
    });
  } catch (error) {
    console.error("Save favourites error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save favourite categories." },
      { status: 500 }
    );
  }
}