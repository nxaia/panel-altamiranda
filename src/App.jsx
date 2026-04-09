import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const PLANOS_BUCKET = "planos-expedientes";
const PLANOS_TABLE = "expediente_planos";
const MAX_PLANO_FILE_SIZE_MB = 15;
const ALLOWED_PLANO_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"];
const ALLOWED_PLANO_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx", "xls", "xlsx", "csv"];

const C = {
  bg: "#f5f7fa",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1e293b",
  muted: "#64748b",
  dim: "#94a3b8",
  sky: "#0ea5e9",
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
  indigo: "#4f46e5",
  slate: "#0f172a",
  softBg: "#eef2f7",
};

const ESTADOS = {
  revision_inicial: { label: "Revisión inicial", bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd" },
  pendiente_documentacion: { label: "Pend. documentación", bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  en_proceso: { label: "En proceso", bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  revision_legal: { label: "Revisión legal", bg: "#e0e7ff", color: "#3730a3", border: "#c7d2fe" },
  pendiente: { label: "Pendiente", bg: "#ffedd5", color: "#9a3412", border: "#fed7aa" },
  detenido: { label: "Detenido", bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
  listo: { label: "Listo", bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
};

const PRIORIDADES = {
  critica: { label: "Crítica", dot: "#ef4444" },
  alta: { label: "Alta", dot: "#f97316" },
  media: { label: "Media", dot: "#f59e0b" },
  baja: { label: "Baja", dot: "#94a3b8" },
};

const AREAS = ["", "Catastro", "Obras", "Legales", "Escribanía", "Topografía", "Dirección", "Mesa de Entradas"];
const LOCALIDADES = ["Banda del Río Salí", "Lastenia"];
const ESTADOS_CIVILES = ["", "Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión convivencial", "Otro"];

const ALL_BARRIOS = [
  "Barrio 140 Viviendas",
  "Barrio 19 de Octubre",
  "Barrio 200 Viviendas",
  "Barrio 4 de Junio",
  "Barrio 40 Viviendas",
  "Barrio 60 Viviendas",
  "Barrio 63 Viviendas",
  "Barrio Aeropuerto",
  "Barrio Alberdi",
  "Barrio Albornoz",
  "Barrio Alto Nuestra Señora del Valle",
  "Barrio Ampliación 4 de Junio",
  "Barrio Ampliación La Milagrosa",
  "Barrio Belgrano 2",
  "Barrio Capitán Candelaria",
  "Barrio Cifre",
  "Barrio Cruz del Norte",
  "Barrio El Cuadro",
  "Barrio El Mirador",
  "Barrio El Polígono",
  "Barrio El Sol",
  "Barrio Enriquetta de Orell",
  "Barrio Fadel",
  "Barrio Fassora",
  "Barrio Fatima",
  "Barrio Flor y Perfume",
  "Barrio General Belgrano",
  "Barrio Juan Posse",
  "Barrio Kilometro 11",
  "Barrio La Arboleda",
  "Barrio La Cerámica",
  "Barrio La Costanera",
  "Barrio La Milagrosa",
  "Barrio La Rivera",
  "Barrio Las Palmeras",
  "Barrio Los Fresnos",
  "Barrio Los Pinos",
  "Barrio Lotear",
  "Barrio Manzana de Oro",
  "Barrio Nuestra Señora del Valle",
  "Barrio Pacará",
  "Barrio Pacará Pintado",
  "Barrio Pozo del Alto",
  "Barrio Presidente Menem",
  "Barrio Presidente Perón",
  "Barrio Progreso",
  "Barrio Refusta",
  "Barrio Sagrado Corazón de Jesús",
  "Barrio San Antonio del Alto",
  "Barrio San Antonio del Bajo",
  "Barrio San Jorge",
  "Barrio San José",
  "Barrio San Juan",
  "Barrio San Justo",
  "Barrio San Miguel Arcangel (260 viv)",
  "Barrio San Ramón 1",
  "Barrio San Ramón 2",
  "Barrio Santa Clara",
  "Barrio Santa Rita",
  "Barrio Santa Rita 1",
  "Barrio Santa Rosa",
  "Barrio Santo Cristo 1",
  "Barrio Santo Cristo 2",
  "Barrio Sargento Cabral",
  "Barrio SMATA (150 Viviendas)",
  "Barrio Soldado Tucumano",
  "Barrio Unión y Progreso",
  "Barrio Victoriano Caro",
  "Barrio Villa Cariño",
  "Barrio Villa Inés",
  "Barrio Villa Lastenia",
  "Otro",
];

const BARRIOS = {
  "Banda del Río Salí": ALL_BARRIOS,
  Lastenia: ALL_BARRIOS,
};

const LOGIN_USERS = [
  { id: "estela-palacios", nombre: "Estela Palacios", rol: "Directora", area: "Dirección", tecnico: false, canEdit: true },
  { id: "carlos-chauvet", nombre: "Carlos Chauvet", rol: "Área técnica", area: "Técnica", tecnico: true, canEdit: true },
  { id: "emanuel-aguilar", nombre: "Emanuel Aguilar", rol: "Consulta", area: "Dirección", tecnico: false, canEdit: false },
];

const PAGE_SIZE = 5;
const ACCESS_HISTORY_KEY = "cig_panel_access_history_v1";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 8px",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 13,
  background: "#f8fafc",
  color: C.text,
  outline: "none",
};

const compactInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "5px 8px",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 11,
  background: "#fff",
  color: C.text,
  outline: "none",
  minHeight: 30,
  lineHeight: 1.2,
};

const btnPrimary = {
  background: C.sky,
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
};

const btnGhost = {
  background: "#fff",
  color: C.muted,
  border: `1px solid ${C.border}`,
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
};

const labelStyle = {
  fontSize: 10,
  color: C.dim,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: ".05em",
  marginBottom: 3,
};

function EmptyBlock({ title, text, action = null }) {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: C.muted }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{title}</div>
      <div style={{ fontSize: 13, marginTop: 8 }}>{text}</div>
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildUsersMap(users) {
  return users.reduce((acc, user) => {
    acc[user.id] = user.nombre;
    return acc;
  }, {});
}

function nextExpedienteNumber(items) {
  const currentYear = new Date().getFullYear();
  const maxCorrelative = items.reduce((max, item) => {
    const match = String(item.num || "").match(/EXP-\d{4}-(\d+)/i);
    if (!match) return max;
    return Math.max(max, Number(match[1] || 0));
  }, 0);
  return `EXP-${currentYear}-${String(maxCorrelative + 1).padStart(3, "0")}`;
}

function nextExpedienteNumberFromSeed(seed, index) {
  const currentYear = new Date().getFullYear();
  return `EXP-${currentYear}-${String(seed + index).padStart(3, "0")}`;
}

function composeBarrio(localidad, barrio) {
  return `${localidad} | ${barrio}`;
}

function splitBarrio(value) {
  if (!value || !String(value).includes(" | ")) {
    return { localidad: "", barrio: value || "" };
  }
  const [localidad, barrio] = String(value).split(" | ");
  return { localidad: localidad || "", barrio: barrio || "" };
}

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeTitular(value) {
  return cleanText(value).replace(/\s+/g, " ").toUpperCase();
}

function normalizePhone(value) {
  return cleanText(value).replace(/\s+/g, "");
}

function stripAccents(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toSearchable(value) {
  return cleanText(value).toLowerCase();
}

function truncateText(value, max = 70) {
  const text = cleanText(value);
  if (!text) return "—";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function getFileExtension(fileName) {
  return String(fileName || "").split(".").pop()?.toLowerCase() || "";
}

function isAllowedPlanoFile(file) {
  if (!file) return false;
  const extension = getFileExtension(file.name);
  return ALLOWED_PLANO_MIME_TYPES.includes(file.type) || ALLOWED_PLANO_EXTENSIONS.includes(extension);
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return "—";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function isPreviewableFile(fileName = "", mimeType = "") {
  const extension = getFileExtension(fileName);
  return ["pdf", "jpg", "jpeg", "png", "webp"].includes(extension) || String(mimeType || "").startsWith("image/") || mimeType === "application/pdf";
}

function getPreviewType(fileName = "", mimeType = "") {
  const extension = getFileExtension(fileName);
  if (["jpg", "jpeg", "png", "webp"].includes(extension) || String(mimeType || "").startsWith("image/")) return "image";
  if (extension === "pdf" || mimeType === "application/pdf") return "pdf";
  return "other";
}

function buildBarrioFilterOptions() {
  return LOCALIDADES.map((localidad) => ({
    localidad,
    items: (BARRIOS[localidad] || []).map((barrio) => ({
      value: composeBarrio(localidad, barrio),
      label: barrio,
    })),
  }));
}

function getEstadoSelectStyle(estado) {
  const current = ESTADOS[estado] || ESTADOS.pendiente;
  return {
    ...compactInputStyle,
    background: current.bg,
    color: current.color,
    border: `1px solid ${current.border}`,
    fontWeight: 700,
  };
}

function getAttachmentLabel(fileName = "", mimeType = "") {
  const ext = getFileExtension(fileName);
  if (["jpg", "jpeg", "png", "webp"].includes(ext) || String(mimeType).startsWith("image/")) return "Imagen";
  if (ext === "pdf" || mimeType === "application/pdf") return "PDF";
  if (["doc", "docx"].includes(ext)) return "Documento";
  if (["xls", "xlsx", "csv"].includes(ext)) return "Planilla";
  return "Archivo";
}

function isPreviewableAttachment(fileName = "", mimeType = "") {
  const ext = getFileExtension(fileName);
  return mimeType === "application/pdf" || String(mimeType).startsWith("image/") || ["pdf", "jpg", "jpeg", "png", "webp"].includes(ext);
}

function getExpedienteCompleteness(expediente, attachments = []) {
  const checks = [
    cleanText(expediente?.titular),
    cleanText(expediente?.dni),
    cleanText(expediente?.telefono),
    cleanText(expediente?.barrio),
    cleanText(expediente?.estadoCivil),
    cleanText(expediente?.padronNumero),
    cleanText(expediente?.estado),
    cleanText(expediente?.area),
    cleanText(expediente?.resp),
    cleanText(expediente?.notas),
  ];

  const completed = checks.filter(Boolean).length + (attachments.length > 0 ? 1 : 0);
  const total = checks.length + 1;
  const percent = Math.round((completed / total) * 100);

  let level = "bajo";
  let label = "Básico";
  if (percent >= 85) {
    level = "alto";
    label = "Completo";
  } else if (percent >= 55) {
    level = "medio";
    label = "Intermedio";
  }

  return { completed, total, percent, level, label };
}

function CompletenessBadge({ expediente, attachments = [] }) {
  const info = getExpedienteCompleteness(expediente, attachments);
  const styles = info.level === "alto"
    ? { background: "#dcfce7", color: "#166534", border: "#bbf7d0" }
    : info.level === "medio"
    ? { background: "#fef3c7", color: "#92400e", border: "#fde68a" }
    : { background: "#e2e8f0", color: "#475569", border: "#cbd5e1" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 9px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        background: styles.background,
        color: styles.color,
        border: `1px solid ${styles.border}`,
      }}
    >
      {info.label} · {info.percent}%
    </span>
  );
}

function buildPlanoPublicUrl(filePath) {
  if (!supabase || !filePath) return "";
  const { data } = supabase.storage.from(PLANOS_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || "";
}

function normalizePlanoRecord(row) {
  if (!row) return null;
  const path = row.archivo_path || row.path || row.plano_path || "";
  return {
    id: row.id,
    expedienteId: row.expediente_id,
    archivoPath: path,
    nombreOriginal: row.nombre_original || row.nombre || path.split("/").pop() || "Archivo",
    tipoMime: row.tipo_mime || "",
    tamanoBytes: Number(row.tamano_bytes || 0),
    createdAt: row.created_at || null,
    uploadedBy: row.uploaded_by || null,
    publicUrl: row.public_url || buildPlanoPublicUrl(path),
  };
}

function buildPlanosIndex(rows) {
  const index = {};
  for (const row of rows || []) {
    const normalized = normalizePlanoRecord(row);
    if (!normalized?.expedienteId) continue;
    if (!index[normalized.expedienteId]) index[normalized.expedienteId] = [];
    index[normalized.expedienteId].push(normalized);
  }

  Object.keys(index).forEach((key) => {
    index[key].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  });

  return index;
}

async function fetchPlanosIndex(expedienteIds = []) {
  if (!supabase || !Array.isArray(expedienteIds) || expedienteIds.length === 0) return { data: {}, error: null };

  const { data, error } = await supabase
    .from(PLANOS_TABLE)
    .select("id, expediente_id, archivo_path, nombre_original, tipo_mime, tamano_bytes, created_at, uploaded_by")
    .in("expediente_id", expedienteIds)
    .order("created_at", { ascending: false });

  if (error) return { data: {}, error };
  return { data: buildPlanosIndex(data || []), error: null };
}

async function fetchPlanosForExpediente(expedienteId) {
  if (!supabase || !expedienteId) return { data: [], error: null };

  const { data, error } = await supabase
    .from(PLANOS_TABLE)
    .select("id, expediente_id, archivo_path, nombre_original, tipo_mime, tamano_bytes, created_at, uploaded_by")
    .eq("expediente_id", expedienteId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error };
  return { data: (data || []).map(normalizePlanoRecord), error: null };
}

function normalizeExpediente(row) {
  return {
    id: row.id,
    num: row.numero_expediente || `EXP-${row.id}`,
    titular: normalizeTitular(row.titular),
    dni: row.dni || "",
    telefono: normalizePhone(row.telefono),
    barrio: row.barrio || "",
    estadoCivil: row.estado_civil || "",
    padronNumero: row.padron_numero || "",
    planoUrl: row.plano_url || (row.plano_path ? buildPlanoPublicUrl(row.plano_path) : ""),
    planoPath: row.plano_path || "",
    estado: row.estado || "pendiente",
    area: row.area_actual || "",
    resp: row.responsable_id || "",
    doc: row.documentacion || "incompleta",
    dias: Number(row.dias_sin_avance || row.dias_sin_movimiento || 0),
    upd: row.ultima_actualizacion || row.updated_at || row.created_at || null,
    prio: row.prioridad || "baja",
    observaciones: row.observaciones || "",
    notas: row.notas || "",
    editableTecnico: row.editable_tecnico ?? true,
    origenCarga: row.origen_carga || "manual",
    createdAt: row.created_at || null,
  };
}

function buildUpdatePayload(partial) {
  const payload = {};
  if (Object.prototype.hasOwnProperty.call(partial, "titular")) payload.titular = normalizeTitular(partial.titular);
  if (Object.prototype.hasOwnProperty.call(partial, "dni")) payload.dni = cleanText(partial.dni);
  if (Object.prototype.hasOwnProperty.call(partial, "telefono")) payload.telefono = normalizePhone(partial.telefono);
  if (Object.prototype.hasOwnProperty.call(partial, "barrio")) payload.barrio = partial.barrio;
  if (Object.prototype.hasOwnProperty.call(partial, "estadoCivil")) payload.estado_civil = cleanText(partial.estadoCivil);
  if (Object.prototype.hasOwnProperty.call(partial, "padronNumero")) payload.padron_numero = cleanText(partial.padronNumero);
  if (Object.prototype.hasOwnProperty.call(partial, "planoUrl")) payload.plano_url = cleanText(partial.planoUrl);
  if (Object.prototype.hasOwnProperty.call(partial, "planoPath")) payload.plano_path = cleanText(partial.planoPath);
  if (Object.prototype.hasOwnProperty.call(partial, "estado")) payload.estado = partial.estado;
  if (Object.prototype.hasOwnProperty.call(partial, "area")) payload.area_actual = partial.area;
  if (Object.prototype.hasOwnProperty.call(partial, "resp")) payload.responsable_id = partial.resp || null;
  if (Object.prototype.hasOwnProperty.call(partial, "doc")) payload.documentacion = partial.doc;
  if (Object.prototype.hasOwnProperty.call(partial, "prio")) payload.prioridad = partial.prio;
  if (Object.prototype.hasOwnProperty.call(partial, "notas")) payload.notas = partial.notas || "";
  if (Object.prototype.hasOwnProperty.call(partial, "observaciones")) payload.observaciones = partial.observaciones || "";
  payload.ultima_actualizacion = new Date().toISOString();
  payload.updated_at = new Date().toISOString();
  return payload;
}

function normalizeHeader(value) {
  return stripAccents(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeDni(value) {
  const raw = cleanText(value);
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  if (digits.length <= 8) return digits;
  return digits.slice(2, 10);
}

function normalizeComparableText(value) {
  return stripAccents(value)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePadron(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9/.-]/g, "");
}

function buildDuplicateKey({ titular, padronNumero }) {
  const normalizedTitular = normalizeComparableText(titular);
  const normalizedPadron = normalizePadron(padronNumero);
  if (!normalizedTitular || !normalizedPadron) return "";
  return `${normalizedTitular}__${normalizedPadron}`;
}

function getDuplicateSignature(row) {
  const dni = normalizeDni(row?.dni);
  if (dni) return `DNI:${dni}`;
  const fallback = buildDuplicateKey({ titular: row?.titular, padronNumero: row?.padron_numero ?? row?.padronNumero });
  return fallback ? `TP:${fallback}` : "";
}

function getRowsToDeleteByDuplicateRule(rows) {
  const sorted = [...(rows || [])].sort((a, b) => {
    const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
    const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
    if (aTime !== bTime) return aTime - bTime;
    return Number(a.id || 0) - Number(b.id || 0);
  });

  const seen = new Set();
  const idsToDelete = [];

  for (const row of sorted) {
    const signature = getDuplicateSignature(row);
    if (!signature) continue;
    if (seen.has(signature)) {
      idsToDelete.push(row.id);
      continue;
    }
    seen.add(signature);
  }

  return idsToDelete;
}

function buildFrontendDuplicateSignature(row) {
  const dni = normalizeDni(row?.dni);
  if (dni) return `DNI:${dni}`;

  const titular = normalizeComparableText(row?.titular);
  const padron = normalizePadron(row?.padronNumero);
  if (titular && padron) return `TP:${titular}__${padron}`;

  const barrio = normalizeComparableText(row?.barrio);
  if (titular && barrio) return `TB:${titular}__${barrio}`;

  return `ROW:${row?.id ?? Math.random()}`;
}

function dedupeExpedientesForView(rows) {
  const seen = new Set();
  const uniqueRows = [];
  let hiddenDuplicates = 0;

  for (const row of rows || []) {
    const signature = buildFrontendDuplicateSignature(row);
    if (seen.has(signature)) {
      hiddenDuplicates += 1;
      continue;
    }
    seen.add(signature);
    uniqueRows.push(row);
  }

  return {
    uniqueRows,
    hiddenDuplicates,
    totalRows: Array.isArray(rows) ? rows.length : 0,
  };
}

function detectLocalidadFromFilename(fileName) {
  const key = normalizeHeader(fileName);
  return key.includes("lastenia") ? "Lastenia" : "Banda del Río Salí";
}

function detectBarrioFromFilename(fileName) {
  const base = stripAccents(fileName)
    .replace(/\.xlsx$|\.xls$|\.csv$/i, "")
    .replace(/[()]/g, " ")
    .replace(/\b(act|actualizado|completo|completa|nancy|mza|manzana|hoja|sheet|2024|2025|2026)\b/gi, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normalizedBase = normalizeHeader(base);

  const variants = [
    { match: ["lamilagrosa"], value: "Barrio La Milagrosa" },
    { match: ["ampliacionlamilagrosa"], value: "Barrio Ampliación La Milagrosa" },
    { match: ["costanera"], value: "Barrio La Costanera" },
    { match: ["ptemenem", "presidentemenem", "barrioptemenem"], value: "Barrio Presidente Menem" },
    { match: ["unionyprogreso", "unionyprogeso", "progreso"], value: "Barrio Unión y Progreso" },
    { match: ["villalastenia", "lastenia"], value: "Barrio Villa Lastenia" },
    { match: ["260viviendas", "260viv", "sanmiguelarcangel"], value: "Barrio San Miguel Arcangel (260 viv)" },
    { match: ["alberdi"], value: "Barrio Alberdi" },
    { match: ["sanramonii", "sanramon2"], value: "Barrio San Ramón 2" },
    { match: ["aeropuerto"], value: "Barrio Aeropuerto" },
  ];

  for (const item of variants) {
    if (item.match.some((token) => normalizedBase.includes(token))) return item.value;
  }

  const found = ALL_BARRIOS.find((barrio) => normalizedBase.includes(normalizeHeader(barrio.replace(/^Barrio\s+/i, ""))));
  return found || base || "Otro";
}

function findHeaderRow(rows) {
  let bestIndex = -1;
  let bestScore = -1;
  const keys = ["padron", "padronn", "apellidoynombre", "apellidoynombre", "nombreyapellido", "nombreyapellido", "dni", "estadocivil", "observacion", "entrega", "dominio", "respfiscal", "telefono", "celular", "contacto"];

  rows.slice(0, 15).forEach((row, index) => {
    const normalized = row.map((cell) => normalizeHeader(cell));
    const score = keys.reduce((acc, key) => acc + (normalized.some((cell) => cell.includes(key)) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestScore > 0 ? bestIndex : -1;
}

function findColumnIndex(headers, aliases) {
  return headers.findIndex((header) => aliases.some((alias) => header.includes(alias)));
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}


async function fetchAllExpedientes() {
  if (!supabase) return { data: [], error: null };

  const pageSize = 1000;
  let from = 0;
  let allRows = [];

  while (true) {
    const { data: rows, error } = await supabase
      .from("expedientes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) return { data: [], error };

    const batch = rows || [];
    allRows = allRows.concat(batch);

    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return { data: allRows, error: null };
}

function mapSheetRowsToRecords(rows, fileName) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const headerRowIndex = findHeaderRow(rows);
  const startIndex = headerRowIndex >= 0 ? headerRowIndex : 0;
  const headers = (rows[startIndex] || []).map((cell) => normalizeHeader(cell));

  const titularIndex = findColumnIndex(headers, [
    "apellidoynombre",
    "apellidosynombres",
    "nombreyapellido",
    "nombres",
    "responsablefiscal",
    "respfiscal",
    "propietariolegal",
    "dominio",
    "titular",
  ]);
  const dniIndex = findColumnIndex(headers, ["dni", "dniycuil", "dnicuil", "nrodocumento", "documento"]);
  const telefonoIndex = findColumnIndex(headers, ["telefono", "telefonocelular", "celular", "contacto", "telefono1", "movil"]);
  const estadoCivilIndex = findColumnIndex(headers, ["estadocivil"]);
  const padronIndex = findColumnIndex(headers, ["padron", "padronn", "cuenta", "nrocuenta"]);
  const observacionIndex = findColumnIndex(headers, ["observacion", "observaciones", "entrega", "estado", "expediente", "exped", "notas"]);

  const barrio = detectBarrioFromFilename(fileName);
  const localidad = detectLocalidadFromFilename(fileName);

  return rows
    .slice(startIndex + 1)
    .map((row) => {
      const titularRaw = titularIndex >= 0 ? row[titularIndex] : "";
      const dniRaw = dniIndex >= 0 ? row[dniIndex] : "";
      const telefonoRaw = telefonoIndex >= 0 ? row[telefonoIndex] : "";
      const estadoCivilRaw = estadoCivilIndex >= 0 ? row[estadoCivilIndex] : "";
      const padronRaw = padronIndex >= 0 ? row[padronIndex] : "";
      const observacionRaw = observacionIndex >= 0 ? row[observacionIndex] : "";

      const titular = normalizeTitular(titularRaw);
      const dni = normalizeDni(dniRaw);
      const telefono = normalizePhone(telefonoRaw);
      const estadoCivil = cleanText(estadoCivilRaw);
      const padronNumero = cleanText(padronRaw);
      const observaciones = cleanText(observacionRaw);

      if (!titular && !dni && !padronNumero && !telefono) return null;
      if (titular && ["padron", "apellidoynombre", "respfiscal", "nombreyapellido", "dominio", "titular"].includes(normalizeHeader(titular))) return null;

      return {
        titular,
        dni,
        telefono,
        estadoCivil,
        localidad,
        barrio,
        padronNumero,
        observaciones,
        notas: "",
      };
    })
    .filter(Boolean);
}

async function parseExcelFiles(files) {
  const XLSX = await import("xlsx");
  const all = [];
  const details = [];

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    let fileCount = 0;

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const records = mapSheetRowsToRecords(rows, file.name);
      fileCount += records.length;
      all.push(...records);
    });

    details.push({ fileName: file.name, count: fileCount, barrio: detectBarrioFromFilename(file.name) });
  }

  return { records: all, details };
}

function Badge({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.pendiente;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 9px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 600,
        background: e.bg,
        color: e.color,
        border: `1px solid ${e.border}`,
      }}
    >
      {e.label}
    </span>
  );
}

function Priority({ prioridad }) {
  const p = PRIORIDADES[prioridad] || PRIORIDADES.baja;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.dot, display: "inline-block" }} />
      {p.label}
    </span>
  );
}

function Doc({ doc }) {
  return doc === "completa" ? (
    <span style={{ fontSize: 11, color: C.green }}>✓ Completa</span>
  ) : (
    <span style={{ fontSize: 11, color: C.red }}>! Incompleta</span>
  );
}

function LoginScreen({ selectedUserId, onSelectUser, onIngresar, loginLoading, loginError }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#edf5fb 0%, #f5f7fa 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          background: "#fff",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(15,23,42,.12)",
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ height: 8, background: "linear-gradient(90deg,#0ea5e9,#14b8a6)" }} />
        <div style={{ padding: "34px 30px 28px", textAlign: "center" }}>
          <div
            style={{
              width: 132,
              height: 132,
              margin: "0 auto 28px",
              borderRadius: 28,
              background: "#fff",
              border: `1px solid ${C.border}`,
              boxShadow: "0 16px 40px rgba(15,23,42,.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src="/logo-icono.png" alt="Municipio" style={{ width: 102, height: 102, objectFit: "contain" }} />
          </div>

          <div style={{ fontSize: 14, color: C.muted, fontWeight: 700, letterSpacing: ".12em" }}>MUNICIPALIDAD DE</div>
          <div style={{ fontSize: 26, color: C.slate, fontWeight: 800, marginTop: 6 }}>Banda del Río Salí</div>
          <div style={{ width: 92, height: 4, borderRadius: 999, background: "#14b8a6", margin: "20px auto 18px" }} />
          <div style={{ fontSize: 18, color: C.slate, fontWeight: 700 }}>Dirección de Regularización Dominial</div>
          <div style={{ maxWidth: 520, margin: "14px auto 0", color: C.muted, fontSize: 14, lineHeight: 1.55 }}>
            Ingreso institucional al sistema interno de gestión de expedientes. Seleccioná el usuario autorizado para continuar.
          </div>

          <div style={{ maxWidth: 480, margin: "28px auto 0", display: "grid", gap: 12 }}>
            {LOGIN_USERS.map((user) => {
              const active = selectedUserId === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user.id)}
                  style={{
                    textAlign: "left",
                    padding: "16px 18px",
                    borderRadius: 16,
                    border: `1px solid ${active ? "#7dd3fc" : C.border}`,
                    background: active ? "#f0f9ff" : "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, color: C.slate, fontWeight: 700 }}>{user.nombre}</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>
                      {user.rol} • {user.area}
                    </div>
                  </div>
                  <div
                    style={{
                      minWidth: 24,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: `2px solid ${active ? C.sky : "#cbd5e1"}`,
                      background: active ? C.sky : "#fff",
                      boxShadow: active ? "inset 0 0 0 4px #fff" : "none",
                    }}
                  />
                </button>
              );
            })}
          </div>

          {loginError ? (
            <div
              style={{
                maxWidth: 480,
                margin: "18px auto 0",
                background: "#fef2f2",
                color: "#991b1b",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 13,
              }}
            >
              {loginError}
            </div>
          ) : null}

          <div style={{ marginTop: 24 }}>
            <button
              onClick={onIngresar}
              disabled={loginLoading || !selectedUserId}
              style={{
                ...btnPrimary,
                padding: "13px 28px",
                fontSize: 15,
                borderRadius: 12,
                opacity: loginLoading || !selectedUserId ? 0.7 : 1,
                cursor: loginLoading || !selectedUserId ? "not-allowed" : "pointer",
              }}
            >
              {loginLoading ? "Ingresando..." : "Ingresar al panel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalExpediente({ item, users, usersMap, onClose, onSaveField, savingField, onUploadPlano, onDeletePlano, uploadingPlano, deletingPlanoId, canEdit, onDelete, planos = [] }) {
  const [draft, setDraft] = useState(item || null);
  const [previewFileId, setPreviewFileId] = useState("");

  useEffect(() => {
    setDraft(item || null);
    setPreviewFileId("");
  }, [item]);

  if (!draft) return null;

  const zona = splitBarrio(draft.barrio);
  const saving = savingField === String(draft.id);
  const barrios = BARRIOS[zona.localidad || "Banda del Río Salí"] || ALL_BARRIOS;
  const latestPlano = planos[0] || null;
  const modalFiles = planos.length ? planos : (draft.planoUrl ? [{ id: `legacy-${draft.id}`, nombreOriginal: draft.planoPath || "Archivo cargado", publicUrl: draft.planoUrl, tamanoBytes: 0, createdAt: draft.upd, tipoMime: "" }] : []);
  const previewTarget = modalFiles.find((file) => String(file.id) === String(previewFileId)) || modalFiles[0] || null;

  const updateField = (field, value) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    if (canEdit) onSaveField(draft.id, { [field]: value });
  };

  const updateZona = (part, value) => {
    const nextZona = { ...zona, [part]: value };
    if (part === "localidad" && !nextZona.barrio) nextZona.barrio = (BARRIOS[value] || [])[0] || "";
    updateField("barrio", composeBarrio(nextZona.localidad || "Banda del Río Salí", nextZona.barrio || ""));
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,.35)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 18,
          width: "100%",
          maxWidth: 980,
          margin: "0 16px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,.15)",
        }}
      >
        <div style={{ background: "linear-gradient(135deg,#38bdf8,#0ea5e9)", padding: "22px 24px", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "#bae6fd", fontWeight: 600, textTransform: "uppercase" }}>Expediente</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 3 }}>{draft.num}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {saving ? <span style={{ fontSize: 12, color: "#e0f2fe" }}>Guardando…</span> : null}
              {!canEdit ? <span style={{ fontSize: 12, color: "#e0f2fe" }}>Solo lectura</span> : null}
              <button onClick={onClose} style={{ border: "none", background: "transparent", color: "#bae6fd", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
          </div>
        </div>

        <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
          <div><div style={labelStyle}>Titular</div><input value={draft.titular} disabled={!canEdit} onChange={(e) => updateField("titular", e.target.value)} style={inputStyle} /></div>
          <div><div style={labelStyle}>DNI</div><input value={draft.dni} disabled={!canEdit} onChange={(e) => updateField("dni", e.target.value)} style={inputStyle} /></div>
          <div><div style={labelStyle}>Contacto</div><input value={draft.telefono || ""} disabled={!canEdit} onChange={(e) => updateField("telefono", e.target.value)} style={inputStyle} /></div>
          <div><div style={labelStyle}>Estado civil</div><select value={draft.estadoCivil} disabled={!canEdit} onChange={(e) => updateField("estadoCivil", e.target.value)} style={inputStyle}>{ESTADOS_CIVILES.map((x) => <option key={x} value={x}>{x || "Seleccionar"}</option>)}</select></div>
          <div><div style={labelStyle}>Localidad</div><select value={zona.localidad || "Banda del Río Salí"} disabled={!canEdit} onChange={(e) => updateZona("localidad", e.target.value)} style={inputStyle}>{LOCALIDADES.map((loc) => <option key={loc} value={loc}>{loc}</option>)}</select></div>
          <div><div style={labelStyle}>Barrio</div><select value={zona.barrio || ""} disabled={!canEdit} onChange={(e) => updateZona("barrio", e.target.value)} style={inputStyle}><option value="">Seleccionar</option>{barrios.map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
          <div><div style={labelStyle}>N° de padrón</div><input value={draft.padronNumero} disabled={!canEdit} onChange={(e) => updateField("padronNumero", e.target.value)} style={inputStyle} /></div>
          <div><div style={labelStyle}>Estado</div><select value={draft.estado} disabled={!canEdit} onChange={(e) => updateField("estado", e.target.value)} style={inputStyle}>{Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <div><div style={labelStyle}>Área</div><select value={draft.area} disabled={!canEdit} onChange={(e) => updateField("area", e.target.value)} style={inputStyle}>{AREAS.filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
          <div><div style={labelStyle}>Responsable</div><select value={draft.resp} disabled={!canEdit} onChange={(e) => updateField("resp", e.target.value)} style={inputStyle}><option value="">Responsable</option>{users.map((user) => <option key={user.id} value={user.id}>{user.nombre}</option>)}</select></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={labelStyle}>Notas internas</div>
            <textarea value={draft.notas} disabled={!canEdit} onChange={(e) => updateField("notas", e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={labelStyle}>Archivos adjuntos</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
              {canEdit ? (
                <label style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 8, cursor: uploadingPlano ? "not-allowed" : "pointer" }}>
                  {uploadingPlano ? "Subiendo..." : "Subir archivos"}
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    multiple
                    style={{ display: "none" }}
                    disabled={uploadingPlano}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length) onUploadPlano(draft.id, files);
                      e.target.value = "";
                    }}
                  />
                </label>
              ) : null}
              <span style={{ color: C.dim, fontSize: 12 }}>Máximo {MAX_PLANO_FILE_SIZE_MB} MB por archivo • JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, CSV</span>
            </div>

            {modalFiles.length ? (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gap: 10 }}>
                  {modalFiles.map((plano) => {
                    const activePreview = String(previewTarget?.id || "") === String(plano.id);
                    return (
                      <div key={plano.id} style={{ background: activePreview ? "#eff6ff" : "#f8fafc", border: `1px solid ${activePreview ? "#93c5fd" : C.border}`, borderRadius: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: C.slate }}>{plano.nombreOriginal || "Archivo"}</div>
                          <div style={{ marginTop: 4, fontSize: 12, color: C.dim }}>
                            {plano.tamanoBytes ? formatFileSize(plano.tamanoBytes) : "Archivo adjunto"}
                            {plano.createdAt ? ` • ${formatDateTime(plano.createdAt)}` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <button type="button" onClick={() => setPreviewFileId(String(plano.id))} style={{ ...btnGhost, padding: "7px 10px", fontSize: 12, color: C.sky }}>Ver</button>
                          <a href={plano.publicUrl} download style={{ color: C.sky, fontWeight: 700, textDecoration: "none", fontSize: 12 }}>Descargar</a>
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => onDeletePlano(draft.id, plano)}
                              disabled={deletingPlanoId === String(plano.id || draft.id)}
                              style={{ border: "none", background: "transparent", color: C.red, fontWeight: 700, cursor: deletingPlanoId === String(plano.id || draft.id) ? "not-allowed" : "pointer", opacity: deletingPlanoId === String(plano.id || draft.id) ? 0.6 : 1, padding: 0 }}
                            >
                              {deletingPlanoId === String(plano.id || draft.id) ? "Eliminando..." : "Eliminar"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {previewTarget ? (
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: "#fff", overflow: "hidden" }}>
                    <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.slate }}>Vista previa: {previewTarget.nombreOriginal}</div>
                      <a href={previewTarget.publicUrl} target="_blank" rel="noreferrer" style={{ color: C.sky, fontWeight: 700, textDecoration: "none", fontSize: 12 }}>Abrir en pestaña</a>
                    </div>
                    {getPreviewType(previewTarget.nombreOriginal, previewTarget.tipoMime) === "image" ? (
                      <div style={{ padding: 12, background: "#f8fafc", display: "flex", justifyContent: "center" }}>
                        <img src={previewTarget.publicUrl} alt={previewTarget.nombreOriginal} style={{ maxWidth: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 10 }} />
                      </div>
                    ) : getPreviewType(previewTarget.nombreOriginal, previewTarget.tipoMime) === "pdf" ? (
                      <iframe title={previewTarget.nombreOriginal} src={previewTarget.publicUrl} style={{ width: "100%", height: 420, border: "none", background: "#fff" }} />
                    ) : (
                      <div style={{ padding: 20, fontSize: 13, color: C.muted }}>Este tipo de archivo no tiene vista previa dentro del panel. Usá “Descargar” o “Abrir en pestaña”.</div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <span style={{ color: C.dim, fontSize: 12 }}>Sin archivos adjuntos</span>
            )}
          </div>
        </div>

        <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>{canEdit ? <button onClick={() => onDelete(draft)} style={{ ...btnGhost, color: C.red, borderColor: "#fecaca" }}>Eliminar expediente</button> : null}</div>
          <button onClick={onClose} style={btnGhost}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function NuevoExpedienteModal({ open, onClose, onSave, saving, users }) {
  const [form, setForm] = useState({
    titular: "",
    dni: "",
    telefono: "",
    localidad: "Banda del Río Salí",
    barrioSeleccionado: "",
    barrioManual: "",
    estadoCivil: "",
    padronNumero: "",
    estado: "revision_inicial",
    area: "",
    resp: "",
    notas: "",
  });
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) {
      setForm({
        titular: "",
        dni: "",
        telefono: "",
        localidad: "Banda del Río Salí",
        barrioSeleccionado: "",
        barrioManual: "",
        estadoCivil: "",
        padronNumero: "",
        estado: "revision_inicial",
        area: "",
        resp: "",
        notas: "",
      });
      setValidationError("");
    }
  }, [open]);

  if (!open) return null;

  const barrios = BARRIOS[form.localidad] || [];
  const barrioFinal = form.barrioSeleccionado === "Otro" ? form.barrioManual.trim() : form.barrioSeleccionado;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const guardar = () => {
    if (!form.titular.trim() || !form.area) {
      setValidationError("Completá titular y área.");
      return;
    }
    if (!barrioFinal) {
      setValidationError("Seleccioná o escribí un barrio.");
      return;
    }
    setValidationError("");
    onSave({
      titular: form.titular,
      dni: form.dni,
      telefono: form.telefono,
      localidad: form.localidad,
      barrio: barrioFinal,
      estadoCivil: form.estadoCivil,
      padronNumero: form.padronNumero,
      estado: form.estado,
      area: form.area,
      resp: form.resp,
      notas: form.notas,
    });
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.35)", backdropFilter: "blur(4px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 560, margin: "0 16px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
        <div style={{ background: "linear-gradient(135deg,#38bdf8,#0ea5e9)", padding: "20px 22px", color: "#fff" }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Nuevo expediente</div>
          <div style={{ fontSize: 12, color: "#bae6fd", marginTop: 4 }}>Carga inicial del expediente</div>
        </div>
        <div style={{ padding: 20, display: "grid", gap: 12 }}>
          {validationError ? <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 8px", fontSize: 12 }}>{validationError}</div> : null}
          <input value={form.titular} onChange={(e) => set("titular", e.target.value)} placeholder="Nombre del titular" style={inputStyle} />
          <input value={form.dni} onChange={(e) => set("dni", e.target.value)} placeholder="DNI" style={inputStyle} />
          <input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="Contacto / teléfono" style={inputStyle} />
          <select value={form.estadoCivil} onChange={(e) => set("estadoCivil", e.target.value)} style={inputStyle}>{ESTADOS_CIVILES.map((x) => <option key={x} value={x}>{x || "Estado civil"}</option>)}</select>
          <input value={form.padronNumero} onChange={(e) => set("padronNumero", e.target.value)} placeholder="N° de padrón" style={inputStyle} />
          <select value={form.localidad} onChange={(e) => { set("localidad", e.target.value); set("barrioSeleccionado", ""); set("barrioManual", ""); }} style={inputStyle}>{LOCALIDADES.map((loc) => <option key={loc} value={loc}>{loc}</option>)}</select>
          <select value={form.barrioSeleccionado} onChange={(e) => set("barrioSeleccionado", e.target.value)} style={inputStyle}>
            <option value="">Barrio</option>
            {barrios.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          {form.barrioSeleccionado === "Otro" ? <input value={form.barrioManual} onChange={(e) => set("barrioManual", e.target.value)} placeholder="Escribí el barrio" style={inputStyle} /> : null}
          <select value={form.estado} onChange={(e) => set("estado", e.target.value)} style={inputStyle}>{Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          <select value={form.area} onChange={(e) => set("area", e.target.value)} style={inputStyle}><option value="">Área</option>{AREAS.filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)}</select>
          <select value={form.resp} onChange={(e) => set("resp", e.target.value)} style={inputStyle}><option value="">Responsable</option>{users.map((user) => <option key={user.id} value={user.id}>{user.nombre}</option>)}</select>
          <textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Notas internas" rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={btnGhost} disabled={saving}>Cancelar</button>
          <button onClick={guardar} style={btnPrimary} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

function ExpedienteRow({ exp, users, usersMap, onSaveField, onOpen, onUploadPlano, onDeletePlano, deletingPlanoId, uploadingPlano, savingField, canEdit, onDelete, planos = [], selected, onToggleSelect }) {
  const [draft, setDraft] = useState(exp);

  useEffect(() => {
    setDraft(exp);
  }, [exp]);

  const zona = splitBarrio(draft.barrio);
  const saving = savingField === String(draft.id);
  const barrios = BARRIOS[zona.localidad || "Banda del Río Salí"] || ALL_BARRIOS;
  const latestPlano = planos[0] || null;

  const updateField = (field, value) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    if (canEdit) onSaveField(draft.id, { [field]: value });
  };

  const updateZona = (part, value) => {
    const nextZona = { ...zona, [part]: value };
    if (part === "localidad" && !nextZona.barrio) nextZona.barrio = (BARRIOS[value] || [])[0] || "";
    updateField("barrio", composeBarrio(nextZona.localidad || "Banda del Río Salí", nextZona.barrio || ""));
  };

  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9", verticalAlign: "top" }}>
      <td style={{ padding: "8px 6px", width: 32 }}>
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect(exp.id)} />
      </td>
      <td style={{ padding: "8px 8px" }}>
        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 800 }}>{draft.num}</span>
        <div style={{ color: C.dim, fontSize: 11, marginTop: 6 }}>{draft.origenCarga}</div>
        <div style={{ marginTop: 8 }}><CompletenessBadge expediente={draft} attachments={planos} /></div>
      </td>
      <td style={{ padding: "8px 8px", minWidth: 170 }}><input value={draft.titular} disabled={!canEdit} onChange={(e) => updateField("titular", e.target.value)} style={compactInputStyle} /></td>
      <td style={{ padding: "8px 8px", minWidth: 100 }}><input value={draft.dni} disabled={!canEdit} onChange={(e) => updateField("dni", e.target.value)} style={compactInputStyle} /></td>
      <td style={{ padding: "8px 8px", minWidth: 128 }}><input value={draft.telefono || ""} disabled={!canEdit} onChange={(e) => updateField("telefono", e.target.value)} style={compactInputStyle} /></td>
      <td style={{ padding: "8px 8px", minWidth: 124 }}><select value={draft.estadoCivil} disabled={!canEdit} onChange={(e) => updateField("estadoCivil", e.target.value)} style={compactInputStyle}>{ESTADOS_CIVILES.map((x) => <option key={x} value={x}>{x || "Seleccionar"}</option>)}</select></td>
      <td style={{ padding: "8px 8px", minWidth: 150 }}>
        <select value={zona.localidad || "Banda del Río Salí"} disabled={!canEdit} onChange={(e) => updateZona("localidad", e.target.value)} style={{ ...compactInputStyle, marginBottom: 8 }}>{LOCALIDADES.map((loc) => <option key={loc} value={loc}>{loc}</option>)}</select>
        <select value={zona.barrio || ""} disabled={!canEdit} onChange={(e) => updateZona("barrio", e.target.value)} style={compactInputStyle}>
          <option value="">Barrio</option>
          {barrios.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </td>
      <td style={{ padding: "8px 8px", minWidth: 100 }}><input value={draft.padronNumero} disabled={!canEdit} onChange={(e) => updateField("padronNumero", e.target.value)} style={compactInputStyle} /></td>
      <td style={{ padding: "8px 8px", minWidth: 165 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {canEdit ? (
            <label style={{ ...btnGhost, textAlign: "center", padding: "8px 10px", fontSize: 11, color: uploadingPlano ? C.dim : C.text, cursor: uploadingPlano ? "not-allowed" : "pointer" }}>
              {uploadingPlano ? "Subiendo..." : "Subir archivo"}
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                multiple
                style={{ display: "none" }}
                disabled={uploadingPlano}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length) onUploadPlano(draft.id, files);
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}
          {latestPlano || draft.planoUrl ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => onDeletePlano(draft.id, latestPlano || { id: `legacy-${draft.id}`, archivoPath: draft.planoPath, nombreOriginal: draft.planoPath || "Plano", publicUrl: draft.planoUrl })}
                    disabled={deletingPlanoId === String((latestPlano || { id: `legacy-${draft.id}` }).id)}
                    style={{
                      ...btnGhost,
                      padding: "6px 10px",
                      fontSize: 11,
                      color: C.red,
                      borderColor: "#fecaca",
                      cursor: deletingPlanoId === String((latestPlano || { id: `legacy-${draft.id}` }).id) ? "not-allowed" : "pointer",
                      opacity: deletingPlanoId === String((latestPlano || { id: `legacy-${draft.id}` }).id) ? 0.6 : 1,
                    }}
                  >
                    {deletingPlanoId === String((latestPlano || { id: `legacy-${draft.id}` }).id) ? "Eliminando..." : "Eliminar último"}
                  </button>
                ) : null}
              </div>
              <a href={(latestPlano?.publicUrl || draft.planoUrl)} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.sky, fontWeight: 700, textDecoration: "none" }}>{isPreviewableAttachment(latestPlano?.nombreOriginal, latestPlano?.tipoMime) ? "Abrir último" : "Descargar último"}</a>
              <span style={{ fontSize: 11, color: C.dim }}>{planos.length > 1 ? `${planos.length} archivos` : (latestPlano?.nombreOriginal || "1 archivo")}</span>
            </>
          ) : <span style={{ fontSize: 11, color: C.dim }}>Sin archivo</span>}
        </div>
      </td>
      <td style={{ padding: "8px 8px", minWidth: 120 }}><div style={{ marginBottom: 8 }}><Badge estado={draft.estado} /></div><select value={draft.estado} disabled={!canEdit} onChange={(e) => updateField("estado", e.target.value)} style={compactInputStyle}>{Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></td>
      <td style={{ padding: "8px 8px", minWidth: 112 }}><select value={draft.area} disabled={!canEdit} onChange={(e) => updateField("area", e.target.value)} style={compactInputStyle}>{AREAS.filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)}</select></td>
      <td style={{ padding: "8px 8px", minWidth: 128 }}><select value={draft.resp} disabled={!canEdit} onChange={(e) => updateField("resp", e.target.value)} style={compactInputStyle}><option value="">Responsable</option>{users.map((user) => <option key={user.id} value={user.id}>{user.nombre}</option>)}</select><div style={{ color: C.dim, fontSize: 11, marginTop: 4 }}>{usersMap[draft.resp] || "—"}</div></td>
      <td style={{ padding: "8px 8px", minWidth: 170 }}><textarea value={draft.notas} disabled={!canEdit} onChange={(e) => updateField("notas", e.target.value)} rows={2} style={{ ...compactInputStyle, resize: "vertical", minHeight: 54 }} /></td>
      <td style={{ padding: "8px 8px", minWidth: 100 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <button onClick={() => onOpen(draft)} style={{ ...btnPrimary, padding: "6px 10px", fontSize: 11 }}>Ver</button>
          {canEdit ? <button onClick={() => onDelete(draft)} style={{ ...btnGhost, padding: "6px 10px", fontSize: 11, color: C.red, borderColor: "#fecaca" }}>Eliminar</button> : null}
        </div>
        {saving ? <div style={{ marginTop: 8, fontSize: 10, color: C.dim }}>Guardando…</div> : null}
      </td>
    </tr>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [planosByExpediente, setPlanosByExpediente] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fArea, setFArea] = useState("");
  const [fBarrio, setFBarrio] = useState("");
  const [fPrioridad, setFPrioridad] = useState("");
  const [fCompletitud, setFCompletitud] = useState("");
  const [page, setPage] = useState(1);
  const [modalItem, setModalItem] = useState(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rawRowCount, setRawRowCount] = useState(0);
  const [hiddenDuplicateCount, setHiddenDuplicateCount] = useState(0);

  const [selectedLoginUserId, setSelectedLoginUserId] = useState(LOGIN_USERS[0].id);
  const [activeUser, setActiveUser] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [accessSyncStatus, setAccessSyncStatus] = useState({ kind: "", text: "" });
  const [accessHistory, setAccessHistory] = useState([]);

  const [savingField, setSavingField] = useState("");
  const [uploadingPlanoId, setUploadingPlanoId] = useState("");
  const [deletingPlanoId, setDeletingPlanoId] = useState("");
  const saveTimersRef = useRef({});

  const [importFiles, setImportFiles] = useState([]);
  const [importingExcel, setImportingExcel] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [sortOrder, setSortOrder] = useState("recent");
  const [selectedExpedientes, setSelectedExpedientes] = useState([]);

  const fechaActual = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  const usersMap = useMemo(() => buildUsersMap(users), [users]);
  const canEdit = Boolean(activeUser?.canEdit);
  const barrioFilterOptions = useMemo(() => buildBarrioFilterOptions(), []);

  const stats = useMemo(() => ({
    total: data.length,
    proceso: data.filter((e) => e.estado === "en_proceso").length,
    criticos: data.filter((e) => e.prio === "critica").length,
    atrasados: data.filter((e) => e.dias >= 14).length,
    completos: data.filter((e) => getExpedienteCompleteness(e, planosByExpediente[e.id] || []).level === "alto").length,
  }), [data, planosByExpediente]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACCESS_HISTORY_KEY);
      setAccessHistory(raw ? JSON.parse(raw) : []);
    } catch {
      setAccessHistory([]);
    }
  }, []);

  useEffect(() => {
    if (activeUser) loadInitialData();
  }, [activeUser]);

  useEffect(() => () => {
    Object.values(saveTimersRef.current).forEach((timer) => clearTimeout(timer));
  }, []);

  async function applyExpedientePlanoUpdate(expedienteId, filePath, publicUrl) {
    if (!supabase || !expedienteId) return { data: null, error: null };

    const timestamp = new Date().toISOString();
    const payload = {
      plano_path: filePath || "",
      plano_url: publicUrl || "",
      ultima_actualizacion: timestamp,
      updated_at: timestamp,
    };

    return await supabase
      .from("expedientes")
      .update(payload)
      .eq("id", expedienteId)
      .select("*")
      .single();
  }

  async function refreshPlanosForExpediente(expedienteId) {
    const result = await fetchPlanosForExpediente(expedienteId);
    if (result.error) return { data: [], error: result.error };

    const planos = result.data || [];
    setPlanosByExpediente((prev) => ({
      ...prev,
      [expedienteId]: planos,
    }));

    return { data: planos, error: null };
  }


  async function loadInitialData(showRefresh = false) {
    if (!supabase) {
      setError("Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError("");

    const [usersResult, expedientesResult] = await Promise.all([
      supabase.from("usuarios").select("id, nombre, rol, email, created_at").order("nombre", { ascending: true }),
      fetchAllExpedientes(),
    ]);

    if (usersResult.error) {
      setError(`No se pudieron cargar los usuarios: ${usersResult.error.message}`);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (expedientesResult.error) {
      setError(`No se pudieron cargar los expedientes: ${expedientesResult.error.message}`);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setUsers(usersResult.data || []);

    const normalizedRows = (expedientesResult.data || []).map(normalizeExpediente);
    const dedupeResult = dedupeExpedientesForView(normalizedRows);

    const expedienteIds = (expedientesResult.data || []).map((row) => row.id).filter(Boolean);
    const planosResult = await fetchPlanosIndex(expedienteIds);
    if (!planosResult.error) {
      setPlanosByExpediente(planosResult.data || {});
    }

    const mergedRows = dedupeResult.uniqueRows.map((row) => {
      const planos = (planosResult.data || {})[row.id] || [];
      const latestPlano = planos[0] || null;
      if (!latestPlano) return row;
      return {
        ...row,
        planoPath: latestPlano.archivoPath || row.planoPath || "",
        planoUrl: latestPlano.publicUrl || row.planoUrl || "",
      };
    });

    setRawRowCount(dedupeResult.totalRows);
    setHiddenDuplicateCount(dedupeResult.hiddenDuplicates);
    setData(mergedRows);
    setSelectedExpedientes((prev) => prev.filter((id) => mergedRows.some((row) => row.id === id)));

    if (dedupeResult.hiddenDuplicates > 0) {
      setNotice(`Se ocultaron ${dedupeResult.hiddenDuplicates} expedientes duplicados en pantalla. La base no fue modificada.`);
    }

    setLoading(false);
    setRefreshing(false);
  }

  async function handleLogin() {
    const selectedUser = LOGIN_USERS.find((u) => u.id === selectedLoginUserId);
    if (!selectedUser) {
      setLoginError("Seleccioná un usuario habilitado para ingresar.");
      return;
    }
    if (!supabase) {
      setLoginError("Faltan las variables de entorno de Supabase.");
      return;
    }

    setLoginLoading(true);
    setLoginError("");
    setAccessSyncStatus({ kind: "", text: "" });

    const entry = { nombre: selectedUser.nombre, rol: selectedUser.rol, fecha_ingreso: new Date().toISOString() };
    let syncStatus = { kind: "success", text: "Ingreso registrado correctamente en el sistema central." };

    const insertResult = await supabase.from("panel_accesos").insert(entry);
    if (insertResult.error) {
      syncStatus = { kind: "warning", text: "Ingreso registrado localmente. Pendiente sincronización central." };
    }

    const localEntry = { ...entry, tecnico: selectedUser.tecnico, area: selectedUser.area };
    let nextHistory = [];
    try {
      const raw = localStorage.getItem(ACCESS_HISTORY_KEY);
      const current = raw ? JSON.parse(raw) : [];
      nextHistory = [localEntry, ...current].slice(0, 10);
      localStorage.setItem(ACCESS_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      nextHistory = [localEntry];
    }

    setAccessHistory(nextHistory);
    setActiveUser({ ...selectedUser, lastLoginAt: entry.fecha_ingreso });
    setAccessSyncStatus(syncStatus);
    setLoginLoading(false);
  }

  async function addExpediente(form) {
    if (!supabase || !canEdit) return;
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      numero_expediente: nextExpedienteNumber(data),
      titular: normalizeTitular(form.titular),
      dni: cleanText(form.dni),
      telefono: normalizePhone(form.telefono),
      barrio: composeBarrio(form.localidad, form.barrio),
      estado_civil: cleanText(form.estadoCivil),
      padron_numero: cleanText(form.padronNumero),
      plano_url: "",
      plano_path: "",
      estado: form.estado,
      area_actual: form.area,
      responsable_id: form.resp || null,
      documentacion: "incompleta",
      dias_sin_avance: 0,
      prioridad: "baja",
      observaciones: "",
      notas: form.notas || "",
      ultima_actualizacion: new Date().toISOString(),
      origen_carga: "manual",
      editable_tecnico: true,
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase.from("expedientes").insert(payload).select("*").single();
    if (insertError) {
      setError(`No se pudo guardar el expediente: ${insertError.message}`);
      setSaving(false);
      return;
    }

    setData((prev) => [normalizeExpediente(inserted), ...prev]);
    setNuevoOpen(false);
    setActiveNav("Expedientes");
    setNotice("Expediente creado correctamente.");
    setSaving(false);
  }

  async function persistFieldUpdate(expedienteId, partial) {
    if (!supabase || !canEdit) return;
    const payload = buildUpdatePayload(partial);
    setSavingField(String(expedienteId));
    const { data: updated, error: updateError } = await supabase
      .from("expedientes")
      .update(payload)
      .eq("id", expedienteId)
      .select("*")
      .single();

    if (updateError) {
      setError(`No se pudo guardar el expediente: ${updateError.message}`);
      setSavingField("");
      return;
    }

    const normalized = normalizeExpediente(updated);
    const latestPlano = (planosByExpediente[expedienteId] || [])[0] || null;
    const merged = latestPlano ? { ...normalized, planoPath: latestPlano.archivoPath || normalized.planoPath, planoUrl: latestPlano.publicUrl || normalized.planoUrl } : normalized;
    setData((prev) => prev.map((item) => (item.id === expedienteId ? merged : item)));
    setModalItem((prev) => (prev && prev.id === expedienteId ? merged : prev));
    setSavingField("");
  }

  function saveExpedienteField(expedienteId, partial) {
    if (!canEdit) return;
    setData((prev) => prev.map((item) => (item.id === expedienteId ? { ...item, ...partial } : item)));
    setModalItem((prev) => (prev && prev.id === expedienteId ? { ...prev, ...partial } : prev));

    const key = String(expedienteId);
    if (saveTimersRef.current[key]) clearTimeout(saveTimersRef.current[key]);
    saveTimersRef.current[key] = setTimeout(() => {
      persistFieldUpdate(expedienteId, partial);
      delete saveTimersRef.current[key];
    }, 700);
  }

  async function uploadPlanoFile(expedienteId, incomingFiles) {
    if (!supabase || !incomingFiles || !canEdit) return;

    const files = Array.isArray(incomingFiles) ? incomingFiles : [incomingFiles];
    if (!files.length) return;

    const invalidFile = files.find((file) => !isAllowedPlanoFile(file));
    if (invalidFile) {
      setError("Formato no permitido. Subí PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX o CSV.");
      return;
    }

    const oversized = files.find((file) => file.size > MAX_PLANO_FILE_SIZE_MB * 1024 * 1024);
    if (oversized) {
      setError(`El archivo ${oversized.name} supera el límite de ${MAX_PLANO_FILE_SIZE_MB} MB.`);
      return;
    }

    setUploadingPlanoId(String(expedienteId));
    setError("");
    setNotice("");

    try {
      let lastFilePath = "";
      let lastPublicUrl = "";

      for (const file of files) {
        const extension = getFileExtension(file.name) || "bin";
        const safeBaseName = String(file.name || "archivo")
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 60) || "archivo";
        const filePath = `${expedienteId}/${Date.now()}-${safeBaseName}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(PLANOS_BUCKET)
          .upload(filePath, file, { upsert: false, contentType: file.type || undefined });

        if (uploadError) {
          throw new Error(`No se pudo subir ${file.name}: ${uploadError.message}`);
        }

        const publicUrl = buildPlanoPublicUrl(filePath);
        lastFilePath = filePath;
        lastPublicUrl = publicUrl;

        const metadataPayload = {
          expediente_id: expedienteId,
          archivo_path: filePath,
          nombre_original: file.name,
          tipo_mime: file.type || null,
          tamano_bytes: file.size || 0,
          uploaded_by: activeUser?.nombre || null,
        };

        const { error: planoInsertError } = await supabase.from(PLANOS_TABLE).insert(metadataPayload);
        if (planoInsertError) {
          throw new Error(`El archivo se subió, pero no se pudo registrar en la base: ${planoInsertError.message}`);
        }
      }

      const { data: updatedExpediente, error: expedienteUpdateError } = await applyExpedientePlanoUpdate(expedienteId, lastFilePath, lastPublicUrl);
      if (expedienteUpdateError) {
        throw new Error(`El archivo se subió, pero no se pudo vincular al expediente: ${expedienteUpdateError.message}`);
      }

      const planosRefresh = await refreshPlanosForExpediente(expedienteId);
      if (planosRefresh.error) {
        throw new Error(`El archivo se subió, pero no se pudo refrescar la lista de planos: ${planosRefresh.error.message}`);
      }

      const normalizedExpediente = normalizeExpediente(updatedExpediente);
      const latestPlano = (planosRefresh.data || [])[0] || null;
      const mergedExpediente = latestPlano
        ? {
            ...normalizedExpediente,
            planoPath: latestPlano.archivoPath || normalizedExpediente.planoPath || lastFilePath,
            planoUrl: latestPlano.publicUrl || normalizedExpediente.planoUrl || lastPublicUrl,
          }
        : {
            ...normalizedExpediente,
            planoPath: normalizedExpediente.planoPath || lastFilePath,
            planoUrl: normalizedExpediente.planoUrl || lastPublicUrl,
          };

      setData((prev) => prev.map((item) => (item.id === expedienteId ? mergedExpediente : item)));
      setModalItem((prev) => (prev && prev.id === expedienteId ? mergedExpediente : prev));
      setNotice(files.length === 1 ? "Archivo subido correctamente." : `Se subieron ${files.length} archivos correctamente.`);
    } catch (err) {
      setError(err.message || "No se pudo subir el plano.");
    } finally {
      setUploadingPlanoId("");
    }
  }
  async function deletePlanoFile(expedienteId, plano) {
    if (!supabase || !canEdit || !expedienteId) return;

    const planoId = plano?.id;
    const isLegacyPlano = String(planoId || "").startsWith("legacy-");
    const ok = window.confirm(`¿Eliminar el plano "${plano?.nombreOriginal || "archivo"}"?`);
    if (!ok) return;

    setDeletingPlanoId(String(plano.id));
    setError("");
    setNotice("");

    try {
      if (plano.archivoPath) {
        const { error: storageError } = await supabase.storage
          .from(PLANOS_BUCKET)
          .remove([plano.archivoPath]);

        if (storageError) {
          throw new Error(`No se pudo eliminar el archivo del storage: ${storageError.message}`);
        }
      }

      if (!isLegacyPlano && planoId) {
        const { error: deletePlanoError } = await supabase
          .from(PLANOS_TABLE)
          .delete()
          .eq("id", planoId);

        if (deletePlanoError) {
          throw new Error(`No se pudo eliminar el registro del plano: ${deletePlanoError.message}`);
        }
      }

      const planosRefresh = await refreshPlanosForExpediente(expedienteId);
      if (planosRefresh.error) {
        throw new Error(`El plano se eliminó, pero no se pudo refrescar la lista: ${planosRefresh.error.message}`);
      }

      const latestPlano = (planosRefresh.data || [])[0] || null;
      const nextPath = latestPlano?.archivoPath || "";
      const nextUrl = latestPlano?.publicUrl || "";

      const { data: updatedExpediente, error: expedienteUpdateError } = await applyExpedientePlanoUpdate(expedienteId, nextPath, nextUrl);
      if (expedienteUpdateError) {
        throw new Error(`El plano se eliminó, pero no se pudo actualizar el expediente: ${expedienteUpdateError.message}`);
      }

      const normalizedExpediente = normalizeExpediente(updatedExpediente);
      const mergedExpediente = {
        ...normalizedExpediente,
        planoPath: nextPath,
        planoUrl: nextUrl,
      };

      setData((prev) => prev.map((item) => (item.id === expedienteId ? mergedExpediente : item)));
      setModalItem((prev) => (prev && prev.id === expedienteId ? mergedExpediente : prev));
      setNotice("Plano eliminado correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo eliminar el plano.");
    } finally {
      setDeletingPlanoId("");
    }
  }

  async function deleteExpediente(item) {
    if (!supabase || !canEdit || !item?.id) return;
    const ok = window.confirm(`¿Eliminar el expediente ${item.num}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    setError("");
    setNotice("");

    const planos = planosByExpediente[item.id] || [];
    if (planos.length) {
      const storagePaths = planos.map((plano) => plano.archivoPath).filter(Boolean);
      if (storagePaths.length) await supabase.storage.from(PLANOS_BUCKET).remove(storagePaths);
      await supabase.from(PLANOS_TABLE).delete().eq("expediente_id", item.id);
    }

    const { error: deleteError } = await supabase.from("expedientes").delete().eq("id", item.id);
    if (deleteError) {
      setError(`No se pudo eliminar el expediente: ${deleteError.message}`);
      return;
    }

    setPlanosByExpediente((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    setSelectedExpedientes((prev) => prev.filter((id) => id !== item.id));
    setData((prev) => prev.filter((row) => row.id !== item.id));
    setModalItem((prev) => (prev?.id === item.id ? null : prev));
    setNotice(`Expediente ${item.num} eliminado correctamente.`);
  }

  function toggleSelectExpediente(expedienteId) {
    setSelectedExpedientes((prev) => prev.includes(expedienteId) ? prev.filter((id) => id !== expedienteId) : [...prev, expedienteId]);
  }

  function toggleSelectPage() {
    const pageIds = slice.map((item) => item.id);
    const allSelected = pageIds.every((id) => selectedExpedientes.includes(id));
    setSelectedExpedientes((prev) => allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]);
  }

  async function exportSelectedToPdf() {
    const selectedRows = data.filter((item) => selectedExpedientes.includes(item.id));
    if (!selectedRows.length) {
      setError("Seleccioná al menos un expediente para descargar el PDF.");
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const marginX = 42;
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;
      let y = 46;

      const addWrappedLine = (label, value = "—") => {
        const text = `${label}: ${value || "—"}`;
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, marginX, y);
        y += lines.length * 14 + 4;
        if (y > pageHeight - 70) {
          doc.addPage();
          y = 46;
        }
      };

      selectedRows.forEach((expediente, index) => {
        if (index > 0) {
          doc.addPage();
          y = 46;
        }

        const attachments = planosByExpediente[expediente.id] || [];
        const completeness = getExpedienteCompleteness(expediente, attachments);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`Expediente ${expediente.num}`, marginX, y);
        y += 24;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        addWrappedLine("Titular", expediente.titular);
        addWrappedLine("DNI", expediente.dni);
        addWrappedLine("Contacto", expediente.telefono);
        addWrappedLine("Estado civil", expediente.estadoCivil);
        addWrappedLine("Barrio", expediente.barrio);
        addWrappedLine("Padrón", expediente.padronNumero);
        addWrappedLine("Estado", ESTADOS[expediente.estado]?.label || expediente.estado);
        addWrappedLine("Área", expediente.area);
        addWrappedLine("Responsable", usersMap[expediente.resp] || "—");
        addWrappedLine("Completitud", `${completeness.label} (${completeness.percent}%)`);
        addWrappedLine("Notas", expediente.notas || expediente.observaciones || "—");
        addWrappedLine("Última actualización", formatDateTime(expediente.upd));
        addWrappedLine("Cantidad de archivos", String(attachments.length || 0));

        if (attachments.length) {
          attachments.forEach((attachment, idx) => {
            addWrappedLine(`Archivo ${idx + 1}`, `${attachment.nombreOriginal} • ${formatFileSize(attachment.tamanoBytes)} • ${attachment.publicUrl || "sin URL"}`);
          });
        }
      });

      doc.save(`expedientes-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      setError(`No se pudo generar el PDF. Verificá que el proyecto tenga instalada la librería jspdf. Detalle: ${err.message}`);
    }
  }


  async function importExcelNow() {
    if (!supabase || !canEdit) return;
    if (!importFiles.length) {
      setError("Seleccioná al menos un archivo Excel.");
      return;
    }

    setImportingExcel(true);
    setError("");
    setNotice("");
    setImportSummary(null);

    try {
      const { records, details } = await parseExcelFiles(importFiles);
      const filtered = records.filter((row) => row.titular || row.dni || row.padronNumero || row.telefono);

      if (!filtered.length) {
        setError("No se encontraron registros útiles para importar.");
        setImportingExcel(false);
        return;
      }

      const incomingDnis = [...new Set(filtered.map((row) => normalizeDni(row.dni)).filter(Boolean))];
      const { data: existingRows, error: existingError } = await supabase
        .from("expedientes")
        .select("dni, titular, padron_numero");
      if (existingError) throw existingError;

      const existingDniSet = new Set(
        (existingRows || []).map((row) => normalizeDni(row.dni)).filter(Boolean)
      );
      const existingFallbackSet = new Set(
        (existingRows || [])
          .filter((row) => !normalizeDni(row.dni))
          .map((row) => buildDuplicateKey({ titular: row.titular, padronNumero: row.padron_numero }))
          .filter(Boolean)
      );

      const seenBatchDnis = new Set();
      const seenBatchFallbackKeys = new Set();
      const deduped = [];
      let ignoredDuplicates = 0;

      for (const row of filtered) {
        const dni = normalizeDni(row.dni);
        const fallbackKey = !dni ? buildDuplicateKey(row) : "";

        if (dni) {
          if (existingDniSet.has(dni) || seenBatchDnis.has(dni)) {
            ignoredDuplicates += 1;
            continue;
          }
          seenBatchDnis.add(dni);
          deduped.push(row);
          continue;
        }

        if (fallbackKey) {
          if (existingFallbackSet.has(fallbackKey) || seenBatchFallbackKeys.has(fallbackKey)) {
            ignoredDuplicates += 1;
            continue;
          }
          seenBatchFallbackKeys.add(fallbackKey);
        }

        deduped.push(row);
      }

      if (!deduped.length) {
        setImportSummary({ totalFiles: importFiles.length, totalRows: 0, ignoredDuplicates, details });
        setImportFiles([]);
        setNotice(`No se cargaron expedientes nuevos. Se ignoraron ${ignoredDuplicates} repetidos por DNI o por titular + padrón.`);
        setActiveNav("Expedientes");
        setImportingExcel(false);
        await loadInitialData(true);
        return;
      }

      const seed = data.reduce((max, item) => {
        const match = String(item.num || "").match(/EXP-\d{4}-(\d+)/i);
        return Math.max(max, Number(match?.[1] || 0));
      }, 0) + 1;

      const payload = deduped.map((row, index) => ({
        numero_expediente: nextExpedienteNumberFromSeed(seed, index),
        titular: normalizeTitular(row.titular),
        dni: cleanText(row.dni),
        telefono: normalizePhone(row.telefono),
        barrio: composeBarrio(row.localidad, row.barrio),
        estado_civil: cleanText(row.estadoCivil),
        padron_numero: cleanText(row.padronNumero),
        plano_url: "",
        plano_path: "",
        estado: "revision_inicial",
        area_actual: "Mesa de Entradas",
        responsable_id: null,
        documentacion: "incompleta",
        dias_sin_avance: 0,
        prioridad: "baja",
        observaciones: cleanText(row.observaciones),
        notas: row.notas || "",
        ultima_actualizacion: new Date().toISOString(),
        origen_carga: "excel",
        editable_tecnico: true,
        updated_at: new Date().toISOString(),
      }));

      const chunks = chunkArray(payload, 200);
      let insertedCount = 0;

      for (const chunk of chunks) {
        const { data: inserted, error: insertError } = await supabase.from("expedientes").insert(chunk).select("id");
        if (insertError) throw insertError;
        insertedCount += inserted?.length || 0;
      }

      await loadInitialData(true);
      setImportSummary({ totalFiles: importFiles.length, totalRows: insertedCount, ignoredDuplicates, details });
      setImportFiles([]);
      setNotice(`Importación completada. Se cargaron ${insertedCount} expedientes y se ignoraron ${ignoredDuplicates} repetidos por DNI o por titular + padrón.`);
      setActiveNav("Expedientes");
    } catch (err) {
      setError(`No se pudo importar el Excel: ${err.message}`);
    }

    setImportingExcel(false);
  }

  const filtered = useMemo(() => {
    let d = [...data];
    const q = search.trim().toLowerCase();
    if (q) {
      d = d.filter((e) =>
        toSearchable(e.titular).includes(q) ||
        toSearchable(e.dni).includes(q) ||
        toSearchable(e.telefono).includes(q) ||
        toSearchable(e.num).includes(q) ||
        toSearchable(e.barrio).includes(q) ||
        toSearchable(usersMap[e.resp] || "").includes(q) ||
        toSearchable(e.notas).includes(q)
      );
    }
    if (fEstado) d = d.filter((e) => e.estado === fEstado);
    if (fArea) d = d.filter((e) => e.area === fArea);
    if (fPrioridad) d = d.filter((e) => e.prio === fPrioridad);
    if (fBarrio) d = d.filter((e) => e.barrio === fBarrio);
    if (fCompletitud) {
      d = d.filter((e) => {
        const info = getExpedienteCompleteness(e, planosByExpediente[e.id] || []);
        if (fCompletitud === "alto") return info.level === "alto";
        if (fCompletitud === "medio") return info.level === "medio";
        if (fCompletitud === "bajo") return info.level === "bajo";
        if (fCompletitud === "con_archivos") return (planosByExpediente[e.id] || []).length > 0 || Boolean(cleanText(e.planoUrl));
        if (fCompletitud === "sin_archivos") return (planosByExpediente[e.id] || []).length === 0 && !cleanText(e.planoUrl);
        return true;
      });
    }

    if (sortOrder === "az") d.sort((a, b) => cleanText(a.titular).localeCompare(cleanText(b.titular), "es", { sensitivity: "base" }));
    else if (sortOrder === "za") d.sort((a, b) => cleanText(b.titular).localeCompare(cleanText(a.titular), "es", { sensitivity: "base" }));
    else if (sortOrder === "complete") d.sort((a, b) => getExpedienteCompleteness(b, planosByExpediente[b.id] || []).percent - getExpedienteCompleteness(a, planosByExpediente[a.id] || []).percent);
    else d.sort((a, b) => new Date(b.upd || 0).getTime() - new Date(a.upd || 0).getTime());

    return d;
  }, [data, search, fEstado, fArea, fPrioridad, fBarrio, fCompletitud, usersMap, sortOrder, planosByExpediente]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const pageButtons = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "dots-end", totalPages];
    if (currentPage >= totalPages - 3) return [1, "dots-start", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "dots-start", currentPage - 1, currentPage, currentPage + 1, "dots-end", totalPages];
  }, [currentPage, totalPages]);

  const navItems = [
    { label: "Dashboard", icon: "⊞" },
    { label: "Expedientes", icon: "📋" },
    { label: "Importar Excel", icon: "⇪" },
    { label: "Nuevo expediente", icon: "＋" },
  ];

  const accessSyncStyle = accessSyncStatus.kind === "success"
    ? { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }
    : accessSyncStatus.kind === "warning"
    ? { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }
    : null;

  if (!activeUser) {
    return <LoginScreen selectedUserId={selectedLoginUserId} onSelectUser={setSelectedLoginUserId} onIngresar={handleLogin} loginLoading={loginLoading} loginError={loginError} />;
  }

  return (
    <div style={{ margin: 0, fontFamily: "Segoe UI, sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={{ width: sidebarOpen ? 196 : 82, background: "#fff", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
          <div style={{ padding: "18px 12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "center" }}>
            <div style={{ width: sidebarOpen ? 88 : 56, height: sidebarOpen ? 88 : 56, borderRadius: sidebarOpen ? 22 : 16, background: "#fff", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(15,23,42,.06)" }}>
              <img src="/logo-icono.png" alt="Municipio" style={{ width: sidebarOpen ? 68 : 40, height: sidebarOpen ? 68 : 40, objectFit: "contain" }} />
            </div>
          </div>
          <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map((item) => {
              const active = activeNav === item.label;
              return (
                <button key={item.label} onClick={() => item.label === "Nuevo expediente" ? (canEdit ? setNuevoOpen(true) : null) : setActiveNav(item.label)} style={{ display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "flex-start" : "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "none", background: active ? "#eff6ff" : "transparent", cursor: "pointer", color: active ? "#2563eb" : C.muted, fontSize: 13 }}>
                  <span>{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
          <div style={{ padding: "8px 8px", borderTop: "1px solid #f1f5f9", fontSize: 11, color: C.dim, textAlign: sidebarOpen ? "left" : "center" }}>
            {sidebarOpen ? "Powered by NEXAIA" : "NX"}
          </div>
          <div style={{ padding: 8, borderTop: "1px solid #f1f5f9" }}>
            <button onClick={() => setSidebarOpen((s) => !s)} style={{ width: "100%", padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#cbd5e1", fontSize: 11 }}>{sidebarOpen ? "◀" : "▶"}</button>
          </div>
        </aside>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{activeNav}</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Dirección de Regularización Dominial • Base conectada a Supabase</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <div style={{ padding: "8px 12px", borderRadius: 999, border: `1px solid ${C.border}`, background: "#f8fafc", color: C.slate, fontSize: 13, fontWeight: 600 }}>{activeUser.nombre} · {activeUser.rol}</div>
              <button onClick={() => { setActiveUser(null); setSelectedLoginUserId(LOGIN_USERS[0].id); setActiveNav("Dashboard"); setLoginError(""); setNotice(""); setAccessSyncStatus({ kind: "", text: "" }); }} style={btnGhost}>Salir</button>
              <div style={{ fontSize: 13, color: C.muted }}>{fechaActual}</div>
              <button onClick={() => loadInitialData(true)} style={btnGhost}>{refreshing ? "Actualizando..." : "Actualizar"}</button>
              {canEdit ? <button onClick={() => setNuevoOpen(true)} style={btnPrimary}>+ Nuevo expediente</button> : null}
            </div>
          </header>

          <main style={{ flex: 1, padding: "20px 24px", maxWidth: 1500, width: "100%", boxSizing: "border-box" }}>
            {error ? <div style={{ marginBottom: 16, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>{error}</div> : null}
            {notice ? <div style={{ marginBottom: 16, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>{notice}</div> : null}
            {accessSyncStyle ? <div style={{ ...accessSyncStyle, marginBottom: 16, borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>{accessSyncStatus.text}</div> : null}
            {!canEdit ? <div style={{ marginBottom: 16, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>Usuario en modo solo lectura. Este perfil no puede crear, editar, importar ni eliminar expedientes.</div> : null}

            {loading ? (
              <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}` }}><EmptyBlock title="Cargando datos del sistema" text="Esperando respuesta de Supabase para usuarios y expedientes." /></div>
            ) : activeNav === "Dashboard" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
                  {[["Expedientes únicos", stats.total, "Mostrados en el panel"], ["Completos", stats.completos, "Con datos y adjuntos"], ["En proceso", stats.proceso, "Seguimiento activo"], ["Casos críticos", stats.criticos, "Prioridad crítica"], ["Atrasados (+14d)", stats.atrasados, "Requieren revisión"]].map(([label, value, note]) => (
                    <div key={label} style={{ background: "#fff", border: `1px solid ${C.border}`, padding: "14px 18px", borderRadius: 16 }}>
                      <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
                      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{value}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: C.dim }}>{note}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: 14, marginTop: 14 }}>
                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Ingreso actual</div>
                    <div style={{ marginTop: 12, fontSize: 18, fontWeight: 800 }}>{activeUser.nombre}</div>
                    <div style={{ marginTop: 4, color: C.muted }}>{activeUser.rol}</div>
                    <div style={{ marginTop: 16, fontSize: 12, color: C.dim }}>Último ingreso: {formatDateTime(activeUser.lastLoginAt)}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: C.dim }}>Perfil técnico: {activeUser.tecnico ? "Sí" : "No"}</div>
                  </div>
                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Últimos ingresos registrados</div>
                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>{accessHistory.length === 0 ? <div style={{ color: C.dim, fontSize: 13 }}>Aún no hay accesos registrados.</div> : accessHistory.slice(0, 4).map((entry, index) => <div key={`${entry.nombre}-${entry.fecha_ingreso}-${index}`} style={{ background: C.softBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}><div style={{ fontWeight: 700 }}>{entry.nombre}</div><div style={{ marginTop: 4, color: C.muted, fontSize: 13 }}>{entry.rol}</div><div style={{ marginTop: 6, color: C.dim, fontSize: 12 }}>{formatDateTime(entry.fecha_ingreso)}</div></div>)}</div>
                  </div>
                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Importación masiva lista</div>
                    <div style={{ marginTop: 10, color: C.muted, fontSize: 13, lineHeight: 1.55 }}>Ya podés subir varios Excel desde el panel. El barrio se toma del nombre del archivo y la carga va directo a Supabase.</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                      <div style={{ background: C.softBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}><div style={{ fontWeight: 700, fontSize: 13, color: C.indigo }}>Campos nuevos</div><div style={{ marginTop: 10, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>estado_civil<br />telefono<br />padron_numero<br />plano_url<br />notas</div></div>
                      <div style={{ background: C.softBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}><div style={{ fontWeight: 700, fontSize: 13, color: C.indigo }}>Cobertura actual</div><div style={{ marginTop: 10, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>Con plano: {data.filter((d) => (planosByExpediente[d.id] || []).length > 0 || cleanText(d.planoUrl)).length}<br />Con padrón: {data.filter((d) => cleanText(d.padronNumero)).length}<br />Con estado civil: {data.filter((d) => cleanText(d.estadoCivil)).length}<br />Usuarios cargados: {users.length}</div></div>
                    </div>
                  </div>
                </div>
              </>
            ) : activeNav === "Importar Excel" ? (
              <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: 22 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.slate }}>Importar archivos Excel</div>
                <div style={{ marginTop: 8, color: C.muted, fontSize: 13, lineHeight: 1.55 }}>Podés subir varios archivos .xlsx o .xls. El sistema toma el barrio desde el nombre del archivo y carga directo a Supabase. Los DNI repetidos se ignoran automáticamente.</div>
                <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 16 }}>
                  <div style={{ border: `1px dashed ${C.border}`, borderRadius: 16, padding: 20, background: "#f8fafc" }}>
                    <div style={{ fontWeight: 700, color: C.slate }}>Carga directa</div>
                    <div style={{ marginTop: 8, color: C.muted, fontSize: 13, lineHeight: 1.65 }}>1. Seleccionás varios Excel<br />2. El sistema detecta columnas útiles<br />3. Limpia datos<br />4. Inserta todo en Supabase sin vista previa</div>
                    <div style={{ marginTop: 18 }}><input type="file" accept=".xlsx,.xls" multiple disabled={!canEdit} style={inputStyle} onChange={(e) => setImportFiles(Array.from(e.target.files || []))} /></div>
                    <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button onClick={importExcelNow} style={btnPrimary} disabled={!canEdit || importingExcel || !importFiles.length}>{importingExcel ? "Importando..." : "Importar ahora"}</button>
                      <button onClick={() => setImportFiles([])} style={btnGhost} disabled={!canEdit || importingExcel}>Limpiar</button>
                    </div>
                    <div style={{ marginTop: 12, color: C.dim, fontSize: 12 }}>{importFiles.length ? `${importFiles.length} archivo(s) listos para importar.` : "Todavía no seleccionaste archivos."}</div>
                  </div>
                  <div style={{ background: C.softBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ fontWeight: 700, color: C.slate }}>Campos que detecta</div>
                    <div style={{ marginTop: 10, color: C.muted, fontSize: 13, lineHeight: 1.75 }}>• titular / nombre y apellido<br />• dni o dni/cuil<br />• estado civil<br />• padrón<br />• observaciones / entrega / estado</div>
                    <div style={{ marginTop: 14, fontWeight: 700, color: C.slate }}>Destino automático</div>
                    <div style={{ marginTop: 10, color: C.muted, fontSize: 13, lineHeight: 1.75 }}>• estado: Revisión inicial<br />• área: Mesa de Entradas<br />• origen_carga: excel<br />• barrio: nombre del archivo</div>
                  </div>
                </div>
                {importSummary ? (
                  <div style={{ marginTop: 18, background: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ fontWeight: 800, color: C.slate }}>Última importación</div>
                    <div style={{ marginTop: 8, color: C.muted, fontSize: 13 }}>Archivos: {importSummary.totalFiles} • Registros cargados: {importSummary.totalRows} • Repetidos ignorados: {importSummary.ignoredDuplicates || 0}</div>
                    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>{importSummary.details.map((item) => <div key={item.fileName} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 8px", fontSize: 13 }}><strong>{item.fileName}</strong> — {item.count} registro(s) — {item.barrio}</div>)}</div>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <div style={{ position: "relative", flex: 1, minWidth: 170 }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.dim, fontSize: 13 }}>🔍</span>
                        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar nombre, DNI, contacto, expediente, notas o responsable..." style={{ ...inputStyle, paddingLeft: 32 }} />
                      </div>
                      <button onClick={() => { setSearch(""); setFEstado(""); setFArea(""); setFPrioridad(""); setFBarrio(""); setFCompletitud(""); setPage(1); }} style={btnGhost}>Limpiar filtros</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
                      <select value={fEstado} onChange={(e) => { setFEstado(e.target.value); setPage(1); }} style={inputStyle}><option value="">Todos los estados</option>{Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                      <select value={fArea} onChange={(e) => { setFArea(e.target.value); setPage(1); }} style={inputStyle}><option value="">Todas las áreas</option>{AREAS.filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)}</select>
                      <select value={fBarrio} onChange={(e) => { setFBarrio(e.target.value); setPage(1); }} style={inputStyle}>
                        <option value="">Todos los barrios</option>
                        {barrioFilterOptions.map((group) => (
                          <optgroup key={group.localidad} label={group.localidad}>
                            {group.items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      <select value={fPrioridad} onChange={(e) => { setFPrioridad(e.target.value); setPage(1); }} style={inputStyle}><option value="">Todas las prioridades</option>{Object.entries(PRIORIDADES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                      <select value={fCompletitud} onChange={(e) => { setFCompletitud(e.target.value); setPage(1); }} style={inputStyle}>
                        <option value="">Toda completitud</option>
                        <option value="alto">Completos</option>
                        <option value="medio">Intermedios</option>
                        <option value="bajo">Básicos</option>
                        <option value="con_archivos">Con archivos</option>
                        <option value="sin_archivos">Sin archivos</option>
                      </select>
                    </div>                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                      <button onClick={() => setSortOrder("recent")} style={{ ...btnGhost, background: sortOrder === "recent" ? "#eff6ff" : "#fff", color: sortOrder === "recent" ? "#2563eb" : C.muted }}>Recientes</button>
                      <button onClick={() => setSortOrder("az")} style={{ ...btnGhost, background: sortOrder === "az" ? "#eff6ff" : "#fff", color: sortOrder === "az" ? "#2563eb" : C.muted }}>Titular A-Z</button>
                      <button onClick={() => setSortOrder("za")} style={{ ...btnGhost, background: sortOrder === "za" ? "#eff6ff" : "#fff", color: sortOrder === "za" ? "#2563eb" : C.muted }}>Titular Z-A</button>
                      <button onClick={() => setSortOrder("complete")} style={{ ...btnGhost, background: sortOrder === "complete" ? "#eff6ff" : "#fff", color: sortOrder === "complete" ? "#2563eb" : C.muted }}>Más completos</button>
                      <button onClick={toggleSelectPage} style={btnGhost}>{slice.every((item) => selectedExpedientes.includes(item.id)) && slice.length ? "Deseleccionar página" : "Seleccionar página"}</button>
                      <button onClick={exportSelectedToPdf} style={btnPrimary}>Descargar PDF seleccionados</button>
                    </div>
                  </div>

                  <div style={{ overflow: "auto", maxHeight: "calc(100vh - 310px)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1720, fontSize: 11 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fafafa", position: "sticky", top: 0, zIndex: 2 }}>
                          {["✓", "N° Expediente", "Titular", "DNI", "Contacto", "Estado civil", "Barrio", "N° de padrón", "Archivos", "Estado", "Área", "Responsable", "Notas", "Acciones"].map((h) => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: ".05em", background: "#fafafa" }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {slice.length === 0 ? <tr><td colSpan={14}><EmptyBlock title="No se encontraron expedientes" text="Ajustá los filtros o cargá el primer expediente." /></td></tr> : slice.map((exp) => <ExpedienteRow key={exp.id} exp={exp} users={users} usersMap={usersMap} onSaveField={saveExpedienteField} onOpen={setModalItem} onUploadPlano={uploadPlanoFile} onDeletePlano={deletePlanoFile} deletingPlanoId={deletingPlanoId} uploadingPlano={uploadingPlanoId === String(exp.id)} savingField={savingField} canEdit={canEdit} onDelete={deleteExpediente} planos={planosByExpediente[exp.id] || []} selected={selectedExpedientes.includes(exp.id)} onToggleSelect={toggleSelectExpediente} />)}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ padding: "12px 18px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, color: C.muted }}>Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} registros únicos • Seleccionados: {selectedExpedientes.length} • Filas totales en base: {rawRowCount} • Duplicados ocultos: {hiddenDuplicateCount} • Página {currentPage} de {totalPages}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button onClick={() => setPage(1)} style={btnGhost} disabled={currentPage === 1}>Primera</button>
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} style={btnGhost} disabled={currentPage === 1}>Anterior</button>
                      {pageButtons.map((item, index) => item === "dots-start" || item === "dots-end" ? (
                        <span key={`${item}-${index}`} style={{ padding: "0 4px", color: C.dim, fontSize: 12 }}>…</span>
                      ) : (
                        <button
                          key={`page-${item}`}
                          onClick={() => setPage(item)}
                          style={{
                            ...btnGhost,
                            minWidth: 40,
                            padding: "8px 10px",
                            background: currentPage === item ? "#eff6ff" : "#fff",
                            color: currentPage === item ? "#2563eb" : C.muted,
                            borderColor: currentPage === item ? "#93c5fd" : C.border,
                          }}
                        >
                          {item}
                        </button>
                      ))}
                      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={btnGhost} disabled={currentPage === totalPages}>Siguiente</button>
                      <button onClick={() => setPage(totalPages)} style={btnGhost} disabled={currentPage === totalPages}>Última</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <ModalExpediente item={modalItem} users={users} usersMap={usersMap} onClose={() => setModalItem(null)} onSaveField={saveExpedienteField} savingField={savingField} onUploadPlano={uploadPlanoFile} onDeletePlano={deletePlanoFile} uploadingPlano={uploadingPlanoId === String(modalItem?.id)} deletingPlanoId={deletingPlanoId} canEdit={canEdit} onDelete={deleteExpediente} planos={planosByExpediente[modalItem?.id] || []} />
      <NuevoExpedienteModal open={nuevoOpen} onClose={() => setNuevoOpen(false)} onSave={addExpediente} saving={saving} users={users} />
    </div>
  );
}
