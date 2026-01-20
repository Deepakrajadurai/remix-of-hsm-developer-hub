import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json();
    console.log("Webhook/Request received:", payload);

    // 1. Validate Payload (Must be INSERT on event_registrations OR direct call)
    // Check for 'record' (webhook) or direct payload
    const record = payload.record || payload;

    if (!record.email || !record.event_id) {
      throw new Error("Invalid record data: email and event_id required");
    }

    // 2. Fetch Event Details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', record.event_id)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    // 3. Generate QR Code Data & URL
    // Unique option for every event (ticket_code is unique per registration)
    const qrData = JSON.stringify({
      ticket_id: record.id,
      code: record.ticket_code,
      event: event.title,
      attendee: `${record.first_name} ${record.last_name}`
    });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    // Banner Image: Use event image or fallback
    const bannerImage = event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2000";

    // 4. Send Email via Resend using the Custom Template
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "HSM Developer Community <onboarding@resend.dev>", // Using Resend test domain - update to your verified domain in production
      to: [record.email],
      subject: `Ticket: ${event.title}`,
      html: `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body {
    margin:0;
    padding:0;
    background:#f1f3f6;
    font-family: Arial, Helvetica, sans-serif;
  }
  .wrapper {
    padding:24px 12px;
  }
  .container {
    max-width:640px;
    margin:0 auto;
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:10px;
    overflow:hidden;
  }
  .banner img {
    width:100%;
    height: 250px;
    object-fit: cover;
    display:block;
  }
  .content {
    padding:26px 28px;
    color:#1f2937;
  }
  h2 {
    color:#0b67ff;
    margin-top:0;
  }
  p {
    line-height:1.6;
    margin:10px 0;
    text-align:justify;
  }
  .qr {
    margin-top:20px;
    text-align:center;
  }
  .qr img {
    width:120px;
    height:120px;
    border:1px solid #ddd;
    padding:6px;
    background:#fff;
  }
  .footer {
    background:#f8fafc;
    padding:16px;
    text-align:center;
    font-size:13px;
    color:#6b7280;
  }
  .details-box {
    background: #f8fafc;
    padding: 15px;
    border-radius: 8px;
    margin: 20px 0;
    border-left: 4px solid #0b67ff;
    text-align: left;
  }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="banner">
        <img src="${bannerImage}" alt="HSM Developer Community">
      </div>
      <div class="content">
        <h2>Registration Confirmed</h2>
        <p>Dear ${record.first_name},</p>
        <p>
          You have successfully registered for the <strong>"${event.title}"</strong> event!
          We are excited to see you there.
        </p>
        <div class="details-box">
           <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${new Date(event.event_date).toLocaleString()}</p>
           <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${event.location}</p>
           <p style="margin: 5px 0;"><strong>🎟️ Attendees:</strong> ${record.attendees_count}</p>
           <p style="margin: 5px 0;"><strong>💰 Price:</strong> ${event.price}</p>
        </div>
        <p>
          Please keep this email safe. You will need to present the QR code below at the entrance for check-in.
        </p>
        <p>
          We look forward to an active and collaborative event.
        </p>
        <p>
          Thank you for your participation.
        </p>
        <p>
          Kind regards,<br>
          <strong>HSM Developer Community</strong>
        </p>
        <div class="qr">
          <img src="${qrUrl}" alt="Community QR Code">
          <p style="font-size: 11px; color:#888;">Code: ${record.ticket_code}</p>
        </div>
      </div>
      <div class="footer">
        Hochschule Schmalkalden – HSM Developer Community
      </div>
    </div>
  </div>
</body>
</html>`,
    });

    if (emailError) {
      console.error("Email Error:", emailError);
      throw emailError;
    }

    return new Response(JSON.stringify(emailData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
