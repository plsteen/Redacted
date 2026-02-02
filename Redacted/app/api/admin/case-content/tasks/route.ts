import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content", "cases");

// GET - Read tasks.json for a case
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
    const tasksPath = path.join(CONTENT_DIR, caseCode, lang, "tasks.json");
    const content = await fs.readFile(tasksPath, "utf-8");
    const tasks = JSON.parse(content);

    return NextResponse.json({ tasks });
  } catch (error) {
    // Check if it's a file not found error
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ tasks: [] });
    }
    console.error("Failed to read tasks:", error);
    return NextResponse.json({ error: "Failed to read tasks" }, { status: 500 });
  }
}

// PATCH - Update tasks.json for a case
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { caseCode, lang, tasks } = body;

    if (!caseCode || !lang || !tasks) {
      return NextResponse.json(
        { error: "Missing caseCode, lang, or tasks" },
        { status: 400 }
      );
    }

    const tasksPath = path.join(CONTENT_DIR, caseCode, lang, "tasks.json");

    // Write the updated tasks
    await fs.writeFile(tasksPath, JSON.stringify(tasks, null, 2), "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save tasks:", error);
    return NextResponse.json({ error: "Failed to save tasks" }, { status: 500 });
  }
}
