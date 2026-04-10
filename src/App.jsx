import { useState, useEffect, useRef, useCallback } from "react";

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
  "finanzas_verano":      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=0&single=true&output=csv",
  "finanzas_tradicional": "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=603840342&single=true&output=csv",
  "finanzas_eventos":     "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJvG5kPNt2TPAY3VXmsVbUvcqr7Yx_BMMMoYTJaAGzZmrJCD4L-seYex1ybnv4WBlbaUjYaClf_qo1/pub?gid=1543724149&single=true&output=csv",
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
  verano:      { label: "Práctica de verano",    icon: "☀️" },
  tradicional: { label: "Práctica tradicional",  icon: "📋" },
  eventos:     { label: "Eventos",               icon: "🎟️" },
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
  // Parse CSV handling quoted fields
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
  const headers = rows[0];
  return rows.slice(1).filter(r => r.some(v => v)).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (row[i] || "").trim(); });
    return obj;
  });
}

async function hashPwd(pwd) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pwd + ":pasantiamap"));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const uKey = e => "u:" + btoa(e).replace(/=/g,"");
const pKey = e => "p:" + btoa(e).replace(/=/g,"");
function loadUser(email)     { try { const v = localStorage.getItem(uKey(email)); return v ? JSON.parse(v) : null; } catch { return null; } }
function saveUser(email, d)  { try { localStorage.setItem(uKey(email), JSON.stringify(d)); } catch {} }
function loadProg(email)     { try { const v = localStorage.getItem(pKey(email)); return v ? JSON.parse(v) : {}; } catch { return {}; } }
function saveProg(email, d)  { try { localStorage.setItem(pKey(email), JSON.stringify(d)); } catch {} }

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark,     setDark]     = useState(false);  // light mode default
  const [page,     setPage]     = useState("landing");
  const [user,     setUser]     = useState(null);
  const [progress, setProgress] = useState({});
  const [country,  setCountry]  = useState(null);
  const [area,     setArea]     = useState(null);
  const [fading,   setFading]   = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

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

  const login = async (email, name) => {
    setUser({ email, name });
    setProgress(loadProg(email));
    setAuthOpen(false);
  };

  const logout = () => { setUser(null); setProgress({}); };

  const updStatus = useCallback(async (jobId, status) => {
    if (!user) { setAuthOpen(true); return; }
    const next = { ...progress, [jobId]: { ...(progress[jobId]||{}), status } };
    setProgress(next);
    saveProg(user.email, next);
  }, [progress, user]);

  const updNote = useCallback(async (jobId, notes) => {
    if (!user) return;
    const next = { ...progress, [jobId]: { ...(progress[jobId]||{}), notes } };
    setProgress(next);
    saveProg(user.email, next);
  }, [progress, user]);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:t.bg, color:t.text, minHeight:"100vh", transition:"background .25s,color .25s" }}>
      <Styles t={t} dark={dark} />

      <Navbar t={t} dark={dark} setDark={setDark} user={user} logout={logout} setAuthOpen={setAuthOpen} page={page} country={country} area={area} go={go} />

      {authOpen && <AuthModal t={t} login={login} close={() => setAuthOpen(false)} />}

      <div style={{ paddingTop:56, opacity:fading?0:1, transition:"opacity .15s" }}>
        {page==="landing" && <Landing  t={t} dark={dark} go={go} user={user} />}
        {page==="country" && <CountryPage t={t} go={go} />}
        {page==="area"    && <AreaPage t={t} go={go} country={country} />}
        {page==="tracker" && <Tracker  t={t} dark={dark} go={go} country={country} area={area} progress={progress} updStatus={updStatus} updNote={updNote} user={user} setAuthOpen={setAuthOpen} />}
      </div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ t, dark, setDark, user, logout, setAuthOpen, page, country, area, go }) {
  const cd = COUNTRIES.find(c=>c.code===country);
  const ad = AREAS.find(a=>a.id===area);
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:300, height:56, padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", background:t.navBg, backdropFilter:"blur(20px)", borderBottom:"1px solid "+t.border }}>
      <button onClick={()=>go("landing")} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
        <span style={{ fontSize:16 }}>🌎</span>
        <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:15, color:t.text }}>
          <span style={{ color:t.red }}>Pasantía</span>Map
        </span>
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
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
            <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,"+t.red+",#6644cc)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>
              {user.name[0].toUpperCase()}
            </div>
            <span style={{ fontSize:13, color:t.textSec, maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</span>
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

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      if (!mail||!pwd) { setErr("Completa todos los campos."); setBusy(false); return; }
      const hash = await hashPwd(pwd);
      if (tab==="register") {
        if (!name)      { setErr("Ingresa tu nombre."); setBusy(false); return; }
        if (pwd!==pwd2) { setErr("Las contraseñas no coinciden."); setBusy(false); return; }
        if (pwd.length<6){ setErr("Mínimo 6 caracteres."); setBusy(false); return; }
        if (loadUser(mail)) { setErr("Ese correo ya tiene cuenta."); setBusy(false); return; }
        saveUser(mail, { name, hash });
        login(mail, name);
      } else {
        const u = loadUser(mail);
        if (!u)          { setErr("No encontramos esa cuenta."); setBusy(false); return; }
        if (u.hash!==hash){ setErr("Contraseña incorrecta.");    setBusy(false); return; }
        login(mail, u.name);
      }
    } catch { setErr("Algo salió mal."); }
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
            <span style={{ color:t.red }}>Pasantía</span>Map
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

        {err && <div style={{ marginTop:10, padding:"9px 13px", background:dark?"#2a1010":"#fff1f0", border:"1px solid #fca5a533", borderRadius:8, color:"#ef4444", fontSize:12 }}>{err}</div>}

        <button onClick={submit} disabled={busy} className="cta" style={{ width:"100%", marginTop:16, fontSize:14, padding:"12px 0", justifyContent:"center" }}>
          {busy ? <><span className="spin-icon">⟳</span> Cargando…</> : tab==="login" ? "Entrar →" : "Crear cuenta →"}
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0 0" }}>
          <div style={{ flex:1, height:1, background:t.border }} />
          <span style={{ fontSize:11, color:t.muted }}>o</span>
          <div style={{ flex:1, height:1, background:t.border }} />
        </div>
        <button disabled style={{ marginTop:10, width:"100%", padding:"10px 0", background:t.pill, border:"1px solid "+t.border, borderRadius:9, cursor:"not-allowed", fontSize:13, color:t.muted, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:9, opacity:.55 }}>
          <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Continuar con Google <span style={{ fontSize:10, background:t.border, padding:"1px 6px", borderRadius:4, marginLeft:2 }}>Próximamente</span>
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
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${dark?"rgba(255,255,255,.012)":"rgba(0,0,0,.03)"} 1px,transparent 1px),linear-gradient(90deg,${dark?"rgba(255,255,255,.012)":"rgba(0,0,0,.03)"} 1px,transparent 1px)`, backgroundSize:"48px 48px" }} />
      </div>
      <div className="land-in" style={{ position:"relative", textAlign:"center", maxWidth:680 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:t.pill, border:"1px solid "+t.border, borderRadius:20, padding:"5px 14px", marginBottom:28, fontSize:11, color:t.muted, letterSpacing:".07em", textTransform:"uppercase", fontWeight:700 }}>
          <span className="blink-dot" /> {total}+ oportunidades curadas · Chile
        </div>
        <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:"clamp(40px,8vw,80px)", fontWeight:700, lineHeight:1.04, letterSpacing:"-.04em", color:t.text, marginBottom:18 }}>
          {user ? "Hola, "+user.name.split(" ")[0]+"." : "Tu próxima"}<br />
          <span style={{ color:t.red }}>pasantía</span> te<br />está esperando.
        </h1>
        <p style={{ fontSize:17, color:t.muted, lineHeight:1.7, margin:"0 auto 44px", maxWidth:460 }}>
          Oportunidades reales en Chile — curadas a mano, con links directos {user ? "y tu progreso guardado." : "y seguimiento de postulaciones."}
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
function AreaPage({ t, go, country }) {
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
          const demoCount  = Object.values(DEMO_DATA[a.id]||{}).reduce((s,arr)=>s+arr.length,0);
          const hasSheets  = ["verano","tradicional","eventos"].some(k => SHEET_URLS[a.id+"_"+k]);
          return (
            <button key={a.id} onClick={()=>go("tracker",{area:a.id})} className="area-card"
              style={{ "--i":i, "--ac":a.color, background:t.card, border:"1.5px solid "+t.border, borderRadius:12, padding:"18px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:7, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              <span style={{ fontSize:26 }}>{a.icon}</span>
              <span style={{ fontWeight:600, fontSize:12, color:t.text, lineHeight:1.3, textAlign:"center" }}>{a.label}</span>
              {hasSheets
                ? <span style={{ fontSize:10, background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0", padding:"1px 7px", borderRadius:10, fontWeight:600 }}>● En vivo</span>
                : <span style={{ fontSize:10, color:t.muted }}>{demoCount} oportunidades</span>}
            </button>
          );
        })}
      </div>
      <button onClick={()=>go("country")} style={{ marginTop:8, background:"none", border:"none", color:t.muted, cursor:"pointer", fontSize:13 }}>← Cambiar país</button>
    </div>
  );
}

// ─── TRACKER ──────────────────────────────────────────────────────────────────
function Tracker({ t, dark, go, country, area, progress, updStatus, updNote, user, setAuthOpen }) {
  const cd = COUNTRIES.find(c=>c.code===country);
  const ad = AREAS.find(a=>a.id===area);
  const [subcat,      setSubcat]      = useState("verano");
  const [jobs,        setJobs]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [sheetError,  setSheetError]  = useState("");
  const [dropdown, setDropdown] = useState(null);
  const [search,   setSearch]   = useState("");
  const [remFilt,  setRemFilt]  = useState("Todas");
  const [stFilt,   setStFilt]   = useState("Todas");
  const [cityFilt, setCityFilt] = useState("Todas");

  const areaData = DEMO_DATA[area] || {};
  const subcats  = Object.keys(SUBCATEGORY_LABELS).filter(k => (areaData[k]||[]).length > 0 || k==="tradicional");

  // Load jobs for current subcategory — from Sheet if configured, else demo data
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
            setJobs(rows.map(r => ({ ...r, id: r.id || (area+"-"+subcat+"-"+Math.random()) })));
          }
        })
        .catch(err => {
          setSheetError("Error al cargar Sheet: " + err.message);
          setJobs(areaData[subcat] || []);
        })
        .finally(() => setLoading(false));
    } else {
      setJobs(areaData[subcat] || []);
    }
  }, [area, subcat]);

  // Merge progress
  const merged = jobs.map(j => ({
    ...j,
    status: progress[j.id]?.status || "Sin estado",
    notes:  progress[j.id]?.notes  || "",
    posted: j.posted || null,
  }));

  // Extract unique cities from current jobs for the filter dropdown
  const cities = ["Todas", ...Array.from(new Set(merged.map(j => j.region).filter(Boolean))).sort()];

  const filtered = merged.filter(j => {
    if (stFilt  !== "Todas" && j.status !== stFilt)  return false;
    if (remFilt !== "Todas" && j.remote !== remFilt) return false;
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

  const isEvent = subcat === "eventos";

  return (
    <div onClick={()=>setDropdown(null)} style={{ minHeight:"calc(100vh - 56px)" }}>

      {/* Header */}
      <div style={{ padding:"22px 28px 0", borderBottom:"1px solid "+t.border }}>
        <button onClick={()=>go("area")} style={{ background:"none", border:"none", color:t.muted, cursor:"pointer", fontSize:12, padding:0, marginBottom:6, display:"flex", alignItems:"center", gap:4 }}>← Cambiar área</button>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12, marginBottom:16 }}>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:t.text, letterSpacing:"-.02em" }}>
            {ad?.icon} {ad?.label}
            <span style={{ color:t.red, marginLeft:10, fontSize:14, fontWeight:500 }}>{cd?.flag} {cd?.name}</span>
          </h2>
          {!user && (
            <button onClick={()=>setAuthOpen(true)} style={{ background:t.redLight, border:"1px solid #fca5a544", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:12, color:t.red, fontWeight:600, fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
              🔒 Inicia sesión para guardar tu progreso
            </button>
          )}
        </div>

        {/* Subcategory tabs */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {Object.keys(SUBCATEGORY_LABELS).map(k => {
            const info  = SUBCATEGORY_LABELS[k];
            const count = (areaData[k]||[]).length;
            const active = subcat === k;
            return (
              <button key={k} onClick={()=>setSubcat(k)}
                style={{ padding:"7px 16px", borderRadius:20, border:"1.5px solid "+(active?t.red:t.border), background:active?t.red:"transparent", color:active?"#fff":t.muted, fontSize:13, fontWeight:active?600:400, cursor:"pointer", fontFamily:"inherit", transition:"all .18s", display:"flex", alignItems:"center", gap:6 }}>
                {info.icon} {info.label}
                <span style={{ fontSize:11, background:active?"rgba(255,255,255,.25)":t.pill, padding:"1px 7px", borderRadius:10, color:active?"#fff":t.faint }}>
                  {count}
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

      {/* Filters */}
      <div style={{ padding:"0 28px 12px", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <input placeholder="🔎 Empresa, rol, región..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ background:t.input, border:"1px solid "+t.border, borderRadius:8, color:t.text, padding:"7px 12px", fontFamily:"inherit", fontSize:13, outline:"none", width:210 }} />
        {!isEvent && <>
          <select value={stFilt} onChange={e=>setStFilt(e.target.value)} style={{ background:t.input, color:t.text, border:"1px solid "+t.border, borderRadius:8, padding:"7px 11px", fontFamily:"inherit", fontSize:13, cursor:"pointer" }}>
            <option value="Todas">Todos los estados</option>
            {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
          </select>
          <select value={remFilt} onChange={e=>setRemFilt(e.target.value)} style={{ background:t.input, color:t.text, border:"1px solid "+t.border, borderRadius:8, padding:"7px 11px", fontFamily:"inherit", fontSize:13, cursor:"pointer" }}>
            <option value="Todas">Toda modalidad</option>
            {["Remoto","Híbrido","Presencial"].map(r=><option key={r}>{r}</option>)}
          </select>
          {cities.length > 2 && (
            <select value={cityFilt} onChange={e=>setCityFilt(e.target.value)} style={{ background:t.input, color:t.text, border:"1px solid "+t.border, borderRadius:8, padding:"7px 11px", fontFamily:"inherit", fontSize:13, cursor:"pointer" }}>
              {cities.map(ci=><option key={ci}>{ci === "Todas" ? "Toda ciudad" : ci}</option>)}
            </select>
          )}
        </>}
        <span style={{ marginLeft:"auto", fontSize:12, color:t.muted }}>{filtered.length} resultado{filtered.length!==1?"s":""}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:t.muted }}>
          <span className="spin-icon" style={{ fontSize:24 }}>⟳</span>
          <div style={{ marginTop:12, fontSize:13 }}>Cargando desde Google Sheets…</div>
        </div>
      ) : (
        <>
        {sheetError && (
          <div style={{ margin:"0 28px 12px", padding:"10px 16px", borderRadius:8, background:"#fff7ed", border:"1px solid #fed7aa", color:"#c2410c", fontSize:12, display:"flex", alignItems:"flex-start", gap:8 }}>
            <span>⚠️</span>
            <div>
              <strong>Error de conexión con Google Sheets:</strong> {sheetError}
              <div style={{ marginTop:4, opacity:.75 }}>Mostrando datos de ejemplo. Verifica que el Sheet esté publicado y los encabezados sean: <code>id, company, role, region, remote, duration, posted, deadline, link, notes</code></div>
            </div>
          </div>
        )}
        <div style={{ overflowX:"auto", padding:"0 28px 60px" }}>
          <table style={{ borderCollapse:"collapse", width:"100%", fontSize:13 }}>
            <thead>
              <tr>
                {["Estado","Empresa","Rol","Región","Modalidad","Duración","Publicado","Cierre","Notas","Link"].map(h=>(
                  <th key={h} style={{ background:t.thead, color:t.muted, fontSize:10, textTransform:"uppercase", letterSpacing:".07em", padding:"10px 14px", textAlign:"left", fontWeight:600, position:"sticky", top:0, zIndex:10, borderBottom:"1px solid "+t.border, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={9} style={{ textAlign:"center", padding:64, color:t.muted }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
                  <div style={{ fontWeight:600, color:t.text, marginBottom:4 }}>Sin resultados</div>
                  <div style={{ fontSize:12 }}>Prueba otro filtro o subcategoría</div>
                </td></tr>
              ) : filtered.map(job=>{
                const sc  = SS[job.status]||SS["Sin estado"];
                const dl  = deadlineInfo(job.deadline);
                const rem = job.remote==="Remoto"  ? {bg:"#f0fdf4",text:"#16a34a"}
                          : job.remote==="Híbrido" ? {bg:"#eff6ff",text:"#2563eb"}
                          : {bg:t.pill,text:t.muted};
                return (
                  <tr key={job.id} className="trow" style={{ borderBottom:"1px solid "+t.border }}>
                    {/* STATUS FIRST — like Trackr */}
                    <td style={{ padding:"10px 12px", position:"relative" }} onClick={e=>e.stopPropagation()}>
                      <span onClick={()=>setDropdown(dropdown===job.id?null:job.id)}
                        style={{ background:sc.bg, color:sc.text, border:"1px solid "+sc.border, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:4, userSelect:"none" }}>
                        {job.status} ▾
                      </span>
                      {dropdown===job.id && (
                        <div onClick={e=>e.stopPropagation()} style={{ position:"absolute", background:t.dropdown, border:"1px solid "+t.border, borderRadius:10, padding:5, zIndex:100, minWidth:148, boxShadow:"0 12px 40px rgba(0,0,0,.15)", top:"calc(100% + 2px)", left:0 }}>
                          {STATUS_OPTIONS.map(s=>{
                            const st = SS[s]||SS["Sin estado"];
                            return <div key={s} onClick={()=>{ updStatus(job.id,s); setDropdown(null); }} className="dd-item"
                              style={{ padding:"7px 11px", borderRadius:7, cursor:"pointer", fontSize:12, color:st.text, display:"flex", alignItems:"center", gap:7 }}>
                              <span style={{ width:7, height:7, borderRadius:"50%", background:st.text, display:"inline-block", flexShrink:0 }} />{s}
                            </div>;
                          })}
                          {!user && <div style={{ padding:"7px 11px", fontSize:11, color:t.muted, borderTop:"1px solid "+t.border, marginTop:4 }}>Inicia sesión para guardar</div>}
                        </div>
                      )}
                    </td>
                    <td style={{ padding:"10px 14px", fontWeight:600, color:t.text, whiteSpace:"nowrap" }}>{job.company}</td>
                    <td style={{ padding:"10px 14px", color:t.textSec, maxWidth:200 }}>{job.role}</td>
                    <td style={{ padding:"10px 14px", color:t.muted, fontSize:12, whiteSpace:"nowrap" }}>{job.region}</td>
                    <td style={{ padding:"10px 14px" }}><span style={{ background:rem.bg, color:rem.text, padding:"3px 8px", borderRadius:4, fontSize:11, fontWeight:500 }}>{job.remote}</span></td>
                    <td style={{ padding:"10px 14px", color:t.muted, fontSize:12, whiteSpace:"nowrap" }}>{job.duration}</td>
                    {(() => { const ps = postedStyle(job.posted, job.deadline); return (
                      <td style={{ padding:"10px 14px", fontSize:12, whiteSpace:"nowrap", ...ps }}>
                        {job.posted ? job.posted : <span style={{color:t.faint}}>—</span>}
                      </td>
                    ); })()}
                    <td style={{ padding:"10px 14px", fontSize:12, color:dl?.color||t.muted, whiteSpace:"nowrap" }}>{dl?dl.text:<span style={{color:t.faint}}>—</span>}</td>
                    <td style={{ padding:"10px 14px", minWidth:160 }}>
                      <input value={job.notes} placeholder={user?"Agregar nota…":"Inicia sesión para notas"} readOnly={!user} onChange={e=>updNote(job.id,e.target.value)} onClick={e=>e.stopPropagation()}
                        style={{ background:"transparent", border:"none", color:t.muted, fontFamily:"inherit", fontSize:12, width:"100%", outline:"none", cursor:user?"text":"default" }} />
                    </td>
                    <td style={{ padding:"10px 14px" }}>
                      <a href={job.link} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ color:t.accent, textDecoration:"none", fontSize:13, fontWeight:500, whiteSpace:"nowrap" }}>Postular ↗</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
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
    `}</style>
  );
}
