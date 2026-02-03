import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

interface CaseMetadata {
  id: string;
  code: string;
  difficulty: "easy" | "medium" | "hard" | "very_difficult";
  estimated_duration_minutes: number;
  description: string;
  tags: string[];
  is_published: boolean;
  mystery_locales: Array<{ id: string; title: string; tagline: string | null; description: string | null; lang: string }>;
  created_at: string;
  updated_at: string;
}

// GET - List all cases with metadata
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data: cases, error } = await supabase
      .from("mysteries")
      .select(
        `
        id,
        code,
        difficulty,
        estimated_duration_minutes,
        description,
        tags,
        is_published,
        mystery_locales(id, title, tagline, description, lang),
        created_at,
        updated_at
      `
      )
      .order("created_at", { ascending: false }) as {
      data: CaseMetadata[] | null;
      error: any;
    };

    if (error) {
      console.error("Supabase error fetching cases:", error);
      throw error;
    }

    return NextResponse.json({ cases: cases || [] });
  } catch (error) {
    console.error("Failed to fetch cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}

// POST - Create new case
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      code,
      title_en,
      title_no,
      difficulty = "medium",
      estimated_duration_minutes = 30,
      description = "",
      tags = [],
    } = body;

    if (!code || !title_en || !title_no) {
      return NextResponse.json(
        { error: "Missing required fields: code, title_en, title_no" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Create mystery
    const { data: mystery, error: mysteryError } = await supabase
      .from("mysteries")
      .insert({
        code,
        difficulty,
        estimated_duration_minutes,
        description,
        tags,
        is_published: false,
      } as any)
      .select()
      .single() as any;

    if (mysteryError || !mystery) throw mysteryError || new Error("Failed to create mystery");

    // Add locales
    const { error: localeError } = await supabase
      .from("mystery_locales")
      .insert([
        { mystery_id: mystery.id, lang: "en", title: title_en },
        { mystery_id: mystery.id, lang: "no", title: title_no },
      ]);

    if (localeError) throw localeError;

    return NextResponse.json({ case: mystery }, { status: 201 });
  } catch (error) {
    console.error("Failed to create case:", error);
    return NextResponse.json(
      { error: "Failed to create case" },
      { status: 500 }
    );
  }
}

// PATCH - Update case
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      difficulty,
      estimated_duration_minutes,
      description,
      tags,
      is_published,
      title_en,
      title_no,
      tagline_en,
      tagline_no,
      description_en,
      description_no,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Case ID required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const updates: any = { updated_at: new Date().toISOString() };

    if (difficulty) updates.difficulty = difficulty;
    if (estimated_duration_minutes !== undefined) {
      updates.estimated_duration_minutes = estimated_duration_minutes;
    }
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags;
    if (is_published !== undefined) updates.is_published = is_published;

    // Update mystery
    const { error: updateError } = await supabase
      .from("mysteries")
      .update(updates)
      .eq("id", id);

    if (updateError) throw updateError;

    // Update EN locale
    if (title_en || tagline_en || description_en) {
      const enUpdates: any = {};
      if (title_en) enUpdates.title = title_en;
      if (tagline_en !== undefined) enUpdates.tagline = tagline_en;
      if (description_en !== undefined) enUpdates.description = description_en;
      
      await supabase
        .from("mystery_locales")
        .update(enUpdates)
        .eq("mystery_id", id)
        .eq("lang", "en");
    }

    // Update NO locale
    if (title_no || tagline_no || description_no) {
      const noUpdates: any = {};
      if (title_no) noUpdates.title = title_no;
      if (tagline_no !== undefined) noUpdates.tagline = tagline_no;
      if (description_no !== undefined) noUpdates.description = description_no;
      
      await supabase
        .from("mystery_locales")
        .update(noUpdates)
        .eq("mystery_id", id)
        .eq("lang", "no");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update case:", error);
    return NextResponse.json(
      { error: "Failed to update case" },
      { status: 500 }
    );
  }
}

// DELETE - Delete case
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
      return NextResponse.json({ error: "Case ID required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Delete associated evidence prompts first
    await supabase.from("evidence_prompts").delete().eq("case_id", id);

    // Delete locales
    await supabase.from("mystery_locales").delete().eq("mystery_id", id);

    // Delete mystery
    const { error } = await supabase
      .from("mysteries")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete case:", error);
    return NextResponse.json(
      { error: "Failed to delete case" },
      { status: 500 }
    );
  }
}
