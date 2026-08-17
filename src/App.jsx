import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE SHEETS CONFIG
// Para conectar tus propios datos:
// 1. Crea un Google Sheet con estas columnas:
//    id | company | role | region | remote | duration | posted | deadline | link | notes
// 2. Archivo → Compartir → Publicar en la web → Hoja específica → CSV → Publicar
// 3. Copia la URL y reemplaza el valor en SHEET_URLS abajo
// 4. Repite para cada área / subcategoría que quieras
//
// DEMO: usamos datos hardcoded como fallback mientras configuras tus Sheets
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_URLS = {
  // Finanzas
  "finanzas_verano":       "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=0&single=true&output=csv",
  "finanzas_profesional":  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=603840342&single=true&output=csv",
  "finanzas_eventos":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=1543724149&single=true&output=csv",
  "finanzas_intermedia":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=464911051&single=true&output=csv",  //
  // Software
  "software_verano":       "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=0&single=true&output=csv",
  "software_profesional":  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=603840342&single=true&output=csv",
  "software_eventos":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=1543724149&single=true&output=csv",
  "software_intermedia":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=1058058583&single=true&output=csv",  //
  // Consultoría
  "consultoria_verano":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=0&single=true&output=csv",
  "consultoria_profesional":"https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=603840342&single=true&output=csv",
  "consultoria_eventos":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=1543724149&single=true&output=csv",
  "consultoria_intermedia":"https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=938561389&single=true&output=csv",  //
  // Marketing
  "marketing_verano":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=0&single=true&output=csv",
  "marketing_profesional": "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=603840342&single=true&output=csv",
  "marketing_eventos":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=1543724149&single=true&output=csv",
  "marketing_intermedia":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=1126315179&single=true&output=csv",  // 🔑
  // Ingeniería
  "ingenieria_verano":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=0&single=true&output=csv",
  "ingenieria_profesional":"https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=603840342&single=true&output=csv",
  "ingenieria_eventos":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=1543724149&single=true&output=csv",
  "ingenieria_intermedia":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=2102085951&single=true&output=csv",  //
  // Legal
  "legal_verano":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=0&single=true&output=csv",
  "legal_profesional":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=603840342&single=true&output=csv",
  "legal_eventos":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=1543724149&single=true&output=csv",
  "legal_intermedia":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=783952437&single=true&output=csv",  //
  // RRHH
  "rrhh_verano":           "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=0&single=true&output=csv",
  "rrhh_profesional":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=603840342&single=true&output=csv",
  "rrhh_eventos":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=1543724149&single=true&output=csv",
  "rrhh_intermedia":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=1639239870&single=true&output=csv",  // 
  // Salud
  "salud_verano":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=0&single=true&output=csv",
  "salud_profesional":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=603840342&single=true&output=csv",
  "salud_eventos":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=1543724149&single=true&output=csv",
  "salud_intermedia":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=1985808223&single=true&output=csv",  //
  // Diseño
  "diseno_verano":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=0&single=true&output=csv",
  "diseno_profesional":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=603840342&single=true&output=csv",
  "diseno_eventos":        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=1543724149&single=true&output=csv",
  "diseno_intermedia":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=1568521146&single=true&output=csv",  //
  // Educación
  "educacion_verano":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=0&single=true&output=csv",
  "educacion_profesional": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=603840342&single=true&output=csv",
  "educacion_eventos":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=1543724149&single=true&output=csv",
  "educacion_intermedia":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=2139796109&single=true&output=csv",  //
};

// ─── DEMO DATA (reemplazada por Google Sheets cuando configures las URLs) ────
const DEMO_DATA = {
  software: {
    verano: [
      { id:"cl-sw-v-001", company:"Falabella Tech",  role:"Práctica Verano — Backend Developer",   region:"Santiago", remote:"Híbrido",    duration:"3 meses", deadline:"2026-04-30", link:"https://jobs.falabella.com",                        notes:"Java o Python. Postula en jobs.falabella.com" },
      { id:"cl-sw-v-002", company:"Mercado Libre",   role:"Summer Internship — Data Analyst",      region:"Santiago", remote:"Híbrido",    duration:"3 meses", deadline:"2026-05-15", link:"https://www.mercadolibre.cl/jobs",                   notes:"SQL y Python requeridos" },
      { id:"cl-sw-v-003", company:"Globant Chile",   role:"Summer Trainee Developer",              region:"Santiago", remote:"Remoto",     duration:"3 meses", deadline:"2026-06-01", link:"https://www.globant.com/careers",                   notes:"Múltiples stacks disponibles" },
      { id:"cl-sw-v-004", company:"Accenture Chile", role:"Summer Technology Intern",              region:"Santiago", remote:"Híbrido",    duration:"3 meses", deadline:"2026-05-20", link:"https://www.accenture.com/cl-es/careers",           notes:"Cloud & Infra o Desarrollo" },
      { id:"cl-sw-v-005", company:"Buk",             role:"Práctica Verano Full Stack",            region:"Santiago", remote:"Híbrido",    duration:"3 meses", deadline:"2026-04-15", link:"https://www.buk.cl/trabaja-con-nosotros",           notes:"React + Node. Startup chilena" },
    ],
    tradicional: [
      { id:"cl-sw-t-001", company:"Entel Digital",   role:"Práctica Desarrollador/a Web",          region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-31", link:"https://www.linkedin.com/company/entel/jobs/",      notes:"Agile/Scrum. Buen ambiente" },
      { id:"cl-sw-t-002", company:"Fintual",         role:"Práctica Ingeniería de Software",       region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-01", link:"https://fintual.com/jobs",                          notes:"Ruby on Rails. Ambiente muy técnico" },
      { id:"cl-sw-t-003", company:"NotCo",           role:"Data Science Intern",                   region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-10", link:"https://www.linkedin.com/company/the-not-company/", notes:"Python y ML. FoodTech global" },
      { id:"cl-sw-t-004", company:"Betterfly",       role:"Práctica Backend Engineer",             region:"Santiago", remote:"Remoto",     duration:"6 meses", deadline:"2026-06-01", link:"https://www.betterfly.com/careers",                 notes:"Node.js. Unicornio chileno" },
      { id:"cl-sw-t-005", company:"Cornershop",      role:"Internship Software Engineer",          region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-20", link:"https://www.linkedin.com/company/cornershop-inc/",  notes:"Python/Go. Empresa de Uber" },
      { id:"cl-sw-t-006", company:"IBM Chile",       role:"Práctica Technology Consultant",        region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-15", link:"https://www.ibm.com/employment/",                   notes:"Consultoría IT. Inglés B2" },
    ],
    eventos: [
      { id:"cl-sw-e-001", company:"GetOnBoard",      role:"Tech Talks — Networking para practicantes", region:"Santiago", remote:"Presencial", duration:"1 día", deadline:"2026-04-10", link:"https://www.getonbrd.com/events",               notes:"Evento anual de networking tech" },
      { id:"cl-sw-e-002", company:"Startup Chile",   role:"Demo Day — Pasantías en startups",          region:"Santiago", remote:"Híbrido",    duration:"1 día", deadline:"2026-04-20", link:"https://www.startupchile.org/events",           notes:"Conoce startups que buscan practicantes" },
    ],
  },
  finanzas: {
    verano:      [],
    tradicional: [],
    eventos:     [],
  },
  consultoria: {
    verano: [
      { id:"cl-co-v-001", company:"McKinsey Chile",  role:"Summer Business Analyst",              region:"Santiago", remote:"Presencial", duration:"2 meses", deadline:"2026-04-01", link:"https://www.mckinsey.com/careers",                  notes:"Top consulting. Proceso muy selectivo" },
      { id:"cl-co-v-002", company:"BCG Chile",       role:"Summer Associate Intern",              region:"Santiago", remote:"Presencial", duration:"2 meses", deadline:"2026-04-01", link:"https://www.bcg.com/careers",                       notes:"Cases y fit. Inglés fluido" },
      { id:"cl-co-v-003", company:"Bain Chile",      role:"Summer Consultant",                    region:"Santiago", remote:"Presencial", duration:"2 meses", deadline:"2026-04-15", link:"https://www.bain.com/careers",                      notes:"MBB. El más pequeño pero muy valorado" },
    ],
    tradicional: [
      { id:"cl-co-t-001", company:"Deloitte Chile",  role:"Analyst Trainee — Audit",              region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-31", link:"https://www2.deloitte.com/cl/es/careers.html",      notes:"IFRS y contabilidad. Inglés B2" },
      { id:"cl-co-t-002", company:"PwC Chile",       role:"Asociado/a en Práctica — Assurance",   region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-15", link:"https://www.pwc.com/cl/es/careers.html",            notes:"Auditoría financiera" },
      { id:"cl-co-t-003", company:"EY Chile",        role:"Staff — Auditoría",                    region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-04-30", link:"https://careers.ey.com/",                           notes:"Gran plataforma de carrera" },
      { id:"cl-co-t-004", company:"KPMG Chile",      role:"Práctica Consultoría de Negocios",     region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-20", link:"https://www.linkedin.com/company/kpmg/jobs/",       notes:"Proyectos de transformación digital" },
      { id:"cl-co-t-005", company:"Capgemini Chile", role:"Junior Consultant Trainee",            region:"Santiago", remote:"Remoto",     duration:"6 meses", deadline:"2026-05-01", link:"https://www.capgemini.com/cl-es/careers/",          notes:"Inglés requerido" },
    ],
    eventos: [
      { id:"cl-co-e-001", company:"MBB Chile",       role:"Case Workshop — Preparación Consulting", region:"Santiago", remote:"Presencial", duration:"1 día", deadline:"2026-04-05", link:"https://www.linkedin.com/",                         notes:"Workshop gratuito de cases para postulantes" },
    ],
  },
  marketing: {
    verano: [
      { id:"cl-mk-v-001", company:"Cornershop",      role:"Growth Marketing Intern",              region:"Santiago", remote:"Híbrido",    duration:"3 meses", deadline:"2026-04-20", link:"https://www.linkedin.com/company/cornershop-inc/",  notes:"A/B testing. Crecimiento de usuarios" },
      { id:"cl-mk-v-002", company:"Falabella",       role:"Práctica Verano Marketing Digital",    region:"Santiago", remote:"Híbrido",    duration:"3 meses", deadline:"2026-04-30", link:"https://jobs.falabella.com",                        notes:"Performance y SEO/SEM" },
    ],
    tradicional: [
      { id:"cl-mk-t-001", company:"Cencosud",        role:"Práctica Trade Marketing",             region:"Santiago", remote:"Presencial", duration:"6 meses", deadline:"2026-04-30", link:"https://www.cencosud.com/trabaja-con-nosotros/",    notes:"Retail. Excel y PowerPoint" },
      { id:"cl-mk-t-002", company:"CCU",             role:"Práctica Brand Management",            region:"Santiago", remote:"Presencial", duration:"6 meses", deadline:"2026-05-15", link:"https://www.linkedin.com/company/ccu/jobs/",        notes:"Marcas como Cristal, Heineken" },
      { id:"cl-mk-t-003", company:"WOM Chile",       role:"Práctica Marketing y Comunicaciones",  region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-01", link:"https://www.linkedin.com/company/wom-chile/jobs/",  notes:"Redes sociales y campañas digitales" },
      { id:"cl-mk-t-004", company:"Entel",           role:"Práctica CRM y Marketing Analytics",   region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-06-15", link:"https://www.linkedin.com/company/entel/jobs/",      notes:"SQL y BI. Muy analítico" },
    ],
    eventos: [
      { id:"cl-mk-e-001", company:"IAB Chile",       role:"Digital Marketing Summit",             region:"Santiago", remote:"Presencial", duration:"1 día", deadline:"2026-05-05", link:"https://www.iabchile.cl/",                            notes:"Mayor evento de marketing digital de Chile" },
    ],
  },
  ingenieria: {
    verano: [
      { id:"cl-in-v-001", company:"Codelco",         role:"Práctica Verano — Ingeniería en Minas", region:"Norte Grande", remote:"Presencial", duration:"2 meses", deadline:"2026-04-01", link:"https://www.codelco.com/trabaja-en-codelco/",    notes:"Viáticos cubiertos. Faenas en norte" },
      { id:"cl-in-v-002", company:"SQM",             role:"Summer Intern — Procesos",              region:"Antofagasta",  remote:"Presencial", duration:"2 meses", deadline:"2026-04-15", link:"https://www.sqm.com/en/trabaja-con-nosotros/",   notes:"Litio y minerales" },
    ],
    tradicional: [
      { id:"cl-in-t-001", company:"ENAP",            role:"Práctica Ingeniería Química",           region:"Biobío",   remote:"Presencial", duration:"3 meses", deadline:"2026-05-15", link:"https://www.enap.cl/pag/37/750/trabaja_con_nosotros.aspx", notes:"Refinería Biobío" },
      { id:"cl-in-t-002", company:"Enel Chile",      role:"Práctica Ingeniería Eléctrica",         region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-30", link:"https://www.enel.cl/es/conoce-enel/empleo.html",   notes:"Energías renovables" },
      { id:"cl-in-t-003", company:"Arauco",          role:"Práctica Ingeniería Industrial",        region:"Los Lagos", remote:"Presencial", duration:"3 meses", deadline:"2026-04-15", link:"https://www.arauco.cl/trabaja-con-nosotros/",       notes:"Forestal. Plantas en regiones" },
      { id:"cl-in-t-004", company:"Aguas Andinas",   role:"Práctica Ingeniería Ambiental",         region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-06-01", link:"https://www.aguasandinas.cl/empresa/trabaja-con-nosotros", notes:"Tratamiento de aguas" },
    ],
    eventos: [
      { id:"cl-in-e-001", company:"IIME Chile",      role:"Feria de Prácticas Ingeniería",         region:"Santiago", remote:"Presencial", duration:"1 día", deadline:"2026-04-22", link:"https://www.iime.cl/",                                notes:"Feria anual de empresas para ingenieros" },
    ],
  },
  legal: {
    verano: [
      { id:"cl-le-v-001", company:"Carey y Cía",     role:"Summer Clerk — Derecho",                region:"Santiago", remote:"Presencial", duration:"2 meses", deadline:"2026-04-10", link:"https://www.carey.cl/carreras",                     notes:"Top firma Chile. Muy selectivo" },
      { id:"cl-le-v-002", company:"Cariola Díez",    role:"Summer Associate Junior",               region:"Santiago", remote:"Presencial", duration:"2 meses", deadline:"2026-04-10", link:"https://www.cariola.cl/trabaja-con-nosotros",        notes:"M&A corporativo. Inglés fluido" },
    ],
    tradicional: [
      { id:"cl-le-t-001", company:"Guerrero Olivos", role:"Práctica Legal — Corporativo",          region:"Santiago", remote:"Presencial", duration:"6 meses", deadline:"2026-05-15", link:"https://www.guerreroolivos.cl/trabaja-con-nosotros", notes:"Derecho societario" },
      { id:"cl-le-t-002", company:"Baker McKenzie",  role:"Práctica — Transaccional",              region:"Santiago", remote:"Presencial", duration:"6 meses", deadline:"2026-06-01", link:"https://careers.bakermckenzie.com/",                 notes:"Firma internacional. Cross-border" },
      { id:"cl-le-t-003", company:"Garrigues Chile", role:"Práctica Abogado/a",                    region:"Santiago", remote:"Presencial", duration:"6 meses", deadline:"2026-05-01", link:"https://www.garrigues.com/es_ES/empleo",             notes:"Firma española. Inglés B2" },
    ],
    eventos: [
      { id:"cl-le-e-001", company:"CAEL Chile",      role:"Networking Legal — Estudiantes Derecho", region:"Santiago", remote:"Presencial", duration:"1 día", deadline:"2026-04-18", link:"https://www.linkedin.com/",                          notes:"Evento de networking para futuros abogados" },
    ],
  },
  rrhh: {
    verano: [],
    tradicional: [
      { id:"cl-rh-t-001", company:"Adecco Chile",    role:"Práctica Reclutamiento y Selección",    region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-31", link:"https://www.adecco.cl/candidatos",                  notes:"Reclutamiento masivo y especializado" },
      { id:"cl-rh-t-002", company:"Manpower Chile",  role:"Práctica Recursos Humanos",             region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-15", link:"https://www.manpower.cl/",                           notes:"HR generalista" },
      { id:"cl-rh-t-003", company:"Falabella",       role:"Práctica Gestión de Personas",          region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-30", link:"https://jobs.falabella.com",                        notes:"Área Corporativa. Retail a escala" },
      { id:"cl-rh-t-004", company:"Sodexo Chile",    role:"Práctica RRHH & Bienestar Laboral",     region:"Santiago", remote:"Presencial", duration:"6 meses", deadline:"2026-06-15", link:"https://www.linkedin.com/company/sodexo/jobs/",      notes:"Benefits. Psicología organizacional" },
    ],
    eventos: [],
  },
  salud: {
    verano: [],
    tradicional: [
      { id:"cl-sa-t-001", company:"Clínica Las Condes",  role:"Práctica Medicina / Interno/a",     region:"Santiago", remote:"Presencial", duration:"3 meses", deadline:"2026-04-30", link:"https://www.clinicalascondes.cl/EMPLEOS",            notes:"Una de las mejores clínicas del país" },
      { id:"cl-sa-t-002", company:"Clínica Alemana",     role:"Práctica Enfermería",               region:"Santiago", remote:"Presencial", duration:"3 meses", deadline:"2026-05-15", link:"https://www.alemana.cl/cl/site/edic/base/port/trabaja.html", notes:"Reconocida internacionalmente" },
      { id:"cl-sa-t-003", company:"Red Salud",           role:"Práctica Psicología Clínica",       region:"Santiago", remote:"Presencial", duration:"6 meses", deadline:"2026-05-31", link:"https://www.redsalud.cl/trabaja-con-nosotros/",      notes:"Red de 30+ clínicas" },
      { id:"cl-sa-t-004", company:"Cruz Verde",          role:"Práctica Química Farmacéutica",     region:"RM/Regiones", remote:"Presencial", duration:"6 meses", deadline:"2026-06-01", link:"https://www.cruzverde.cl/trabaja-con-nosotros/", notes:"Cadena farmacéutica líder" },
    ],
    eventos: [],
  },
  diseno: {
    verano: [
      { id:"cl-di-v-001", company:"Mercado Libre",   role:"Summer Product Design Intern",          region:"Santiago", remote:"Híbrido",    duration:"3 meses", deadline:"2026-05-01", link:"https://www.mercadolibre.cl/jobs",                  notes:"Diseño de producto a escala LATAM" },
    ],
    tradicional: [
      { id:"cl-di-t-001", company:"Falabella",       role:"Práctica UX Design",                    region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-31", link:"https://jobs.falabella.com",                        notes:"Figma requerido. Portfolio indispensable" },
      { id:"cl-di-t-002", company:"Buk",             role:"Práctica UI/UX Designer",               region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-15", link:"https://www.buk.cl/trabaja-con-nosotros",           notes:"Design systems. Equipo joven" },
      { id:"cl-di-t-003", company:"Fintual",         role:"Práctica Diseño de Producto",           region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-04-30", link:"https://fintual.com/jobs",                          notes:"Fintech. Orientado a datos" },
      { id:"cl-di-t-004", company:"Houm",            role:"UX Research Intern",                    region:"Santiago", remote:"Remoto",     duration:"3 meses", deadline:"2026-05-01", link:"https://www.houm.com/trabaja-con-nosotros",         notes:"Proptech. Research con usuarios reales" },
    ],
    eventos: [
      { id:"cl-di-e-001", company:"UX Conf Chile",   role:"UX Conference — Estudiantes",           region:"Santiago", remote:"Híbrido",    duration:"1 día", deadline:"2026-04-28", link:"https://www.uxconf.cl/",                              notes:"Principal evento UX del país" },
    ],
  },
  educacion: {
    verano: [],
    tradicional: [
      { id:"cl-ed-t-001", company:"Duoc UC",         role:"Práctica Coordinación Académica",       region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-05-31", link:"https://www.duoc.cl/trabaja-con-nosotros/",         notes:"E-learning y presencial" },
      { id:"cl-ed-t-002", company:"Fundación Chile", role:"Práctica Área Educación",               region:"Santiago", remote:"Híbrido",    duration:"6 meses", deadline:"2026-04-30", link:"https://www.fundacionchile.com/trabaja-con-nosotros", notes:"Innovación educativa" },
      { id:"cl-ed-t-003", company:"Enseña Chile",    role:"Fellow / Práctica Docencia",            region:"Regiones", remote:"Presencial", duration:"3 meses", deadline:"2026-04-15", link:"https://www.ensenachile.cl/reclutamiento",          notes:"Enseña en escuelas vulnerables" },
      { id:"cl-ed-t-004", company:"Laboratoria",     role:"Práctica Diseño de Curriculum",         region:"Santiago", remote:"Remoto",     duration:"6 meses", deadline:"2026-05-20", link:"https://www.laboratoria.la/trabaja-con-nosotros",   notes:"Bootcamp tech para mujeres LATAM" },
    ],
    eventos: [],
  },
};

const SUBCATEGORY_LABELS = {
  verano:      { label: "Práctica de Verano 2027",    icon: "☀️" },
  profesional: { label: "Práctica Profesional",       icon: "💼" },
  intermedia:  { label: "Off-Cycle / Intermedia",     icon: "🔄" },
  eventos:     { label: "Eventos",                    icon: "🎟️" },
};

// Contextual info shown above the table for each period, so students understand
// what kind of internship they're looking at and whether it fits their situation.
const SUBCATEGORY_INFO = {
  verano: {
    icon: "☀️",
    title: "Sobre las Prácticas de Verano",
    facts: [
      { icon: "📅", label: "Cuándo", text: "Suelen comenzar en Diciembre o Enero." },
      { icon: "⏳", label: "Duración", text: "Generalmente 3 meses o menos." },
      { icon: "🎓", label: "Perfil", text: "Orientadas principalmente a penúltimo y último año, aunque en varias ocasiones aceptan alumnos más jóvenes (desde tercer año)." },
      { icon: "🛡️", label: "Requisitos", text: "Los seguros otorgados por la universidad son obligatorios." },
      { icon: "🤝", label: "Para qué sirve", text: "Suele ser el primer acercamiento real a la empresa." },
    ],
  },
  profesional: {
    icon: "💼",
    title: "Sobre las Prácticas Profesionales",
    facts: [
      { icon: "📅", label: "Cuándo", text: "Suelen abrir en verano, marzo o agosto." },
      { icon: "⏳", label: "Duración", text: "Entre 3 y 6 meses." },
      { icon: "🎓", label: "Perfil", text: "Alumnos de penúltimo y/o último año, generalmente con calidad de alumno regular." },
      { icon: "📜", label: "Para qué sirve", text: "Suele ser la práctica obligatoria que piden las universidades para poder titularse." },
    ],
  },
  intermedia: {
    icon: "🔄",
    title: "Sobre las Off-Cycle / Intermedias",
    facts: [
      { icon: "📅", label: "Cuándo", text: "Pueden abrir en cualquier momento del año." },
      { icon: "⏳", label: "Duración", text: "Entre 6 meses y 1 año." },
      { icon: "🎓", label: "Perfil", text: "Orientadas a último año y/o recién egresados." },
      { icon: "🚀", label: "Para qué sirve", text: "Suelen ser programas de transición o inserción laboral más profunda. Pueden o no ser requisito universitario." },
    ],
  },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: "CL", name: "Chile",     flag: "🇨🇱", active: true  },
  { code: "AR", name: "Argentina", flag: "🇦🇷", active: false },
  { code: "CO", name: "Colombia",  flag: "🇨🇴", active: false },
  { code: "MX", name: "México",    flag: "🇲🇽", active: false },
  { code: "PE", name: "Perú",      flag: "🇵🇪", active: false },
  { code: "ES", name: "España",    flag: "🇪🇸", active: false },
];

// `locked: true` → area card is visible but not clickable yet ("Pronto").
// Sheet URLs stay connected; we just don't expose the area in the UI until it's populated.
const AREAS = [
  { id: "software",    label: "Software & Tech", icon: "💻", color: "#2563eb" },
  { id: "finanzas",    label: "Finanzas",         icon: "📈", color: "#059669" },
  { id: "consultoria", label: "Consultoría",      icon: "🧠", color: "#7c3aed" },
  { id: "marketing",   label: "Marketing",        icon: "📣", color: "#d97706" },
  { id: "rrhh",        label: "RRHH",             icon: "🤝", color: "#059669" },
  { id: "ingenieria",  label: "Ingeniería",       icon: "⚙️",  color: "#dc2626", locked: true },
  { id: "legal",       label: "Legal",            icon: "⚖️",  color: "#0891b2", locked: true },
  { id: "salud",       label: "Salud",            icon: "🏥", color: "#e11d48", locked: true },
  { id: "diseno",      label: "Diseño & UX",      icon: "🎨", color: "#d97706", locked: true },
  { id: "educacion",   label: "Educación",        icon: "📚", color: "#7c3aed", locked: true },
];

const STATUS_OPTIONS = ["Sin estado","Interesado/a","Postulé","Entrevista","Oferta","Rechazado"];

const SS = {
  "Sin estado":   { bg: "#f1f5f9", text: "#94a3b8", border: "#e2e8f0" },
  "Interesado/a": { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  "Postulé":      { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  "Entrevista":   { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  "Oferta":       { bg: "#faf5ff", text: "#7c3aed", border: "#e9d5ff" },
  "Rechazado":    { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
};

// Dark-mode status colors: deep tinted backgrounds + bright text, tuned for true-black UI
const SS_DARK = {
  "Sin estado":   { bg: "#18181b", text: "#8e8e98", border: "#28282d" },
  "Interesado/a": { bg: "#0e1c30", text: "#5fa8fb", border: "#1c3454" },
  "Postulé":      { bg: "#0c2116", text: "#40d47e", border: "#163524" },
  "Entrevista":   { bg: "#241b0c", text: "#f5b638", border: "#3d2f12" },
  "Oferta":       { bg: "#1d0f2e", text: "#bf7cf9", border: "#301a4d" },
  "Rechazado":    { bg: "#280f16", text: "#fb6a7f", border: "#421a24" },
};

// Return the right status color set for the current theme
function statusColors(status, dark) {
  const map = dark ? SS_DARK : SS;
  return map[status] || map["Sin estado"];
}

// ─── THEME (light default) ────────────────────────────────────────────────────
const LT = {
  bg:        "#f8fafc",
  surface:   "#ffffff",
  card:      "#ffffff",
  border:    "#e2e8f0",
  borderMid: "#cbd5e1",
  text:      "#0f172a",
  textSec:   "#334155",
  muted:     "#64748b",
  faint:     "#94a3b8",
  input:     "#ffffff",
  thead:     "#f1f5f9",
  pill:      "#f1f5f9",
  navBg:     "rgba(248,250,252,0.92)",
  dropdown:  "#ffffff",
  red:       "#d4281a",
  redLight:  "#fff1f0",
  accent:    "#2563eb",
};
const DT = {
  bg:        "#000000",
  surface:   "#0c0c0e",
  card:      "#0c0c0e",
  border:    "#212124",
  borderMid: "#2e2e33",
  text:      "#f5f5f7",
  textSec:   "#b0b0b8",
  muted:     "#76767e",
  faint:     "#4e4e56",
  input:     "#0a0a0c",
  thead:     "#0a0a0c",
  pill:      "#161619",
  navBg:     "rgba(0,0,0,0.85)",
  dropdown:  "#141416",
  red:       "#ff4438",
  redLight:  "#2a0f0d",
  accent:    "#5aabff",
};

// ─── OPPORTUNITY COUNTS ──────────────────────────────────────────────────────
// Admin: update counts in Supabase whenever you add new rows to a Sheet
// Run in Supabase SQL Editor: update opportunity_counts set count=N where key='area_subcat';

const SEEN_KEY = "mipasantia_seen_counts";

function getSeenCounts() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"); } catch { return {}; }
}
function markSeen(key, count) {
  try {
    const seen = getSeenCounts();
    seen[key] = count;
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {}
}
function hasNew(key, liveCounts) {
  if (!liveCounts || liveCounts[key] === undefined) return false;
  const seen = getSeenCounts();
  const seenCount = seen[key] ?? -1;
  return liveCounts[key] > seenCount;
}

// ─── UTILS ───────────────────────────────────────────────────────────────────

// Parse multiple cities from region string. Supports separators: , ; | /
function parseRegions(regionStr) {
  if (!regionStr) return [];
  return regionStr.split(/[,;|/]/).map(s => s.trim()).filter(Boolean);
}

// Parse a date string from the Sheet. Supports DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD,
// and falls back to native Date parsing if format is unrecognized.
// Returns a Date object or null if unparseable.
function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  if (!s) return null;

  // DD/MM/YYYY or DD-MM-YYYY (day first, common in Chile/LATAM/ES)
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    d = parseInt(d, 10); mo = parseInt(mo, 10); y = parseInt(y, 10);
    if (y < 100) y += 2000;
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return new Date(y, mo - 1, d);
    }
  }

  // ISO YYYY-MM-DD (also accepted)
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return new Date(y, mo - 1, d);
    }
  }

  // Fallback to native parser (handles "Aug 15 2025" etc.)
  const native = new Date(s);
  return isNaN(native.getTime()) ? null : native;
}

// Build URL for company logo stored in Supabase Storage `logos` bucket.
// Pass the filename without extension (e.g. "santander" → tries png, svg, webp).
// Returns null if no SUPABASE_URL configured.
function logoUrl(name, ext = "png") {
  if (!SUPABASE_URL || !name) return null;
  // Sanitize: lowercase, alphanumeric + hyphens only
  const clean = name.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
  if (!clean) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/logos/${clean}.${ext}`;
}

function postedStyle(posted, deadline) {
  if (!posted) return {};
  const postedDate = parseDate(posted);
  const deadlineDate = parseDate(deadline);
  if (!postedDate) return {};
  const daysOld  = Math.floor((Date.now() - postedDate) / 86400000);
  const daysLeft = deadlineDate ? Math.floor((deadlineDate - Date.now()) / 86400000) : 999;
  if (daysOld <= 7)   return { color: "#2563eb", fontWeight: 600, title: "Publicado recientemente" };
  if (daysLeft >= 0)  return { color: "#16a34a", title: "Postulaciones abiertas" };
  return {};
}

function deadlineInfo(d) {
  if (!d) return null;
  const parsed = parseDate(d);
  if (!parsed) return null;
  const days = Math.floor((parsed - Date.now()) / 86400000);
  if (days < 0)   return { color: "#ef4444", text: "⛔ Cerrado" };
  if (days <= 5)  return { color: "#f59e0b", text: "⚠️ " + d + " (" + days + "d)" };
  if (days <= 14) return { color: "#10b981", text: d + " (" + days + "d)" };
  return { color: null, text: d };
}

async function fetchSheet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const text = await res.text();
  if (!text || text.trim().length < 5) throw new Error("Sheet vacío");

  const parseCSVRow = row => {
    const result = [];
    let cur = "", inQ = false;
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '"') { inQ = !inQ; }
      else if (row[i] === "," && !inQ) { result.push(cur.trim()); cur = ""; }
      else { cur += row[i]; }
    }
    result.push(cur.trim());
    return result;
  };

  const rows = text.trim().split("\n").map(parseCSVRow);
  if (!rows || rows.length < 2) throw new Error("Sin filas en el Sheet");
  const headers = rows[0];
  if (!headers || headers.length === 0) throw new Error("Sin encabezados");

  return rows.slice(1)
    .filter(r => r && r.some(v => v && v.trim()))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h.trim()] = (row[i] || "").trim(); });
      return obj;
    });
}

async function hashPwd(pwd) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pwd + ":pasantiamap"));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const uKey = e => "u:" + btoa(e).replace(/=/g,"");
const pKey = e => "p:" + btoa(e).replace(/=/g,"");
// ─── AUTH BACKEND ────────────────────────────────────────────────────────────
// Supabase config — fill these in after creating your project at supabase.com
// Then run: npm install @supabase/supabase-js
// Keys come from Vercel environment variables — never hardcode them here
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "";

const useSupabase = SUPABASE_URL && SUPABASE_KEY;

// Supabase client — created once at module load
const _sb = useSupabase ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
function getSB() { return _sb; }

// ── User storage (localStorage fallback while Supabase not configured) ────────
function loadUser(email)   { try { const v=localStorage.getItem(uKey(email)); return v?JSON.parse(v):null; } catch { return null; } }
function saveUser(email,d) { try { localStorage.setItem(uKey(email),JSON.stringify(d)); } catch {} }
function loadProg(email)   { try { const v=localStorage.getItem(pKey(email)); return v?JSON.parse(v):{};  } catch { return {};  } }
function saveProg(email,d) { try { localStorage.setItem(pKey(email),JSON.stringify(d)); } catch {} }

// ── Supabase auth helpers (used when SUPABASE_URL is set) ────────────────────
async function sbSignUp(email, password, name) {
  const sb = getSB();
  if (!sb) return null;
  const { error } = await sb.auth.signUp({
    email, password,
    options: { data: { name, full_name: name } }
  });
  if (error) throw new Error(error.message);
}

async function sbSignIn(email, password) {
  const sb = getSB();
  if (!sb) return null;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

async function sbSignInGoogle() {
  const sb = getSB();
  if (!sb) throw new Error("Supabase no configurado");
  const { error } = await sb.auth.signInWithOAuth({ provider: "google",
    options: { redirectTo: window.location.origin } });
  if (error) throw new Error(error.message);
}

async function sbLoadProg(userId) {
  const sb = getSB();
  if (!sb) return null;
  const { data, error } = await sb
    .from("progress")
    .select("data")
    .eq("user_id", userId)
    .limit(1);
  if (error) { console.error("sbLoadProg error:", error.message); return {}; }
  return (data && data.length > 0) ? data[0].data : {};
}

async function sbSaveProg(userId, prog) {
  const sb = getSB();
  if (!sb) return;
  const { error } = await sb.from("progress")
    .upsert({ user_id: userId, data: prog, updated_at: new Date().toISOString() },
             { onConflict: "user_id" });
  if (error) console.error("sbSaveProg:", error.message);
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark,       setDark]       = useState(false);
  const [page,       setPage]       = useState("landing");
  const [user,       setUser]       = useState(null);
  const [progress,   setProgress]   = useState({});
  const [country,    setCountry]    = useState(null);
  const [area,       setArea]       = useState(null);
  const [fading,     setFading]     = useState(false);
  const [authOpen,   setAuthOpen]   = useState(false);
  const [liveCounts, setLiveCounts] = useState({});

  const t = dark ? DT : LT;

  const go = (to, opts) => {
    setFading(true);
    // Scroll to top so new page starts clean
    window.scrollTo({ top: 0, behavior: "instant" });
    setTimeout(() => {
      if (opts?.country !== undefined) setCountry(opts.country);
      if (opts?.area    !== undefined) setArea(opts.area);
      setPage(to);
      setFading(false);
    }, 160);
  };

  const login = (email, name, sbUserId) => {
    const prog = sbUserId ? {} : loadProg(email);
    setUser({ email, name, sbUserId: sbUserId || null });
    setProgress(prog);
    setAuthOpen(false);
    if (sbUserId) sbLoadProg(sbUserId).then(p => { if (p) setProgress(p); });
  };

  const logout = async () => {
    const sb = getSB();
    if (sb) await sb.auth.signOut();
    setUser(null); setProgress({});
  };

  const [saveMsg, setSaveMsg] = useState("");

  const saveProgress = async (next) => {
    if (!user) return;
    if (user.sbUserId) {
      const sb = getSB();
      if (!sb) return;
      const { error } = await sb
        .from("progress")
        .upsert({ user_id: user.sbUserId, data: next, updated_at: new Date().toISOString() },
                 { onConflict: "user_id" });
      if (error) {
        console.error("Save error:", error);
        setSaveMsg("❌ Error al guardar: " + error.message);
      } else {
        setSaveMsg("✅ Guardado");
      }
    } else {
      saveProg(user.email, next);
      setSaveMsg("✅ Guardado");
    }
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const updStatus = useCallback(async (jobId, status, meta) => {
    if (!user) { setAuthOpen(true); return; }
    const next = { ...progress, [jobId]: { ...(progress[jobId]||{}), status, ...(meta||{}) } };
    setProgress(next);
    await saveProgress(next);
  }, [progress, user]);

  const updNote = useCallback(async (jobId, notes) => {
    if (!user) return;
    const next = { ...progress, [jobId]: { ...(progress[jobId]||{}), notes } };
    setProgress(next);
    await saveProgress(next);
  }, [progress, user]);

  // Fetch opportunity counts from Supabase on mount
  useEffect(() => {
    const sb = getSB();
    if (!sb) return;
    sb.from("opportunity_counts").select("key, count")
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach(row => { map[row.key] = row.count; });
        setLiveCounts(map);
      })
      .catch(() => {});
  }, []);

  // Auth: Supabase handles everything via onAuthStateChange
  // (session restore on reload, OAuth redirects, email/password login)
  useEffect(() => {
    const sb = getSB();
    if (!sb) return;
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        const u = session.user;
        const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email.split("@")[0];
        setUser({ email: u.email, name, sbUserId: u.id });
        setAuthOpen(false);
        // Clean URL if coming from OAuth redirect
        if (window.location.hash || window.location.search.includes("code=")) {
          window.history.replaceState(null, "", window.location.pathname);
        }
        sbLoadProg(u.id).then(p => { if (p && Object.keys(p).length > 0) setProgress(p); });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProgress({});
      }
    });
    return () => subscription.unsubscribe();
  }, []);


  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:t.bg, color:t.text, minHeight:"100vh", transition:"background .25s,color .25s" }}>
      <Styles t={t} dark={dark} />

      <Navbar t={t} dark={dark} setDark={setDark} user={user} logout={logout} setAuthOpen={setAuthOpen} page={page} country={country} area={area} go={go} saveMsg={saveMsg} />

      {authOpen && <AuthModal t={t} login={login} close={() => setAuthOpen(false)} />}

      <div key={page} className={fading ? "page-leaving" : "page-entering"} style={{ paddingTop:56 }}>
        {page==="landing" && <Landing  t={t} dark={dark} go={go} user={user} liveCounts={liveCounts} />}
        {page==="country" && <CountryPage t={t} go={go} />}
        {page==="area"    && <AreaPage t={t} go={go} country={country} liveCounts={liveCounts} />}
        {page==="tracker" && <Tracker  t={t} dark={dark} go={go} country={country} area={area} progress={progress} updStatus={updStatus} updNote={updNote} user={user} setAuthOpen={setAuthOpen} liveCounts={liveCounts} />}
        {page==="profile"  && <Profile t={t} dark={dark} go={go} user={user} progress={progress} setUser={setUser} setProgress={setProgress} />}
        {page==="about"    && <About t={t} go={go} />}
        {!["landing","country","area","tracker","profile","about"].includes(page) && <NotFound t={t} go={go} />}
      </div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ t, dark, setDark, user, logout, setAuthOpen, page, country, area, go, saveMsg }) {
  const cd = COUNTRIES.find(c=>c.code===country);
  const ad = AREAS.find(a=>a.id===area);
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:300, height:56, padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", background:t.navBg, backdropFilter:"blur(20px)", borderBottom:"1px solid "+t.border }}>
      <button onClick={()=>go("landing")} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
        <span style={{ fontSize:16 }}>🌎</span>
        <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:15, color:t.text }}>
          <span style={{ color:t.red }}>Mi</span>Pasantía
        </span>
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {saveMsg && (
          <span style={{ fontSize:12, color: saveMsg.startsWith("✅") ? "#16a34a" : "#ef4444",
            background: saveMsg.startsWith("✅") ? "#f0fdf4" : "#fff1f0",
            border: "1px solid " + (saveMsg.startsWith("✅") ? "#bbf7d0" : "#fecdd3"),
            padding:"3px 10px", borderRadius:20, transition:"opacity .3s" }}>
            {saveMsg}
          </span>
        )}
        {page==="tracker" && cd && (
          <span style={{ fontSize:11, color:t.muted, display:"flex", alignItems:"center", gap:5 }}>
            <button onClick={()=>go("country")} style={{ background:"none", border:"none", cursor:"pointer", color:t.muted, fontSize:11, padding:0 }}>{cd.flag} {cd.name}</button>
            {ad && <><span>·</span><span>{ad.icon} {ad.label}</span></>}
          </span>
        )}

        <button onClick={()=>setDark(d=>!d)} style={{ background:t.pill, border:"1px solid "+t.border, borderRadius:20, padding:"5px 12px", cursor:"pointer", fontSize:12, color:t.muted }}>
          {dark ? "☀️" : "🌙"}
        </button>

        {user ? (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={()=>go("profile")} style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,"+t.red+",#6644cc)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", border:"none", cursor:"pointer" }}>
              {user.name[0].toUpperCase()}
            </button>
            <button onClick={()=>go("profile")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:t.textSec, maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"inherit", padding:0 }}>{user.name}</button>
            <button onClick={logout} style={{ background:"none", border:"1px solid "+t.border, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:12, color:t.muted }}>Salir</button>
          </div>
        ) : (
          <button onClick={()=>setAuthOpen(true)} style={{ background:t.red, border:"none", borderRadius:8, padding:"7px 16px", cursor:"pointer", fontSize:13, color:"#fff", fontWeight:600, fontFamily:"inherit" }}>
            Iniciar sesión
          </button>
        )}
      </div>
    </nav>
  );
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
function AuthModal({ t, login, close }) {
  const [tab,  setTab]  = useState("login");
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [pwd,  setPwd]  = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

  const [confirmed, setConfirmed] = useState(false);

  const submit = async () => {
    setErr("");
    if (!mail || !pwd) { setErr("Completa todos los campos."); return; }
    setBusy(true);
    try {
      if (tab === "register") {
        if (!name)        { setErr("Ingresa tu nombre."); setBusy(false); return; }
        if (pwd !== pwd2) { setErr("Las contraseñas no coinciden."); setBusy(false); return; }
        if (pwd.length < 6){ setErr("Mínimo 6 caracteres."); setBusy(false); return; }
        if (useSupabase) {
          await sbSignUp(mail, pwd, name);
          setConfirmed(true);
          // Fire-and-forget welcome email
          fetch("/api/welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: mail, name }),
          }).catch(() => {});
        } else {
          if (loadUser(mail)) { setErr("Ya existe una cuenta con ese correo."); setBusy(false); return; }
          const hash = await hashPwd(pwd);
          saveUser(mail, { name, hash });
          login(mail, name, null);
        }
      } else {
        if (useSupabase) {
          await sbSignIn(mail, pwd);
          // onAuthStateChange fires and closes modal + sets user
        } else {
          const hash = await hashPwd(pwd);
          const u = loadUser(mail);
          if (!u)            { setErr("No encontramos esa cuenta."); setBusy(false); return; }
          if (u.hash !== hash){ setErr("Contraseña incorrecta."); setBusy(false); return; }
          login(mail, u.name, null);
        }
      }
    } catch(e) {
      setErr(e.message || "Algo salió mal. Inténtalo de nuevo.");
    }
    setBusy(false);
  };


  const inp = { background:t.input, border:"1px solid "+t.border, borderRadius:9, color:t.text, padding:"11px 14px", fontFamily:"inherit", fontSize:14, outline:"none", width:"100%", transition:"border .2s" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={close} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.45)", backdropFilter:"blur(4px)" }} />
      <div className="modal-in" style={{ position:"relative", width:"100%", maxWidth:400, background:t.card, border:"1px solid "+t.border, borderRadius:18, padding:"36px 32px", boxShadow:"0 24px 64px rgba(0,0,0,.2)" }}>
        <button onClick={close} style={{ position:"absolute", top:14, right:16, background:"none", border:"none", cursor:"pointer", fontSize:18, color:t.muted }}>×</button>
        <div style={{ textAlign:"center", marginBottom:26 }}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:20, marginBottom:4 }}>
            <span style={{ color:t.red }}>Mi</span>Pasantía
          </div>
          <p style={{ color:t.muted, fontSize:13 }}>{tab==="login"?"Inicia sesión para guardar tu progreso":"Crea tu cuenta gratis"}</p>
        </div>

        <div style={{ display:"flex", background:t.pill, borderRadius:9, padding:3, marginBottom:22, border:"1px solid "+t.border }}>
          {["login","register"].map(tb => (
            <button key={tb} onClick={()=>{setTab(tb);setErr("");}} style={{ flex:1, padding:"8px 0", border:"none", borderRadius:7, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", transition:"all .18s", background:tab===tb?t.surface:"transparent", color:tab===tb?t.text:t.muted, boxShadow:tab===tb?"0 1px 4px rgba(0,0,0,.1)":"none" }}>
              {tb==="login"?"Iniciar sesión":"Registrarse"}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {tab==="register" && <input placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor=t.red} onBlur={e=>e.target.style.borderColor=t.border} />}
          <input placeholder="Correo electrónico" type="email" value={mail} onChange={e=>setMail(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor=t.red} onBlur={e=>e.target.style.borderColor=t.border} onKeyDown={e=>e.key==="Enter"&&submit()} />
          <input placeholder="Contraseña" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor=t.red} onBlur={e=>e.target.style.borderColor=t.border} onKeyDown={e=>e.key==="Enter"&&submit()} />
          {tab==="register" && <input placeholder="Confirmar contraseña" type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor=t.red} onBlur={e=>e.target.style.borderColor=t.border} onKeyDown={e=>e.key==="Enter"&&submit()} />}
        </div>

        {err && (
          <div style={{ marginTop:10, padding:"9px 13px", background: err.startsWith("✅") ? "#f0fdf4" : "#fff1f0", border:"1px solid " + (err.startsWith("✅") ? "#bbf7d0" : "#fca5a533"), borderRadius:8, color: err.startsWith("✅") ? "#16a34a" : "#ef4444", fontSize:12 }}>
            {err}
          </div>
        )}

        {confirmed ? (
          <div style={{ marginTop:16, padding:"16px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>📧</div>
            <div style={{ fontWeight:600, color:"#16a34a", marginBottom:4 }}>Revisa tu correo</div>
            <div style={{ fontSize:12, color:"#4b5563" }}>Te enviamos un link de confirmación a <strong>{mail}</strong>. Una vez confirmado podrás iniciar sesión.</div>
          </div>
        ) : (
          <button onClick={submit} disabled={busy} className="cta" style={{ width:"100%", marginTop:16, fontSize:14, padding:"12px 0", justifyContent:"center" }}>
            {busy ? <><span className="spin-icon">⟳</span> Cargando…</> : tab==="login" ? "Entrar →" : "Crear cuenta →"}
          </button>
        )}

        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0 0" }}>
          <div style={{ flex:1, height:1, background:t.border }} />
          <span style={{ fontSize:11, color:t.muted }}>o</span>
          <div style={{ flex:1, height:1, background:t.border }} />
        </div>
        <button onClick={useSupabase ? sbSignInGoogle : null} disabled={!useSupabase}
          style={{ marginTop:10, width:"100%", padding:"10px 0", background:t.pill, border:"1px solid "+t.border, borderRadius:9, cursor:useSupabase?"pointer":"not-allowed", fontSize:13, color:useSupabase?t.text:t.muted, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:9, opacity:useSupabase?1:.55, transition:"all .2s" }}>
          <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Continuar con Google
          {!useSupabase && <span style={{ fontSize:10, background:t.border, padding:"1px 6px", borderRadius:4, marginLeft:2 }}>Próximamente</span>}
        </button>
      </div>
    </div>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
function Landing({ t, dark, go, user, liveCounts }) {
  const liveTotal = liveCounts ? Object.values(liveCounts).reduce((s,n)=>s+(Number(n)||0),0) : 0;
  const demoTotal = Object.values(DEMO_DATA).reduce((s,a)=>s+Object.values(a).reduce((ss,arr)=>ss+arr.length,0),0);
  const total = liveTotal > 0 ? liveTotal : demoTotal;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 56px)", padding:"40px 24px", position:"relative", overflow:"hidden" }}>
      <div aria-hidden style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:`radial-gradient(circle,${dark?"rgba(255,68,56,.10)":"rgba(212,40,26,.06)"},transparent 60%)`, top:"-10%", left:"50%", transform:"translateX(-50%)" }} />
        <div className="grid-anim" style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${dark?"rgba(255,255,255,.045)":"rgba(0,0,0,.03)"} 1px,transparent 1px),linear-gradient(90deg,${dark?"rgba(255,255,255,.045)":"rgba(0,0,0,.03)"} 1px,transparent 1px)`, backgroundSize:"48px 48px" }} />
      </div>
      <div className="land-in" style={{ position:"relative", textAlign:"center", maxWidth:680 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:t.pill, border:"1px solid "+t.border, borderRadius:20, padding:"5px 14px", marginBottom:28, fontSize:11, color:t.muted, letterSpacing:".07em", textTransform:"uppercase", fontWeight:700 }}>
          <span className="blink-dot" /> {total}+ oportunidades curadas · Chile · LATAM · España
        </div>
        <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:"clamp(40px,8vw,80px)", fontWeight:700, lineHeight:1.04, letterSpacing:"-.04em", color:t.text, marginBottom:18 }}>
          {user
            ? <>{user.name.split(" ")[0]+","}<br /><span style={{color:t.red}}>¿qué pasantía</span><br />buscas hoy?</>
            : <>Tu próxima<br /><span style={{color:t.red}}>pasantía</span> te<br />está esperando.</>
          }
        </h1>
        <p style={{ fontSize:17, color:t.muted, lineHeight:1.7, margin:"0 auto 44px", maxWidth:460 }}>
          Oportunidades reales en América Latina y España — curadas a mano, con links directos {user ? "y tu progreso guardado." : "y seguimiento de postulaciones."}
        </p>
        <button className="cta" onClick={()=>go("country")} style={{ fontSize:16, padding:"15px 48px" }}>
          Explorar pasantías →
        </button>
        <div style={{ marginTop:52, display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap" }}>
          {AREAS.filter(a=>!a.locked).map(a=><span key={a.id} style={{ fontSize:12, color:t.faint }}>{a.icon} {a.label}</span>)}
        </div>
        <button onClick={()=>go("about")} style={{ marginTop:38, background:"none", border:"none", color:t.muted, cursor:"pointer", fontSize:13, fontFamily:"inherit", textDecoration:"underline", textUnderlineOffset:4 }}>
          ¿Qué es MiPasantía? →
        </button>
      </div>
    </div>
  );
}

// ─── COUNTRY PAGE ─────────────────────────────────────────────────────────────
function CountryPage({ t, go }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minHeight:"calc(100vh - 56px)", padding:"60px 24px" }}>
      <div className="page-in" style={{ textAlign:"center", marginBottom:48 }}>
        <p style={{ fontSize:11, color:t.red, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", marginBottom:8 }}>Paso 1 de 2</p>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:"clamp(26px,5vw,48px)", fontWeight:700, letterSpacing:"-.03em", color:t.text }}>¿En qué país?</h2>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, maxWidth:740, width:"100%" }}>
        {COUNTRIES.map((c,i)=>(
          <button key={c.code} onClick={()=>c.active&&go("area",{country:c.code})} className={c.active?"country-card":"country-card-soon"}
            style={{ "--i":i, background:t.card, border:"1.5px solid "+t.border, opacity:c.active?1:.55, cursor:c.active?"pointer":"default", borderRadius:14, padding:"24px 14px", display:"flex", flexDirection:"column", alignItems:"center", gap:10, position:"relative", transition:"all .18s", fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ fontSize:44, lineHeight:1 }}>{c.flag}</span>
            <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, color:t.text }}>{c.name}</span>
            {!c.active && <span style={{ position:"absolute", top:8, right:8, fontSize:9, background:t.pill, color:t.muted, padding:"2px 6px", borderRadius:4, fontWeight:700, letterSpacing:".06em", border:"1px solid "+t.border }}>PRONTO</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── AREA PAGE ────────────────────────────────────────────────────────────────
function AreaPage({ t, go, country, liveCounts }) {
  const cd = COUNTRIES.find(c=>c.code===country);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minHeight:"calc(100vh - 56px)", padding:"60px 24px" }}>
      <div className="page-in" style={{ textAlign:"center", marginBottom:44 }}>
        <p style={{ fontSize:11, color:t.red, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", marginBottom:8 }}>Paso 2 de 2 · {cd?.flag} {cd?.name}</p>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:"clamp(26px,5vw,48px)", fontWeight:700, letterSpacing:"-.03em", color:t.text, marginBottom:8 }}>¿En qué área?</h2>
        <p style={{ color:t.muted, fontSize:14 }}>Selecciona un área para ver oportunidades curadas</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))", gap:11, maxWidth:800, width:"100%", marginBottom:18 }}>
        {AREAS.map((a,i)=>{
          const subcatKeys = ["verano","tradicional","eventos"];
          const sheetCount = subcatKeys.filter(k => SHEET_URLS[a.id+"_"+k]).length;
          const demoCount  = Object.values(DEMO_DATA[a.id]||{}).reduce((s,arr)=>s+arr.length,0);
          const hasSheets  = sheetCount > 0;
          // Check if any subcat of this area has new opportunities
          const areaHasNew = !a.locked && subcatKeys.some(k => hasNew(a.id+"_"+k, liveCounts));
          return (
            <button key={a.id}
              onClick={a.locked ? undefined : ()=>go("tracker",{area:a.id})}
              disabled={a.locked}
              title={a.locked ? "Estamos preparando esta área" : undefined}
              className={a.locked ? "area-card area-locked" : "area-card"}
              style={{ "--i":i, "--ac":a.color, background:t.card, border:"1.5px solid "+t.border, borderRadius:12, padding:"18px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:7, cursor:a.locked?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", position:"relative", opacity:a.locked?.55:1 }}>
              {areaHasNew && (
                <span style={{ position:"absolute", top:8, right:8, width:9, height:9, borderRadius:"50%", background:"#d4281a", boxShadow:"0 0 0 2px white" }} />
              )}
              <span style={{ fontSize:26, filter:a.locked?"grayscale(1)":"none" }}>{a.icon}</span>
              <span style={{ fontWeight:600, fontSize:12, color:t.text, lineHeight:1.3, textAlign:"center" }}>{a.label}</span>
              {a.locked ? (
                <span style={{ fontSize:9.5, color:t.faint, background:t.pill, border:"1px solid "+t.border, padding:"2px 8px", borderRadius:20, fontWeight:600, letterSpacing:".04em" }}>
                  🔒 PRONTO
                </span>
              ) : (
                <span style={{ fontSize:10, color:t.muted }}>
                  {hasSheets ? "Ver oportunidades →" : demoCount + " oportunidades"}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button onClick={()=>go("country")} style={{ marginTop:8, background:"none", border:"none", color:t.muted, cursor:"pointer", fontSize:13 }}>← Cambiar país</button>
    </div>
  );
}

// ─── TRACKER ──────────────────────────────────────────────────────────────────
function Tracker({ t, dark, go, country, area, progress, updStatus, updNote, user, setAuthOpen, liveCounts }) {
  const cd = COUNTRIES.find(c=>c.code===country);
  const ad = AREAS.find(a=>a.id===area);
  const [subcat,      setSubcat]      = useState("verano");
  const [jobs,        setJobs]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [sheetError,  setSheetError]  = useState("");
  const [views,       setViews]       = useState({ total: null, today: null });
  const [celebrateTotal, setCelebrateTotal] = useState(null);
  const [dropdown,    setDropdown]    = useState(null);
  const [search,      setSearch]      = useState("");
  const [remFilt,     setRemFilt]     = useState("Todas");
  const [stFilt,      setStFilt]      = useState("Todas");
  const [cityFilt,    setCityFilt]    = useState("Todas");

  const filtersActive = search !== "" || remFilt !== "Todas" || stFilt !== "Todas" || cityFilt !== "Todas";
  const clearFilters = () => { setSearch(""); setRemFilt("Todas"); setStFilt("Todas"); setCityFilt("Todas"); };
  const [collapsed,   setCollapsed]   = useState({});
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 700);
  const [groupBy,     setGroupBy]     = useState(() => {
    try { return localStorage.getItem("mipasantia_groupby") || "auto"; } catch { return "auto"; }
  });
  const [infoModal,   setInfoModal]   = useState(null); // "stage" | "last_open" | "process" | null
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);   // { groupName: true/false }

  const areaData = DEMO_DATA[area] || {};
  const isEvent  = subcat === "eventos";

  // Persist groupBy preference
  useEffect(() => {
    try { localStorage.setItem("mipasantia_groupby", groupBy); } catch {}
    setCollapsed({});
  }, [groupBy]);

  // Reset filters + mark seen when switching
  useEffect(() => {
    setCityFilt("Todas");
    setCollapsed({});
    setCelebrateTotal(null); // clear any pending celebration when changing tabs
    // Mark this subcat as seen so dot disappears
    const key = (area || "todas") + "_" + subcat;
    if (liveCounts && liveCounts[key] !== undefined) {
      markSeen(key, liveCounts[key]);
    }
  }, [subcat, area, liveCounts]);

  // Track + fetch page views — RPC returns updated values atomically
  useEffect(() => {
    const sb = getSB();
    if (!sb) return;
    const key = (area || "todas") + "_" + subcat;
    sb.rpc("increment_views", { p_key: key })
      .then(({ data, error }) => {
        console.log("views rpc result:", JSON.stringify({ data, error }));
        if (error) { setViews({ total: null, today: null }); return; }
        // Handle both array and single object responses
        const row = Array.isArray(data) ? data[0] : data;
        if (row && (row.total !== undefined)) {
          const newTotal = Number(row.total);
          setViews({ total: newTotal, today: Number(row.today) });
          // Celebrate if THIS visit is the one that crossed a hundred (e.g. 299 → 300)
          if (newTotal > 0 && newTotal % 100 === 0) setCelebrateTotal(newTotal);
        } else {
          // Fallback: read directly from table
          sb.from("page_views").select("total,today").eq("page_key", key).limit(1)
            .then(({ data: d2 }) => {
              if (d2 && d2[0]) setViews({ total: Number(d2[0].total), today: Number(d2[0].today) });
            });
        }
      })
      .catch(e => { console.error("views error:", e); setViews({ total: null, today: null }); });
  }, [area, subcat]);

  // Guard: if someone lands on a locked area, send them back to the area picker
  useEffect(() => {
    if (ad?.locked) go("area");
  }, [ad, go]);

  // Load jobs — Sheet if configured, else demo data
  useEffect(() => {
    const key = area + "_" + subcat;
    if (SHEET_URLS[key]) {
      setLoading(true);
      setSheetError("");
      fetchSheet(SHEET_URLS[key])
        .then(rows => {
          if (rows.length === 0) {
            setSheetError("El Sheet está vacío o los encabezados no coinciden.");
            setJobs(areaData[subcat] || []);
          } else {
            setJobs(rows.map((r,i) => ({ ...r, id: r.id || (area+"-"+subcat+"-"+i) })));
          }
        })
        .catch(err => { setSheetError("Error: " + err.message); setJobs(areaData[subcat] || []); })
        .finally(()  => setLoading(false));
    } else {
      // No URL configured yet (e.g. Off-Cycle/Intermedia not loaded)
      setSheetError("");
      setJobs(areaData[subcat] || []);
    }
  }, [area, subcat]);

  // Merge with user progress — keep sheet notes separate from user personal notes
  const merged = jobs.map(j => ({
    ...j,
    status:     progress[j.id]?.status || "Sin estado",
    sheetNotes: j.notes || "",          // notes from Google Sheet (public)
    notes:      j.notes || "",          // keep for display compatibility
    posted:     j.posted || null,
  }));

  // "Empty sheet" = configured sheet that loaded with zero opportunities (not filtered).
  // Shows the friendly "you're early" state instead of an empty table.
  const sheetEmpty = !loading && merged.length === 0;

  // Cities: flatten all individual cities from comma/pipe/slash-separated regions
  const cities = ["Todas", ...Array.from(
    new Set(merged.flatMap(j => parseRegions(j.region)))
  ).sort()];

  const filtered = merged.filter(j => {
    if (stFilt   !== "Todas" && j.status !== stFilt)   return false;
    if (remFilt  !== "Todas" && j.remote !== remFilt)  return false;
    if (cityFilt !== "Todas" && !parseRegions(j.region).includes(cityFilt)) return false;
    if (search) {
      const searchable = (j.company+" "+j.role+" "+j.region+" "+parseRegions(j.region).join(" ")).toLowerCase();
      if (!searchable.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const stats = {
    total:      merged.length,
    applied:    merged.filter(j=>j.status==="Postulé").length,
    interviews: merged.filter(j=>j.status==="Entrevista").length,
    offers:     merged.filter(j=>j.status==="Oferta").length,
  };

  // Group jobs based on user preference:
  //   "auto"   → use Sheet's `group` column if present, else flat
  //   "region" → group by region
  //   "flat"   → no groups (one big list)
  //   "group"  → force group by Sheet's `group` column
  const sheetHasGroups = filtered.some(j => j.group && j.group.trim());
  let activeMode = groupBy;
  if (activeMode === "auto") activeMode = sheetHasGroups ? "group" : "flat";
  // When the sheet defines groups, flattening is not allowed — fall back to group view
  if (activeMode === "flat" && sheetHasGroups) activeMode = "group";

  let groups;
  let hasGroups;
  if (activeMode === "region") {
    hasGroups = true;
    groups = filtered.reduce((acc, j) => {
      const regs = parseRegions(j.region);
      if (regs.length === 0) {
        if (!acc["Sin región"]) acc["Sin región"] = [];
        acc["Sin región"].push(j);
      } else {
        // Opportunity appears in each of its regions
        regs.forEach(g => {
          if (!acc[g]) acc[g] = [];
          acc[g].push(j);
        });
      }
      return acc;
    }, {});
  } else if (activeMode === "group" && sheetHasGroups) {
    hasGroups = true;
    groups = filtered.reduce((acc, j) => {
      const g = (j.group && j.group.trim()) || "Otras";
      if (!acc[g]) acc[g] = [];
      acc[g].push(j);
      return acc;
    }, {});
  } else {
    hasGroups = false;
    groups = { "": filtered };
  }

  const toggleGroup = g => setCollapsed(prev => ({ ...prev, [g]: !prev[g] }));
  const allCollapsed = Object.keys(groups).length > 0 && Object.keys(groups).every(g => collapsed[g]);
  const toggleAll = () => {
    if (allCollapsed) setCollapsed({});
    else {
      const all = {};
      Object.keys(groups).forEach(g => { all[g] = true; });
      setCollapsed(all);
    }
  };

  const COL_SPAN = isEvent ? 6 : 13;

  return (
    <div onClick={()=>setDropdown(null)} style={{ minHeight:"calc(100vh - 56px)" }}>

      {/* Header */}
      <div style={{ padding:"22px 28px 14px", borderBottom:"1px solid "+t.border }}>
        <button onClick={()=>go("area")} style={{ background:"none", border:"none", color:t.muted, cursor:"pointer", fontSize:12, padding:0, marginBottom:6 }}>← Cambiar área</button>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12, marginBottom:16 }}>
          <div>
            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:t.text, letterSpacing:"-.02em" }}>
              {ad?.icon} {ad?.label}
              <span style={{ color:t.red, marginLeft:10, fontSize:14, fontWeight:500 }}>{cd?.flag} {cd?.name}</span>
            </h2>
            {/* View counter — shown when data is available */}
            {views.total !== null && (
              <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:6 }}>
                <span style={{ fontSize:12, color:t.muted, display:"flex", alignItems:"center", gap:5, position:"relative" }}>
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 10s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"/><circle cx="10" cy="10" r="3"/>
                  </svg>
                  <strong style={{ color:t.textSec, fontVariantNumeric:"tabular-nums", position:"relative" }}>
                    <CountUp value={views.total} />
                    <ConfettiBurst trigger={celebrateTotal} />
                  </strong> visitas totales
                </span>
                <span style={{ fontSize:11, color:t.muted, opacity:.5 }}>·</span>
                <span style={{ fontSize:12, color:t.muted, display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:"#16a34a", display:"inline-block", animation:"blink 2s infinite" }} />
                  <strong style={{ color:"#16a34a", fontVariantNumeric:"tabular-nums" }}>
                    <CountUp value={views.today} duration={700} />
                  </strong> visitas hoy
                </span>
              </div>
            )}
          </div>
          {!user && (
            <button onClick={()=>setAuthOpen(true)} style={{ background:t.redLight, border:"1px solid #fca5a544", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:12, color:t.red, fontWeight:600, fontFamily:"inherit" }}>
              🔒 Inicia sesión para guardar tu progreso
            </button>
          )}
        </div>

        {/* Subcategory tabs */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {Object.keys(SUBCATEGORY_LABELS).map(k => {
            const info  = SUBCATEGORY_LABELS[k];
            const count = (areaData[k]||[]).length || (SHEET_URLS[area+"_"+k] ? "●" : 0);
            const active = subcat === k;
            return (
              <button key={k} onClick={()=>setSubcat(k)} className="press"
                style={{ padding:"7px 16px", borderRadius:20, border:"1.5px solid "+(active?t.red:t.border), background:active?t.red:"transparent", color:active?"#fff":t.muted, fontSize:13, fontWeight:active?600:400, cursor:"pointer", fontFamily:"inherit", transition:"all .18s", display:"flex", alignItems:"center", gap:6, position:"relative" }}>
                {!active && hasNew((area||"todas")+"_"+k, liveCounts) && (
                  <span style={{ position:"absolute", top:4, right:4, width:7, height:7, borderRadius:"50%", background:"#d4281a", boxShadow:"0 0 0 1.5px white" }} />
                )}
                {info.icon} {info.label}
                <span style={{ fontSize:11, background:active?"rgba(255,255,255,.25)":t.pill, padding:"1px 7px", borderRadius:10, color:active?"#fff":t.faint }}>
                  {SHEET_URLS[area+"_"+k] ? "●" : count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:10, padding:"16px 28px", flexWrap:"wrap" }}>
        {[
          {label:"Oportunidades",v:stats.total,      icon:"📋",color:"#2563eb"},
          {label:"Postulaciones",v:stats.applied,    icon:"📤",color:"#16a34a"},
          {label:"Entrevistas",  v:stats.interviews, icon:"🎯",color:"#d97706"},
          {label:"Ofertas",      v:stats.offers,     icon:"🎉",color:"#7c3aed"},
        ].map(s=>(
          <div key={s.label} style={{ background:t.card, border:"1px solid "+t.border, borderRadius:10, padding:"11px 16px", flex:1, minWidth:80 }}>
            <div style={{ fontSize:14, marginBottom:2 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:"'Sora',sans-serif", lineHeight:1 }}>
              <CountUp value={s.v} duration={650} />
            </div>
            <div style={{ fontSize:10, color:t.muted, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Period info — explains what this kind of internship is about */}
      {SUBCATEGORY_INFO[subcat] && (
        <PeriodInfo info={SUBCATEGORY_INFO[subcat]} subcat={subcat} t={t} dark={dark} />
      )}

      {/* Quick status chips — shows my progress at a glance */}
      {!isEvent && (() => {
        const myCounts = {};
        merged.forEach(j => { if (j.status !== "Sin estado") myCounts[j.status] = (myCounts[j.status]||0)+1; });
        const total = Object.values(myCounts).reduce((a,b)=>a+b,0);
        if (total === 0) return null;
        return (
          <div style={{ padding:"0 28px 10px", display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:11, color:t.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>Mis postulaciones:</span>
            {["Interesado/a","Postulé","Entrevista","Oferta","Rechazado"].map(s => {
              if (!myCounts[s]) return null;
              const sc = statusColors(s, dark);
              const active = stFilt === s;
              return (
                <button key={s} onClick={() => setStFilt(active ? "Todas" : s)}
                  style={{ background: active ? sc.text : sc.bg, color: active ? "#fff" : sc.text,
                    border:"1px solid "+sc.border, borderRadius:20, padding:"3px 10px",
                    fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"inherit",
                    display:"inline-flex", alignItems:"center", gap:5, transition:"all .15s" }}>
                  {s} <span style={{ background: active?"rgba(255,255,255,.3)":t.surface, borderRadius:10, padding:"0 5px", fontSize:11 }}>{myCounts[s]}</span>
                </button>
              );
            })}
            {stFilt !== "Todas" && (
              <button onClick={() => setStFilt("Todas")}
                style={{ background:"none", border:"none", color:t.muted, cursor:"pointer", fontSize:11, textDecoration:"underline", fontFamily:"inherit" }}>
                Ver todas
              </button>
            )}
          </div>
        );
      })()}

      {/* Filters */}
      <div style={{ padding:"0 28px 12px", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <input placeholder="🔎 Empresa, rol, región..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ background:t.input, border:"1px solid "+t.border, borderRadius:8, color:t.text, padding:"7px 12px", fontFamily:"inherit", fontSize:13, outline:"none", width:isMobile?"100%":"210px" }} />
        {!isEvent && <>
          <select value={stFilt} onChange={e=>setStFilt(e.target.value)}
            style={{ background:t.input, color:t.text, border:"1px solid "+t.border, borderRadius:8, padding:"7px 11px", fontFamily:"inherit", fontSize:13, cursor:"pointer", flex: isMobile?"1":"none" }}>
            <option value="Todas">Todos los estados</option>
            {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
          </select>
          {!isMobile && <>
            <select value={remFilt} onChange={e=>setRemFilt(e.target.value)}
              style={{ background:t.input, color:t.text, border:"1px solid "+t.border, borderRadius:8, padding:"7px 11px", fontFamily:"inherit", fontSize:13, cursor:"pointer" }}>
              <option value="Todas">Toda modalidad</option>
              {["Remoto","Híbrido","Presencial"].map(r=><option key={r}>{r}</option>)}
            </select>
            {cities.length > 2 && (
              <select value={cityFilt} onChange={e=>setCityFilt(e.target.value)}
                style={{ background:t.input, color:t.text, border:"1px solid "+t.border, borderRadius:8, padding:"7px 11px", fontFamily:"inherit", fontSize:13, cursor:"pointer" }}>
                {cities.map(ci=><option key={ci}>{ci==="Todas"?"Toda ciudad":ci}</option>)}
              </select>
            )}
          </>}
        </>}
        <span style={{ marginLeft:"auto", fontSize:12, color:t.muted }}>{filtered.length} resultado{filtered.length!==1?"s":""}</span>
        {filtersActive && (
          <button onClick={clearFilters} className="press" title="Limpiar todos los filtros"
            style={{ background:"none", border:"1px solid "+t.border, borderRadius:8, padding:"5px 11px", cursor:"pointer", fontSize:11, color:t.muted, fontFamily:"inherit", fontWeight:600, display:"inline-flex", alignItems:"center", gap:5 }}>
            ✕ Limpiar
          </button>
        )}
        {!isEvent && (() => {
          // If the sheet has defined groups, offer "Por tipo" vs "Por región" (no flat).
          // Otherwise offer "Por región" vs "Sin grupos".
          const opts = sheetHasGroups
            ? [
                { id:"auto",   label:"Por tipo",   title:"Agrupar por categoría de empresa" },
                { id:"region", label:"Por región", title:"Agrupar por región/ciudad" },
              ]
            : [
                { id:"region", label:"Por región", title:"Agrupar por región/ciudad" },
                { id:"flat",   label:"Sin grupos", title:"Lista plana" },
              ];
          // Determine which option is visually active
          const current = sheetHasGroups
            ? (groupBy === "region" ? "region" : "auto")
            : (groupBy === "region" ? "region" : "flat");
          return (
            <div style={{ display:"flex", gap:0, border:"1px solid "+t.border, borderRadius:8, overflow:"hidden", background:t.input }}>
              {opts.map(opt => (
                <button key={opt.id} onClick={()=>setGroupBy(opt.id)} title={opt.title}
                  style={{ padding:"5px 10px", border:"none", cursor:"pointer", fontSize:11, fontFamily:"inherit", fontWeight:600,
                    background: current === opt.id ? t.red : "transparent",
                    color:      current === opt.id ? "#fff" : t.muted,
                    transition:"all .15s" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          );
        })()}
        {hasGroups && !isMobile && (
          <button onClick={toggleAll}
            style={{ background:"none", border:"1px solid "+t.border, borderRadius:6, padding:"5px 11px", cursor:"pointer", fontSize:12, color:t.muted, fontFamily:"inherit" }}>
            {allCollapsed ? "↕ Expandir" : "↕ Colapsar"}
          </button>
        )}
      </div>

      {/* Sheet error */}
      {sheetError && (
        <div style={{ margin:"0 28px 12px", padding:"10px 16px", borderRadius:8, background:"#fff7ed", border:"1px solid #fed7aa", color:"#c2410c", fontSize:12 }}>
          ⚠️ <strong>Error Google Sheets:</strong> {sheetError}
        </div>
      )}

      {/* Table / Cards */}
      <div key={subcat} className="subcat-fade">
      {loading ? (
        isMobile ? <MobileSkeleton t={t} dark={dark} /> : <TableSkeleton t={t} dark={dark} isEvent={isEvent} />
      ) : sheetEmpty ? (
        <EarlyState t={t} subcat={subcat} setSubcat={setSubcat} isEvent={isEvent} />
      ) : isMobile ? (
        <MobileCards
          groups={groups} hasGroups={hasGroups} collapsed={collapsed}
          toggleGroup={toggleGroup} isEvent={isEvent} t={t} dark={dark}
          dropdown={dropdown} setDropdown={setDropdown}
          updStatus={updStatus} user={user} setAuthOpen={setAuthOpen}
          filtered={filtered} filtersActive={filtersActive} clearFilters={clearFilters}
          setInfoModal={setInfoModal}
        />
      ) : (
        <>
        <div style={{ overflowX:"auto", padding:"0 28px 60px" }}>
          <table style={{ borderCollapse:"collapse", width:"100%", fontSize:13 }}>
            <thead>
              <tr>
                {(isEvent
                  ? ["Estado","Empresa","Evento","Región","Fecha","Link"]
                  : ["Estado","Empresa","Rol","Región","Modalidad","Duración","Apertura","Cierre","Etapa","Últ. Apertura","Proceso","Notas","Link"]
                ).map(h=>{
                  // Map header label → info key for the "?" button
                  const infoKey = h==="Etapa" ? "stage" : h==="Últ. Apertura" ? "last_open" : h==="Proceso" ? "process" : null;
                  return (
                    <th key={h} style={{ background:t.thead, color:t.muted, fontSize:10, textTransform:"uppercase", letterSpacing:".07em", padding:"10px 14px", textAlign:"left", fontWeight:600, position:"sticky", top:0, zIndex:10, borderBottom:"1px solid "+t.border, whiteSpace:"nowrap" }}>
                      <span style={{ display:"inline-flex", alignItems:"center" }}>
                        {h}
                        {infoKey && <InfoButton onClick={()=>setInfoModal(infoKey)} t={t} />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={COL_SPAN} style={{ textAlign:"center", padding:"72px 24px", color:t.muted }}>
                  <div style={{ fontSize:38, marginBottom:12, opacity:.85 }}>{filtersActive ? "🔍" : "📭"}</div>
                  <div style={{ fontWeight:700, color:t.text, marginBottom:6, fontSize:15, fontFamily:"'Sora',sans-serif" }}>
                    {filtersActive ? "Sin coincidencias" : "Aún no hay oportunidades aquí"}
                  </div>
                  <div style={{ fontSize:13, maxWidth:340, margin:"0 auto", lineHeight:1.5 }}>
                    {filtersActive
                      ? "No encontramos oportunidades con estos filtros. Prueba ajustarlos o límpialos."
                      : "Esta categoría se está llenando. Vuelve pronto o explora otra subcategoría."}
                  </div>
                  {filtersActive && (
                    <button onClick={clearFilters} className="press" style={{ marginTop:18, background:t.pill, border:"1px solid "+t.border, borderRadius:9, padding:"8px 18px", cursor:"pointer", fontSize:13, color:t.text, fontFamily:"inherit", fontWeight:600 }}>
                      Limpiar filtros
                    </button>
                  )}
                </td></tr>
              ) : Object.entries(groups).map(([groupName, groupJobs]) => (
                <GroupRows
                  key={groupName}
                  groupName={groupName}
                  jobs={groupJobs}
                  hasGroups={hasGroups}
                  collapsed={!!collapsed[groupName]}
                  onToggle={()=>toggleGroup(groupName)}
                  colSpan={COL_SPAN}
                  isEvent={isEvent}
                  t={t} dark={dark}
                  dropdown={dropdown} setDropdown={setDropdown}
                  updStatus={updStatus} updNote={updNote}
                  user={user} setAuthOpen={setAuthOpen}
                />
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      </div>

      {/* Subtle feedback link — only when the sheet actually has content or is empty (not while loading) */}
      {!loading && (
        <div style={{ textAlign:"center", padding:"0 28px 48px" }}>
          <button onClick={()=>setFeedbackOpen(true)}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:t.faint, fontFamily:"inherit", textDecoration:"underline", textUnderlineOffset:3, transition:"color .15s" }}
            onMouseEnter={e=>e.currentTarget.style.color=t.muted}
            onMouseLeave={e=>e.currentTarget.style.color=t.faint}>
            ¿Notaste algo incorrecto o faltante?
          </button>
        </div>
      )}

      {/* Column glossary modal */}
      {infoModal && <InfoModal infoKey={infoModal} t={t} dark={dark} onClose={()=>setInfoModal(null)} />}

      {/* Feedback modal */}
      {feedbackOpen && <FeedbackModal t={t} dark={dark} area={area} subcat={subcat} onClose={()=>setFeedbackOpen(false)} />}
    </div>
  );
}

// ─── PERIOD INFO ──────────────────────────────────────────────────────────────
// Collapsible panel explaining what each internship period involves.
// Remembers the user's open/closed preference per subcategory.
function PeriodInfo({ info, subcat, t, dark }) {
  const storeKey = "mipasantia_periodinfo_" + subcat;
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(storeKey);
      return saved === null ? true : saved === "1"; // open by default
    } catch { return true; }
  });

  const toggle = () => {
    setOpen(o => {
      const next = !o;
      try { localStorage.setItem(storeKey, next ? "1" : "0"); } catch {}
      return next;
    });
  };

  return (
    <div style={{ padding:"0 28px 16px" }}>
      <div style={{ background:t.card, border:"1px solid "+t.border, borderRadius:12, overflow:"hidden" }}>
        <button onClick={toggle}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"11px 15px", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
          <span style={{ fontSize:16 }}>{info.icon}</span>
          <span style={{ flex:1, fontSize:13, fontWeight:700, color:t.text, letterSpacing:"-.01em" }}>{info.title}</span>
          <span style={{ fontSize:11, color:t.muted, transition:"transform .2s", display:"inline-block", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>▼</span>
        </button>
        {open && (
          <div className="group-expand" style={{ padding:"2px 15px 14px", display:"flex", flexDirection:"column", gap:8 }}>
            {info.facts.map((f, i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:12.5, lineHeight:1.55 }}>
                <span style={{ flexShrink:0, fontSize:13, width:18, textAlign:"center" }}>{f.icon}</span>
                <span style={{ color:t.textSec }}>
                  <strong style={{ color:t.text, fontWeight:700 }}>{f.label}:</strong> {f.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EARLY STATE (empty sheet) ────────────────────────────────────────────────
// Shown when a subcategory's sheet has loaded but has zero opportunities yet.
function EarlyState({ t, subcat, setSubcat, isEvent }) {
  // Friendly, subcategory-aware message
  const subcatName = SUBCATEGORY_LABELS[subcat]?.label || "estas oportunidades";
  const isVerano = subcat === "verano";
  const otherSubcats = Object.keys(SUBCATEGORY_LABELS).filter(k => k !== subcat);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"64px 28px 80px", maxWidth:560, margin:"0 auto" }}>
      <div style={{ fontSize:64, marginBottom:18, lineHeight:1 }}>🏎️</div>
      <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:"clamp(22px,4vw,28px)", fontWeight:800, color:t.text, letterSpacing:"-.02em", marginBottom:12 }}>
        ¡Parece que llegaste temprano!
      </h2>
      <p style={{ fontSize:15, color:t.textSec, lineHeight:1.6, marginBottom:14 }}>
        Sabemos que la puntualidad es importante, pero esta vez te adelantaste un poco más.
      </p>
      <p style={{ fontSize:14, color:t.muted, lineHeight:1.65, marginBottom:28 }}>
        {isVerano
          ? "Las postulaciones para prácticas de verano 2027 suelen abrir entre Agosto y Octubre. Estate atento para cuando empiecen a aparecer nuevas oportunidades aquí. Por ahora, siéntete libre de revisar las Prácticas Profesionales, Intermedias y Eventos de esta misma área :)"
          : `Aún no hay oportunidades cargadas en ${subcatName} para esta área. Vuelve pronto para ver nuevas oportunidades, o explora las otras subcategorías de esta misma área mientras tanto :)`}
      </p>
      <div style={{ display:"flex", gap:9, flexWrap:"wrap", justifyContent:"center" }}>
        {otherSubcats.map(k => {
          const info = SUBCATEGORY_LABELS[k];
          return (
            <button key={k} onClick={()=>setSubcat(k)} className="press"
              style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, border:"1.5px solid "+t.border, background:t.card, color:t.text, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"border-color .15s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=t.red}
              onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
              <span>{info.icon}</span> {info.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── MOBILE CARDS ─────────────────────────────────────────────────────────────
function MobileCards({ groups, hasGroups, collapsed, toggleGroup, isEvent, t, dark, dropdown, setDropdown, updStatus, user, setAuthOpen, filtered, filtersActive, clearFilters, setInfoModal }) {
  if (filtered.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"64px 28px", color:t.muted }}>
        <div style={{ fontSize:38, marginBottom:12, opacity:.85 }}>{filtersActive ? "🔍" : "📭"}</div>
        <div style={{ fontWeight:700, color:t.text, marginBottom:6, fontSize:15, fontFamily:"'Sora',sans-serif" }}>
          {filtersActive ? "Sin coincidencias" : "Aún no hay oportunidades aquí"}
        </div>
        <div style={{ fontSize:13, maxWidth:300, margin:"0 auto", lineHeight:1.5 }}>
          {filtersActive
            ? "No encontramos oportunidades con estos filtros. Prueba ajustarlos o límpialos."
            : "Esta categoría se está llenando. Vuelve pronto o explora otra subcategoría."}
        </div>
        {filtersActive && (
          <button onClick={clearFilters} className="press" style={{ marginTop:18, background:t.pill, border:"1px solid "+t.border, borderRadius:9, padding:"8px 18px", cursor:"pointer", fontSize:13, color:t.text, fontFamily:"inherit", fontWeight:600 }}>
            Limpiar filtros
          </button>
        )}
      </div>
    );
  }
  return (
    <div style={{ padding:"0 16px 60px", display:"flex", flexDirection:"column", gap:10 }}>
      {Object.entries(groups).map(([groupName, groupJobs]) => (
        <div key={groupName}>
          {hasGroups && (
            <button onClick={()=>toggleGroup(groupName)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 4px", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", marginBottom:4 }}>
              <span style={{ fontSize:11, color:t.muted, transform:collapsed[groupName]?"rotate(-90deg)":"rotate(0)", transition:"transform .2s", display:"inline-block" }}>▼</span>
              <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:12, color:t.text, textTransform:"uppercase", letterSpacing:".05em" }}>{groupName}</span>
              <span style={{ fontSize:11, background:t.pill, color:t.muted, padding:"1px 7px", borderRadius:10, border:"1px solid "+t.border }}>{groupJobs.length}</span>
            </button>
          )}
          {!collapsed[groupName] && (
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {groupJobs.map((job, ji) => (
                <MobileCard key={job.id} job={job} isEvent={isEvent} t={t} dark={dark}
                  dropdown={dropdown} setDropdown={setDropdown}
                  updStatus={updStatus} user={user} setAuthOpen={setAuthOpen} rowIndex={ji}
                  setInfoModal={setInfoModal} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MobileCard({ job, isEvent, t, dark, dropdown, setDropdown, updStatus, user, setAuthOpen, rowIndex = 0, setInfoModal }) {
  const sc = statusColors(job.status, dark);
  const [pulse, setPulse] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const prevStatus = useRef(job.status);
  useEffect(() => {
    if (prevStatus.current !== job.status) {
      prevStatus.current = job.status;
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 450);
      return () => clearTimeout(timer);
    }
  }, [job.status]);
  const dl = deadlineInfo(job.deadline);
  const rem = job.remote === "Remoto"  ? { color: dark ? "#4ade80" : "#16a34a", bg: dark ? "#12281c" : "#f0fdf4", border: dark ? "#1e4230" : "#bbf7d0" }
            : job.remote === "Híbrido" ? { color: dark ? "#60a5fa" : "#2563eb", bg: dark ? "#16233d" : "#eff6ff", border: dark ? "#243b5e" : "#bfdbfe" }
            : job.remote === "Presencial" ? { color: dark ? "#fb923c" : "#ea580c", bg: dark ? "#2a1a10" : "#fff7ed", border: dark ? "#452a15" : "#fed7aa" }
            : { color:t.muted, bg:t.pill, border:t.border };
  const regs = parseRegions(job.region);

  // A labeled data row: small uppercase label on the left, value on the right.
  // If `infoKey` is passed, shows a "?" button next to the label.
  const DataRow = ({ label, infoKey, children }) => (
    <div style={{ display:"flex", alignItems:"baseline", gap:10, fontSize:12.5 }}>
      <span style={{ flexShrink:0, width:74, color:t.faint, fontSize:10.5, textTransform:"uppercase", letterSpacing:".05em", fontWeight:600, paddingTop:1, display:"inline-flex", alignItems:"center" }}>
        {label}
        {infoKey && setInfoModal && <InfoButton onClick={()=>setInfoModal(infoKey)} t={t} />}
      </span>
      <span style={{ flex:1, minWidth:0, color:t.textSec }}>{children}</span>
    </div>
  );

  return (
    <div className="row-enter" style={{ background:t.card, border:"1px solid "+t.border, borderRadius:14, padding:"14px 15px", position:"relative", animationDelay: Math.min(rowIndex * 40, 400) + "ms" }}
      onClick={() => setDropdown(null)}>

      {/* Top: logo + company + role, and status badge */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:11, flex:1, minWidth:0 }}>
          <CompanyLogo company={job.company} logo={job.logo} size={40} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:15, color:t.text, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"-.01em" }}>{job.company}</div>
            <div style={{ fontSize:12.5, color:t.muted, lineHeight:1.35 }}>{job.role}</div>
          </div>
        </div>
        <div style={{ flexShrink:0 }} onClick={e=>e.stopPropagation()}>
          <span onClick={(e)=>{
              const r = e.currentTarget.getBoundingClientRect();
              setAnchorRect({ top:r.top, bottom:r.bottom, left:r.left, right:r.right });
              setDropdown(dropdown===job.id?null:job.id);
            }}
            className={pulse ? "badge-pulse" : ""}
            style={{ background:sc.bg, color:sc.text, border:"1px solid "+sc.border, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4, userSelect:"none", whiteSpace:"nowrap", transition:"background .2s, color .2s, border-color .2s" }}>
            {job.status} ▾
          </span>
          <StatusDropdown
            open={dropdown === job.id}
            rect={anchorRect}
            onClose={()=>setDropdown(null)}
            onSelect={(s)=>updStatus(job.id, s, { company:job.company, role:job.role, region:job.region, link:job.link, logo:job.logo })}
            t={t} dark={dark} user={user} setAuthOpen={setAuthOpen}
          />
        </div>
      </div>

      {/* Labeled data rows */}
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {isEvent ? (
          <>
            {regs.length > 0 && (
              <DataRow label="Ubicación">
                {regs.map((r,i)=>(
                  <span key={i} style={{ display:"inline-block", background:t.pill, padding:"1px 7px", borderRadius:7, fontSize:11.5, border:"1px solid "+t.border, marginRight:4, marginBottom:2 }}>{r}</span>
                ))}
              </DataRow>
            )}
            {job.deadline && (
              <DataRow label="Fecha">
                <span style={{ color: dl?.color || t.textSec, fontWeight: dl ? 600 : 400 }}>{dl ? dl.text : job.deadline}</span>
              </DataRow>
            )}
          </>
        ) : (
          <>
            {regs.length > 0 && (
              <DataRow label="Ubicación">
                {regs.map((r,i)=>(
                  <span key={i} style={{ display:"inline-block", background:t.pill, padding:"1px 7px", borderRadius:7, fontSize:11.5, border:"1px solid "+t.border, marginRight:4, marginBottom:2 }}>{r}</span>
                ))}
              </DataRow>
            )}
            {job.remote && (
              <DataRow label="Modalidad">
                <span style={{ background:rem.bg, color:rem.color, padding:"2px 9px", borderRadius:7, fontWeight:600, fontSize:11.5, border:"1px solid "+rem.border }}>{job.remote}</span>
              </DataRow>
            )}
            {job.duration && <DataRow label="Duración">{job.duration}</DataRow>}
            {job.posted && <DataRow label="Apertura">{job.posted}</DataRow>}
            {job.deadline && (
              <DataRow label="Cierre">
                <span style={{ color: dl?.color || t.textSec, fontWeight: dl ? 600 : 400 }}>{dl ? dl.text : job.deadline}</span>
              </DataRow>
            )}
            {job.stage && (
              <DataRow label="Etapa" infoKey="stage">
                <span style={{ background:t.pill, color:t.textSec, padding:"2px 9px", borderRadius:7, border:"1px solid "+t.border, fontWeight:500, fontSize:11.5 }}>{job.stage}</span>
              </DataRow>
            )}
            {job.last_open && <DataRow label="Últ. apertura" infoKey="last_open">{job.last_open}</DataRow>}
            {job.process && <DataRow label="Proceso" infoKey="process">{job.process}</DataRow>}
            {(job.sheetNotes || job.notes) && <DataRow label="Notas">{job.sheetNotes || job.notes}</DataRow>}
          </>
        )}
      </div>

      {/* Postular button — or a clear "not open yet" state when there's no link */}
      {job.link ? (
        <a href={job.link} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:13, padding:"9px 0", fontSize:13, color:"#fff", background:t.red, fontWeight:600, textDecoration:"none", borderRadius:9 }}>
          Postular ↗
        </a>
      ) : (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:13, padding:"9px 0", fontSize:12.5, color:t.faint, background:t.pill, border:"1px solid "+t.border, fontWeight:600, borderRadius:9 }}>
          Aún no disponible
        </div>
      )}
    </div>
  );
}

// ─── GROUP ROWS ───────────────────────────────────────────────────────────────
function GroupRows({ groupName, jobs, hasGroups, collapsed, onToggle, colSpan, isEvent, t, dark, dropdown, setDropdown, updStatus, updNote, user, setAuthOpen }) {
  return (
    <>
      {/* Group header row */}
      {hasGroups && (
        <tr onClick={onToggle} className="group-header-row" style={{ cursor:"pointer", userSelect:"none" }}>
          <td colSpan={colSpan} style={{ padding:"9px 14px", background: dark?"#0f0f11":"#f1f5f9", borderBottom:"1px solid "+t.border, borderTop:"2px solid "+t.border, transition:"background .18s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:t.muted, transition:"transform .2s", display:"inline-block", transform: collapsed?"rotate(-90deg)":"rotate(0deg)" }}>▼</span>
              <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:12, color:t.text, letterSpacing:".04em", textTransform:"uppercase" }}>{groupName}</span>
              <span style={{ fontSize:11, background:t.pill, color:t.muted, padding:"1px 8px", borderRadius:10, border:"1px solid "+t.border }}>{jobs.length}</span>
            </div>
          </td>
        </tr>
      )}

      {/* Job rows */}
      {!collapsed && jobs.map((job, ji) => (
        <JobRow key={job.id} job={job} isEvent={isEvent} t={t} dark={dark}
          dropdown={dropdown} setDropdown={setDropdown}
          updStatus={updStatus} updNote={updNote}
          user={user} setAuthOpen={setAuthOpen} rowIndex={ji} />
      ))}
    </>
  );
}

// ─── COMPANY LOGO ─────────────────────────────────────────────────────────────
// Tries png → svg → webp from Supabase Storage. Falls back to colored initial.
function CompanyLogo({ company, size = 28, logo }) {
  const [extIdx, setExtIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const exts = ["png", "svg", "webp", "jpg"];

  // Use explicit logo column from Sheet, or derive from company name
  const filename = logo || company;
  const url = !failed && filename ? logoUrl(filename, exts[extIdx]) : null;

  const initial = (company || "?").trim()[0]?.toUpperCase() || "?";
  // Stable color from company name hash
  const hue = company
    ? [...company].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 0)
    : 0;
  const bg = `hsl(${hue}, 65%, 55%)`;

  const baseStyle = {
    width: size, height: size, borderRadius: "50%",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, overflow: "hidden",
    background: failed || !url ? bg : "#f8fafc",
    border: "1px solid rgba(0,0,0,0.08)",
  };

  if (failed || !url) {
    return (
      <span style={{ ...baseStyle, color: "#fff", fontSize: size * 0.4, fontWeight: 700, fontFamily: "'Sora', sans-serif" }}>
        {initial}
      </span>
    );
  }
  return (
    <span style={baseStyle}>
      <img
        src={url}
        alt={company}
        width={size} height={size}
        loading="lazy"
        onError={() => {
          if (extIdx < exts.length - 1) setExtIdx(extIdx + 1);
          else setFailed(true);
        }}
        style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }}
      />
    </span>
  );
}

// ─── STATUS DROPDOWN ──────────────────────────────────────────────────────────
// Rendered in a portal at document.body with position:fixed, using the badge's
// rect captured AT CLICK TIME (passed via `rect`). No ref measuring, no timing
// issues, immune to transformed/animated ancestors and table stacking contexts.
function StatusDropdown({ open, rect, onSelect, onClose, t, dark, user, setAuthOpen, options, colorMap, renderLabel, showLoginHint = true }) {
  const menuRef = useRef(null);
  const opts = options || STATUS_OPTIONS;
  const colors = colorMap || (dark ? SS_DARK : SS);

  // Close on outside click / Escape / any scroll or resize (keeps position honest)
  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onScroll = () => onClose();
    // Defer so the click that opened it doesn't instantly close it.
    // Uses "click" (not mousedown) so badge toggles — which stopPropagation
    // before reaching document — aren't closed-then-reopened.
    const timer = setTimeout(() => {
      document.addEventListener("click", onDocPointer);
      document.addEventListener("keydown", onKey);
      window.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", onScroll);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", onDocPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, onClose]);

  if (!open || !rect) return null;

  // Geometry — all computed directly from the captured rect
  const MENU_W = 178;
  const MENU_H = opts.length * 36 + (showLoginHint && !user ? 40 : 0) + 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const openUp = (vh - rect.bottom < MENU_H + 12) && (rect.top > MENU_H + 12);
  // Horizontal: prefer left-aligned to badge; flip to right-aligned if it would overflow
  const alignRight = rect.left + MENU_W > vw - 8;
  const left  = alignRight ? undefined : Math.max(8, rect.left);
  const right = alignRight ? Math.max(8, vw - rect.right) : undefined;
  const top    = openUp ? undefined : rect.bottom + 6;
  const bottom = openUp ? (vh - rect.top + 6) : undefined;

  return createPortal(
    <div
      ref={menuRef}
      onClick={e => e.stopPropagation()}
      style={{
        position: "fixed",
        top, bottom, left, right,
        background: t.dropdown,
        border: "1px solid " + t.border,
        borderRadius: 10,
        padding: 5,
        zIndex: 9999,
        minWidth: 158,
        maxWidth: 230,
        boxShadow: "0 12px 40px rgba(0,0,0,.18)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {opts.map(s => {
        const st = colors[s] || colors["Sin estado"];
        return (
          <div key={s} onClick={() => { onSelect(s); onClose(); }} className="dd-item"
            style={{ padding: "8px 12px", borderRadius: 7, cursor: "pointer", fontSize: 13, color: st.text, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.text, flexShrink: 0 }} />{renderLabel ? renderLabel(s) : s}
          </div>
        );
      })}
      {showLoginHint && !user && (
        <div style={{ padding: "8px 12px", fontSize: 11, color: t.muted, borderTop: "1px solid " + t.border, marginTop: 4 }}>
          <span style={{ cursor: "pointer", color: "#d4281a" }} onClick={() => setAuthOpen(true)}>Inicia sesión</span> para guardar
        </div>
      )}
    </div>,
    document.body
  );
}

// ─── JOB ROW ──────────────────────────────────────────────────────────────────
function JobRow({ job, isEvent, t, dark, dropdown, setDropdown, updStatus, updNote, user, setAuthOpen, rowIndex = 0 }) {
  const sc  = statusColors(job.status, dark);
  const [pulse, setPulse] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const prevStatus = useRef(job.status);
  useEffect(() => {
    if (prevStatus.current !== job.status) {
      prevStatus.current = job.status;
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 450);
      return () => clearTimeout(timer);
    }
  }, [job.status]);
  const dl  = deadlineInfo(job.deadline);
  const ps  = postedStyle(job.posted, job.deadline);
  const rem = job.remote==="Remoto"  ? {bg:"#f0fdf4",text:"#16a34a"}
            : job.remote==="Híbrido" ? {bg:"#eff6ff",text:"#2563eb"}
            : {bg:t.pill,text:t.muted};

  return (
    <tr className="trow row-enter" style={{ borderBottom:"1px solid "+t.border, animationDelay: Math.min(rowIndex * 25, 400) + "ms" }}>
      {/* STATUS — first column like Trackr */}
      <td style={{ padding:"10px 12px" }} onClick={e=>e.stopPropagation()}>
        <span onClick={(e)=>{
            const r = e.currentTarget.getBoundingClientRect();
            setAnchorRect({ top:r.top, bottom:r.bottom, left:r.left, right:r.right });
            setDropdown(dropdown===job.id?null:job.id);
          }}
          className={pulse ? "badge-pulse" : ""}
          style={{ background:sc.bg, color:sc.text, border:"1px solid "+sc.border, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:4, userSelect:"none", transition:"background .2s, color .2s, border-color .2s" }}>
          {job.status} ▾
        </span>
        <StatusDropdown
          open={dropdown===job.id}
          rect={anchorRect}
          onClose={()=>setDropdown(null)}
          onSelect={(s)=>updStatus(job.id, s, { company: job.company, role: job.role, region: job.region, link: job.link, logo: job.logo })}
          t={t} dark={dark} user={user} setAuthOpen={setAuthOpen}
        />
      </td>
      <td style={{ padding:"10px 14px", fontWeight:600, color:t.text, whiteSpace:"nowrap" }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:9 }}>
          <CompanyLogo company={job.company} logo={job.logo} size={26} />
          <span>{job.company}</span>
        </span>
      </td>
      <td style={{ padding:"10px 14px", color:t.textSec, maxWidth:200 }}>{job.role}</td>
      <td style={{ padding:"10px 14px", color:t.muted, fontSize:12 }}>
        {(() => {
          const regs = parseRegions(job.region);
          if (regs.length === 0) return <span style={{color:t.faint}}>—</span>;
          if (regs.length === 1) return <span style={{whiteSpace:"nowrap"}}>{regs[0]}</span>;
          return (
            <span style={{ display:"inline-flex", flexWrap:"wrap", gap:3 }}>
              {regs.map((r, i) => (
                <span key={i} style={{ background:t.pill, padding:"1px 6px", borderRadius:8, fontSize:11, border:"1px solid "+t.border, whiteSpace:"nowrap" }}>
                  {r}
                </span>
              ))}
            </span>
          );
        })()}
      </td>

      {isEvent ? (
        <td style={{ padding:"10px 14px", fontSize:12, color:dl?.color||t.muted, whiteSpace:"nowrap" }}>{dl?dl.text:<span style={{color:t.faint}}>—</span>}</td>
      ) : (
        <>
          <td style={{ padding:"10px 14px" }}><span style={{ background:rem.bg, color:rem.text, padding:"3px 8px", borderRadius:4, fontSize:11, fontWeight:500 }}>{job.remote}</span></td>
          <td style={{ padding:"10px 14px", color:t.muted, fontSize:12, whiteSpace:"nowrap" }}>{job.duration}</td>
          {/* Apertura */}
          <td style={{ padding:"10px 14px", fontSize:12, whiteSpace:"nowrap", ...ps }}>
            {job.posted || <span style={{color:t.faint}}>—</span>}
          </td>
          {/* Cierre */}
          <td style={{ padding:"10px 14px", fontSize:12, color:dl?.color||t.muted, whiteSpace:"nowrap" }}>
            {dl ? dl.text : <span style={{color:t.faint}}>—</span>}
          </td>
          {/* Etapa */}
          <td style={{ padding:"10px 14px", fontSize:12, color:t.muted, whiteSpace:"nowrap" }}>
            {job.stage
              ? <span style={{ background:t.pill, padding:"3px 9px", borderRadius:8, fontSize:11, fontWeight:500, border:"1px solid "+t.border }}>{job.stage}</span>
              : <span style={{color:t.faint}}>—</span>}
          </td>
          {/* Últ. Apertura */}
          <td style={{ padding:"10px 14px", fontSize:12, whiteSpace:"nowrap", color:t.muted }}>
            {job.last_open
              ? <span title="Última vez que abrió este cargo">{job.last_open}</span>
              : <span style={{color:t.faint}}>—</span>}
          </td>
          <td style={{ padding:"10px 14px", maxWidth:200, color:t.muted, fontSize:12 }}>
            {job.process || <span style={{ color:t.faint }}>—</span>}
          </td>
          <td style={{ padding:"10px 14px", maxWidth:220, color:t.muted, fontSize:12 }}>
            {job.sheetNotes || job.notes || <span style={{ color:t.faint }}>—</span>}
          </td>
        </>
      )}

      <td style={{ padding:"10px 14px" }}>
        {job.link ? (
          <a href={job.link} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
            style={{ color:t.accent, textDecoration:"none", fontSize:13, fontWeight:500, whiteSpace:"nowrap" }}>
            Postular ↗
          </a>
        ) : (
          <span title="Esta oportunidad todavía no tiene link de postulación"
            style={{ color:t.faint, fontSize:12, whiteSpace:"nowrap", background:t.pill, border:"1px solid "+t.border, padding:"3px 9px", borderRadius:7 }}>
            Aún no disponible
          </span>
        )}
      </td>
    </tr>
  );
}


// ─── PROFILE STATUS BADGE ─────────────────────────────────────────────────────
// Badge + portal dropdown for the profile applications list.
function ProfileStatusBadge({ status, jobId, t, dark, onSelect, open, setOpen }) {
  const [anchorRect, setAnchorRect] = useState(null);
  const sc = statusColors(status === "Sin estado" ? "Interesado/a" : status, dark);
  const options = ["Sin estado", "Interesado/a", "Postulé", "Entrevista", "Oferta", "Rechazado"];
  return (
    <div onClick={e => e.stopPropagation()}>
      <span onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setAnchorRect({ top:r.top, bottom:r.bottom, left:r.left, right:r.right });
          setOpen(!open);
        }}
        style={{ background: sc.bg, color: sc.text, border: "1px solid " + sc.border, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, userSelect: "none" }}>
        {status} ▾
      </span>
      <StatusDropdown
        open={open}
        rect={anchorRect}
        onClose={() => setOpen(false)}
        onSelect={onSelect}
        options={options}
        renderLabel={(s) => s === "Sin estado" ? "🗑 Quitar de mi lista" : s}
        showLoginHint={false}
        t={t} dark={dark}
      />
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function Profile({ t, dark, go, user, progress, setUser, setProgress }) {
  const [tab,       setTab]       = useState("postulaciones");
  const [notes,     setNotes]     = useState({});
  const [pwdOpen,   setPwdOpen]   = useState(false);
  const [delOpen,   setDelOpen]   = useState(false);
  const [oldPwd,    setOldPwd]    = useState("");
  const [newPwd,    setNewPwd]    = useState("");
  const [newPwd2,   setNewPwd2]   = useState("");
  const [pwdMsg,    setPwdMsg]    = useState("");
  const [delConfirm,setDelConfirm]= useState("");
  const [busy,      setBusy]      = useState(false);
  const [noteSaved, setNoteSaved] = useState("");
  const [sheetLookup, setSheetLookup] = useState({});  // { jobId: {company,role,region,link} }
  const [resolving,   setResolving]   = useState(false);

  // On mount: resolve job names for old entries that lack metadata
  // Uses localStorage cache so it's only slow the first time
  useEffect(() => {
    const ACTIVE = ["Interesado/a","Postulé","Entrevista","Oferta","Rechazado"];
    const unresolvedIds = Object.entries(progress)
      .filter(([, v]) => ACTIVE.includes(v?.status) && !v?.company)
      .map(([id]) => id);
    if (unresolvedIds.length === 0) return;

    // Check localStorage cache first
    const CACHE_KEY = "mipasantia_joblookup";
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      const fromCache = {};
      const stillMissing = [];
      unresolvedIds.forEach(id => {
        if (cached[id]) fromCache[id] = cached[id];
        else stillMissing.push(id);
      });
      if (Object.keys(fromCache).length > 0) setSheetLookup(fromCache);
      if (stillMissing.length === 0) return; // all resolved from cache
    } catch(e) {}

    // Fetch sheets in parallel batches of 5
    setResolving(true);
    const urls = Object.values(SHEET_URLS);
    const lookup = {};
    const BATCH = 5;

    const runBatch = async (startIdx) => {
      const batch = urls.slice(startIdx, startIdx + BATCH);
      if (batch.length === 0) {
        // Done — update state and cache
        setSheetLookup(prev => ({ ...prev, ...lookup }));
        try {
          const existing = JSON.parse(localStorage.getItem("mipasantia_joblookup") || "{}");
          localStorage.setItem("mipasantia_joblookup", JSON.stringify({ ...existing, ...lookup }));
        } catch(e) {}
        setResolving(false);
        return;
      }
      await Promise.all(batch.map(url =>
        fetchSheet(url)
          .then(rows => {
            rows.forEach(row => {
              if (row?.id && unresolvedIds.includes(row.id)) {
                lookup[row.id] = {
                  company: row.company || row.id,
                  role:    row.role    || "",
                  region:  row.region  || "",
                  link:    row.link    || null,
                  logo:    row.logo    || null,
                };
              }
            });
          })
          .catch(() => {})
      ));
      // Update state after each batch so names appear progressively
      setSheetLookup(prev => ({ ...prev, ...lookup }));
      await runBatch(startIdx + BATCH);
    };

    runBatch(0);
  }, []);


  // Load notification preferences
  const [notifyClosing, setNotifyClosing] = useState(true);
  const [notifyNew,     setNotifyNew]     = useState(true);
  const [prefSaved,     setPrefSaved]     = useState(false);

  useEffect(() => {
    const sb = getSB();
    if (!sb || !user?.sbUserId) return;
    sb.from("user_preferences").select("notify_closing, notify_new")
      .eq("user_id", user.sbUserId).limit(1)
      .then(({ data }) => {
        if (data && data[0]) {
          setNotifyClosing(data[0].notify_closing);
          setNotifyNew(data[0].notify_new);
        }
      });
  }, [user]);

  const savePrefs = async (closing, newOpp) => {
    const sb = getSB();
    if (!sb || !user?.sbUserId) return;
    await sb.from("user_preferences").upsert(
      { user_id: user.sbUserId, notify_closing: closing, notify_new: newOpp, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2000);
  };

  // Load personal notes from Supabase on mount
  useEffect(() => {
    const sb = getSB();
    if (!sb || !user?.sbUserId) return;
    sb.from("notes")
      .select("data")
      .eq("user_id", user.sbUserId)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setNotes(data[0].data || {});
      });
  }, [user]);

  const saveNote = async (jobId, text) => {
    const next = { ...notes, [jobId]: text };
    setNotes(next);
    const sb = getSB();
    if (sb && user?.sbUserId) {
      await sb.from("notes")
        .upsert({ user_id: user.sbUserId, data: next, updated_at: new Date().toISOString() },
                 { onConflict: "user_id" });
      setNoteSaved(jobId);
      setTimeout(() => setNoteSaved(""), 1500);
    }
  };

  // Collect all jobs that have a non-neutral status
  const ACTIVE_STATUSES = ["Interesado/a","Postulé","Entrevista","Oferta","Rechazado"];

  const applications = Object.entries(progress)
    .filter(([, v]) => ACTIVE_STATUSES.includes(v?.status))
    .map(([jobId, v]) => ({ jobId, ...v }));

  const [profDropdown, setProfDropdown] = useState(null);

  const changeStatus = async (jobId, newStatus) => {
    let next;
    if (newStatus === "Sin estado") {
      next = { ...progress };
      delete next[jobId];
    } else {
      next = { ...progress, [jobId]: { ...(progress[jobId]||{}), status: newStatus } };
    }
    setProgress(next);
    const sb = getSB();
    if (sb && user?.sbUserId) {
      await sb.from("progress").upsert(
        { user_id: user.sbUserId, data: next, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    } else if (user?.email) { saveProg(user.email, next); }
    setProfDropdown(null);
  };

  // Get display info — prefer stored metadata, sheetLookup, DEMO_DATA, then parse ID
  const allDemoJobs = Object.values(DEMO_DATA).flatMap(area => Object.values(area).flat());
  const getDisplayName = (jobId, stored) => {
    if (stored?.company) return { company: stored.company, role: stored.role||"", region: stored.region||"", link: stored.link||null, logo: stored.logo||null };
    if (sheetLookup[jobId]) return sheetLookup[jobId];
    const demo = allDemoJobs.find(j => j.id === jobId);
    if (demo) return { company: demo.company, role: demo.role, region: demo.region, link: demo.link };
    return { company: resolving ? "Cargando nombre…" : jobId, role: resolving ? "" : "Visita la oportunidad para actualizar", region: "", link: null };
  };

  const changePwd = async () => {
    if (!newPwd || newPwd !== newPwd2) { setPwdMsg("❌ Las contraseñas no coinciden."); return; }
    if (newPwd.length < 6) { setPwdMsg("❌ Mínimo 6 caracteres."); return; }
    setBusy(true);
    const sb = getSB();
    if (sb) {
      const { error } = await sb.auth.updateUser({ password: newPwd });
      setPwdMsg(error ? "❌ " + error.message : "✅ Contraseña actualizada correctamente.");
    } else {
      setPwdMsg("❌ No disponible sin Supabase.");
    }
    setBusy(false);
    setOldPwd(""); setNewPwd(""); setNewPwd2("");
  };

  const deleteAccount = async () => {
    if (delConfirm !== user.email) { return; }
    setBusy(true);
    const sb = getSB();
    if (sb) {
      // Delete progress data first
      await sb.from("progress").delete().eq("user_id", user.sbUserId);
      await sb.from("notes").delete().eq("user_id", user.sbUserId);
      // Sign out (admin delete requires service role — user can contact admin)
      await sb.auth.signOut();
      setUser(null); setProgress({});
      go("landing");
    }
    setBusy(false);
  };

  const inpStyle = { background: t.input, border: "1px solid " + t.border, borderRadius: 9, color: t.text, padding: "10px 14px", fontFamily: "inherit", fontSize: 13, outline: "none", width: "100%" };

  const stats = {
    total:      applications.length,
    entrevistas: applications.filter(a => a.status === "Entrevista").length,
    ofertas:    applications.filter(a => a.status === "Oferta").length,
    rechazados: applications.filter(a => a.status === "Rechazado").length,
  };

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", maxWidth: 900, margin: "0 auto", padding: "36px 24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#d4281a,#6644cc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {user.name[0].toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, color: t.text, letterSpacing: "-.02em" }}>{user.name}</h1>
          <p style={{ fontSize: 13, color: t.muted, marginTop: 2 }}>{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { label: "Postulaciones",  v: stats.total,       color: "#2563eb" },
          { label: "Entrevistas",    v: stats.entrevistas, color: "#d97706" },
          { label: "Ofertas",        v: stats.ofertas,     color: "#7c3aed" },
          { label: "Rechazos",       v: stats.rechazados,  color: "#e11d48" },
        ].map(s => (
          <div key={s.label} style={{ background: t.card, border: "1px solid " + t.border, borderRadius: 10, padding: "12px 18px", flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'Sora',sans-serif", lineHeight: 1 }}>
              <CountUp value={s.v} duration={650} />
            </div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: t.pill, borderRadius: 10, padding: 4, border: "1px solid " + t.border, width: "fit-content" }}>
        {[
          { id: "postulaciones", label: "📋 Mis postulaciones" },
          { id: "cuenta",        label: "⚙️ Mi cuenta" },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ padding: "8px 18px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === tb.id ? 600 : 400, fontFamily: "inherit", transition: "all .18s", background: tab === tb.id ? t.surface : "transparent", color: tab === tb.id ? t.text : t.muted, boxShadow: tab === tb.id ? "0 1px 4px rgba(0,0,0,.1)" : "none" }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* POSTULACIONES TAB */}
      {tab === "postulaciones" && (
        <div>
          {applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: t.muted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 600, color: t.text, marginBottom: 6 }}>Sin postulaciones aún</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Cuando marques una oportunidad aparecerá aquí</div>
              <button onClick={() => go("country")} className="cta" style={{ fontSize: 14, padding: "10px 24px" }}>
                Explorar oportunidades →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {applications.map(({ jobId, status, company, role, region, link, logo }) => {
                return (
                  <div key={jobId} style={{ background: t.card, border: "1px solid " + t.border, borderRadius: 12, padding: "16px 20px", transition: "box-shadow .18s" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                    {(() => {
                      const d = getDisplayName(jobId, { company, role, region, link, status, logo });
                      return (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:12, flex: 1, minWidth: 200 }}>
                            <CompanyLogo company={d.company} logo={d.logo} size={36} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: t.text, marginBottom: 3 }}>{d.company}</div>
                              {d.role && <div style={{ fontSize: 12, color: t.muted }}>{d.role}{d.region ? " · " + d.region : ""}</div>}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <ProfileStatusBadge
                              status={status} jobId={jobId} t={t} dark={dark}
                              onSelect={(s) => changeStatus(jobId, s)}
                              open={profDropdown === jobId}
                              setOpen={(v) => setProfDropdown(v ? jobId : null)}
                            />
                            {d.link && (
                              <a href={d.link} target="_blank" rel="noopener noreferrer"
                                style={{ color: t.accent, fontSize: 12, textDecoration: "none", fontWeight: 500 }}>
                                Ver ↗
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Personal note */}
                    <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 11, color: t.muted, marginTop: 8, flexShrink: 0 }}>📝 Nota:</span>
                      <div style={{ flex: 1, position: "relative" }}>
                        <textarea
                          value={notes[jobId] || ""}
                          onChange={e => setNotes(prev => ({ ...prev, [jobId]: e.target.value }))}
                          onBlur={e => saveNote(jobId, e.target.value)}
                          placeholder="Agrega una nota personal (solo visible para ti)..."
                          rows={2}
                          style={{ width: "100%", background: dark ? "#0d0d1a" : "#f8fafc", border: "1px solid " + t.border, borderRadius: 8, color: t.text, fontFamily: "inherit", fontSize: 12, padding: "8px 12px", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
                        />
                        {noteSaved === jobId && (
                          <span style={{ position: "absolute", right: 8, bottom: 8, fontSize: 10, color: "#16a34a", background: "#f0fdf4", padding: "2px 6px", borderRadius: 6 }}>✅ Guardada</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CUENTA TAB */}
      {tab === "cuenta" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>

          {/* Notifications */}
          <div style={{ background: t.card, border: "1px solid " + t.border, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: t.text, marginBottom: 14 }}>🔔 Alertas por email</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "closing", label: "Prácticas por cerrar", desc: "Avísame cuando una práctica guardada cierra en 7 días o menos", value: notifyClosing, set: v => { setNotifyClosing(v); savePrefs(v, notifyNew); } },
                { key: "new",     label: "Nuevas oportunidades",  desc: "Avísame cuando se agreguen nuevas prácticas", value: notifyNew, set: v => { setNotifyNew(v); savePrefs(notifyClosing, v); } },
              ].map(item => (
                <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <button onClick={() => item.set(!item.value)}
                    style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", flexShrink: 0, transition: "background .2s", background: item.value ? "#16a34a" : t.border, position: "relative" }}>
                    <span style={{ position: "absolute", top: 3, left: item.value ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                  </button>
                </div>
              ))}
            </div>
            {prefSaved && <div style={{ marginTop: 10, fontSize: 12, color: "#16a34a" }}>✅ Preferencias guardadas</div>}
          </div>

          {/* Change password */}
          <div style={{ background: t.card, border: "1px solid " + t.border, borderRadius: 12, overflow: "hidden" }}>
            <button onClick={() => { setPwdOpen(o => !o); setPwdMsg(""); }}
              style={{ width: "100%", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit" }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: t.text }}>🔑 Cambiar contraseña</span>
              <span style={{ color: t.muted, fontSize: 13 }}>{pwdOpen ? "▲" : "▼"}</span>
            </button>
            {pwdOpen && (
              <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Nueva contraseña" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} style={inpStyle} />
                <input placeholder="Confirmar nueva contraseña" type="password" value={newPwd2} onChange={e => setNewPwd2(e.target.value)} style={inpStyle}
                  onKeyDown={e => e.key === "Enter" && changePwd()} />
                {pwdMsg && (
                  <div style={{ fontSize: 12, padding: "8px 12px", borderRadius: 8, background: pwdMsg.startsWith("✅") ? "#f0fdf4" : "#fff1f0", color: pwdMsg.startsWith("✅") ? "#16a34a" : "#ef4444", border: "1px solid " + (pwdMsg.startsWith("✅") ? "#bbf7d0" : "#fecdd3") }}>
                    {pwdMsg}
                  </div>
                )}
                <button onClick={changePwd} disabled={busy} className="cta" style={{ fontSize: 13, padding: "10px 0", justifyContent: "center" }}>
                  {busy ? <><span className="spin-icon">⟳</span> Guardando…</> : "Actualizar contraseña"}
                </button>
              </div>
            )}
          </div>

          {/* Account info */}
          <div style={{ background: t.card, border: "1px solid " + t.border, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: t.text, marginBottom: 12 }}>ℹ️ Información de cuenta</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.muted }}>Nombre</span>
                <span style={{ color: t.text, fontWeight: 500 }}>{user.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.muted }}>Correo</span>
                <span style={{ color: t.text, fontWeight: 500 }}>{user.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.muted }}>Postulaciones activas</span>
                <span style={{ color: "#2563eb", fontWeight: 700 }}>{stats.total}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.muted }}>Progreso guardado en</span>
                <span style={{ color: user.sbUserId ? "#16a34a" : t.muted, fontWeight: 500 }}>{user.sbUserId ? "☁️ Supabase" : "💾 Local"}</span>
              </div>
            </div>
          </div>

          {/* Delete account */}
          <div style={{ background: dark ? "#1a0a0a" : "#fff1f0", border: "1px solid #fecdd3", borderRadius: 12, overflow: "hidden" }}>
            <button onClick={() => setDelOpen(o => !o)}
              style={{ width: "100%", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit" }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#e11d48" }}>🗑️ Eliminar cuenta</span>
              <span style={{ color: "#e11d48", fontSize: 13, opacity: .6 }}>{delOpen ? "▲" : "▼"}</span>
            </button>
            {delOpen && (
              <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>
                  Esta acción es <strong>irreversible</strong>. Se eliminarán todas tus postulaciones y notas. Para confirmar, escribe tu correo electrónico:
                </p>
                <input placeholder={user.email} value={delConfirm} onChange={e => setDelConfirm(e.target.value)} style={{ ...inpStyle, border: "1px solid #fecdd3" }} />
                <button onClick={deleteAccount} disabled={busy || delConfirm !== user.email}
                  style={{ padding: "10px 0", borderRadius: 9, border: "none", background: delConfirm === user.email ? "#e11d48" : t.pill, color: delConfirm === user.email ? "#fff" : t.muted, cursor: delConfirm === user.email ? "pointer" : "not-allowed", fontWeight: 600, fontFamily: "inherit", fontSize: 13, transition: "all .2s" }}>
                  {busy ? "Eliminando…" : "Eliminar cuenta permanentemente"}
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}


// ─── ABOUT ────────────────────────────────────────────────────────────────────
function About({ t, go }) {
  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"56px 24px 80px" }}>
      <button onClick={()=>go("landing")} style={{ background:"none", border:"none", color:t.muted, cursor:"pointer", fontSize:13, padding:0, marginBottom:24 }}>← Volver</button>
      <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:"clamp(32px,5vw,48px)", fontWeight:800, color:t.text, letterSpacing:"-.03em", lineHeight:1.1, marginBottom:14 }}>
        Sobre <span style={{ color:t.red }}>Mi</span>Pasantía
      </h1>
      <p style={{ fontSize:17, color:t.muted, lineHeight:1.6, marginBottom:36 }}>
        Una plataforma curada para estudiantes que buscan su próxima práctica profesional en Chile y LATAM.
      </p>

      <section style={{ marginBottom:32 }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:t.text, marginBottom:12, letterSpacing:"-.01em" }}>¿Por qué existe?</h2>
        <p style={{ fontSize:15, color:t.textSec, lineHeight:1.7 }}>
          Buscar prácticas en Chile es agotador. Los portales de empleo están saturados, los grupos de WhatsApp son caóticos, y muchas oportunidades buenas pasan desapercibidas porque no están en un solo lugar. MiPasantía nace para resolver eso: un mapa claro y actualizado de las mejores oportunidades, con seguimiento personal incluido.
        </p>
      </section>

      <section style={{ marginBottom:32 }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:t.text, marginBottom:12, letterSpacing:"-.01em" }}>¿Cómo funciona?</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[
            { n:"1", t:"Curamos a mano", d:"Revisamos las páginas oficiales de cientos de empresas para encontrar prácticas reales y vigentes en Chile y LATAM." },
            { n:"2", t:"Organizamos por área y modalidad", d:"Verano, Profesional, Off-Cycle y Eventos. Y cada subcategoría con sus grupos (Bulge Bracket, MBB, Big Tech, etc.)." },
            { n:"3", t:"Guardas tu progreso", d:"Marca el estado de cada oportunidad (Interesado, Postulé, Entrevista, Oferta). Se sincroniza entre todos tus dispositivos." },
            { n:"4", t:"Te avisamos cuando algo cierra", d:"Si tienes prácticas guardadas que están por cerrar, te llega un email para que no las dejes pasar." },
          ].map(s => (
            <div key={s.n} style={{ display:"flex", gap:14, padding:"14px 0" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:t.red, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, flexShrink:0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:3 }}>{s.t}</div>
                <div style={{ fontSize:14, color:t.muted, lineHeight:1.5 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom:32 }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:t.text, marginBottom:12, letterSpacing:"-.01em" }}>¿Cuesta algo?</h2>
        <p style={{ fontSize:15, color:t.textSec, lineHeight:1.7 }}>
          No. Es gratis y siempre lo será para los estudiantes. En el futuro podríamos ofrecer alertas personalizadas en una cuenta Pro opcional, pero las oportunidades y el seguimiento básico van a ser siempre libres y accesibles.
        </p>
      </section>

      <section style={{ marginBottom:32 }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:t.text, marginBottom:12, letterSpacing:"-.01em" }}>¿Conoces una práctica que no está?</h2>
        <p style={{ fontSize:15, color:t.textSec, lineHeight:1.7, marginBottom:16 }}>
          Si encontraste una oportunidad que crees deberíamos agregar, escríbenos. Las mejores recomendaciones siempre vienen de la misma comunidad estudiantil.
        </p>
        <a href="mailto:contacto@mipasantia.cl" style={{ display:"inline-flex", alignItems:"center", gap:8, color:t.red, fontSize:15, fontWeight:600, textDecoration:"none", borderBottom:"2px solid "+t.red, paddingBottom:2 }}>
          contacto@mipasantia.cl →
        </a>
      </section>

      {/* Creator section */}
      <section style={{ marginTop:48, padding:"36px 0", borderTop:"1px solid "+t.border }}>
        <div style={{ fontSize:11, color:t.faint, textTransform:"uppercase", letterSpacing:".09em", fontWeight:700, marginBottom:18, textAlign:"center" }}>
          Sobre el creador
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:18 }}>
          {/* Photo from Supabase Storage — upload as "creator.png" to the `logos` bucket
              or create a separate bucket. The component falls back gracefully if missing. */}
          <CreatorPhoto t={t} />
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:t.text, letterSpacing:"-.02em", marginBottom:4 }}>
              Matt 🇨🇱
            </div>
            <div style={{ fontSize:13, color:t.muted }}>
              Fundador de MiPasantía
            </div>
          </div>
          <p style={{ fontSize:14, color:t.textSec, lineHeight:1.7, maxWidth:520, margin:"4px 0" }}>
            Estudiante chileno que se cansó de buscar oportunidades dispersas entre portales, grupos de WhatsApp y posts random de LinkedIn. Construí MiPasantía para que ningún estudiante pierda una buena oportunidad por no haberla visto a tiempo.
          </p>

          {/* Experiences */}
          <div style={{ width:"100%", maxWidth:560, marginTop:20 }}>
            <div style={{ fontSize:11, color:t.faint, textTransform:"uppercase", letterSpacing:".09em", fontWeight:700, marginBottom:14, textAlign:"left" }}>
              Experiencias recientes
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                {
                  logo: "ms",
                  role: "Japan Early Insights",
                  company: "Morgan Stanley",
                  date: "Marzo – Mayo 2026",
                  location: null,
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                },
                {
                  logo: "barclays",
                  role: "Spring Operations Intern",
                  company: "Barclays",
                  date: "Abril 2026",
                  location: "Glasgow, UK",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
                },
                {
                  logo: "loreal",
                  role: "Spring Intern",
                  company: "L'Oréal",
                  date: "Abril 2026",
                  location: "London, UK",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit.",
                },
              ].map((exp, i) => (
                <div key={i} style={{ display:"flex", gap:14, padding:"14px 16px", background:t.card, border:"1px solid "+t.border, borderRadius:12, textAlign:"left", alignItems:"flex-start", transition:"box-shadow .18s, transform .18s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 22px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <CompanyLogo company={exp.company} logo={exp.logo} size={44} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:2 }}>{exp.role}</div>
                    <div style={{ fontSize:13, color:t.muted, marginBottom:4 }}>
                      {exp.company}
                      {exp.location && <span style={{ color:t.faint }}> · {exp.location}</span>}
                    </div>
                    <div style={{ fontSize:11, color:t.faint, marginBottom:8, fontWeight:500 }}>{exp.date}</div>
                    <p style={{ fontSize:13, color:t.textSec, lineHeight:1.55, margin:0 }}>{exp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginTop:18 }}>
            <a href="https://www.linkedin.com/in/TU-USUARIO" target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:10, background:"#0a66c2", color:"#fff", textDecoration:"none", fontSize:14, fontWeight:600, fontFamily:"inherit", transition:"transform .15s, box-shadow .15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(10,102,194,.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.56c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.65H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43c-1.14 0-2.07-.93-2.07-2.07s.93-2.07 2.07-2.07 2.07.93 2.07 2.07-.93 2.07-2.07 2.07zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
              LinkedIn
            </a>
            <a href="https://link-a-tu-cv.com" target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:10, background:t.card, border:"1.5px solid "+t.border, color:t.text, textDecoration:"none", fontSize:14, fontWeight:600, fontFamily:"inherit", transition:"transform .15s, box-shadow .15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,.08)"; e.currentTarget.style.borderColor = t.red; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = t.border; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Mi CV
            </a>
          </div>
        </div>
      </section>

      <div style={{ marginTop:24, padding:"28px 0 0", borderTop:"1px solid "+t.border, fontSize:13, color:t.faint, textAlign:"center" }}>
        Hecho con cariño en Chile 🇨🇱 · MiPasantía · {new Date().getFullYear()}
      </div>
    </div>
  );
}

// Creator photo — loads from Supabase Storage `logos/creator.png`
function CreatorPhoto({ t }) {
  const [failed, setFailed] = useState(false);
  const url = !failed && SUPABASE_URL
    ? `${SUPABASE_URL}/storage/v1/object/public/logos/creator.png`
    : null;

  const fallbackStyle = {
    width: 110, height: 110, borderRadius: "50%",
    background: "linear-gradient(135deg, " + t.red + ", #6644cc)",
    color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 42, fontWeight: 700, fontFamily: "'Sora', sans-serif",
    border: "3px solid " + t.card, boxShadow: "0 8px 28px rgba(212,40,26,.18)",
  };

  if (failed || !url) {
    return <div style={fallbackStyle}>M</div>;
  }
  return (
    <img
      src={url}
      alt="Matt — creador de MiPasantía"
      onError={() => setFailed(true)}
      style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "3px solid " + t.card, boxShadow: "0 8px 28px rgba(0,0,0,.12)" }}
    />
  );
}

// ─── 404 ──────────────────────────────────────────────────────────────────────
function NotFound({ t, go }) {
  return (
    <div style={{ minHeight:"calc(100vh - 56px)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ textAlign:"center", maxWidth:480 }}>
        <div style={{ fontSize:96, fontFamily:"'Sora',sans-serif", fontWeight:800, color:t.red, lineHeight:1, letterSpacing:"-.05em", marginBottom:8 }}>404</div>
        <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:26, fontWeight:700, color:t.text, marginBottom:10, letterSpacing:"-.02em" }}>
          Esta página se nos perdió
        </h1>
        <p style={{ fontSize:15, color:t.muted, lineHeight:1.6, marginBottom:28 }}>
          Quizá seguiste un link viejo o escribiste mal la dirección. Volvamos al inicio y buscamos tu próxima pasantía.
        </p>
        <button onClick={()=>go("landing")} className="cta" style={{ fontSize:14, padding:"12px 28px" }}>
          Ir al inicio →
        </button>
      </div>
    </div>
  );
}


// ─── COUNT UP ─────────────────────────────────────────────────────────────────
// Animates a number counting up to target when it mounts or target changes.
function CountUp({ value, duration = 900, style }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (value == null || isNaN(value)) return;
    const start = prevRef.current;
    const end = Number(value);
    prevRef.current = end;
    if (start === end) { setDisplay(end); return; }

    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      // easeOutExpo for a satisfying deceleration
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setDisplay(Math.round(start + (end - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span style={style}>{display.toLocaleString("es-CL")}</span>;
}

// ─── CONFETTI BURST ───────────────────────────────────────────────────────────
// Fires a small celebratory emoji burst when `trigger` changes to a new value.
// The parent only sets the trigger when the user's OWN visit lands exactly on a
// multiple of 100 (their view took the counter e.g. 299 → 300), so there are no
// false positives from tab switches or reloads.
function ConfettiBurst({ trigger }) {
  const [burst, setBurst] = useState(false);
  const lastTrigger = useRef(null);

  useEffect(() => {
    if (trigger == null) return;
    if (trigger === lastTrigger.current) return; // already celebrated this milestone
    lastTrigger.current = trigger;
    setBurst(true);
    const timer = setTimeout(() => setBurst(false), 2200);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (!burst) return null;

  const emojis = ["🎉", "🎊", "✨", "🎉", "⭐", "🎊", "✨", "🎉"];
  return (
    <span aria-hidden style={{ position:"absolute", left:"50%", top:"50%", width:0, height:0, pointerEvents:"none", zIndex:50 }}>
      {emojis.map((e, i) => {
        const angle = (i / emojis.length) * 2 * Math.PI;
        const dist = 34 + (i % 3) * 10;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist - 10; // bias upward
        return (
          <span key={i} className="confetti-piece"
            style={{ position:"absolute", fontSize:13, "--dx": dx+"px", "--dy": dy+"px", animationDelay:(i*30)+"ms" }}>
            {e}
          </span>
        );
      })}
    </span>
  );
}

// ─── SKELETONS ────────────────────────────────────────────────────────────────
// Shimmer bar used inside skeletons
function Shimmer({ w = "100%", h = 12, r = 6, style = {} }) {
  return (
    <span className="skeleton-shimmer" style={{ display:"inline-block", width:w, height:h, borderRadius:r, ...style }} />
  );
}

function TableSkeleton({ t, dark, isEvent }) {
  const cols = isEvent ? 6 : 13;
  const rows = 8;
  const headers = isEvent
    ? ["Estado","Empresa","Evento","Región","Fecha","Link"]
    : ["Estado","Empresa","Rol","Región","Modalidad","Duración","Apertura","Cierre","Etapa","Últ. Apertura","Proceso","Notas","Link"];
  return (
    <div style={{ overflowX:"auto", padding:"0 28px 60px" }}>
      <table style={{ borderCollapse:"collapse", width:"100%", fontSize:13 }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ background:t.thead, color:t.muted, fontSize:10, textTransform:"uppercase", letterSpacing:".07em", padding:"10px 14px", textAlign:"left", fontWeight:600, borderBottom:"1px solid "+t.border, whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} style={{ borderBottom:"1px solid "+t.border }}>
              {/* Estado */}
              <td style={{ padding:"12px 14px" }}><Shimmer w={72} h={20} r={20} /></td>
              {/* Empresa with logo */}
              <td style={{ padding:"12px 14px" }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:9 }}>
                  <Shimmer w={26} h={26} r={13} />
                  <Shimmer w={80 + (i % 3) * 20} h={12} />
                </span>
              </td>
              {/* remaining cols */}
              {Array.from({ length: cols - 2 }).map((__, j) => (
                <td key={j} style={{ padding:"12px 14px" }}>
                  <Shimmer w={j === cols - 3 ? 48 : 40 + ((i + j) % 4) * 15} h={12} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileSkeleton({ t, dark }) {
  return (
    <div style={{ padding:"0 16px 60px", display:"flex", flexDirection:"column", gap:10 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background:t.card, border:"1px solid "+t.border, borderRadius:12, padding:"14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
              <Shimmer w={36} h={36} r={18} />
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                <Shimmer w={"60%"} h={13} />
                <Shimmer w={"40%"} h={11} />
              </div>
            </div>
            <Shimmer w={70} h={22} r={20} />
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <Shimmer w={60} h={11} />
            <Shimmer w={50} h={11} />
            <Shimmer w={70} h={11} />
          </div>
        </div>
      ))}
    </div>
  );
}


// ─── COLUMN INFO / GLOSSARY ───────────────────────────────────────────────────
// Explanations shown when the user taps the "?" next to certain column headers.
const COLUMN_INFO = {
  stage: {
    title: "Etapa",
    intro: "Indica en qué parte del proceso de selección se encuentra la empresa según lo que reportan otros postulantes. Te sirve para saber si un proceso ya está avanzado (y podrías ir tarde) o si aún estás a tiempo de postular.",
    items: [
      { emoji: "📝", term: "Test Online", desc: "La empresa está enviando pruebas online (lógica, numéricas, verbales) a los postulantes." },
      { emoji: "🎥", term: "Primera Entrevista / Primera Ronda", desc: "Ya están citando a la primera instancia de entrevista. Puede ser una entrevista en vivo con RR.HH., o una entrevista pregrabada (one-way) como HireVue u otra plataforma similar." },
      { emoji: "🗣️", term: "Segunda / Tercera Entrevista", desc: "El proceso avanzó a entrevistas más profundas, muchas veces con el equipo o líderes del área." },
      { emoji: "🏢", term: "Assessment Center", desc: "Etapa grupal presencial o virtual con dinámicas, casos y ejercicios en equipo." },
      { emoji: "🎉", term: "Ofertas Enviadas", desc: "La empresa ya está entregando ofertas a los candidatos seleccionados." },
    ],
  },
  last_open: {
    title: "Última Apertura",
    intro: "Es la fecha en que esta oportunidad abrió en una ocasión anterior (por ejemplo, el año pasado). Sirve como referencia para estimar cuándo podría volver a abrir este año, ya que muchas empresas repiten fechas similares cada temporada.",
    items: [
      { emoji: "📅", term: "¿Para qué me sirve?", desc: "Si una práctica abrió en Agosto el año pasado y aún no abre este año, probablemente lo haga cerca de esa fecha. Te ayuda a anticiparte y estar listo." },
      { emoji: "⏳", term: "¿Es una fecha exacta?", desc: "No. Es una fecha estimada basada en el histórico. La fecha real puede variar algunas semanas." },
    ],
  },
  process: {
    title: "Proceso",
    intro: "Resume las etapas por las que pasarás en el proceso de selección. Aquí te explicamos las siglas y términos más comunes que verás en esta columna:",
    items: [
      { emoji: "📝", term: "OA — Online Assessment", desc: "Prueba online inicial: suele incluir tests de razonamiento numérico, verbal, lógico o de personalidad. Es el primer filtro." },
      { emoji: "🎬", term: "EP — Entrevista Pregrabada", desc: "También llamada one-way interview. Grabas tus respuestas en video frente a la cámara, sin entrevistador en vivo: aparece una pregunta, tienes unos segundos para prepararte y luego un tiempo limitado para responder. Se revisa después. Usamos EP cuando no sabemos qué plataforma específica ocupa la empresa." },
      { emoji: "🎥", term: "HV — HireVue", desc: "Una plataforma específica de entrevista pregrabada, muy usada por bancos y consultoras internacionales. Funciona igual que una EP, pero indicamos HV cuando sabemos con certeza que la empresa ocupa HireVue." },
      { emoji: "🤖", term: "Aira", desc: "Asistente de reclutamiento con inteligencia artificial usado por varias empresas en Chile. Similar a HireVue: rindes tests o entrevistas grabadas evaluadas por IA." },
      { emoji: "💻", term: "VI — Virtual Interview", desc: "Entrevista en vivo por videollamada (Zoom, Teams, Meet) con un reclutador o con el equipo." },
      { emoji: "⚙️", term: "TI — Technical Interview", desc: "Entrevista técnica enfocada en conocimientos específicos del rol (finanzas, programación, casos, etc.)." },
      { emoji: "🏢", term: "AC — Assessment Center", desc: "Jornada grupal (presencial o virtual) con dinámicas, casos de negocio y ejercicios en equipo para evaluar habilidades." },
      { emoji: "🤝", term: "F2F — Face to Face", desc: "Entrevista presencial, cara a cara, normalmente en las oficinas de la empresa." },
      { emoji: "📊", term: "Case Study", desc: "Estudio de caso: te presentan un problema de negocio real o simulado y debes analizarlo y proponer una solución." },
    ],
  },
};

function InfoModal({ infoKey, t, dark, onClose }) {
  const info = COLUMN_INFO[infoKey];
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!info) return null;

  return createPortal(
    <div onClick={onClose} className="info-overlay"
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", backdropFilter:"blur(3px)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} className="info-modal"
        style={{ background:t.card, borderRadius:18, maxWidth:520, width:"100%", maxHeight:"85vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.4)", border:"1px solid "+t.border, fontFamily:"'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ padding:"22px 24px 16px", borderBottom:"1px solid "+t.border, position:"sticky", top:0, background:t.card, borderRadius:"18px 18px 0 0", zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:t.text, letterSpacing:"-.02em", margin:0 }}>
              {info.title}
            </h3>
            <button onClick={onClose} style={{ background:t.pill, border:"1px solid "+t.border, borderRadius:8, width:30, height:30, cursor:"pointer", color:t.muted, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:"inherit", lineHeight:1 }}>✕</button>
          </div>
          <p style={{ fontSize:13.5, color:t.textSec, lineHeight:1.6, margin:"10px 0 0" }}>{info.intro}</p>
        </div>
        {/* Items */}
        <div style={{ padding:"16px 24px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          {info.items.map((it, i) => (
            <div key={i} style={{ display:"flex", gap:13, alignItems:"flex-start" }}>
              <div style={{ fontSize:22, flexShrink:0, lineHeight:1.2, width:30, textAlign:"center" }}>{it.emoji}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:3 }}>{it.term}</div>
                <div style={{ fontSize:13, color:t.muted, lineHeight:1.55 }}>{it.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── FEEDBACK MODAL ───────────────────────────────────────────────────────────
function FeedbackModal({ t, dark, area, subcat, onClose }) {
  const [type, setType] = useState("missing"); // "missing" | "error"
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSend = message.trim().length >= 5 && emailValid && !sending;

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: type === "missing" ? "Sugerir oportunidad faltante" : "Encontré un error",
          message: message.trim(),
          email: email.trim(),
          area, subcat,
        }),
      });
      if (!res.ok) throw new Error("No se pudo enviar");
      setSent(true);
    } catch (e) {
      setError("Hubo un problema al enviar. Intenta de nuevo en un momento.");
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div onClick={onClose} className="info-overlay"
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", backdropFilter:"blur(3px)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} className="info-modal"
        style={{ background:t.card, borderRadius:18, maxWidth:460, width:"100%", maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.4)", border:"1px solid "+t.border, fontFamily:"'DM Sans',sans-serif" }}>

        {sent ? (
          <div style={{ padding:"40px 28px", textAlign:"center" }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🙌</div>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:t.text, marginBottom:10, letterSpacing:"-.02em" }}>¡Gracias por avisar!</h3>
            <p style={{ fontSize:14, color:t.muted, lineHeight:1.6, marginBottom:24 }}>
              Recibimos tu mensaje y lo revisaremos pronto. Aportes como el tuyo hacen que MiPasantía sea mejor para todos.
            </p>
            <button onClick={onClose} className="cta" style={{ fontSize:14, padding:"11px 28px" }}>Cerrar</button>
          </div>
        ) : (
          <>
            <div style={{ padding:"22px 24px 16px", borderBottom:"1px solid "+t.border }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:19, fontWeight:700, color:t.text, letterSpacing:"-.02em", margin:0 }}>
                  ¿Notaste algo incorrecto o faltante?
                </h3>
                <button onClick={onClose} style={{ background:t.pill, border:"1px solid "+t.border, borderRadius:8, width:30, height:30, cursor:"pointer", color:t.muted, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:"inherit", lineHeight:1 }}>✕</button>
              </div>
              <p style={{ fontSize:13, color:t.muted, lineHeight:1.55, margin:"8px 0 0" }}>
                Ayúdanos a mantener la información precisa y completa. Cuéntanos qué encontraste.
              </p>
            </div>

            <div style={{ padding:"18px 24px 24px" }}>
              {/* Type selector */}
              <div style={{ display:"flex", gap:8, marginBottom:18 }}>
                {[
                  { id:"missing", icon:"➕", label:"Sugerir oportunidad" },
                  { id:"error",   icon:"⚠️", label:"Encontré un error" },
                ].map(opt => (
                  <button key={opt.id} onClick={()=>setType(opt.id)}
                    style={{ flex:1, padding:"11px 10px", borderRadius:10, border:"1.5px solid "+(type===opt.id?t.red:t.border), background:type===opt.id?(dark?"#2a0f0d":"#fff1f0"):t.input, color:type===opt.id?t.red:t.muted, fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s", display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                    <span style={{ fontSize:18 }}>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <label style={{ fontSize:12, fontWeight:600, color:t.textSec, display:"block", marginBottom:6 }}>
                {type==="missing" ? "Describe la oportunidad" : "Describe el error"}
              </label>
              <textarea value={message} onChange={e=>setMessage(e.target.value)}
                placeholder={type==="missing"
                  ? "Ej: Falta la práctica de verano de [empresa], el link es..."
                  : "Ej: La fecha de cierre de [empresa] dice X pero debería ser Y..."}
                rows={4}
                style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:"1px solid "+t.border, background:t.input, color:t.text, fontSize:13.5, fontFamily:"inherit", resize:"vertical", marginBottom:16, boxSizing:"border-box", lineHeight:1.5 }} />

              {/* Email */}
              <label style={{ fontSize:12, fontWeight:600, color:t.textSec, display:"block", marginBottom:6 }}>
                Tu correo <span style={{ color:t.faint, fontWeight:400 }}>(para evitar spam y poder responderte)</span>
              </label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="tu@correo.com"
                style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:"1px solid "+t.border, background:t.input, color:t.text, fontSize:13.5, fontFamily:"inherit", marginBottom:18, boxSizing:"border-box" }} />

              {error && <div style={{ fontSize:12.5, color:"#e11d48", marginBottom:12 }}>{error}</div>}

              <button onClick={submit} disabled={!canSend} className={canSend ? "cta" : ""}
                style={{ width:"100%", padding:"12px 0", fontSize:14, fontWeight:600, borderRadius:10, cursor:canSend?"pointer":"not-allowed", fontFamily:"inherit", border:"none",
                  background: canSend ? undefined : t.pill,
                  color: canSend ? "#fff" : t.faint,
                  opacity: sending ? .7 : 1 }}>
                {sending ? "Enviando…" : "Enviar sugerencia"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// Small "?" button placed next to certain column headers
function InfoButton({ onClick, t }) {
  return (
    <button onClick={onClick} title="¿Qué significa?"
      style={{ background:"none", border:"1px solid "+t.border, borderRadius:"50%", width:15, height:15, minWidth:15, padding:0, cursor:"pointer", color:t.faint, fontSize:10, fontWeight:700, display:"inline-flex", alignItems:"center", justifyContent:"center", marginLeft:5, fontFamily:"'DM Sans',sans-serif", lineHeight:1, verticalAlign:"middle", transition:"all .15s" }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=t.red; e.currentTarget.style.color=t.red; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=t.border; e.currentTarget.style.color=t.faint; }}>
      ?
    </button>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
function Styles({ t, dark }) {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:4px;height:4px}
      ::-webkit-scrollbar-thumb{background:${t.red}44;border-radius:3px}
      .cta{background:linear-gradient(135deg,#d4281a,#e8401a);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-family:'DM Sans',sans-serif;transition:all .2s;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 18px rgba(212,40,26,.28)}
      .cta:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 7px 28px rgba(212,40,26,.4)}
      .cta:disabled{opacity:.5;cursor:not-allowed}
      .country-card:hover{transform:translateY(-4px) scale(1.02);border-color:${t.red}!important;box-shadow:0 10px 28px rgba(212,40,26,.12)}
      .country-card-soon{animation:fadeUp .42s ease both;animation-delay:calc(var(--i)*.05s)}
      .area-card:not(.area-locked):hover{transform:translateY(-3px);border-color:var(--ac)!important;box-shadow:0 6px 20px rgba(0,0,0,.1)}
      .area-locked{filter:saturate(.4)}
      .country-card,.area-card{animation:cardPop .5s cubic-bezier(.22,.61,.36,1) both;animation-delay:calc(var(--i)*.045s);transition:transform .18s,border-color .18s,box-shadow .18s}
      .trow:hover td{background:${dark?"rgba(255,255,255,.018)":"rgba(0,0,0,.018)"}}
      .dd-item{transition:background .12s,transform .1s}
      .dd-item:hover{background:${t.pill}}
      .dd-item:active{transform:scale(.97)}
      .modal-in{animation:fadeUp .3s ease both}
      .blink-dot{width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block;animation:blink 2s infinite}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
      .land-in{animation:fadeUp .55s ease both}
      .page-in{animation:fadeUp .4s ease both}
      @keyframes spin-kf{to{transform:rotate(360deg)}}
      .spin-icon{display:inline-block;animation:spin-kf .9s linear infinite}
      @keyframes grid-shift{0%{background-position:0 0}100%{background-position:48px 48px}}
      .grid-anim{animation:grid-shift 4s linear infinite}

      /* Skeleton shimmer */
      .skeleton-shimmer{
        background:linear-gradient(90deg,
          ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} 25%,
          ${dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.11)"} 37%,
          ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} 63%);
        background-size:400% 100%;
        animation:shimmer 1.4s ease infinite;
      }
      @keyframes shimmer{0%{background-position:100% 50%}100%{background-position:0 50%}}

      /* Real rows fade-in when data loads */
      @keyframes rowFadeIn{
        from{opacity:0;transform:translateY(8px)}
        to{opacity:1;transform:none}
      }
      .row-enter{animation:rowFadeIn .45s cubic-bezier(.22,.61,.36,1) both}

      /* Group headers fade */
      @keyframes fadeSlide{
        from{opacity:0;transform:translateY(6px)}
        to{opacity:1;transform:none}
      }
      .fade-slide{animation:fadeSlide .4s ease both}

      /* Page transitions */
      @keyframes pageIn{
        from{opacity:0;transform:translateY(10px)}
        to{opacity:1;transform:none}
      }
      @keyframes pageOut{
        from{opacity:1;transform:translateY(0)}
        to{opacity:0;transform:translateY(-6px)}
      }
      .page-entering{animation:pageIn .38s cubic-bezier(.22,.61,.36,1) both}
      .page-leaving{animation:pageOut .16s ease-in both}

      /* Group expand/collapse */
      @keyframes groupExpand{
        from{opacity:0;transform:translateY(-4px)}
        to{opacity:1;transform:none}
      }
      .group-expand{animation:groupExpand .3s ease both}
      .group-header-row:hover td{background:${dark?"#161618":"#e8edf4"}!important}

      /* Subcategory switch fade */
      @keyframes subcatFade{
        from{opacity:0;transform:translateY(6px)}
        to{opacity:1;transform:none}
      }
      .subcat-fade{animation:subcatFade .32s cubic-bezier(.22,.61,.36,1) both}

      /* Info modal */
      @keyframes infoOverlayIn{from{opacity:0}to{opacity:1}}
      @keyframes infoModalIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
      .info-overlay{animation:infoOverlayIn .2s ease both}
      .info-modal{animation:infoModalIn .3s cubic-bezier(.22,.61,.36,1) both}

      /* Confetti burst */
      @keyframes confettiFly{
        0%{opacity:0;transform:translate(0,0) scale(.3)}
        20%{opacity:1}
        100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.1)}
      }
      .confetti-piece{animation:confettiFly 2s cubic-bezier(.15,.7,.35,1) forwards}

      /* Status badge pulse when changed */
      @keyframes badgePulse{
        0%{transform:scale(1)}
        35%{transform:scale(1.12)}
        100%{transform:scale(1)}
      }
      .badge-pulse{animation:badgePulse .42s cubic-bezier(.34,1.56,.64,1)}

      /* Button press effect */
      .press{transition:transform .1s ease}
      .press:active{transform:scale(.96)}

      /* CTA press */
      .cta:active{transform:scale(.97)}

      /* Area cards cascade entrance */
      @keyframes cardPop{
        from{opacity:0;transform:translateY(14px) scale(.97)}
        to{opacity:1;transform:none}
      }

      /* Respect reduced motion preference */
      @media (prefers-reduced-motion: reduce){
        .page-entering,.page-leaving,.row-enter,.group-expand,.skeleton-shimmer,.grid-anim{
          animation:none !important;
        }
      }
    `}</style>
  );
}
