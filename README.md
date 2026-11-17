This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin property review

Host-submitted properties remain pending until an administrator approves them. Only approved listings appear in public property search and detail pages.
Administrators can also approve or reject guest reviews. Guests can submit one review for a confirmed booking after checkout; only approved reviews appear in the homepage carousel.

To create the first admin account, add these server-only variables to `.env.local` (use a unique, random bootstrap secret of at least 32 characters and an admin password of at least 12 characters):

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-unique-long-password
ADMIN_NAME=Site Administrator
ADMIN_BOOTSTRAP_SECRET=replace-with-a-unique-random-secret-at-least-32-characters
```

Restart the development server, then make the one-time bootstrap request with the secret in the request header:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/admin/bootstrap -Headers @{ "x-admin-bootstrap-secret" = "YOUR_ADMIN_BOOTSTRAP_SECRET" }
```

The bootstrap endpoint refuses to create another admin once one exists. Keep these variables private and out of source control. Sign in at `/auth/login` with the configured admin email and password, then review submissions at `/admin/dashboard`.

## Authorize.Net Sandbox payments

The guest payment flow is Sandbox-only and is available for host-confirmed bookings. It uses Accept.js to tokenize card data in the browser; card numbers and security codes are not sent to this app's server or stored in MongoDB. The server calculates the amount from the booking record.

1. Rotate the Sandbox Transaction Key and Signature Key that were shared in chat. Do not reuse the exposed keys.
2. In the Authorize.Net Sandbox Merchant Interface, obtain the API Login ID, a new Transaction Key, a Signature Key, and a Client Key. The API Login ID is not the account email.
3. Copy `.env.example` to `.env.local` and add the credentials there. Keep `AUTHNET_ENV=sandbox`; never use production credentials with this implementation.
4. Confirm the Sandbox merchant account supports INR before enabling payment. This application prices bookings in INR and will not enable checkout with another currency. If your account does not support INR, resolve currency/account configuration before accepting payments.
5. Restart the Next.js server. A guest can pay from the dashboard after a host confirms a booking.
6. To receive payment lifecycle notifications, configure an Authorize.Net webhook for `https://YOUR_HOST/api/payments/webhook`, subscribe to `net.authorize.payment.authcapture.created`, and use the same Signature Key in `AUTHNET_SIGNATURE_KEY`.

The API Login ID and Client Key are supplied to the browser for Accept.js; transaction and signature keys must remain server-only. Never commit `.env.local` or paste secret keys into source control. Test approved and declined Sandbox payments before deployment. This integration does not implement initiating refunds or a live/production gateway.

## WhatsApp booking-request notifications

The app can send WhatsApp Cloud API template messages to the guest and host immediately after a booking request is created. A request is not a host-confirmed booking, and payment has not been collected at this point. Guests must opt in on the booking form; hosts must save a WhatsApp-capable number and opt in under **Edit profile**.

1. Set up a Meta app with the WhatsApp product and a WhatsApp Business phone number. Use the phone number ID and a server-side access token from Meta.
2. Create and get approval for two WhatsApp message templates in the same language configured below. Set the approved template names in `.env.local`. Initiated business messages use approved templates.
3. Configure the guest template body with these positional variables in this exact order:
   `Hi {{1}}, your booking request for {{2}} ({{3}}) from {{4}} to {{5}} for {{6}} room(s) / {{7}} guest(s) is received. It is awaiting host confirmation; no payment has been collected. Reference: {{8}}.`
4. Configure the host template body with these positional variables in this exact order:
   `Hi {{1}}, new booking request from {{2}} at {{3}}. Room: {{4}}. Rooms: {{5}}; guests: {{6}}. Check-in: {{7}}; check-out: {{8}}. Awaiting your confirmation; payment has not been collected. Reference: {{9}}.`
5. Add the values to `.env.local` (never commit or expose the access token) and restart the server:

   ```env
   META_WHATSAPP_ACCESS_TOKEN=your_server_side_access_token
   META_WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
   META_WHATSAPP_API_VERSION=your_supported_graph_api_version
   META_WHATSAPP_TEMPLATE_LANGUAGE=en_US
   META_WHATSAPP_GUEST_BOOKING_TEMPLATE=approved_guest_template_name
   META_WHATSAPP_HOST_BOOKING_TEMPLATE=approved_host_template_name
   ```

6. Ask hosts to save their phone in international E.164 format (for example `+14155552671`) and enable WhatsApp booking notifications in **Edit profile**. Guests who opt in must enter their number in the same format.
7. Test with Meta's allowed test recipients first. The booking request is still created if WhatsApp is not configured or a send fails; the guest dashboard reports the notification outcome, and the server logs send failures.

## Gemini support assistant

The floating support assistant uses Google's Gemini API and answers questions about this site. Create a Gemini API key in Google AI Studio, restrict it to the Gemini API, and add it as a server-only variable in `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Add the same variable to your hosting provider's server environment and restart or redeploy. Do not use a `NEXT_PUBLIC_` prefix or commit the key. Chat requests are limited to 8 per client per minute, and the app does not save chat transcripts; requests are sent to Gemini with interaction storage disabled. Users are warned not to submit passwords, OTPs, payment details, or other sensitive information. Configure a Gemini API quota as an additional spending safeguard.

## Search engine optimization

The site publishes page metadata, social-sharing cards, `robots.txt`, and a sitemap at `/sitemap.xml`. The sitemap includes approved property listings and the Dharamshala destination pages; unpublished listings and account/admin routes are excluded.

Before deploying, set `SITE_URL` to the canonical public origin (for example, `https://your-real-domain.com`, with no path or trailing route). Vercel deployments can use `VERCEL_PROJECT_PRODUCTION_URL` as a fallback, but setting `SITE_URL` is recommended so canonical links and the sitemap use your actual custom domain. Do not use the localhost URL in production.

After deployment, verify `https://your-real-domain.com/robots.txt` and `https://your-real-domain.com/sitemap.xml`, create a Google Search Console property for the domain, complete ownership verification, and submit the sitemap. Search indexing and ranking are controlled by Google and are not immediate or guaranteed. Keep listing descriptions, prices, locations, and photos accurate and up to date.

## Host listing photos

Hosts can add and remove listing photos from **Host Dashboard → Manage**. Each room type has its own **Room photos** section, so room images can be uploaded separately and are displayed with that room on the guest-facing property page. Save a newly added room type before uploading its photos. Each property and each room type supports up to 10 JPEG, PNG, or WebP images, up to 5 MB each. Image uploads are stored in Cloudinary; configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `.env.local` and restart the app. Removing a Cloudinary-hosted image also attempts to delete it from storage.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
