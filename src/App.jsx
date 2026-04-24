import { useState, useEffect, useCallback } from "react";
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
  "finanzas_tradicional":  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=603840342&single=true&output=csv",
  "finanzas_eventos":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=1543724149&single=true&output=csv",
  // Software (verano URL fixed from pubhtml to csv)
  "software_verano":       "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=0&single=true&output=csv",
  "software_tradicional":  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=603840342&single=true&output=csv",
  "software_eventos":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0ZwGrGTYDhjhFSOMdQiEMXJcnjVTxlY1wn-FnY_SYt_oOJ_6uqNXmOPAc2lm5Ef18SeeIaV4CQ_FQ/pub?gid=1543724149&single=true&output=csv",
  // Consultoría
  "consultoria_verano":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=0&single=true&output=csv",
  "consultoria_tradicional":"https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=603840342&single=true&output=csv",
  "consultoria_eventos":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG9Lx8THbf8_WzdWOdoxfQCAyB1AhrEQi0aKZNPMA-QJaE_edm5iHpwlRSkxwTkkcV9urqjJwa0YQy/pub?gid=1543724149&single=true&output=csv",
  // Marketing
  "marketing_verano":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=0&single=true&output=csv",
  "marketing_tradicional": "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=603840342&single=true&output=csv",
  "marketing_eventos":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4NIA4gP4b1Nbw6RJmuuAuDUNXPuUXfs5ocglT1rRmGvoONqR4Dplax0MFsgDaHGaswuEL9DfU5s9A/pub?gid=1543724149&single=true&output=csv",
  // Ingeniería
  "ingenieria_verano":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=0&single=true&output=csv",
  "ingenieria_tradicional":"https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=603840342&single=true&output=csv",
  "ingenieria_eventos":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHMtUfBZsX0feJP4nqgeZwWIqLPg_RocOsz2m5lQzWgz2ggOZi3tnhDrkDBmnr_O7CTYxtag_jpyIv/pub?gid=1543724149&single=true&output=csv",
  // Legal
  "legal_verano":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=0&single=true&output=csv",
  "legal_tradicional":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=603840342&single=true&output=csv",
  "legal_eventos":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ4FIMSqWfDiZPrU0JKqcHNAD5updX6H0NmROUJO9mWlKML9oDIDQ8GYxSmlvcpFb6CjEyBAsynH1O/pub?gid=1543724149&single=true&output=csv",
  // RRHH
  "rrhh_verano":           "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=0&single=true&output=csv",
  "rrhh_tradicional":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=603840342&single=true&output=csv",
  "rrhh_eventos":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vTD7NvwjYytOMdafNQtsH3LT8NKAB3_Objyf9u_jzDtrhoYw0oNosT8PHe1KQ3er46Tl87COleEa-aa/pub?gid=1543724149&single=true&output=csv",
  // Salud
  "salud_verano":          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=0&single=true&output=csv",
  "salud_tradicional":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=603840342&single=true&output=csv",
  "salud_eventos":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vQG0-Kt_I3Cc5Vy6hZZGcv8P7aE7KpvsxJPh8i7PwXnzSCFTnAoJS-lQkCbat_FuTQP5ICZYPd5YWY_/pub?gid=1543724149&single=true&output=csv",
  // Diseño
  "diseno_verano":         "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=0&single=true&output=csv",
  "diseno_tradicional":    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=603840342&single=true&output=csv",
  "diseno_eventos":        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN-XFWYmtSNOY0_LWKSrQj1p9x2nrtEuYLbxfAMKGsZwTRwWUMYCxHEM1vqFhl8k0USnnBoXyhKbBV/pub?gid=1543724149&single=true&output=csv",
  // Educación
  "educacion_verano":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=0&single=true&output=csv",
  "educacion_tradicional": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=603840342&single=true&output=csv",
  "educacion_eventos":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwqwmP4NcbuCh84LL2LTC-HQjYKPj1zD4oZAoKj4oyJr7U2a79PWVCZ9L7d5R4UycLx8FzMRMW08D5/pub?gid=1543724149&single=true&output=csv",
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
  verano:      { label: "Práctica de Verano 2027", icon: "☀️" },
  tradicional: { label: "Práctica tradicional",    icon: "📋" },
  eventos:     { label: "Eventos",                 icon: "🎟️" },
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

const AREAS = [
  { id: "software",    label: "Software & Tech", icon: "💻", color: "#2563eb" },
  { id: "finanzas",    label: "Finanzas",         icon: "📈", color: "#059669" },
  { id: "consultoria", label: "Consultoría",      icon: "🧠", color: "#7c3aed" },
  { id: "marketing",   label: "Marketing",        icon: "📣", color: "#d97706" },
  { id: "ingenieria",  label: "Ingeniería",       icon: "⚙️",  color: "#dc2626" },
  { id: "legal",       label: "Legal",            icon: "⚖️",  color: "#0891b2" },
  { id: "rrhh",        label: "RRHH",             icon: "🤝", color: "#059669" },
  { id: "salud",       label: "Salud",            icon: "🏥", color: "#e11d48" },
  { id: "diseno",      label: "Diseño & UX",      icon: "🎨", color: "#d97706" },
  { id: "educacion",   label: "Educación",        icon: "📚", color: "#7c3aed" },
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
  bg:        "#08080f",
  surface:   "#0f0f1a",
  card:      "#0f0f1a",
  border:    "#1e1e30",
  borderMid: "#252538",
  text:      "#eeeef5",
  textSec:   "#9898b0",
  muted:     "#4a4a62",
  faint:     "#30304a",
  input:     "#0d0d18",
  thead:     "#0b0b14",
  pill:      "#13131f",
  navBg:     "rgba(8,8,15,0.88)",
  dropdown:  "#14141f",
  red:       "#d4281a",
  redLight:  "#2a1010",
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

// ─── UTILS ────────────────────────────────────────────────────────────────────
function postedStyle(posted, deadline) {
  if (!posted) return {};
  const daysOld  = Math.floor((Date.now() - new Date(posted)) / 86400000);
  const daysLeft = deadline ? Math.floor((new Date(deadline) - Date.now()) / 86400000) : 999;
  if (daysOld <= 7)   return { color: "#2563eb", fontWeight: 600, title: "Publicado recientemente" };
  if (daysLeft >= 0)  return { color: "#16a34a", title: "Postulaciones abiertas" };
  return {};
}

function deadlineInfo(d) {
  if (!d) return null;
  const days = Math.floor((new Date(d) - Date.now()) / 86400000);
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
    setTimeout(() => {
      if (opts?.country !== undefined) setCountry(opts.country);
      if (opts?.area    !== undefined) setArea(opts.area);
      setPage(to);
      setFading(false);
    }, 150);
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

      <div style={{ paddingTop:56, opacity:fading?0:1, transition:"opacity .15s" }}>
        {page==="landing" && <Landing  t={t} dark={dark} go={go} user={user} />}
        {page==="country" && <CountryPage t={t} go={go} />}
        {page==="area"    && <AreaPage t={t} go={go} country={country} liveCounts={liveCounts} />}
        {page==="tracker" && <Tracker  t={t} dark={dark} go={go} country={country} area={area} progress={progress} updStatus={updStatus} updNote={updNote} user={user} setAuthOpen={setAuthOpen} liveCounts={liveCounts} />}
        {page==="profile"  && <Profile t={t} dark={dark} go={go} user={user} progress={progress} setUser={setUser} setProgress={setProgress} />}
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
          setConfirmed(true); // Show confirmation message
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
function Landing({ t, dark, go, user }) {
  const total = Object.values(DEMO_DATA).reduce((s,a)=>s+Object.values(a).reduce((ss,arr)=>ss+arr.length,0),0);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 56px)", padding:"40px 24px", position:"relative", overflow:"hidden" }}>
      <div aria-hidden style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,40,26,.06),transparent 60%)", top:"-10%", left:"50%", transform:"translateX(-50%)" }} />
        <div className="grid-anim" style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${dark?"rgba(255,255,255,.012)":"rgba(0,0,0,.03)"} 1px,transparent 1px),linear-gradient(90deg,${dark?"rgba(255,255,255,.012)":"rgba(0,0,0,.03)"} 1px,transparent 1px)`, backgroundSize:"48px 48px" }} />
      </div>
      <div className="land-in" style={{ position:"relative", textAlign:"center", maxWidth:680 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:t.pill, border:"1px solid "+t.border, borderRadius:20, padding:"5px 14px", marginBottom:28, fontSize:11, color:t.muted, letterSpacing:".07em", textTransform:"uppercase", fontWeight:700 }}>
          <span className="blink-dot" /> {total}+ oportunidades curadas · Chile
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
          {AREAS.map(a=><span key={a.id} style={{ fontSize:12, color:t.faint }}>{a.icon} {a.label}</span>)}
        </div>
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
          const areaHasNew = subcatKeys.some(k => hasNew(a.id+"_"+k, liveCounts));
          return (
            <button key={a.id} onClick={()=>go("tracker",{area:a.id})} className="area-card"
              style={{ "--i":i, "--ac":a.color, background:t.card, border:"1.5px solid "+t.border, borderRadius:12, padding:"18px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:7, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
              {areaHasNew && (
                <span style={{ position:"absolute", top:8, right:8, width:9, height:9, borderRadius:"50%", background:"#d4281a", boxShadow:"0 0 0 2px white" }} />
              )}
              <span style={{ fontSize:26 }}>{a.icon}</span>
              <span style={{ fontWeight:600, fontSize:12, color:t.text, lineHeight:1.3, textAlign:"center" }}>{a.label}</span>
              <span style={{ fontSize:10, color:t.muted }}>
                {hasSheets ? "Ver oportunidades →" : demoCount + " oportunidades"}
              </span>
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
  const [dropdown,    setDropdown]    = useState(null);
  const [search,      setSearch]      = useState("");
  const [remFilt,     setRemFilt]     = useState("Todas");
  const [stFilt,      setStFilt]      = useState("Todas");
  const [cityFilt,    setCityFilt]    = useState("Todas");
  const [collapsed,   setCollapsed]   = useState({});
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 700);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);   // { groupName: true/false }

  const areaData = DEMO_DATA[area] || {};
  const isEvent  = subcat === "eventos";

  // Reset filters + mark seen when switching
  useEffect(() => {
    setCityFilt("Todas");
    setCollapsed({});
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
          setViews({ total: Number(row.total), today: Number(row.today) });
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
      setSheetError("");
      setJobs(areaData[subcat] || []);
    }
  }, [area, subcat]);

  // Merge with user progress
  const merged = jobs.map(j => ({
    ...j,
    status: progress[j.id]?.status || "Sin estado",
    notes:  progress[j.id]?.notes  || "",
    posted: j.posted || null,
  }));

  const cities = ["Todas", ...Array.from(new Set(merged.map(j=>j.region).filter(Boolean))).sort()];

  const filtered = merged.filter(j => {
    if (stFilt   !== "Todas" && j.status !== stFilt)   return false;
    if (remFilt  !== "Todas" && j.remote !== remFilt)  return false;
    if (cityFilt !== "Todas" && j.region !== cityFilt) return false;
    if (search && !(j.company+" "+j.role+" "+j.region).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total:      merged.length,
    applied:    merged.filter(j=>j.status==="Postulé").length,
    interviews: merged.filter(j=>j.status==="Entrevista").length,
    offers:     merged.filter(j=>j.status==="Oferta").length,
  };

  // Group jobs by the "group" column (if present), else one big group
  const hasGroups = filtered.some(j => j.group && j.group.trim());
  const groups = hasGroups
    ? filtered.reduce((acc, j) => {
        const g = j.group?.trim() || "Otras";
        if (!acc[g]) acc[g] = [];
        acc[g].push(j);
        return acc;
      }, {})
    : { "": filtered };

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

  const COL_SPAN = isEvent ? 7 : 9;

  return (
    <div onClick={()=>setDropdown(null)} style={{ minHeight:"calc(100vh - 56px)" }}>

      {/* Header */}
      <div style={{ padding:"22px 28px 0", borderBottom:"1px solid "+t.border }}>
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
                <span style={{ fontSize:12, color:t.muted, display:"flex", alignItems:"center", gap:5 }}>
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 10s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"/><circle cx="10" cy="10" r="3"/>
                  </svg>
                  <strong style={{ color:t.textSec, fontVariantNumeric:"tabular-nums" }}>
                    {views.total.toLocaleString("es-CL")}
                  </strong> visitas totales
                </span>
                <span style={{ fontSize:11, color:t.muted, opacity:.5 }}>·</span>
                <span style={{ fontSize:12, color:t.muted, display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:"#16a34a", display:"inline-block", animation:"blink 2s infinite" }} />
                  <strong style={{ color:"#16a34a", fontVariantNumeric:"tabular-nums" }}>
                    {views.today.toLocaleString("es-CL")}
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
              <button key={k} onClick={()=>setSubcat(k)}
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
            <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:"'Sora',sans-serif", lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:10, color:t.muted, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

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
              const sc = SS[s]||SS["Sin estado"];
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
        {hasGroups && !isMobile && (
          <button onClick={toggleAll}
            style={{ background:"none", border:"1px solid "+t.border, borderRadius:6, padding:"5px 11px", cursor:"pointer", fontSize:12, color:t.muted, fontFamily:"inherit" }}>
            {allCollapsed ? "↕ Expandir todo" : "↕ Colapsar todo"}
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
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:t.muted }}>
          <span className="spin-icon" style={{ fontSize:24 }}>⟳</span>
          <div style={{ marginTop:12, fontSize:13 }}>Cargando desde Google Sheets…</div>
        </div>
      ) : isMobile ? (
        <MobileCards
          groups={groups} hasGroups={hasGroups} collapsed={collapsed}
          toggleGroup={toggleGroup} isEvent={isEvent} t={t} dark={dark}
          dropdown={dropdown} setDropdown={setDropdown}
          updStatus={updStatus} user={user} setAuthOpen={setAuthOpen}
          filtered={filtered}
        />
      ) : (
        <>
        <div style={{ overflowX:"auto", padding:"0 28px 60px" }}>
          <table style={{ borderCollapse:"collapse", width:"100%", fontSize:13 }}>
            <thead>
              <tr>
                {(isEvent
                  ? ["Estado","Empresa","Evento","Región","Fecha","Link"]
                  : ["Estado","Empresa","Rol","Región","Modalidad","Duración","Publicado","Cierre","Notas","Link"]
                ).map(h=>(
                  <th key={h} style={{ background:t.thead, color:t.muted, fontSize:10, textTransform:"uppercase", letterSpacing:".07em", padding:"10px 14px", textAlign:"left", fontWeight:600, position:"sticky", top:0, zIndex:10, borderBottom:"1px solid "+t.border, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={COL_SPAN} style={{ textAlign:"center", padding:64, color:t.muted }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
                  <div style={{ fontWeight:600, color:t.text, marginBottom:4 }}>Sin resultados</div>
                  <div style={{ fontSize:12 }}>Prueba otro filtro o subcategoría</div>
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
  );
}

// ─── MOBILE CARDS ─────────────────────────────────────────────────────────────
function MobileCards({ groups, hasGroups, collapsed, toggleGroup, isEvent, t, dark, dropdown, setDropdown, updStatus, user, setAuthOpen, filtered }) {
  if (filtered.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"60px 28px", color:t.muted }}>
        <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
        <div style={{ fontWeight:600, color:t.text, marginBottom:4 }}>Sin resultados</div>
        <div style={{ fontSize:12 }}>Prueba otro filtro o subcategoría</div>
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
          {!collapsed[groupName] && groupJobs.map(job => (
            <MobileCard key={job.id} job={job} isEvent={isEvent} t={t} dark={dark}
              dropdown={dropdown} setDropdown={setDropdown}
              updStatus={updStatus} user={user} setAuthOpen={setAuthOpen} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MobileCard({ job, isEvent, t, dark, dropdown, setDropdown, updStatus, user, setAuthOpen }) {
  const sc = SS[job.status] || SS["Sin estado"];
  const dl = deadlineInfo(job.deadline);
  const rem = job.remote === "Remoto"  ? { color:"#16a34a", bg:"#f0fdf4" }
            : job.remote === "Híbrido" ? { color:"#2563eb", bg:"#eff6ff" }
            : { color:t.muted, bg:t.pill };

  return (
    <div style={{ background:t.card, border:"1px solid "+t.border, borderRadius:12, padding:"14px 16px", position:"relative" }}
      onClick={() => setDropdown(null)}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:6 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:t.text, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.company}</div>
          <div style={{ fontSize:12, color:t.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.role}</div>
        </div>
        <div style={{ position:"relative", flexShrink:0 }} onClick={e=>e.stopPropagation()}>
          <span onClick={()=>setDropdown(dropdown===job.id?null:job.id)}
            style={{ background:sc.bg, color:sc.text, border:"1px solid "+sc.border, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:500, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4, userSelect:"none" }}>
            {job.status} ▾
          </span>
          {dropdown === job.id && (
            <div onClick={e=>e.stopPropagation()} style={{ position:"absolute", right:0, top:"calc(100% + 4px)", background:t.dropdown, border:"1px solid "+t.border, borderRadius:10, padding:5, zIndex:200, minWidth:148, boxShadow:"0 8px 32px rgba(0,0,0,.2)" }}>
              {STATUS_OPTIONS.map(s => {
                const st = SS[s]||SS["Sin estado"];
                return (
                  <div key={s} onClick={()=>{ updStatus(job.id, s, { company:job.company, role:job.role, region:job.region, link:job.link }); setDropdown(null); }}
                    className="dd-item" style={{ padding:"8px 11px", borderRadius:7, cursor:"pointer", fontSize:13, color:st.text, display:"flex", alignItems:"center", gap:7 }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:st.text, flexShrink:0 }} />{s}
                  </div>
                );
              })}
              {!user && <div style={{ padding:"7px 11px", fontSize:11, color:t.muted, borderTop:"1px solid "+t.border, marginTop:4 }}>
                <span style={{ cursor:"pointer", color:"#d4281a" }} onClick={()=>setAuthOpen(true)}>Inicia sesión</span> para guardar
              </div>}
            </div>
          )}
        </div>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", marginBottom: job.notes || job.link ? 8 : 0 }}>
        {job.region && <span style={{ fontSize:11, color:t.muted }}>📍 {job.region}</span>}
        {job.remote && <span style={{ fontSize:11, background:rem.bg, color:rem.color, padding:"2px 7px", borderRadius:6, fontWeight:500 }}>{job.remote}</span>}
        {job.duration && <span style={{ fontSize:11, color:t.muted }}>⏱ {job.duration}</span>}
        {dl && <span style={{ fontSize:11, color:dl.color, fontWeight:500 }}>{dl.text}</span>}
      </div>
      {job.notes && <div style={{ fontSize:12, color:t.muted, lineHeight:1.5, borderTop:"1px solid "+t.border, paddingTop:8 }}>{job.notes}</div>}
      {job.link && (
        <a href={job.link} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
          style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:8, fontSize:12, color:"#2563eb", fontWeight:600, textDecoration:"none" }}>
          Postular ↗
        </a>
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
        <tr onClick={onToggle} style={{ cursor:"pointer", userSelect:"none" }}>
          <td colSpan={colSpan} style={{ padding:"9px 14px", background: dark?"#0d0d1c":"#f1f5f9", borderBottom:"1px solid "+t.border, borderTop:"2px solid "+t.border }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:t.muted, transition:"transform .2s", display:"inline-block", transform: collapsed?"rotate(-90deg)":"rotate(0deg)" }}>▼</span>
              <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:12, color:t.text, letterSpacing:".04em", textTransform:"uppercase" }}>{groupName}</span>
              <span style={{ fontSize:11, background:t.pill, color:t.muted, padding:"1px 8px", borderRadius:10, border:"1px solid "+t.border }}>{jobs.length}</span>
            </div>
          </td>
        </tr>
      )}

      {/* Job rows */}
      {!collapsed && jobs.map(job => (
        <JobRow key={job.id} job={job} isEvent={isEvent} t={t} dark={dark}
          dropdown={dropdown} setDropdown={setDropdown}
          updStatus={updStatus} updNote={updNote}
          user={user} setAuthOpen={setAuthOpen} />
      ))}
    </>
  );
}

// ─── JOB ROW ──────────────────────────────────────────────────────────────────
function JobRow({ job, isEvent, t, dark, dropdown, setDropdown, updStatus, updNote, user, setAuthOpen }) {
  const sc  = SS[job.status] || SS["Sin estado"];
  const dl  = deadlineInfo(job.deadline);
  const ps  = postedStyle(job.posted, job.deadline);
  const rem = job.remote==="Remoto"  ? {bg:"#f0fdf4",text:"#16a34a"}
            : job.remote==="Híbrido" ? {bg:"#eff6ff",text:"#2563eb"}
            : {bg:t.pill,text:t.muted};

  return (
    <tr className="trow" style={{ borderBottom:"1px solid "+t.border }}>
      {/* STATUS — first column like Trackr */}
      <td style={{ padding:"10px 12px", position:"relative" }} onClick={e=>e.stopPropagation()}>
        <span onClick={()=>setDropdown(dropdown===job.id?null:job.id)}
          style={{ background:sc.bg, color:sc.text, border:"1px solid "+sc.border, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:4, userSelect:"none" }}>
          {job.status} ▾
        </span>
        {dropdown===job.id && (
          <div onClick={e=>e.stopPropagation()} style={{ position:"absolute", background:t.dropdown, border:"1px solid "+t.border, borderRadius:10, padding:5, zIndex:200, minWidth:148, boxShadow:"0 12px 40px rgba(0,0,0,.15)", top:"calc(100% + 2px)", left:0 }}>
            {STATUS_OPTIONS.map(s=>{
              const st = SS[s]||SS["Sin estado"];
              return (
                <div key={s} onClick={()=>{
                  updStatus(job.id, s, {
                    company: job.company, role: job.role,
                    region: job.region, link: job.link,
                  });
                  setDropdown(null);
                }} className="dd-item"
                  style={{ padding:"7px 11px", borderRadius:7, cursor:"pointer", fontSize:12, color:st.text, display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:st.text, flexShrink:0 }} />{s}
                </div>
              );
            })}
            {!user && <div style={{ padding:"7px 11px", fontSize:11, color:t.muted, borderTop:"1px solid "+t.border, marginTop:4 }}>
              <span style={{ cursor:"pointer", color:t.red }} onClick={()=>setAuthOpen(true)}>Inicia sesión</span> para guardar
            </div>}
          </div>
        )}
      </td>
      <td style={{ padding:"10px 14px", fontWeight:600, color:t.text, whiteSpace:"nowrap" }}>{job.company}</td>
      <td style={{ padding:"10px 14px", color:t.textSec, maxWidth:200 }}>{job.role}</td>
      <td style={{ padding:"10px 14px", color:t.muted, fontSize:12, whiteSpace:"nowrap" }}>{job.region}</td>

      {isEvent ? (
        <td style={{ padding:"10px 14px", fontSize:12, color:dl?.color||t.muted, whiteSpace:"nowrap" }}>{dl?dl.text:<span style={{color:t.faint}}>—</span>}</td>
      ) : (
        <>
          <td style={{ padding:"10px 14px" }}><span style={{ background:rem.bg, color:rem.text, padding:"3px 8px", borderRadius:4, fontSize:11, fontWeight:500 }}>{job.remote}</span></td>
          <td style={{ padding:"10px 14px", color:t.muted, fontSize:12, whiteSpace:"nowrap" }}>{job.duration}</td>
          <td style={{ padding:"10px 14px", fontSize:12, whiteSpace:"nowrap", ...ps }}>
            {job.posted || <span style={{color:t.faint}}>—</span>}
          </td>
          <td style={{ padding:"10px 14px", fontSize:12, color:dl?.color||t.muted, whiteSpace:"nowrap" }}>{dl?dl.text:<span style={{color:t.faint}}>—</span>}</td>
          <td style={{ padding:"10px 14px", maxWidth:220, color:t.muted, fontSize:12 }}>
            {job.notes || <span style={{ color:t.faint }}>—</span>}
          </td>
        </>
      )}

      <td style={{ padding:"10px 14px" }}>
        <a href={job.link} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
          style={{ color:t.accent, textDecoration:"none", fontSize:13, fontWeight:500, whiteSpace:"nowrap" }}>
          Postular ↗
        </a>
      </td>
    </tr>
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

  const SS_COLORS = {
    "Sin estado":   { bg: "#f1f5f9", text: "#94a3b8", border: "#e2e8f0" },
    "Interesado/a": { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
    "Postulé":      { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
    "Entrevista":   { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
    "Oferta":       { bg: "#faf5ff", text: "#7c3aed", border: "#e9d5ff" },
    "Rechazado":    { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
  };

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
    if (stored?.company) return { company: stored.company, role: stored.role||"", region: stored.region||"", link: stored.link||null };
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
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'Sora',sans-serif", lineHeight: 1 }}>{s.v}</div>
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
              {applications.map(({ jobId, status, company, role, region, link }) => {
                const sc   = SS_COLORS[status] || SS_COLORS["Interesado/a"];
                return (
                  <div key={jobId} style={{ background: t.card, border: "1px solid " + t.border, borderRadius: 12, padding: "16px 20px", transition: "box-shadow .18s" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                    {(() => {
                      const d = getDisplayName(jobId, { company, role, region, link, status });
                      return (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: t.text, marginBottom: 3 }}>{d.company}</div>
                            {d.role && <div style={{ fontSize: 12, color: t.muted }}>{d.role}{d.region ? " · " + d.region : ""}</div>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {/* Status badge — clickable dropdown */}
                            <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                              <span onClick={() => setProfDropdown(profDropdown === jobId ? null : jobId)}
                                style={{ background: sc.bg, color: sc.text, border: "1px solid " + sc.border, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, userSelect: "none" }}>
                                {status} ▾
                              </span>
                              {profDropdown === jobId && (
                                <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: t.dropdown, border: "1px solid " + t.border, borderRadius: 10, padding: 5, zIndex: 200, minWidth: 148, boxShadow: "0 8px 32px rgba(0,0,0,.15)" }}>
                                  {["Sin estado", ...ACTIVE_STATUSES].map(s => {
                                    const st = SS_COLORS[s]||SS_COLORS["Sin estado"];
                                    return (
                                      <div key={s} onClick={() => changeStatus(jobId, s)} className="dd-item"
                                        style={{ padding: "7px 11px", borderRadius: 7, cursor: "pointer", fontSize: 12, color: st.text, display: "flex", alignItems: "center", gap: 7 }}>
                                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.text, flexShrink: 0 }} />
                                        {s === "Sin estado" ? "🗑 Quitar de mi lista" : s}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
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
      .area-card:hover{transform:translateY(-3px);border-color:var(--ac)!important;box-shadow:0 6px 20px rgba(0,0,0,.1)}
      .country-card,.area-card{animation:fadeUp .4s ease both;animation-delay:calc(var(--i)*.05s);transition:all .18s}
      .trow:hover td{background:${dark?"rgba(255,255,255,.018)":"rgba(0,0,0,.018)"}}
      .dd-item:hover{background:${t.pill}}
      .modal-in{animation:fadeUp .3s ease both}
      .blink-dot{width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block;animation:blink 2s infinite}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      .land-in{animation:fadeUp .55s ease both}
      .page-in{animation:fadeUp .4s ease both}
      @keyframes spin-kf{to{transform:rotate(360deg)}}
      .spin-icon{display:inline-block;animation:spin-kf .9s linear infinite}
      @keyframes grid-shift{0%{background-position:0 0}100%{background-position:48px 48px}}
      .grid-anim{animation:grid-shift 4s linear infinite}
    `}</style>
  );
}
