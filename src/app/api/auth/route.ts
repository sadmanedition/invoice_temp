import { NextResponse } from "next/server";
import { createUser, verifyPassword, simpleHash, getUserByEmail } from "@/lib/store/local-store";
import { setSession, clearSession } from "@/lib/store/auth";
import { seedDemoData } from "@/lib/store/seed";

// POST /api/auth/login
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Ensure demo data exists
  seedDemoData();

  const body = await request.json();

  if (action === "register") {
    // Check if user exists
    const existing = getUserByEmail(body.email);
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const user = createUser({
      email: body.email,
      company_name: body.company_name,
      password_hash: simpleHash(body.password),
    });

    await setSession(user.id);

    return NextResponse.json({ user, success: true });
  }

  if (action === "logout") {
    await clearSession();
    return NextResponse.json({ success: true });
  }

  // Default: login
  const user = verifyPassword(body.email, body.password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await setSession(user.id);

  return NextResponse.json({ user, success: true });
}
