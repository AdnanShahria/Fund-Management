import { NextResponse } from "next/server";
import { updateMember, deleteMember } from "@/lib/db/ledger-service";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    interface MemberUpdateBody {
      displayName?: string;
      role?: "MEMBER" | "TREASURER" | "VIEWER" | "OWNER";
      status?: "active" | "suspended";
      phone?: string;
      telegramUsername?: string;
    }

    const body = (await request.json()) as MemberUpdateBody;
    const updated = await updateMember(params.id, body);

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, member: updated });
  } catch (err) {
    console.error("PATCH /api/members/[id] error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteMember(params.id);

    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Member removed" });
  } catch (err) {
    console.error("DELETE /api/members/[id] error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
