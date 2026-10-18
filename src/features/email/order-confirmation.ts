import { formatMoney } from "@/lib/money";
import type { Order } from "@/features/orders/types";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function orderConfirmationEmail(order: Order, orderUrl: string) {
  const money = (n: number) => formatMoney(n, order.currency);
  const a = order.shipping_address;
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.product_name)}${i.variant_name !== "Default" ? ` <span style="color:#6b7280">(${esc(i.variant_name)})</span>` : ""} × ${i.quantity}</td><td style="padding:6px 0;text-align:right">${money(i.line_total)}</td></tr>`,
    )
    .join("");
  const totals = [
    ["Subtotal", order.subtotal],
    [order.shipping_method_name, order.shipping_amount],
    ["Tax", order.tax_amount],
  ]
    .map(([label, value]) => `<tr><td style="color:#6b7280">${esc(String(label))}</td><td style="text-align:right">${money(Number(value))}</td></tr>`)
    .join("");

  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#111827;max-width:560px;margin:auto;padding:24px">
<h1 style="font-size:22px">Thanks for your order!</h1>
<p>We've received your payment for order <strong>${esc(order.order_number)}</strong>. We'll email you again when it ships.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>
<table style="width:100%;border-top:1px solid #e5e7eb;padding-top:8px">${totals}
<tr><td style="font-weight:600;padding-top:6px">Total</td><td style="text-align:right;font-weight:600;padding-top:6px">${money(order.total_amount)}</td></tr></table>
<h2 style="font-size:16px;margin-top:24px">Delivering to</h2>
<p style="line-height:1.5">${esc(a.full_name)}<br>${esc(a.address_line_1)}${a.address_line_2 ? `<br>${esc(a.address_line_2)}` : ""}<br>${esc(a.city)}${a.state ? `, ${esc(a.state)}` : ""} ${esc(a.postal_code)}<br>${esc(a.country)}</p>
<p><a href="${esc(orderUrl)}" style="display:inline-block;background:#111827;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">View your order</a></p>
</body></html>`;

  const text = `Thanks for your order ${order.order_number}.\nTotal: ${money(order.total_amount)}\nView it at ${orderUrl}`;
  return { subject: `Order ${order.order_number} confirmed`, html, text };
}
