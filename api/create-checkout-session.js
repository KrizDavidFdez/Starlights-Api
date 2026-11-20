import Stripe from "stripe";

const PLANS = {
  starter: { name: "YouTube API Starter", description: "100 Mbps · audio y video hasta 480p · máximo 300 MB", amount: 400 },
  pro: { name: "YouTube API Pro", description: "300 Mbps · audio y video · máximo 1 GB", amount: 600 },
  ultra: { name: "YouTube API Ultra", description: "500 Mbps · audio y video · máximo 2 GB", amount: 800 },
};

const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }

  const origin = req.headers.origin;
  const requestHosts = [req.headers.host, req.headers["x-forwarded-host"]]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .flatMap((value) => (typeof value === "string" ? value.split(",") : []))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  try {
    const parsedOrigin = new URL(origin);
    if (!['http:', 'https:'].includes(parsedOrigin.protocol) || !requestHosts.includes(parsedOrigin.host.toLowerCase())) {
      return res.status(403).json({ error: "Origen de solicitud no válido." });
    }
  } catch {
    return res.status(403).json({ error: "Origen de solicitud no válido." });
  }

  const { planId, requestId } = req.body || {};
  const plan = PLANS[planId];
  if (!plan || typeof requestId !== "string" || !REQUEST_ID_PATTERN.test(requestId)) {
    return res.status(400).json({ error: "Plan o identificador de solicitud no válido." });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: "Stripe aún no está listo para procesar pagos. Inténtalo más tarde." });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        ui_mode: "hosted_page",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: plan.amount,
              recurring: { interval: "month" },
              product_data: { name: plan.name, description: plan.description },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/?checkout=success`,
        cancel_url: `${origin}/?checkout=cancelled`,
      },
      { idempotencyKey: `youtube-api-${requestId}` },
    );

    return res.status(200).json({ url: session.url });
  } catch {
    return res.status(502).json({ error: "No se pudo crear el checkout. Inténtalo de nuevo." });
  }
}
