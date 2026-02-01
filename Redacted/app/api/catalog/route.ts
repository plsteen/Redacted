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

  interface MysteryRow {
    id: string;
    code: string;
    title: string;
    locale: string;
    difficulty: string | null;
    price_nok: number | null;
    summary: string | null;
    backstory: string | null;
    location: string | null;
    date: string | null;
    estimated_minutes: number | null;
    play_count: number | null;
    created_at: string;
  }

  interface PurchaseWithMystery {
    mystery_id: string;
    mysteries: { code: string } | null;
  }

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

  // Try to get mysteries from database first (only if service role is available)
  let catalogItems: CatalogItem[] = [];
  let purchasedMysteryIds: string[] = [];

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminSupabase = getSupabaseAdminClient();
      
      const { data: mysteries } = await adminSupabase
        .from("mysteries")
        .select("id, code, title, difficulty, price_nok, summary, backstory, location, date, estimated_minutes, play_count, created_at")
        .order("created_at", { ascending: false });

      const typedMysteries = (mysteries || []) as unknown as MysteryRow[];

      if (typedMysteries.length > 0) {
        // If user is logged in, check which they own
        if (user) {
          const { data: purchases } = await adminSupabase
            .from("purchases")
            .select("mystery_id")
            .eq("user_id", user.id)
            .eq("status", "completed");

          interface Purchase {
            mystery_id: string;
          }
          const typedPurchases = (purchases || []) as unknown as Purchase[];
          purchasedMysteryIds = typedPurchases.map((p) => p.mystery_id);
        }

        catalogItems = typedMysteries.map((m) => {
          let difficulty = 1;
          if (m.difficulty) {
            difficulty = m.difficulty === 'easy' ? 1 : m.difficulty === 'medium' ? 2 : m.difficulty === 'hard' ? 3 : 1;
          }
          return {
            id: m.id,
            slug: m.code,
            title: m.title,
            locale: locale,
            difficulty,
            priceNok: m.price_nok || 149,
            summary: m.summary,
            backstory: m.backstory,
            location: m.location,
            date: m.date,
            estimatedMinutes: m.estimated_minutes || 45,
            playCount: m.play_count || 0,
            createdAt: m.created_at,
            isPurchased: purchasedMysteryIds.includes(m.id),
          };
        });
      }
    } catch {
      console.log("Database not available, falling back to filesystem");
    }
  }

  // If no mysteries in database, load from filesystem
  if (catalogItems.length === 0) {
    const fileCases = await loadCasesFromFiles(locale);
    catalogItems = fileCases.map((c) => ({
      ...c,
      isPurchased: false,
    }));
  }

  return NextResponse.json({ 
    mysteries: catalogItems,
    user: user ? { id: user.id, email: user.email } : null,
  });
}
