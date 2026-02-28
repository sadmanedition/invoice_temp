import { NextResponse } from "next/server";
import { getSession } from "@/lib/store/auth";
import { getAllUsersWithSettings, updateUserSettings, updateUser } from "@/lib/store/local-store";

async function isAdmin() {
  const user = await getSession();
  return user?.role === "admin" ? user : null;
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = getAllUsersWithSettings();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (body.automation_enabled !== undefined) {
      updateUserSettings(body.user_id, { automation_enabled: body.automation_enabled });
    }

    if (body.role) {
      updateUser(body.user_id, { role: body.role });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
