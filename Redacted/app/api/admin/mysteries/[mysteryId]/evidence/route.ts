import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

// GET - List evidence for a mystery
export async function GET(
  request: NextRequest,
  { params }: { params: { mysteryId: string } }
) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mysteryId } = params;
    const supabase = getSupabaseAdminClient();

    const { data: evidence, error } = await supabase
      .from("evidence")
      .select(`
        id,
        type,
        storage_path,
        unlocked_on_task_id,
        has_transcript,
        evidence_locales(id, title, content, lang)
      `)
      .eq("mystery_id", mysteryId)
      .order("type", { ascending: true }) as any;

    if (error) throw error;

    return NextResponse.json({ evidence: evidence || [] });
  } catch (error) {
    console.error("Failed to fetch evidence:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence" },
      { status: 500 }
    );
  }
}

// POST - Create new evidence
export async function POST(
  request: NextRequest,
  { params }: { params: { mysteryId: string } }
) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mysteryId } = params;
    const body = await request.json();
    const {
      type,
      storage_path,
      unlocked_on_task_id,
      has_transcript = false,
      title_en,
      title_no,
      content_en,
      content_no,
    } = body;

    if (!type || !storage_path || !title_en || !title_no) {
      return NextResponse.json(
        { error: "Missing required fields: type, storage_path, title_en, title_no" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Create evidence
    const { data: evidenceItem, error: evidenceError } = await supabase
      .from("evidence")
      .insert({
        mystery_id: mysteryId,
        type,
        storage_path,
        unlocked_on_task_id: unlocked_on_task_id || null,
        has_transcript,
      } as any)
      .select()
      .single() as any;

    if (evidenceError || !evidenceItem) {
      throw evidenceError || new Error("Failed to create evidence");
    }

    // Add locales
    const { error: localeError } = await supabase
      .from("evidence_locales")
      .insert([
        {
          evidence_id: evidenceItem.id,
          lang: "en",
          title: title_en,
          content: content_en || null,
        },
        {
          evidence_id: evidenceItem.id,
          lang: "no",
          title: title_no,
          content: content_no || null,
        },
      ]);

    if (localeError) throw localeError;

    return NextResponse.json({ evidence: evidenceItem }, { status: 201 });
  } catch (error) {
    console.error("Failed to create evidence:", error);
    return NextResponse.json(
      { error: "Failed to create evidence" },
      { status: 500 }
    );
  }
}
