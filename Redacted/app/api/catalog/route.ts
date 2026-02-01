import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { readFile, readdir } from "fs/promises";
import path from "path";

// Load case data from filesystem
async function loadCasesFromFiles(locale: string = "en") {
  const casesDir = path.join(process.cwd(), "content", "cases");
  
  try {
    const caseFolders = await readdir(casesDir);
    const cases = [];
    
    for (const folder of caseFolders) {
      try {
        const caseFile = path.join(casesDir, folder, locale, "case.json");
        const caseData = JSON.parse(await readFile(caseFile, "utf-8"));
        cases.push({
          id: caseData.id || folder,
          slug: folder,
          title: caseData.title,
          locale: locale,
          difficulty: caseData.difficulty || 1,
          priceNok: caseData.priceNok || 149,
          summary: caseData.summary,
          backstory: caseData.backstory,
          location: caseData.location,
          date: caseData.date,
          estimatedMinutes: caseData.estimatedMinutes || 45,
          playCount: 0,
          createdAt: caseData.createdAt || new Date().toISOString(),
        });
      } catch {
        // Skip folders without valid case.json
      }
    }
    return cases;
  } catch {
    return [];
  }
}

// Get all available mysteries for catalog
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";
  
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  interface CatalogItem {
    id: string;
    slug: string;
    title: string;
    locale: string;
    difficulty: number;
    priceNok: number;
    summary: string | null;
    backstory: string | null;
    location: string | null;
    date: string | null;
    estimatedMinutes: number;
    playCount: number;
    createdAt: string;
    isPurchased: boolean;
  }

  let catalogItems: CatalogItem[] = [];
  const purchasedCodes = new Set<string>();
  const codeToId = new Map<string, string>();

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminSupabase = getSupabaseAdminClient();

      const { data: mysteryIds } = await adminSupabase
        .from("mysteries")
        .select("id, code");

      (mysteryIds || []).forEach((m: { id: string; code: string }) => {
        codeToId.set(m.code, m.id);
      });

      if (user) {
        const { data: purchases } = await adminSupabase
          .from("purchases")
          .select("mystery_id, mysteries(code)")
          .eq("user_id", user.id)
          .eq("status", "completed");

        const typedPurchases = (purchases || []) as Array<{
          mystery_id: string;
          mysteries: { code: string } | null;
        }>;

        typedPurchases.forEach((p) => {
          if (p.mysteries?.code) purchasedCodes.add(p.mysteries.code);
        });
      }
    } catch {
      console.log("Database not available, using filesystem only");
    }
  }

  const fileCases = await loadCasesFromFiles(locale);
  catalogItems = fileCases.map((c) => {
    const dbId = codeToId.get(c.slug);
    return {
      ...c,
      id: dbId || c.id,
      isPurchased: purchasedCodes.has(c.slug),
    };
  });

  return NextResponse.json({ 
    mysteries: catalogItems,
    user: user ? { id: user.id, email: user.email } : null,
  });
}
