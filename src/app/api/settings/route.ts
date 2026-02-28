import { NextResponse } from "next/server";
import { getSession } from "@/lib/store/auth";
import { getUserSettings, updateUserSettings } from "@/lib/store/local-store";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = getUserSettings(user.id);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const settings = updateUserSettings(user.id, {
      follow_up_interval_hours: body.follow_up_interval_hours,
      tone_preference: body.tone_preference,
      enabled_channels: body.enabled_channels,
      automation_enabled: body.automation_enabled,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
