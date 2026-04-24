// Vercel Serverless Function — runs on cron schedule
// Fetches all Sheets, counts rows, updates Supabase

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role key for writes

const SHEET_URLS = {
  "finanzas_verano":       "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=0&single=true&output=csv",
  "finanzas_tradicional":  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=603840342&single=true&output=csv",
  "finanzas_eventos":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=1543724149&single=true&output=csv",
  "software_verano":       "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=0&single=true&output=csv",
  "software_tradicional":  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=603840342&single=true&output=csv",
  "software_eventos":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=1543724149&single=true&output=csv",
  "consultoria_verano":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=0&single=true&output=csv",
  "consultoria_tradicional":"https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=603840342&single=true&output=csv",
  "consultoria_eventos":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=1543724149&single=true&output=csv",
  "marketing_verano":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=0&single=true&output=csv",
  "marketing_tradicional": "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=603840342&single=true&output=csv",
  "marketing_eventos":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=1543724149&single=true&output=csv",
  "ingenieria_verano":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=0&single=true&output=csv",
  "ingenieria_tradicional":"https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=603840342&single=true&output=csv",
  "ingenieria_eventos":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=1543724149&single=true&output=csv",
  "legal_verano":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=0&single=true&output=csv",
  "legal_tradicional":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=603840342&single=true&output=csv",
  "legal_eventos":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=1543724149&single=true&output=csv",
  "rrhh_verano":           "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=0&single=true&output=csv",
  "rrhh_tradicional":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=603840342&single=true&output=csv",
  "rrhh_eventos":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=1543724149&single=true&output=csv",
  "salud_verano":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=0&single=true&output=csv",
  "salud_tradicional":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=603840342&single=true&output=csv",
  "salud_eventos":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=1543724149&single=true&output=csv",
  "diseno_verano":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=0&single=true&output=csv",
  "diseno_tradicional":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=603840342&single=true&output=csv",
  "diseno_eventos":        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=1543724149&single=true&output=csv",
  "educacion_verano":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=0&single=true&output=csv",
  "educacion_tradicional": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=603840342&single=true&output=csv",
  "educacion_eventos":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=1543724149&single=true&output=csv",
};

async function countRows(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split("\n").filter(l => l.trim());
    return Math.max(0, lines.length - 1); // subtract header row
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // Verify cron secret so only Vercel can call this
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Missing Supabase config" });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const results = {};
  const errors  = {};

  // Fetch all sheets in parallel
  await Promise.all(
    Object.entries(SHEET_URLS).map(async ([key, url]) => {
      const count = await countRows(url);
      if (count !== null) results[key] = count;
      else errors[key] = "failed";
    })
  );

  // Upsert counts into Supabase
  if (Object.keys(results).length > 0) {
    const rows = Object.entries(results).map(([key, count]) => ({ key, count }));
    const { error } = await sb
      .from("opportunity_counts")
      .upsert(rows, { onConflict: "key" });
    if (error) {
      return res.status(500).json({ error: error.message, results, errors });
    }
  }

  return res.status(200).json({
    updated: Object.keys(results).length,
    counts: results,
    errors,
  });
}
