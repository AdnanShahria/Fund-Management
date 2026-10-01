import { NextResponse } from "next/server";
import { exportTransactionsCsv } from "@/lib/db/ledger-service";

export const runtime = "edge";

export async function GET() {
  try {
    const csvData = await exportTransactionsCsv();
    const today = new Date().toISOString().split("T")[0];

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="room-302-fund-${today}.csv"`,
      },
    });
  } catch (err) {
    console.error("GET /api/export error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
