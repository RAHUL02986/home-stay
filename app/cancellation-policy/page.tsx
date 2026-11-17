import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Cancellation Policy',
  description: 'Understand booking cancellation and payment support on Find Your Homestay.',
  alternates: { canonical: '/cancellation-policy' },
};

export default function CancellationPolicyPage() {
  return (
    <LegalPage
      title="Cancellation Policy"
      summary="Cancellation options depend on your booking status and payment status. Check the property listing and your booking details before making plans."
      sections={[
        {
          title: 'Before you book',
          content: (
            <p>
              Review the property’s cancellation terms and booking details before submitting a request.
              Cancellation terms may vary by property. If a listing does not clearly explain the terms,
              check with the host before booking.
            </p>
          ),
        },
        {
          title: 'Unpaid bookings',
          content: (
            <p>
              A guest can cancel a pending or confirmed booking before the check-in date through the guest
              dashboard when there is no payment that needs to be resolved. The booking will be marked
              cancelled and its reserved room inventory will be released.
            </p>
          ),
        },
        {
          title: 'Bookings with a payment',
          content: (
            <p>
              If a payment is pending, successful, or partially refunded, self-service cancellation is
              unavailable. Contact the platform support team to have the booking and payment status
              reviewed. Do not assume a refund is automatic; refund eligibility and timing must be
              confirmed for the individual booking.
            </p>
          ),
        },
        {
          title: 'After check-in or a completed stay',
          content: (
            <p>
              The guest dashboard does not allow cancellation on or after the check-in date. If an
              unexpected situation affects your stay, contact the host and platform support as soon as
              possible.
            </p>
          ),
        },
        {
          title: 'Host-rejected requests',
          content: (
            <p>
              A host may reject a pending booking request. The request is then marked cancelled. If you
              have a payment question related to that booking, contact platform support before making
              another payment attempt.
            </p>
          ),
        },
      ]}
    />
  );
}
