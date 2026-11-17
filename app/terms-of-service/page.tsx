import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms for using Find Your Homestay to discover, list, and book stays.',
  alternates: { canonical: '/terms-of-service' },
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Terms of Service"
      summary="These terms describe the basic rules for using Find Your Homestay as a traveler or property host."
      sections={[
        {
          title: 'Using the platform',
          content: (
            <p>
              Find Your Homestay provides tools to discover stays, submit booking requests, and manage
              property listings. You must provide accurate account and booking information, keep your
              sign-in credentials secure, and use the service lawfully.
            </p>
          ),
        },
        {
          title: 'Bookings and property information',
          content: (
            <p>
              A booking request is subject to host confirmation and availability. Review the property
              details, dates, room selection, guest capacity, and total shown before submitting a request
              or payment. Hosts are responsible for keeping their listing information accurate; the
              platform does not guarantee that every listing detail is error-free or that a stay will
              remain available until confirmed.
            </p>
          ),
        },
        {
          title: 'Payments',
          content: (
            <p>
              Where online payment is offered, the payment provider processes the transaction. Follow the
              payment status shown in your account and do not retry an unresolved payment attempt unless
              instructed. Payment processing may also be subject to the provider’s terms.
            </p>
          ),
        },
        {
          title: 'Reviews and acceptable use',
          content: (
            <p>
              Reviews should reflect a genuine stay and be respectful, relevant, and lawful. Do not
              impersonate another person, submit misleading information, interfere with the service, or
              use the platform to harass others. Reviews may be moderated and may be removed if they
              violate these rules.
            </p>
          ),
        },
        {
          title: 'Hosts and guests',
          content: (
            <p>
              Guests are responsible for following the property’s rules and providing accurate details.
              Hosts are responsible for the property and services they offer, responding to booking
              requests, and honoring confirmed stays and the terms shown on their listings.
            </p>
          ),
        },
        {
          title: 'Service availability and changes',
          content: (
            <p>
              Features may change over time, and access may be limited to maintain or protect the service.
              These terms may also be revised; continued use after a revision means you acknowledge the
              updated terms.
            </p>
          ),
        },
      ]}
    />
  );
}
