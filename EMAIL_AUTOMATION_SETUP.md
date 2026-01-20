# Email Automation Setup Guide

To enable automated ticket emails with QR codes, you need to deploy the Supabase Edge Function and set up a Database Webhook.

## 1. Prerequisites
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed.
- A [Resend](https://resend.com) account (Get an API Key).

## 2. Deploy the Edge Function
Run the following commands in your terminal:

```bash
# Login to Supabase
npx supabase login

# Deploy the function
npx supabase functions deploy send-ticket
```

## 3. Set Environment Variables
Set your Resend API Key so the function can send emails.

```bash
npx supabase secrets set RESEND_API_KEY=re_123456789
```

## 4. Create Database Webhook
This triggers the function automatically whenever a new registration is created.

1. Go to your **Supabase Dashboard** > **Database** > **Webhooks**.
2. Click **Create Webhook**.
3. **Name**: `send-ticket-email`
4. **Table**: `event_registrations`
5. **Events**: `INSERT`
6. **Type**: `HTTP Request`
7. **HTTP Request method**: `POST`
8. **URL**: `https://<your-project-ref>.supabase.co/functions/v1/send-ticket`
   - *Replace `<your-project-ref>` with your actual Supabase Reference ID.*
9. **HTTP Headers**:
   - `Authorization`: `Bearer <ANON_KEY>` (or Service Key if you enabled Enforce Auth) -> *Usually Service Key is safer/better for internal webhooks.*
   - If enforcing JWT, add `Authorization: Bearer <SERVICE_ROLE_KEY>`.

## 5. Testing
1. Go to the **Events** page in the app.
2. Register for an event.
3. Check your email (Wait 1-2 minutes).
4. You should receive a formatted email with a QR code!
