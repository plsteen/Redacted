import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { randomBytes } from "crypto";

function generateAccessCode(): string {
  // Generate a readable 8-character code like "ABCD-1234"
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars (0, O, I, 1)
  let code = "";
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
    if (i === 3) code += "-";
  }
  return code;
}

// GET - List all access codes
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      codes: [],
      message: "Database not configured",
    });
  }

  const supabase = getSupabaseAdminClient();

  try {
    const { data: codes, error } = await supabase
      .from("access_codes")
      .select(`
        id,
        code,
        mystery_id,
        created_by,
        created_at,
        expires_at,
        max_uses,
        used_count,
        is_active,
        note,
        mysteries (title, slug)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({
      codes: codes || [],
    });
  } catch (error) {
    console.error("Failed to fetch access codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch access codes" },
      { status: 500 }
    );
  }
}

// POST - Create new access code
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { mysteryId, maxUses = 1, expiresAt, note } = body;

    if (!mysteryId) {
      return NextResponse.json(
        { error: "Mystery ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Generate unique code
    let code = generateAccessCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from("access_codes")
        .select("id")
        .eq("code", code)
        .single();

      if (!existing) break;
      code = generateAccessCode();
      attempts++;
    }

    const { data, error } = await supabase
      .from("access_codes")
      .insert({
        code,
        mystery_id: mysteryId,
        created_by: "admin",
        max_uses: maxUses,
        expires_at: expiresAt || null,
        note: note || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      code: data,
    });
  } catch (error) {
    console.error("Failed to create access code:", error);
    return NextResponse.json(
      { error: "Failed to create access code" },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate access code
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");
  const codeId = searchParams.get("id");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!codeId) {
    return NextResponse.json({ error: "Code ID is required" }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const supabase = getSupabaseAdminClient();

  try {
    const { error } = await supabase
      .from("access_codes")
      .update({ is_active: false })
      .eq("id", codeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to deactivate access code:", error);
    return NextResponse.json(
      { error: "Failed to deactivate access code" },
      { status: 500 }
    );
  }
}
