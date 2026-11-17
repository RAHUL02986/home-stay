interface MetaWhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
  language: string;
}

export type WhatsAppDeliveryStatus =
  | 'sent'
  | 'not_opted_in'
  | 'not_configured'
  | 'missing_phone'
  | 'invalid_phone'
  | 'failed';

function getConfig(): MetaWhatsAppConfig | null {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = process.env.META_WHATSAPP_API_VERSION?.trim();
  const language = process.env.META_WHATSAPP_TEMPLATE_LANGUAGE?.trim();
  const guestTemplate = process.env.META_WHATSAPP_GUEST_BOOKING_TEMPLATE?.trim();
  const hostTemplate = process.env.META_WHATSAPP_HOST_BOOKING_TEMPLATE?.trim();

  if (
    !accessToken ||
    !phoneNumberId ||
    !/^\d+$/.test(phoneNumberId) ||
    !apiVersion ||
    !/^v\d+\.\d+$/.test(apiVersion) ||
    !language ||
    !guestTemplate ||
    !hostTemplate
  ) {
    return null;
  }

  return { accessToken, phoneNumberId, apiVersion, language };
}

export function isMetaWhatsAppConfigured() {
  return getConfig() !== null;
}

export function isWhatsAppPhoneNumber(phone: string) {
  const normalized = phone.replace(/[\s()-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  parameters,
}: {
  to: string;
  templateName: string;
  parameters: string[];
}) {
  const config = getConfig();
  if (!config) {
    throw new Error('Meta WhatsApp is not configured');
  }
  if (!isWhatsAppPhoneNumber(to)) {
    throw new Error('Recipient phone number must use international E.164 format');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(templateName)) {
    throw new Error('WhatsApp template name is invalid');
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/[\s()-]/g, ''),
        type: 'template',
        template: {
          name: templateName,
          language: { code: config.language },
          components: [{
            type: 'body',
            parameters: parameters.map((text) => ({ type: 'text', text })),
          }],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!response.ok) {
    const errorDetails = (await response.text()).slice(0, 1000);
    throw new Error(
      `Meta WhatsApp API returned HTTP ${response.status}: ${errorDetails || response.statusText}`
    );
  }
}
