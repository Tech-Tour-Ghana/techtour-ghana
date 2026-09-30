import { escapeHtml as h } from "./escape.ts";

const wrap = (body: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.5">${body}<p style="color:#666;font-size:13px;margin-top:32px">TechTour Ghana</p></div>`;

export const newsletterWelcome = () => ({
  subject: "Welcome to TechTour Ghana",
  html: wrap(`<h2>Thanks for subscribing</h2><p>You will now hear from us about new tours, study opportunities and tech innovation in Ghana.</p>`),
});

export const contactAck = (name: string) => ({
  subject: "We received your message",
  html: wrap(`<h2>Hi ${h(name)},</h2><p>Thanks for contacting TechTour Ghana. Our team has your message and will reply shortly.</p>`),
});

export const contactNotify = (m: { name: string; email: string; phone: string; subject: string; message: string }) => ({
  subject: `New contact message: ${m.subject}`,
  html: wrap(
    `<p><b>From:</b> ${h(m.name)} (${h(m.email)}${m.phone ? `, ${h(m.phone)}` : ""})</p><p><b>Subject:</b> ${h(m.subject)}</p><p style="white-space:pre-wrap">${h(m.message)}</p>`,
  ),
});

export const orderConfirmation = (o: { name: string; reference: string; amount: number; currency: string }) => ({
  subject: `Order confirmed: ${o.reference}`,
  html: wrap(
    `<h2>Thank you, ${h(o.name)}</h2><p>Your payment was received.</p><p><b>Reference:</b> ${h(o.reference)}<br><b>Total:</b> ${h(o.currency)} ${o.amount.toFixed(2)}</p><p>You can view your orders in your account.</p>`,
  ),
});
