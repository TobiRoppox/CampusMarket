/**
 * emailService.js — Transactional email notifications for Campus Market 2.0.
 *
 * Supports two transport modes (set EMAIL_PROVIDER in .env):
 *   "resend"    — Resend.com API (recommended for production)
 *   "smtp"      — Nodemailer SMTP (fallback / local dev with Mailhog)
 *   "console"   — prints emails to stdout (default when no provider is configured)
 *
 * Environment variables:
 *   EMAIL_PROVIDER    resend | smtp | console
 *   EMAIL_FROM        noreply@yourdomain.com
 *   RESEND_API_KEY    (Resend only)
 *   SMTP_HOST         (SMTP only)
 *   SMTP_PORT         (SMTP only, default 587)
 *   SMTP_USER         (SMTP only)
 *   SMTP_PASS         (SMTP only)
 */

import nodemailer from "nodemailer";

const PROVIDER = process.env.EMAIL_PROVIDER || "console";
const FROM = process.env.EMAIL_FROM || "noreply@campusmarket.csucc.edu.ph";
const APP_NAME = "Campus Market 2.0";
const APP_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Transport factory ─────────────────────────────────────────────────────────

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (PROVIDER === "smtp") {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For "resend" and "console" we handle sending in send() directly
  return _transporter;
}

// ── Core send function ────────────────────────────────────────────────────────

/**
 * Send a transactional email.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 * @returns {Promise<void>}
 */
export async function send({ to, subject, html, text }) {
  if (!to || !subject || !html) {
    throw new Error("[emailService] to, subject, and html are required");
  }

  const plainText =
    text ||
    html
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  if (PROVIDER === "console") {
    console.log("\n────── EMAIL (console mode) ──────");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${plainText}`);
    console.log("──────────────────────────────────\n");
    return;
  }

  if (PROVIDER === "resend") {
    // Resend REST API — no SDK needed
    const { default: fetch } = await import("node-fetch").catch(() => ({
      default: globalThis.fetch,
    }));
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to, subject, html, text: plainText }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`[emailService] Resend error: ${JSON.stringify(err)}`);
    }
    return;
  }

  if (PROVIDER === "smtp") {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html,
      text: plainText,
    });
    return;
  }

  throw new Error(`[emailService] Unknown EMAIL_PROVIDER: "${PROVIDER}"`);
}

// ── HTML template helper ──────────────────────────────────────────────────────

function baseTemplate(title, body) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>
    body  { margin:0; padding:0; background:#F9FAFB; font-family:Inter,Arial,sans-serif; color:#1F2937; }
    .wrap { max-width:560px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; border:1px solid #E5E7EB; }
    .header { background:linear-gradient(135deg,#3B6D11,#BA7517); padding:32px 40px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:22px; font-weight:700; }
    .header p  { margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:14px; }
    .body  { padding:32px 40px; }
    .body h2 { font-size:18px; margin:0 0 12px; color:#111827; }
    .body p  { font-size:15px; line-height:1.7; margin:0 0 16px; color:#374151; }
    .btn   { display:inline-block; padding:12px 28px; background:#BA7517; color:#fff; border-radius:8px; font-weight:600; font-size:15px; text-decoration:none; margin:8px 0; }
    .muted { color:#6B7280; font-size:13px; }
    .footer { padding:20px 40px; border-top:1px solid #F3F4F6; text-align:center; color:#9CA3AF; font-size:12px; }
    .highlight { background:#FFF3CC; border-left:4px solid #BA7517; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; font-size:15px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🏪 ${APP_NAME}</h1>
      <p>CSUCC Student Marketplace</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${APP_NAME} · Caraga State University Cabadbaran Campus<br/>
      <a href="${APP_URL}" style="color:#BA7517">Visit the marketplace</a>
    </div>
  </div>
</body>
</html>`;
}

// ── Named notification functions ──────────────────────────────────────────────

/**
 * Welcome email sent immediately after registration.
 */
export async function sendWelcome({ to, name, role }) {
  const roleLabel = role === "seller" ? "seller" : "buyer";
  await send({
    to,
    subject: `Welcome to ${APP_NAME}! 🎉`,
    html: baseTemplate(
      `Welcome, ${name}!`,
      `
      <h2>Hi ${name}, welcome aboard!</h2>
      <p>Your <strong>${roleLabel}</strong> account has been created successfully.</p>
      ${
        role === "seller"
          ? `<p>Your next step is to <strong>apply for a stall</strong>. Once approved by an admin, you can start listing products.</p>`
          : `<p>Start exploring student products, add items to your cart, and enjoy AI-powered recommendations just for you.</p>`
      }
      <a class="btn" href="${APP_URL}">Go to Campus Market</a>
      <p class="muted">If you didn't create this account, please ignore this email.</p>
      `,
    ),
  });
}

/**
 * Notify a buyer that their order has been placed.
 */
export async function sendOrderConfirmation({
  to,
  name,
  orderId,
  total,
  items = [],
}) {
  const itemRows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;font-size:14px;">${i.name}</td>
          <td style="padding:6px 0;font-size:14px;text-align:right;">×${i.quantity}</td>
          <td style="padding:6px 0;font-size:14px;text-align:right;">₱${Number(i.subtotal).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  await send({
    to,
    subject: `Order Confirmed — #${orderId.slice(0, 8).toUpperCase()}`,
    html: baseTemplate(
      "Order Confirmation",
      `
      <h2>Your order is confirmed! 📦</h2>
      <p>Hi ${name}, we've received your order. The seller will prepare it shortly.</p>
      <div class="highlight">Order ID: <strong>#${orderId.slice(0, 8).toUpperCase()}</strong></div>
      ${
        itemRows
          ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
               <thead><tr>
                 <th style="text-align:left;font-size:12px;color:#6B7280;padding-bottom:8px;border-bottom:1px solid #E5E7EB;">Item</th>
                 <th style="text-align:right;font-size:12px;color:#6B7280;padding-bottom:8px;border-bottom:1px solid #E5E7EB;">Qty</th>
                 <th style="text-align:right;font-size:12px;color:#6B7280;padding-bottom:8px;border-bottom:1px solid #E5E7EB;">Subtotal</th>
               </tr></thead>
               <tbody>${itemRows}</tbody>
               <tfoot><tr>
                 <td colspan="2" style="padding-top:12px;font-weight:700;font-size:15px;border-top:1px solid #E5E7EB;">Total</td>
                 <td style="padding-top:12px;font-weight:700;font-size:15px;text-align:right;border-top:1px solid #E5E7EB;color:#BA7517;">₱${Number(total).toFixed(2)}</td>
               </tr></tfoot>
             </table>`
          : ""
      }
      <p>Payment is <strong>cash on delivery</strong>. Please prepare the exact amount.</p>
      <a class="btn" href="${APP_URL}/orders">Track Your Order</a>
      `,
    ),
  });
}

/**
 * Notify a buyer when their order status changes.
 */
export async function sendOrderStatusUpdate({ to, name, orderId, status }) {
  const statusMessages = {
    confirmed: {
      emoji: "✅",
      line: "The seller has confirmed your order and is preparing it.",
    },
    ready: { emoji: "🎉", line: "Your order is ready for pick-up / delivery!" },
    delivered: {
      emoji: "🏠",
      line: "Your order has been marked as delivered. Enjoy!",
    },
    cancelled: {
      emoji: "❌",
      line: "Your order has been cancelled. Contact the seller if you have questions.",
    },
  };

  const msg = statusMessages[status] ?? {
    emoji: "📢",
    line: `Your order status has changed to: ${status}.`,
  };

  await send({
    to,
    subject: `${msg.emoji} Order #${orderId.slice(0, 8).toUpperCase()} — ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html: baseTemplate(
      "Order Update",
      `
      <h2>${msg.emoji} Order Update</h2>
      <p>Hi ${name},</p>
      <div class="highlight">Order #${orderId.slice(0, 8).toUpperCase()} is now <strong>${status}</strong>.</div>
      <p>${msg.line}</p>
      <a class="btn" href="${APP_URL}/orders">View Order Details</a>
      `,
    ),
  });
}

/**
 * Notify a seller when they receive a new order.
 */
export async function sendNewOrderAlert({
  to,
  sellerName,
  orderId,
  buyerName,
  total,
}) {
  await send({
    to,
    subject: `🛒 New Order Received — #${orderId.slice(0, 8).toUpperCase()}`,
    html: baseTemplate(
      "New Order",
      `
      <h2>You have a new order! 🛒</h2>
      <p>Hi ${sellerName},</p>
      <p><strong>${buyerName}</strong> has placed an order worth <strong>₱${Number(total).toFixed(2)}</strong>.</p>
      <div class="highlight">Order ID: <strong>#${orderId.slice(0, 8).toUpperCase()}</strong></div>
      <p>Please confirm the order as soon as possible to let the buyer know.</p>
      <a class="btn" href="${APP_URL}/seller/orders">View Orders Dashboard</a>
      `,
    ),
  });
}

/**
 * Notify a seller whether their stall was approved or rejected.
 */
export async function sendStallDecision({ to, sellerName, stallName, status }) {
  const approved = status === "approved";
  await send({
    to,
    subject: `${approved ? "🎉" : "❌"} Stall Application — ${approved ? "Approved" : "Rejected"}`,
    html: baseTemplate(
      `Stall ${status}`,
      `
      <h2>${approved ? "🎉 Congratulations!" : "❌ Application Update"}</h2>
      <p>Hi ${sellerName},</p>
      ${
        approved
          ? `<p>Your stall <strong>${stallName}</strong> has been <strong>approved</strong> by the admin. You can now start listing products!</p>
             <a class="btn" href="${APP_URL}/seller/products">Start Adding Products</a>`
          : `<p>Unfortunately, your stall application for <strong>${stallName}</strong> has been <strong>rejected</strong>.</p>
             <p>This may be due to incomplete information or policy violations. You may re-apply with a new application.</p>
             <a class="btn" href="${APP_URL}/seller/stall">Re-apply</a>`
      }
      `,
    ),
  });
}

/**
 * Send a password reset link (if self-service reset is implemented later).
 */
export async function sendPasswordReset({ to, name, resetToken }) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  await send({
    to,
    subject: "Reset Your Campus Market Password",
    html: baseTemplate(
      "Password Reset",
      `
      <h2>Password Reset Request 🔑</h2>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <p>Click the button below. This link expires in <strong>1 hour</strong>.</p>
      <a class="btn" href="${resetUrl}">Reset Password</a>
      <p class="muted">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
      `,
    ),
  });
}

export default {
  send,
  sendWelcome,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendNewOrderAlert,
  sendStallDecision,
  sendPasswordReset,
};
