import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
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

  const supabase = getSupabaseAdminClient();

  try {
    interface MysteryLocale {
      title: string | null;
      lang: string | null;
    }

    interface MysteryRow {
      id: string;
      code: string;
      mystery_locales?: MysteryLocale[] | null;
    }

    const { data: mysteries, error } = await supabase
      .from("mysteries")
      .select("id, code, mystery_locales (title, lang)")
      .order("code", { ascending: true }) as { data: MysteryRow[] | null; error: any };

    if (error) throw error;

    const normalized = (mysteries || []).map((m: MysteryRow) => {
      const locales = m.mystery_locales || [];
      const english = locales.find((l) => l.lang === "en") || locales[0];
      return {
        id: m.id,
        code: m.code,
        title: english?.title || m.code,
      };
    });

    return NextResponse.json({ mysteries: normalized });
  } catch (error) {
    console.error("Failed to fetch mysteries:", error);
    return NextResponse.json(
      { error: "Failed to fetch mysteries" },
      { status: 500 }
    );
  }
}
