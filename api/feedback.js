// Vercel API endpoint — receives feedback/suggestions from users and emails them to the team.

const RESEND_KEY = process.env.RESEND_API_KEY;
// Where feedback reports are delivered. Set FEEDBACK_TO in Vercel env; falls back to a placeholder.
const FEEDBACK_TO = process.env.FEEDBACK_TO || "contacto@mipasantia.cl";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, message, email, area, subcat } = req.body || {};

  // Basic validation + light anti-abuse
  if (!message || message.trim().length < 5) return res.status(400).json({ error: "Mensaje muy corto" });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Correo inválido" });
  if (message.length > 3000) return res.status(400).json({ error: "Mensaje muy largo" });
  if (!RESEND_KEY) return res.status(500).json({ error: "Email no configurado" });

  const safe = (s) => String(s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,sans-serif;background:#f8fafc;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#d4281a;padding:20px 24px;color:#fff">
      <div style="font-size:18px;font-weight:800">📨 Nuevo reporte de usuario</div>
    </div>
    <div style="padding:24px">
      <table style="width:100%;font-size:14px;color:#0f172a;border-collapse:collapse">
        <tr><td style="padding:6px 0;font-weight:700;width:110px">Tipo:</td><td style="padding:6px 0">${safe(type)}</td></tr>
        <tr><td style="padding:6px 0;font-weight:700">Área:</td><td style="padding:6px 0">${safe(area)} · ${safe(subcat)}</td></tr>
        <tr><td style="padding:6px 0;font-weight:700">Correo:</td><td style="padding:6px 0"><a href="mailto:${safe(email)}">${safe(email)}</a></td></tr>
      </table>
      <div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
        <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Mensaje</div>
        <div style="font-size:14px;color:#0f172a;line-height:1.6;white-space:pre-wrap">${safe(message)}</div>
      </div>
    </div>
  </div>
</body></html>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MiPasantía Reportes <reportes@mipasantia.cl>",
        to: [FEEDBACK_TO],
        reply_to: email,
        subject: `[Reporte] ${type} — ${area}/${subcat}`,
        html,
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: err });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
