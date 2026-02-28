import { NextResponse } from "next/server";
import { getSession } from "@/lib/store/auth";
import { getAllFollowUpLogs } from "@/lib/store/local-store";

async function isAdmin() {
  const user = await getSession();
  return user?.role === "admin" ? user : null;
}

export async function GET(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const data = getAllFollowUpLogs(limit, offset);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
