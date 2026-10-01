import { NextResponse } from "next/server";
import { getMembers, addMember } from "@/lib/db/ledger-service";

export const runtime = "edge";

export async function GET() {
  try {
    const members = await getMembers();
    return NextResponse.json({ ok: true, members });
  } catch (err) {
    console.error("GET /api/members error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    interface MemberRequestBody {
      displayName?: string;
      role?: "MEMBER" | "TREASURER" | "VIEWER";
    }

    const body = (await request.json()) as MemberRequestBody;
    const { displayName, role } = body;

    if (!displayName || typeof displayName !== "string" || !displayName.trim()) {
      return NextResponse.json(
        { ok: false, error: "Display name is required" },
        { status: 400 }
      );
    }

    const assignedRole: "MEMBER" | "TREASURER" | "VIEWER" =
      role === "TREASURER" || role === "VIEWER" ? role : "MEMBER";

    const created = await addMember({
      displayName: displayName.trim(),
      role: assignedRole,
    });

    return NextResponse.json({ ok: true, member: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/members error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to add member" },
      { status: 500 }
    );
  }
}
