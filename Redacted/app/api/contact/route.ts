import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

async function sendAdminNotification(name: string, email: string, subject: string) {
  // Send email notification to admin
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping email notification");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "noreply@redacted.game",
        to: "support@redacted.game",
        subject: `New contact message from ${name}`,
        html: `
          <h2>New Contact Message</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><a href="https://redacted.game/admin/messages?auth=redacted2026">View in Admin Panel</a></p>
        `,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send admin notification email:", await response.text());
    }
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message, locale = "en", userId } = body || {};

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      subject,
      message,
      locale,
      user_id: userId || null,
      status: "new",
    });

    if (error) throw error;

    // Send admin notification email (non-blocking)
    sendAdminNotification(name, email, subject).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit contact message:", error);
    return NextResponse.json(
      { error: "Failed to submit message" },
      { status: 500 }
    );
  }
}
