import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

// PATCH - Update evidence
export async function PATCH(
  request: NextRequest,
  { params }: { params: { mysteryId: string; evidenceId: string } }
) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { evidenceId } = params;
    const body = await request.json();
    const {
      type,
      storage_path,
      unlocked_on_task_id,
      has_transcript,
      title_en,
      title_no,
      content_en,
      content_no,
    } = body;

    const supabase = getSupabaseAdminClient();
    const updates: any = {};

    if (type) updates.type = type;
    if (storage_path) updates.storage_path = storage_path;
    if (unlocked_on_task_id !== undefined) updates.unlocked_on_task_id = unlocked_on_task_id;
    if (has_transcript !== undefined) updates.has_transcript = has_transcript;

    // Update evidence
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("evidence")
        .update(updates)
        .eq("id", evidenceId);

      if (updateError) throw updateError;
    }

    // Update EN locale
    if (title_en || content_en !== undefined) {
      const enUpdates: any = {};
      if (title_en) enUpdates.title = title_en;
      if (content_en !== undefined) enUpdates.content = content_en;
      
      await supabase
        .from("evidence_locales")
        .update(enUpdates)
        .eq("evidence_id", evidenceId)
        .eq("lang", "en");
    }

    // Update NO locale
    if (title_no || content_no !== undefined) {
      const noUpdates: any = {};
      if (title_no) noUpdates.title = title_no;
      if (content_no !== undefined) noUpdates.content = content_no;
      
      await supabase
        .from("evidence_locales")
        .update(noUpdates)
        .eq("evidence_id", evidenceId)
        .eq("lang", "no");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update evidence:", error);
    return NextResponse.json(
      { error: "Failed to update evidence" },
      { status: 500 }
    );
  }
}

// DELETE - Delete evidence
export async function DELETE(
  request: NextRequest,
  { params }: { params: { mysteryId: string; evidenceId: string } }
) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { evidenceId } = params;
    const supabase = getSupabaseAdminClient();

    // Delete evidence (locales will cascade)
    const { error } = await supabase
      .from("evidence")
      .delete()
      .eq("id", evidenceId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete evidence:", error);
    return NextResponse.json(
      { error: "Failed to delete evidence" },
      { status: 500 }
    );
  }
}
