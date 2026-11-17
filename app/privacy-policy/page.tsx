import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Find Your Homestay uses and protects account, booking, and review information.',
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="This policy explains what information is used when you browse, book, host, or leave a review through Find Your Homestay."
      sections={[
        {
          title: 'Information we collect',
          content: (
            <>
              <p>
                When you create an account, we use details such as your name and email address, plus any
                optional profile or contact information you provide. A booking may include your travel
                dates, guest and room counts, and the traveler details needed to manage the stay.
              </p>
              <p>
                If you host a property, we use the listing information, location, photos, amenities, and
                room and pricing details you submit. We also store reviews and host replies posted through
                the service.
              </p>
            </>
          ),
        },
        {
          title: 'How we use information',
          content: (
            <p>
              We use information to provide accounts, display listings, send and manage booking requests,
              support payments, operate reviews, and maintain the service. If you opt in to WhatsApp
              booking updates, the phone number and booking details needed for those messages are used to
              send the updates.
            </p>
          ),
        },
        {
          title: 'When information is shared',
          content: (
            <p>
              Booking details are shared with the relevant host so they can handle your stay. Payment
              information is processed by the payment provider shown during checkout; the platform stores
              payment status and transaction references to manage your booking. Information may also be
              shared when needed to operate the service, comply with applicable requirements, or address
              misuse and safety concerns. Questions sent through the support assistant are processed by
              Google&apos;s Gemini API to generate replies. The app does not save chat transcripts and disables
              interaction storage for those requests; do not enter passwords, OTPs, payment details, or
              other sensitive information in the assistant.
            </p>
          ),
        },
        {
          title: 'Reviews and public listing information',
          content: (
            <p>
              Reviews submitted for stays may be shown publicly with your display name and the associated
              property. Property listing details and photos submitted by hosts are displayed to help
              travelers choose a stay. Do not include sensitive personal information in public reviews or
              listings.
            </p>
          ),
        },
        {
          title: 'Your choices and account information',
          content: (
            <p>
              You can review or update available profile details through your account. You can choose
              whether to opt in to WhatsApp booking updates where that option is provided. Booking and
              transaction records may be retained as needed to operate and support the service.
            </p>
          ),
        },
        {
          title: 'Policy updates',
          content: (
            <p>
              We may update this policy as the service changes. The date at the top of this page indicates
              when it was last revised.
            </p>
          ),
        },
      ]}
    />
  );
}
