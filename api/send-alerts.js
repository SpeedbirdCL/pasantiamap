// Vercel Cron — runs daily at 9am Santiago time
// Checks saved opportunities with deadlines <=7 days and emails users

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const RESEND_KEY = process.env.RESEND_API_KEY;
const SITE_URL   = process.env.VITE_SITE_URL || "https://pasantiamap.vercel.app";

const SHEET_URLS = {
  "finanzas_verano":       "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=0&single=true&output=csv",
  "finanzas_profesional":  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=603840342&single=true&output=csv",
  "finanzas_eventos":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=1543724149&single=true&output=csv",
  "finanzas_intermedia":   "",  // 🔑 PEGAR URL CUANDO ESTÉ LISTO
  "software_verano":       "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=0&single=true&output=csv",
  "software_profesional":  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=603840342&single=true&output=csv",
  "software_eventos":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=1543724149&single=true&output=csv",
  "software_intermedia":   "",  // 🔑 PEGAR URL CUANDO ESTÉ LISTO
  "consultoria_verano":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=0&single=true&output=csv",
  "consultoria_profesional":"https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=603840342&single=true&output=csv",
  "consultoria_eventos":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=1543724149&single=true&output=csv",
  "consultoria_intermedia":   "",  // 🔑 PEGAR URL CUANDO ESTÉ LISTO
  "marketing_verano":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=0&single=true&output=csv",
  "marketing_profesional": "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=603840342&single=true&output=csv",
  "marketing_eventos":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=1543724149&single=true&output=csv",
  "marketing_intermedia":   "",  // 🔑 PEGAR URL CUANDO ESTÉ LISTO
  "ingenieria_verano":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=0&single=true&output=csv",
  "ingenieria_profesional":"https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=603840342&single=true&output=csv",
  "ingenieria_eventos":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=1543724149&single=true&output=csv",
  "ingenieria_intermedia":   "",  // 🔑 PEGAR URL CUANDO ESTÉ LISTO
  "legal_verano":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=0&single=true&output=csv",
  "legal_profesional":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=603840342&single=true&output=csv",
  "legal_eventos":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=1543724149&single=true&output=csv",
  "legal_intermedia":   "",  // 🔑 PEGAR URL CUANDO ESTÉ LISTO
  "rrhh_verano":           "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=0&single=true&output=csv",
  "rrhh_profesional":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=603840342&single=true&output=csv",
  "rrhh_eventos":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=1543724149&single=true&output=csv",
  "rrhh_intermedia":   "",  // 🔑 PEGAR URL CUANDO ESTÉ LISTO
  "salud_verano":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=0&single=true&output=csv",
  "salud_profesional":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=603840342&single=true&output=csv",
  "salud_eventos":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=1543724149&single=true&output=csv",
  "salud_intermedia":   "",  // 🔑 PEGAR URL CUANDO ESTÉ LISTO
  "diseno_verano":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=0&single=true&output=csv",
  "diseno_profesional":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=603840342&single=true&output=csv",
  "diseno_eventos":        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=1543724149&single=true&output=csv",
  "diseno_intermedia":   "",  // 🔑 PEGAR URL CUANDO ESTÉ LISTO
  "educacion_verano":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=0&single=true&output=csv",
  "educacion_profesional": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=603840342&single=true&output=csv",
  "educacion_eventos":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=1543724149&single=true&output=csv",
  "educacion_intermedia":   "",  // 🔑 PEGAR URL CUANDO ESTÉ LISTO
};

async function fetchSheet(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const rows = text.trim().split("\n");
    const headers = rows[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    return rows.slice(1).filter(r => r.trim()).map(row => {
      const cells = row.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cells[i] || ""; });
      return obj;
    });
  } catch { return []; }
}

function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  if (!s) return null;
  // DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    d = parseInt(d, 10); mo = parseInt(mo, 10); y = parseInt(y, 10);
    if (y < 100) y += 2000;
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return new Date(y, mo - 1, d);
  }
  // ISO YYYY-MM-DD
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return new Date(y, mo - 1, d);
  }
  const native = new Date(s);
  return isNaN(native.getTime()) ? null : native;
}

function daysUntil(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return null;
  return Math.floor((d - Date.now()) / 86400000);
}

function buildEmail(userName, alerts) {
  const rows = alerts.map(a => {
    const urgency = a.days <= 2 ? "🔴" : a.days <= 5 ? "🟠" : "🟡";
    const label   = a.days === 0 ? "¡Cierra HOY!" : a.days === 1 ? "Cierra mañana" : `Cierra en ${a.days} días`;
    return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0">
          <div style="font-weight:700;color:#0f172a;font-size:14px">${a.company}</div>
          <div style="color:#64748b;font-size:13px;margin-top:2px">${a.role}</div>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;white-space:nowrap">
          <span style="background:${a.days<=2?"#fff1f2":a.days<=5?"#fffbeb":"#fefce8"};color:${a.days<=2?"#e11d48":a.days<=5?"#d97706":"#ca8a04"};padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600">
            ${urgency} ${label}
          </span>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0">
          <a href="${a.link}" style="color:#2563eb;font-size:13px;font-weight:600;text-decoration:none">Postular ↗</a>
        </td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#d4281a,#e8401a);padding:32px 32px 24px">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.03em">🌎 MiPasantía</div>
      <div style="color:rgba(255,255,255,.85);font-size:14px;margin-top:6px">Alertas de postulación</div>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 6px">Hola, ${userName} 👋</p>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px">
        Tienes <strong>${alerts.length}</strong> ${alerts.length===1?"oportunidad guardada que cierra pronto":"oportunidades guardadas que cierran pronto"}. No dejes pasar tu chance de postular:
      </p>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden">
        <thead><tr style="background:#f1f5f9">
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.07em;font-weight:600">Empresa / Rol</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.07em;font-weight:600">Cierre</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.07em;font-weight:600">Link</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:28px;text-align:center">
        <a href="${SITE_URL}" style="display:inline-block;background:linear-gradient(135deg,#d4281a,#e8401a);color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 16px rgba(212,40,26,.3)">
          Ver mis oportunidades →
        </a>
      </div>
    </div>
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
      <p style="color:#94a3b8;font-size:12px;margin:0">
        Recibiste este email porque tienes alertas activadas en MiPasantía.<br>
        <a href="${SITE_URL}" style="color:#94a3b8">Gestionar preferencias</a>
      </p>
    </div>
  </div>
</body></html>`;
}

async function sendEmail(to, subject, html) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "MiPasantía <alertas@mipasantia.cl>",
        to: [to], subject, html,
      }),
    });
    return res.ok;
  } catch { return false; }
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 1. Load all sheets, find jobs closing in <=7 days
  const closingSoon = {};
  await Promise.all(Object.entries(SHEET_URLS).map(async ([, url]) => {
    if (!url || !url.trim()) return; // placeholder URL — skip
    const rows = await fetchSheet(url);
    rows.forEach(row => {
      if (!row.id || !row.deadline) return;
      const days = daysUntil(row.deadline);
      if (days !== null && days >= 0 && days <= 7) {
        closingSoon[row.id] = { company: row.company || "Empresa", role: row.role || "Práctica", link: row.link || SITE_URL, days };
      }
    });
  }));

  if (Object.keys(closingSoon).length === 0) {
    return res.status(200).json({ message: "No opportunities closing soon", sent: 0 });
  }

  // 2. Get users with notify_closing=true
  const { data: prefs } = await sb.from("user_preferences").select("user_id").eq("notify_closing", true);
  const userIds = (prefs || []).map(p => p.user_id);
  if (userIds.length === 0) return res.status(200).json({ message: "No subscribers", sent: 0 });

  // 3. Get their progress and send emails
  const { data: progressRows } = await sb.from("progress").select("user_id, data").in("user_id", userIds);
  const ACTIVE = ["Interesado/a", "Postulé", "Entrevista"];
  let sent = 0;

  for (const row of (progressRows || [])) {
    const alerts = [];
    Object.entries(row.data || {}).forEach(([jobId, val]) => {
      if (ACTIVE.includes(val?.status) && closingSoon[jobId]) {
        alerts.push({ ...closingSoon[jobId], jobId });
      }
    });
    if (alerts.length === 0) continue;
    alerts.sort((a, b) => a.days - b.days);

    const { data: userData } = await sb.auth.admin.getUserById(row.user_id);
    const email = userData?.user?.email;
    const name  = userData?.user?.user_metadata?.name || userData?.user?.user_metadata?.full_name || "estudiante";
    if (!email) continue;

    const subject = alerts.length === 1
      ? `⚠️ ${alerts[0].company} cierra ${alerts[0].days === 0 ? "HOY" : "en " + alerts[0].days + " días"}`
      : `⚠️ ${alerts.length} prácticas guardadas cierran pronto`;

    const ok = await sendEmail(email, subject, buildEmail(name, alerts));
    if (ok) sent++;
  }

  return res.status(200).json({ sent, closingSoon: Object.keys(closingSoon).length });
}
