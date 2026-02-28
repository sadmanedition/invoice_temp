import { NextResponse } from "next/server";
import { getSession } from "@/lib/store/auth";
import { seedDemoData } from "@/lib/store/seed";

export async function GET() {
  seedDemoData();
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}
