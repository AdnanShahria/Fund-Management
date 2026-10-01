import { NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/db/ledger-service";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    interface AuthRequestBody {
      secret?: string;
    }

    const body = (await request.json()) as AuthRequestBody;
    const { secret } = body;

    if (!secret || typeof secret !== "string") {
      return NextResponse.json(
        { ok: false, error: "Admin secret key is required" },
        { status: 400 }
      );
    }

    const isValid = verifyAdminSecret(secret.trim());

    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Incorrect admin secret key" },
        { status: 401 }
      );
    }

    // Return session token indicator
    return NextResponse.json({
      ok: true,
      message: "Admin authentication successful",
      authenticated: true,
    });
  } catch (err) {
    console.error("POST /api/admin/auth error:", err);
    return NextResponse.json(
      { ok: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}
