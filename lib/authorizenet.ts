import { z } from 'zod';

interface AuthorizeNetMessages {
  resultCode?: string;
  message?: Array<{ code?: string; text?: string }>;
}

interface AuthorizeNetTransactionResponse {
  responseCode?: string;
  transId?: string;
  authCode?: string;
  accountNumber?: string;
  accountType?: string;
  messages?: Array<{ code?: string; description?: string }>;
  errors?: Array<{ errorCode?: string; errorText?: string }>;
}

export interface AuthorizeNetTransactionResult {
  messages?: AuthorizeNetMessages;
  transactionResponse?: AuthorizeNetTransactionResponse;
}

const transactionResultSchema = z.object({
  messages: z.object({
    resultCode: z.string().optional(),
    message: z.array(z.object({ code: z.string().optional(), text: z.string().optional() })).optional(),
  }).optional(),
  transactionResponse: z.object({
    responseCode: z.string().optional(),
    transId: z.string().optional(),
    authCode: z.string().optional(),
    accountNumber: z.string().optional(),
    accountType: z.string().optional(),
    messages: z.array(z.object({ code: z.string().optional(), description: z.string().optional() })).optional(),
    errors: z.array(z.object({ errorCode: z.string().optional(), errorText: z.string().optional() })).optional(),
  }).optional(),
});

export function getAuthorizeNetConfig() {
  const apiLoginId = process.env.AUTHNET_API_LOGIN_ID;
  const transactionKey = process.env.AUTHNET_TRANSACTION_KEY;
  const clientKey = process.env.NEXT_PUBLIC_AUTHNET_CLIENT_KEY;
  const signatureKey = process.env.AUTHNET_SIGNATURE_KEY;
  const currency = process.env.AUTHNET_CURRENCY;

  if (
    !apiLoginId ||
    !transactionKey ||
    !clientKey ||
    !signatureKey ||
    !/^[a-f\d]{128}$/i.test(signatureKey) ||
    !currency
  ) {
    return null;
  }

  if (process.env.AUTHNET_ENV !== 'sandbox' || currency !== 'INR') {
    return null;
  }

  return {
    apiLoginId,
    transactionKey,
    clientKey,
    signatureKey,
    currency,
  };
}

export async function createAuthorizeNetCharge(input: {
  apiLoginId: string;
  transactionKey: string;
  amount: number;
  invoiceNumber: string;
  referenceId: string;
  email: string;
  opaqueData: { dataDescriptor: string; dataValue: string };
}): Promise<AuthorizeNetTransactionResult> {
  const response = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      createTransactionRequest: {
        merchantAuthentication: {
          name: input.apiLoginId,
          transactionKey: input.transactionKey,
        },
        refId: input.referenceId,
        transactionRequest: {
          transactionType: 'authCaptureTransaction',
          amount: input.amount.toFixed(2),
          payment: {
            opaqueData: input.opaqueData,
          },
          order: {
            invoiceNumber: input.invoiceNumber,
          },
          customer: {
            email: input.email,
          },
        },
      },
    }),
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Authorize.Net returned HTTP ${response.status}`);
  }

  const result: unknown = await response.json();
  return transactionResultSchema.parse(result);
}

export function isApprovedAuthorizeNetResult(result: AuthorizeNetTransactionResult) {
  return (
    result.messages?.resultCode === 'Ok' &&
    result.transactionResponse?.responseCode === '1' &&
    Boolean(result.transactionResponse.transId)
  );
}

export function getAuthorizeNetFailureDetails(result: AuthorizeNetTransactionResult) {
  const transaction = result.transactionResponse;
  const error = transaction?.errors?.[0];
  const transactionMessage = transaction?.messages?.[0];
  const apiMessage = result.messages?.message?.[0];
  const reasonCode = error?.errorCode || transactionMessage?.code || apiMessage?.code || '';
  const reason = error?.errorText || transactionMessage?.description || apiMessage?.text || '';

  return {
    responseCode: transaction?.responseCode || '',
    reasonCode: reasonCode.slice(0, 40),
    reason: reason.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 240),
  };
}
