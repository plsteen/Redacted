import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// GET - List all cases with their JSON content
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const casesDir = path.join(process.cwd(), "content/cases");
    const caseFolders = await fs.readdir(casesDir);
    
    const cases = await Promise.all(
      caseFolders.map(async (caseCode) => {
        const casePath = path.join(casesDir, caseCode);
        const stat = await fs.stat(casePath);
        
        if (!stat.isDirectory()) return null;
        
        // Read English case.json
        let enCase = null;
        let noCase = null;
        
        try {
          const enPath = path.join(casePath, "en", "case.json");
          const enContent = await fs.readFile(enPath, "utf-8");
          enCase = JSON.parse(enContent);
        } catch (e) {
          console.error(`No EN case.json for ${caseCode}`);
        }
        
        try {
          const noPath = path.join(casePath, "no", "case.json");
          const noContent = await fs.readFile(noPath, "utf-8");
          noCase = JSON.parse(noContent);
        } catch (e) {
          console.error(`No NO case.json for ${caseCode}`);
        }
        
        return {
          code: caseCode,
          en: enCase,
          no: noCase,
        };
      })
    );
    
    return NextResponse.json({ 
      cases: cases.filter(Boolean) 
    });
  } catch (error) {
    console.error("Failed to read cases:", error);
    return NextResponse.json(
      { error: "Failed to read cases" },
      { status: 500 }
    );
  }
}

// PATCH - Update case content
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { caseCode, lang, content } = body;
    
    if (!caseCode || !lang || !content) {
      return NextResponse.json(
        { error: "Missing caseCode, lang, or content" },
        { status: 400 }
      );
    }
    
    const casePath = path.join(process.cwd(), "content/cases", caseCode, lang, "case.json");
    
    // Verify the file exists
    try {
      await fs.access(casePath);
    } catch {
      return NextResponse.json(
        { error: `Case file not found: ${caseCode}/${lang}/case.json` },
        { status: 404 }
      );
    }
    
    // Write the updated content
    await fs.writeFile(casePath, JSON.stringify(content, null, 2), "utf-8");
    
    return NextResponse.json({ success: true, message: "Case updated" });
  } catch (error) {
    console.error("Failed to update case:", error);
    return NextResponse.json(
      { error: "Failed to update case" },
      { status: 500 }
    );
  }
}
