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

export const studyApplicationAck = (a: { name: string; country: string }) => ({
  subject: `We received your application for ${a.country}`,
  html: wrap(
    `<h2>Hi ${h(a.name)},</h2><p>Thanks for applying to study in ${h(a.country)} with TechTour Ghana. Our study abroad team will review your application and contact you. You can follow its status under Study in your account.</p>`,
  ),
});

export const studyApplicationNotify = (a: { name: string; email: string; phone: string; country: string; field: string; level: string; message: string }) => ({
  subject: `New study application: ${a.name}, ${a.country}`,
  html: wrap(
    `<p><b>Applicant:</b> ${h(a.name)} (${h(a.email)}, ${h(a.phone)})</p><p><b>Destination:</b> ${h(a.country)}<br><b>Level:</b> ${h(a.level)}<br><b>Field:</b> ${h(a.field || "-")}</p>${a.message ? `<p style="white-space:pre-wrap">${h(a.message)}</p>` : ""}<p>Review it in the admin under Study Applications.</p>`,
  ),
});

export const supportTicketCreated = (t: { name: string; number: string; subject: string; url: string }) => ({
  subject: `We received your request ${t.number}`,
  html: wrap(
    `<h2>Hi ${h(t.name)},</h2><p>Thanks for contacting TechTour Ghana support. Your ticket <b>${h(t.number)}</b> (${h(t.subject)}) is open and our team will reply as soon as they can.</p><p><a href="${h(t.url)}">View your ticket</a></p>`,
  ),
});

export const supportReply = (t: { name: string; number: string; subject: string; snippet: string; url: string }) => ({
  subject: `New reply on ${t.number}: ${t.subject}`,
  html: wrap(
    `<h2>Hi ${h(t.name)},</h2><p>Our team replied to your ticket <b>${h(t.number)}</b>.</p><blockquote style="border-left:3px solid #ccc;margin:12px 0;padding-left:12px;white-space:pre-wrap">${h(t.snippet)}</blockquote><p><a href="${h(t.url)}">Open the conversation</a> to reply.</p>`,
  ),
});
