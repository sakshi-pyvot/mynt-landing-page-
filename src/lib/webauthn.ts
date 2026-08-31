/**
 * WebAuthn (passkey) LOGIN — the byte plumbing between the JSON a server can
 * send and the ArrayBuffers `navigator.credentials.get()` insists on.
 *
 * Every field that is bytes on the wire travels as **base64url** (RFC 4648 §5:
 * `-`/`_` instead of `+`/`/`, padding stripped). Plain base64 is NOT
 * interchangeable — feeding an unconverted string to atob() silently yields the
 * wrong bytes for ~1 in 20 challenges, and the ceremony then fails with nothing
 * in the UI to explain it. That is why the encode/decode pair lives here with
 * its own tests rather than inline in a component.
 *
 * Decoded on the way in:  challenge, allowCredentials[].id
 * Encoded on the way out: rawId, response.clientDataJSON, response.authenticatorData,
 *                         response.signature, response.userHandle
 *
 * This is the LOGIN half only (`navigator.credentials.get`). Passkey
 * REGISTRATION (`navigator.credentials.create`, enrolling a new passkey from
 * Settings) is a dashboard-only concern, done post-onboarding, and is
 * deliberately not ported here — see f7-frontend/src/lib/webauthn.ts for that
 * half, which this file is ported from.
 */

/* -------------------------------------------------------------------------- */
/* base64url                                                                   */
/* -------------------------------------------------------------------------- */

/** base64url string → bytes. Tolerates input that is already padded. */
export function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  // atob() rejects a length that isn't a multiple of 4, and base64url drops the
  // padding — so put it back before decoding.
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** base64url string → ArrayBuffer, which is what the WebAuthn options want. */
export function base64UrlToBuffer(value: string): ArrayBuffer {
  return base64UrlToBytes(value).buffer as ArrayBuffer;
}

/** bytes → base64url string (no padding). */
export function bufferToBase64Url(source: ArrayBuffer | Uint8Array): string {
  const view = source instanceof Uint8Array ? source : new Uint8Array(source);
  let binary = '';
  // Chunked rather than String.fromCharCode(...view): a signed assertion can run
  // to a few KB and a spread that long blows the argument limit on some engines.
  for (let i = 0; i < view.length; i += 1) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Why the ceremony did not produce a credential.
 *
 * `cancelled` and `unsupported` are the two the user MUST be told about
 * verbatim: the browser dismisses its own sheet and returns, so without this
 * the button just goes quiet and the user assumes the app is broken.
 */
export type PasskeyFailure = 'unsupported' | 'cancelled' | 'duplicate' | 'failed';

export class PasskeyError extends Error {
  reason: PasskeyFailure;
  constructor(reason: PasskeyFailure, message: string) {
    super(message);
    this.name = 'PasskeyError';
    this.reason = reason;
  }
}

/** Read `.name`/`.message` structurally — see toPasskeyError. */
function errField(err: unknown, field: 'name' | 'message'): string {
  if (typeof err !== 'object' || err === null) return '';
  const value = (err as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : '';
}

/**
 * DOMException names the platform authenticator actually throws, in plain words.
 *
 * The name is read off the object rather than behind an `instanceof Error`
 * guard: a DOMException is only an Error by prototype chain, and in jsdom (and
 * across realms — an iframe, a WebView bridge) that check is false, which would
 * turn every cancellation into "something went wrong".
 */
function toPasskeyError(err: unknown): PasskeyError {
  if (err instanceof PasskeyError) return err;
  switch (errField(err, 'name')) {
    case 'NotAllowedError':
    case 'AbortError':
      return new PasskeyError(
        'cancelled',
        'Passkey sign-in was cancelled (or timed out) — nothing was changed.',
      );
    case 'InvalidStateError':
      return new PasskeyError(
        'duplicate',
        'This device already holds a passkey for your account — use it to sign in, or try another device.',
      );
    case 'NotSupportedError':
      return new PasskeyError(
        'unsupported',
        "This device can't complete that kind of passkey sign-in. Try another device, or use your authenticator app instead.",
      );
    case 'SecurityError':
      return new PasskeyError(
        'failed',
        "This page isn't allowed to use a passkey here. Open the app from its usual web address and try again.",
      );
    default:
      return new PasskeyError(
        'failed',
        errField(err, 'message') || 'Your device could not complete passkey sign-in.',
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Authentication (login second factor)                                        */
/* -------------------------------------------------------------------------- */

/**
 * Whether this browser can USE an existing passkey.
 *
 * Signing in calls `.get`, so that is what is tested here — checking
 * `navigator.credentials.create` (the REGISTRATION entry point, not ported into
 * this file) would report the wrong capability at the login screen, where the
 * user has no way to recover.
 */
export function isPasskeyLoginSupported(): boolean {
  return (
    typeof navigator !== 'undefined'
    && typeof navigator.credentials?.get === 'function'
  );
}

/** `PublicKeyCredentialRequestOptions` as the backend sends it (base64url strings). */
export interface PasskeyRequestOptionsJSON {
  challenge: string;
  rpId?: string;
  timeout?: number;
  userVerification?: string;
  allowCredentials?: { id: string; type: string; transports?: string[] }[];
}

/** The `navigator.credentials.get()` result, in the shape the SPI parses. */
export interface PasskeyAssertionJSON {
  id: string;
  rawId: string;
  type: string;
  clientExtensionResults: Record<string, unknown>;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
}

function toRequestOptions(options: PasskeyRequestOptionsJSON): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64UrlToBuffer(options.challenge),
    userVerification: options.userVerification as UserVerificationRequirement | undefined,
    allowCredentials: options.allowCredentials?.map((c) => ({
      type: c.type as PublicKeyCredentialType,
      id: base64UrlToBuffer(c.id),
      ...(c.transports ? { transports: c.transports as AuthenticatorTransport[] } : {}),
    })),
  };
}

/**
 * Serialise the assertion. Duck-typed rather than behind an `instanceof
 * PublicKeyCredential` check: the optional `getClientExtensionResults` getter is
 * missing on older authenticators and in test doubles, and a hard call would
 * throw at the very end of a ceremony the user already completed.
 *
 * `userHandle` is omitted when absent rather than sent as null or "": the SPI
 * treats an empty string as "not supplied", but omitting it is unambiguous at
 * both ends.
 */
function serialiseAssertion(credential: PublicKeyCredential): PasskeyAssertionJSON {
  const response = credential.response as AuthenticatorAssertionResponse;
  const userHandle = response.userHandle ? bufferToBase64Url(response.userHandle) : undefined;
  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    clientExtensionResults:
      typeof credential.getClientExtensionResults === 'function'
        ? (credential.getClientExtensionResults() as Record<string, unknown>)
        : {},
    response: {
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      signature: bufferToBase64Url(response.signature),
      ...(userHandle ? { userHandle } : {}),
    },
  };
}

/**
 * Run the LOGIN ceremony for `options` and return the assertion to POST back as
 * `assertion` on /auth/login.
 *
 * Always throws a PasskeyError, never a bare DOMException — a cancelled prompt at the
 * login screen is the single most likely failure here, and "NotAllowedError" is not a
 * sentence anyone can act on.
 */
export async function getPasskeyAssertion(
  options: PasskeyRequestOptionsJSON,
): Promise<PasskeyAssertionJSON> {
  if (!isPasskeyLoginSupported()) {
    throw new PasskeyError(
      'unsupported',
      "This browser can't use passkeys. Sign in on a device where you set yours up.",
    );
  }
  let credential: Credential | null;
  try {
    credential = await navigator.credentials.get({ publicKey: toRequestOptions(options) });
  } catch (err) {
    throw toPasskeyError(err);
  }
  if (!credential) {
    throw new PasskeyError('cancelled', 'Passkey sign-in was cancelled.');
  }
  return serialiseAssertion(credential as PublicKeyCredential);
}
