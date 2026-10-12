import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/user-auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user,
  });
}