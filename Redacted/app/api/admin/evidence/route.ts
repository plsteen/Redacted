import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

interface EvidencePrompt {
  id: string;
  case_id: string;
  evidence_key: string;
  media_type: "image" | "video" | "audio" | "document";
  media_url: string | null;
  ai_provider: string;
  ai_model: string | null;
  prompt: string;
  prompt_version: number;
  generation_timestamp: string | null;
  metadata: Record<string, any>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// GET - List evidence prompts for a case
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");
  const caseId = searchParams.get("case_id");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!caseId) {
    return NextResponse.json(
      { error: "case_id parameter required" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data: evidence, error } = await supabase
      .from("evidence_prompts")
      .select("*")
      .eq("case_id", caseId)
      .order("evidence_key", { ascending: true }) as {
      data: EvidencePrompt[] | null;
      error: any;
    };

    if (error) throw error;

    return NextResponse.json({ evidence: evidence || [] });
  } catch (error) {
    console.error("Failed to fetch evidence prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence prompts" },
      { status: 500 }
    );
  }
}

// POST - Create or update evidence prompt
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      case_id,
      evidence_key,
      media_type,
      ai_provider = "openai",
      ai_model,
      prompt,
      media_url,
      notes,
      metadata = {},
    } = body;

    if (!case_id || !evidence_key || !media_type || !prompt) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: case_id, evidence_key, media_type, prompt",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Check if evidence prompt already exists
    const { data: existing } = await supabase
      .from("evidence_prompts")
      .select("id, prompt_version")
      .eq("case_id", case_id)
      .eq("evidence_key", evidence_key)
      .single();

    if (existing) {
      // Update existing - increment version
      const { data, error } = await supabase
        .from("evidence_prompts")
        .update({
          prompt,
          ai_provider,
          ai_model,
          media_url,
          notes,
          metadata,
          prompt_version: existing.prompt_version + 1,
          generation_timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ evidence: data });
    } else {
      // Create new
      const { data, error } = await supabase
        .from("evidence_prompts")
        .insert({
          case_id,
          evidence_key,
          media_type,
          ai_provider,
          ai_model,
          prompt,
          media_url,
          notes,
          metadata,
          prompt_version: 1,
          generation_timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ evidence: data }, { status: 201 });
    }
  } catch (error) {
    console.error("Failed to save evidence prompt:", error);
    return NextResponse.json(
      { error: "Failed to save evidence prompt" },
      { status: 500 }
    );
  }
}

// DELETE - Delete evidence prompt
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Evidence prompt ID required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("evidence_prompts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete evidence prompt:", error);
    return NextResponse.json(
      { error: "Failed to delete evidence prompt" },
      { status: 500 }
    );
  }
}
