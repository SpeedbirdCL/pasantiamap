// Vercel API endpoint — sends welcome email after registration
// Called from frontend right after signup succeeds.

const RESEND_KEY = process.env.RESEND_API_KEY;
const SITE_URL   = process.env.VITE_SITE_URL || "https://pasantiamap.vercel.app";

function buildWelcomeEmail(name) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#d4281a,#e8401a);padding:36px 32px;color:#fff;text-align:center">
      <div style="font-size:48px;margin-bottom:10px">🌎</div>
      <div style="font-size:24px;font-weight:800;letter-spacing:-.03em">¡Bienvenido a MiPasantía!</div>
    </div>
    <div style="padding:32px">
      <p style="color:#0f172a;font-size:17px;font-weight:600;margin:0 0 12px">Hola, ${name} 👋</p>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px">
        Gracias por unirte. Ahora tienes acceso al mapa más completo de prácticas profesionales en Chile y LATAM, organizado por área, modalidad y tipo de empresa.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px">
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:14px">Lo que puedes hacer:</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;gap:12px;align-items:start">
            <span style="font-size:18px;flex-shrink:0">🔍</span>
            <div>
              <div style="font-size:14px;font-weight:600;color:#0f172a">Explora oportunidades</div>
              <div style="font-size:13px;color:#64748b;line-height:1.5">10 áreas, 4 modalidades, cientos de empresas curadas</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:start">
            <span style="font-size:18px;flex-shrink:0">📌</span>
            <div>
              <div style="font-size:14px;font-weight:600;color:#0f172a">Marca tu estado</div>
              <div style="font-size:13px;color:#64748b;line-height:1.5">Interesado, Postulé, Entrevista, Oferta — sincronizado en todos tus dispositivos</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:start">
            <span style="font-size:18px;flex-shrink:0">🔔</span>
            <div>
              <div style="font-size:14px;font-weight:600;color:#0f172a">Recibe alertas por email</div>
              <div style="font-size:13px;color:#64748b;line-height:1.5">Te avisamos cuando una práctica que guardaste está por cerrar</div>
            </div>
          </div>
        </div>
      </div>

      <div style="text-align:center;margin-bottom:20px">
        <a href="${SITE_URL}" style="display:inline-block;background:linear-gradient(135deg,#d4281a,#e8401a);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(212,40,26,.3)">
          Explorar oportunidades →
        </a>
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;margin:24px 0 0;text-align:center">
        ¿Tienes una práctica que crees deberíamos agregar?<br>
        Responde este correo o escríbenos a <a href="mailto:contacto@mipasantia.cl" style="color:#d4281a">contacto@mipasantia.cl</a>
      </p>
    </div>
    <div style="padding:20px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
      <p style="color:#94a3b8;font-size:12px;margin:0">Hecho con cariño en Chile 🇨🇱 · MiPasantía</p>
    </div>
  </div>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, name } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email required" });
  if (!RESEND_KEY) return res.status(500).json({ error: "Email not configured" });

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MiPasantía <bienvenida@mipasantia.cl>",
        to: [email],
        subject: "¡Bienvenido a MiPasantía! 🌎",
        html: buildWelcomeEmail(name || "estudiante"),
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
