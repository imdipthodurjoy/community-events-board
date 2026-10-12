import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function verifyAdmin() {
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