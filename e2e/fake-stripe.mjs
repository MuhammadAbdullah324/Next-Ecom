// A tiny stand-in for the parts of the Stripe API this app uses, for end-to-end tests
// without a Stripe account. It hosts a fake payment page and sends signed webhooks.
//   STRIPE_WEBHOOK_SECRET=whsec_test APP_URL=http://localhost:3000 node e2e/fake-stripe.mjs
import http from "node:http";
import Stripe from "stripe";

const PORT = Number(process.env.FAKE_STRIPE_PORT ?? 12111);
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_test";
const stripe = new Stripe("sk_test_fake");
const sessions = new Map();
let seq = 0;

function parseForm(body) {
  const out = {};
  for (const [key, value] of new URLSearchParams(body)) {
    const path = key.replace(/\]/g, "").split("[");
    let node = out;
    path.forEach((part, i) => {
      if (i === path.length - 1) node[part] = value;
      else node = node[part] ??= {};
    });
  }
  return out;
}

async function sendWebhook(type, session) {
  const payload = JSON.stringify({ id: `evt_${++seq}_${Date.now()}`, object: "event", type, data: { object: session } });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
  const res = await fetch(`${APP_URL}/api/stripe/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": header },
    body: payload,
  });
  console.log(`webhook ${type} -> ${res.status}`);
}

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

http
  .createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const parts = url.pathname.split("/").filter(Boolean);

    if (req.method === "POST" && url.pathname === "/v1/checkout/sessions") {
      const p = parseForm(body);
      const items = Object.values(p.line_items ?? {});
      const amount = items.reduce((s, i) => s + Number(i.price_data.unit_amount) * Number(i.quantity ?? 1), 0);
      const id = `cs_test_${++seq}${Date.now()}`;
      const session = {
        id, object: "checkout.session", status: "open", payment_status: "unpaid",
        amount_total: amount + Number(process.env.FAKE_STRIPE_AMOUNT_DELTA ?? 0),
        currency: items[0]?.price_data.currency ?? "usd",
        client_reference_id: p.client_reference_id, metadata: p.metadata ?? {}, customer_email: p.customer_email,
        payment_intent: null, success_url: p.success_url, cancel_url: p.cancel_url,
        url: `http://127.0.0.1:${PORT}/pay/${id}`,
      };
      sessions.set(id, session);
      return json(res, 200, session);
    }
    if (parts[0] === "v1" && parts[1] === "checkout" && parts[2] === "sessions" && parts[3]) {
      const session = sessions.get(parts[3]);
      if (!session) return json(res, 404, { error: { type: "invalid_request_error", message: "No such session" } });
      if (req.method === "POST" && parts[4] === "expire") {
        if (session.status !== "open") return json(res, 400, { error: { type: "invalid_request_error", message: "Not open" } });
        session.status = "expired";
        await sendWebhook("checkout.session.expired", session);
      }
      return json(res, 200, session);
    }
    if (req.method === "POST" && url.pathname === "/v1/refunds") {
      console.log("refund", body);
      return json(res, 200, { id: `re_${++seq}`, object: "refund", status: "succeeded" });
    }

    // Fake hosted payment page.
    if (parts[0] === "pay" && parts[1]) {
      const session = sessions.get(parts[1]);
      if (!session) { res.writeHead(404); return res.end("no session"); }
      const outcome = url.searchParams.get("outcome");
      if (!outcome) {
        res.writeHead(200, { "content-type": "text/html" });
        return res.end(`<!doctype html><title>Fake Stripe</title><h1>Pay ${(session.amount_total / 100).toFixed(2)} ${session.currency}</h1>
          <a href="?outcome=paid">Pay now</a> <a href="?outcome=failed">Fail payment</a> <a href="${session.cancel_url}">Back to store</a>`);
      }
      session.status = "complete";
      if (outcome === "paid") {
        session.payment_status = "paid";
        session.payment_intent = `pi_test_${++seq}_${Date.now()}`;
        if (!process.env.FAKE_STRIPE_SKIP_WEBHOOK) await sendWebhook("checkout.session.completed", session);
      } else {
        await sendWebhook("checkout.session.async_payment_failed", session);
      }
      res.writeHead(303, { location: session.success_url.replace("{CHECKOUT_SESSION_ID}", session.id) });
      return res.end();
    }
    res.writeHead(404);
    res.end();
  })
  .listen(PORT, () => console.log(`fake stripe on ${PORT}`));
