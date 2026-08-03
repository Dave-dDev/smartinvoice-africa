/**
 * SmartInvoice Africa — Paystack Inline Checkout
 *
 * Loads PaystackPop and opens the secure inline payment popup for an invoice.
 * Prefers server-side initialization via the `paystack-init` Supabase Edge
 * Function (returns an access_code), and falls back to fully client-side
 * initialization if the function isn't deployed yet.
 */

let scriptPromise = null;

/**
 * Lazily load the PaystackPop inline script once.
 * @returns {Promise<void>}
 */
function loadPaystackScript() {
  if (window.PaystackPop) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Paystack. Check your connection."));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Initialize a transaction server-side (edge function) to get an access code.
 * @param {{ invoiceNumber: string, email: string, amount: number, currency: string }} params
 * @returns {Promise<string|null>} access_code or null if function is unavailable
 */
async function initializeServerSide({ invoiceNumber, email, amount, currency }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/paystack-init`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          email,
          amount,       // in whole currency units (e.g. NGN 25,000)
          currency,
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data?.access_code || null;
  } catch (err) {
    console.warn("paystack-init unavailable, using client-side init:", err.message);
    return null;
  }
}

/**
 * Open the Paystack inline checkout popup for a single invoice.
 *
 * @param {Object} opts
 * @param {string} opts.publicKey      Paystack public key (VITE_PAYSTACK_PUBLIC_KEY)
 * @param {string} opts.email          Customer email (required by Paystack)
 * @param {number} opts.amount         Amount in whole currency units (kobo × 100)
 * @param {string} opts.currency       NGN | KES | GHS | ZAR
 * @param {string} opts.reference      Unique transaction reference
 * @param {Object} opts.metadata       e.g. { invoice_number, customer_name }
 * @param {Function} opts.onSuccess    (transaction) => void
 * @param {Function} [opts.onClose]    () => void
 * @returns {Promise<void>}
 */
export async function payWithPaystack({
  publicKey,
  email,
  amount,
  currency = "NGN",
  reference,
  metadata = {},
  onSuccess,
  onClose,
}) {
  if (!publicKey) {
    throw new Error(
      "Paystack is not configured. Add VITE_PAYSTACK_PUBLIC_KEY to your .env file."
    );
  }
  if (!email) {
    throw new Error("A customer email is required to start a Paystack payment.");
  }

  await loadPaystackScript();

  const kobo = Math.round(amount * 100);
  if (kobo < 100) {
    throw new Error("Minimum payment amount is 1 currency unit.");
  }

  // Prefer an access_code from the edge function; otherwise initialize client-side.
  const accessCode = await initializeServerSide({
    invoiceNumber: metadata.invoice_number,
    email,
    amount,
    currency,
  });

  const popup = window.PaystackPop.setup({
    key: publicKey,
    email,
    amount: kobo,
    currency,
    ref: reference,
    metadata,
    ...(accessCode ? { access_code: accessCode } : {}),
    callback: (transaction) => onSuccess(transaction),
    onClose: () => onClose && onClose(),
  });

  popup.openIframe();
}
