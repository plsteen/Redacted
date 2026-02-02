import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content", "cases");

// GET - Read evidence.json for a case
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");
  const caseCode = searchParams.get("caseCode");
  const lang = searchParams.get("lang") || "en";

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!caseCode) {
    return NextResponse.json({ error: "Missing caseCode" }, { status: 400 });
  }

  try {
    const evidencePath = path.join(CONTENT_DIR, caseCode, lang, "evidence.json");
    const content = await fs.readFile(evidencePath, "utf-8");
    const evidence = JSON.parse(content);

    return NextResponse.json({ evidence });
  } catch (error) {
    // Check if it's a file not found error
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ evidence: [] });
    }
    console.error("Failed to read evidence:", error);
    return NextResponse.json({ error: "Failed to read evidence" }, { status: 500 });
  }
}

// PATCH - Update evidence.json for a case
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { caseCode, lang, evidence } = body;

    if (!caseCode || !lang || !evidence) {
      return NextResponse.json(
        { error: "Missing caseCode, lang, or evidence" },
        { status: 400 }
      );
    }

    const evidencePath = path.join(CONTENT_DIR, caseCode, lang, "evidence.json");

    // Write the updated evidence
    await fs.writeFile(evidencePath, JSON.stringify(evidence, null, 2), "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save evidence:", error);
    return NextResponse.json({ error: "Failed to save evidence" }, { status: 500 });
  }
}
