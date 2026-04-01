import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

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
const BARRIOS = {
  "Banda del Río Salí": ["Centro", "Otro"],
  Lastenia: ["Centro", "Otro"],
};
const PAGE_SIZE = 10;

const EXCEL_TEMPLATE_COLUMNS = [
  "numero_expediente",
  "titular",
  "dni",
  "localidad",
  "barrio",
  "estado",
  "subestado",
  "area_actual",
  "responsable_id",
  "documentacion",
  "prioridad",
  "observaciones",
  "proxima_accion",
  "dias_sin_avance",
  "ultima_actualizacion",
];

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 13,
  background: "#f8fafc",
  color: C.text,
  outline: "none",
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

function EmptyBlock({ title, text, action = null }) {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: C.muted }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{title}</div>
      <div style={{ fontSize: 13, marginTop: 8 }}>{text}</div>
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
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

function toSearchable(value) {
  return cleanText(value).toLowerCase();
}

function truncateText(value, max = 55) {
  const text = cleanText(value);
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function normalizeExpediente(row) {
  const numero = row.numero_expediente || row.num || `EXP-${row.id}`;
  const zona = splitBarrio(row.barrio || "");
  const dias = Number(row.dias_sin_movimiento ?? row.dias_sin_avance ?? 0);
  const ultima = row.ultima_actualizacion || row.updated_at || row.created_at || null;

  return {
    id: row.id,
    num: numero,
    titular: row.titular || "—",
    dni: row.dni || "—",
    barrio: row.barrio || "—",
    localidad: zona.localidad || "—",
    barrioNombre: zona.barrio || "—",
    estado: row.estado || "pendiente",
    sub: row.subestado || "—",
    area: row.area_actual || "—",
    resp: row.responsable_id || "",
    doc: row.documentacion || "incompleta",
    dias,
    upd: ultima,
    prio: row.prioridad || "baja",
    observaciones: row.observaciones || "",
    proximaAccion: row.proxima_accion || "",
    ultimaActualizacion: ultima,
    createdAt: row.created_at || null,
  };
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
        whiteSpace: "nowrap",
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

function Dias({ dias }) {
  if (dias === 0) return <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Hoy</span>;
  if (dias >= 30) return <span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>{dias}d</span>;
  if (dias >= 14) return <span style={{ fontSize: 11, color: C.amber }}>{dias}d</span>;
  return <span style={{ fontSize: 11, color: C.dim }}>{dias}d</span>;
}

const labelStyle = {
  fontSize: 10,
  color: C.dim,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: ".05em",
  marginBottom: 3,
};

function ModalExpediente({ item, usersMap, onClose }) {
  if (!item) return null;
  const zona = splitBarrio(item.barrio);

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
          maxWidth: 760,
          margin: "0 16px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,.15)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ background: "linear-gradient(135deg,#38bdf8,#0ea5e9)", padding: "22px 24px", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: "#bae6fd", fontWeight: 600, textTransform: "uppercase" }}>
                Expediente
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 3 }}>{item.num}</div>
              <div style={{ fontSize: 12, color: "#e0f2fe", marginTop: 6 }}>{item.titular}</div>
            </div>
            <button onClick={onClose} style={{ border: "none", background: "transparent", color: "#bae6fd", fontSize: 18, cursor: "pointer" }}>
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: 24, overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><div style={labelStyle}>Titular</div><div>{item.titular}</div></div>
            <div><div style={labelStyle}>DNI</div><div>{item.dni}</div></div>
            <div><div style={labelStyle}>Localidad</div><div>{zona.localidad || "—"}</div></div>
            <div><div style={labelStyle}>Barrio</div><div>{zona.barrio || "—"}</div></div>
            <div><div style={labelStyle}>Estado</div><div><Badge estado={item.estado} /></div></div>
            <div><div style={labelStyle}>Subestado</div><div>{item.sub}</div></div>
            <div><div style={labelStyle}>Área</div><div>{item.area}</div></div>
            <div><div style={labelStyle}>Responsable</div><div>{usersMap[item.resp] || "—"}</div></div>
            <div><div style={labelStyle}>Documentación</div><div><Doc doc={item.doc} /></div></div>
            <div><div style={labelStyle}>Prioridad</div><div><Priority prioridad={item.prio} /></div></div>
            <div><div style={labelStyle}>Días sin movimiento</div><div><Dias dias={item.dias} /></div></div>
            <div><div style={labelStyle}>Última actualización</div><div>{formatDate(item.ultimaActualizacion, true)}</div></div>
          </div>

          <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
            <div style={{ background: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
              <div style={labelStyle}>Próxima acción</div>
              <div style={{ fontSize: 13, color: C.text }}>{cleanText(item.proximaAccion) || "—"}</div>
            </div>

            <div style={{ background: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
              <div style={labelStyle}>Observaciones</div>
              <div style={{ fontSize: 13, color: C.text, whiteSpace: "pre-wrap" }}>{cleanText(item.observaciones) || "—"}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "flex-end" }}>
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
    localidad: "Banda del Río Salí",
    barrioSeleccionado: "",
    barrioManual: "",
    estado: "revision_inicial",
    area: "",
    resp: "",
  });
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) {
      setForm({
        titular: "",
        dni: "",
        localidad: "Banda del Río Salí",
        barrioSeleccionado: "",
        barrioManual: "",
        estado: "revision_inicial",
        area: "",
        resp: "",
      });
      setValidationError("");
    }
  }, [open]);

  if (!open) return null;

  const barrios = BARRIOS[form.localidad] || [];
  const barrioFinal =
    form.barrioSeleccionado === "Otro" ? form.barrioManual.trim() : form.barrioSeleccionado;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const guardar = () => {
    if (!form.titular.trim() || !form.dni.trim() || !form.area) {
      setValidationError("Completá titular, DNI y área.");
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
      localidad: form.localidad,
      barrio: barrioFinal,
      estado: form.estado,
      area: form.area,
      resp: form.resp,
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
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
          maxWidth: 460,
          margin: "0 16px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,.15)",
        }}
      >
        <div style={{ background: "linear-gradient(135deg,#38bdf8,#0ea5e9)", padding: "20px 22px", color: "#fff" }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Nuevo expediente</div>
          <div style={{ fontSize: 12, color: "#bae6fd", marginTop: 4 }}>Carga inicial del expediente</div>
        </div>

        <div style={{ padding: 20, display: "grid", gap: 12 }}>
          {validationError ? (
            <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px", fontSize: 12 }}>
              {validationError}
            </div>
          ) : null}

          <input value={form.titular} onChange={(e) => set("titular", e.target.value)} placeholder="Nombre del titular" style={inputStyle} />
          <input value={form.dni} onChange={(e) => set("dni", e.target.value)} placeholder="DNI" style={inputStyle} />

          <select value={form.localidad} onChange={(e) => { set("localidad", e.target.value); set("barrioSeleccionado", ""); set("barrioManual", ""); }} style={inputStyle}>
            {LOCALIDADES.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>

          <select value={form.barrioSeleccionado} onChange={(e) => set("barrioSeleccionado", e.target.value)} style={inputStyle}>
            <option value="">Barrio</option>
            {barrios.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>

          {form.barrioSeleccionado === "Otro" ? (
            <input value={form.barrioManual} onChange={(e) => set("barrioManual", e.target.value)} placeholder="Escribí el barrio" style={inputStyle} />
          ) : null}

          <select value={form.estado} onChange={(e) => set("estado", e.target.value)} style={inputStyle}>
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          <select value={form.area} onChange={(e) => set("area", e.target.value)} style={inputStyle}>
            <option value="">Área</option>
            {AREAS.filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <select value={form.resp} onChange={(e) => set("resp", e.target.value)} style={inputStyle}>
            <option value="">Responsable</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.nombre}</option>)}
          </select>
        </div>

        <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={btnGhost} disabled={saving}>Cancelar</button>
          <button onClick={guardar} style={btnPrimary} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, padding: "14px 18px", borderRadius: 12 }}>
      <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {sub ? <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fArea, setFArea] = useState("");
  const [fResp, setFResp] = useState("");
  const [fLocalidad, setFLocalidad] = useState("");
  const [fBarrio, setFBarrio] = useState("");
  const [fPrioridad, setFPrioridad] = useState("");
  const [vista, setVista] = useState("todos");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [page, setPage] = useState(1);
  const [modalItem, setModalItem] = useState(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showIntro, setShowIntro] = useState(true);

  const fechaActual = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  const usersMap = useMemo(() => buildUsersMap(users), [users]);

  const barriosDisponibles = useMemo(() => {
    const fromConfig = fLocalidad ? (BARRIOS[fLocalidad] || []).filter((b) => b !== "Otro") : [];
    const fromData = data
      .filter((item) => !fLocalidad || item.localidad === fLocalidad)
      .map((item) => item.barrioNombre)
      .filter((b) => b && b !== "—");

    return Array.from(new Set([...fromConfig, ...fromData])).sort((a, b) => a.localeCompare(b, "es"));
  }, [data, fLocalidad]);

  const stats = useMemo(() => ({
    total: data.length,
    proceso: data.filter((e) => e.estado === "en_proceso").length,
    criticos: data.filter((e) => e.prio === "critica").length,
    atrasados: data.filter((e) => e.dias >= 14).length,
    conObservaciones: data.filter((e) => cleanText(e.observaciones)).length,
    conProximaAccion: data.filter((e) => cleanText(e.proximaAccion)).length,
  }), [data]);

  const filtered = useMemo(() => {
    let d = [...data];

    if (vista === "pendiente") d = d.filter((e) => e.estado === "pendiente" || e.estado === "pendiente_documentacion");
    else if (vista === "catastro") d = d.filter((e) => e.area === "Catastro");
    else if (vista === "sin_planos") d = d.filter((e) => e.sub === "Sin planos");
    else if (vista === "relevamiento") d = d.filter((e) => e.sub === "Relevamiento");
    else if (vista === "listo") d = d.filter((e) => e.estado === "listo");
    else if (vista === "atrasados") d = d.filter((e) => e.dias >= 14);

    const q = search.trim().toLowerCase();
    if (q) {
      d = d.filter((e) =>
        [
          e.titular,
          e.dni,
          e.num,
          e.barrio,
          e.localidad,
          e.barrioNombre,
          usersMap[e.resp] || "",
          e.observaciones,
          e.proximaAccion,
          e.sub,
          e.area,
        ].some((field) => toSearchable(field).includes(q))
      );
    }

    if (fEstado) d = d.filter((e) => e.estado === fEstado);
    if (fArea) d = d.filter((e) => e.area === fArea);
    if (fResp) d = d.filter((e) => e.resp === fResp);
    if (fLocalidad) d = d.filter((e) => e.localidad === fLocalidad);
    if (fBarrio) d = d.filter((e) => e.barrioNombre === fBarrio);
    if (fPrioridad) d = d.filter((e) => e.prio === fPrioridad);

    if (sortBy === "updated_desc") {
      d.sort((a, b) => new Date(b.upd || 0) - new Date(a.upd || 0));
    } else if (sortBy === "updated_asc") {
      d.sort((a, b) => new Date(a.upd || 0) - new Date(b.upd || 0));
    } else if (sortBy === "dias_desc") {
      d.sort((a, b) => b.dias - a.dias);
    } else if (sortBy === "dias_asc") {
      d.sort((a, b) => a.dias - b.dias);
    } else if (sortBy === "expediente_asc") {
      d.sort((a, b) => a.num.localeCompare(b.num, "es"));
    } else if (sortBy === "titular_asc") {
      d.sort((a, b) => a.titular.localeCompare(b.titular, "es"));
    }

    return d;
  }, [data, vista, search, fEstado, fArea, fResp, fLocalidad, fBarrio, fPrioridad, sortBy, usersMap]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function loadInitialData(showRefresh = false) {
    if (!supabase) {
      setError("Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    const [usersResult, expedientesResult] = await Promise.all([
      supabase.from("usuarios").select("id, nombre, rol, email, created_at").order("nombre", { ascending: true }),
      supabase.from("expedientes").select("*").order("created_at", { ascending: false }),
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
    setData((expedientesResult.data || []).map(normalizeExpediente));
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, fEstado, fArea, fResp, fLocalidad, fBarrio, fPrioridad, vista, sortBy]);

  async function addExpediente(form) {
    if (!supabase) return;

    setSaving(true);
    setError("");
    setNotice("");

    const nowIso = new Date().toISOString();
    const payload = {
      numero_expediente: nextExpedienteNumber(data),
      titular: form.titular.trim(),
      dni: form.dni.trim(),
      barrio: composeBarrio(form.localidad, form.barrio),
      estado: form.estado,
      subestado: "Nuevo",
      area_actual: form.area,
      responsable_id: form.resp || null,
      documentacion: "incompleta",
      dias_sin_avance: 0,
      prioridad: "baja",
      updated_at: nowIso,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("expedientes")
      .insert(payload)
      .select("*")
      .single();

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

  const navItems = [
    { label: "Dashboard", icon: "⊞" },
    { label: "Expedientes", icon: "📋" },
    { label: "Nuevo expediente", icon: "＋" },
  ];

  if (showIntro) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg,#f8fafc 0%,#eef5fb 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          boxSizing: "border-box",
          fontFamily: "Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 760,
            background: "#ffffff",
            border: `1px solid ${C.border}`,
            borderRadius: 28,
            boxShadow: "0 24px 60px rgba(15,23,42,.10)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 10,
              background: "linear-gradient(90deg,#0ea5e9,#2563eb,#14b8a6)",
            }}
          />

          <div
            style={{
              padding: "44px 32px 38px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 182,
                height: 182,
                borderRadius: 24,
                background: "#f8fafc",
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                boxSizing: "border-box",
              }}
            >
              <img
                src="/logo-icono.png"
                alt="Logo Municipalidad Banda del Río Salí"
                style={{ width: "112px", height: "112px", objectFit: "contain" }}
              />
            </div>

            <div style={{ marginTop: 26, fontSize: 14, color: C.muted, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700 }}>
              Municipalidad de
            </div>
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800, color: C.slate, marginTop: 6 }}>
              Banda del Río Salí
            </div>
            <div style={{ width: 88, height: 4, borderRadius: 999, background: "linear-gradient(90deg,#0ea5e9,#14b8a6)", marginTop: 22 }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginTop: 22 }}>
              Dirección de Regularización Dominial
            </div>
            <div style={{ fontSize: 14, color: C.muted, maxWidth: 520, lineHeight: 1.6, marginTop: 14 }}>
              Sistema interno de gestión de expedientes para seguimiento operativo,
              control por áreas y organización del proceso de regularización dominial.
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 28 }}>
              <button
                onClick={() => setShowIntro(false)}
                style={{
                  ...btnPrimary,
                  padding: "12px 22px",
                  borderRadius: 12,
                  fontSize: 14,
                  boxShadow: "0 14px 28px rgba(14,165,233,.20)",
                }}
              >
                Ingresar al panel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ margin: 0, fontFamily: "Segoe UI, sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={{ width: sidebarOpen ? 220 : 78, background: "#fff", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
          <div
            style={{
              padding: sidebarOpen ? "18px 14px 16px" : "18px 10px 16px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: sidebarOpen ? 104 : 64,
                height: sidebarOpen ? 104 : 64,
                borderRadius: 20,
                border: `1px solid ${C.border}`,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: sidebarOpen ? 10 : 6,
                boxSizing: "border-box",
                boxShadow: "0 4px 14px rgba(15,23,42,.06)",
              }}
            >
              <img
                src="/logo-icono.png"
                alt="Logo Municipalidad Banda del Río Salí"
                style={{ width: sidebarOpen ? "78px" : "48px", height: sidebarOpen ? "78px" : "48px", objectFit: "contain" }}
              />
            </div>
          </div>

          <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map((item) => {
              const active = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => item.label === "Nuevo expediente" ? setNuevoOpen(true) : setActiveNav(item.label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: sidebarOpen ? "flex-start" : "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: active ? "#eff6ff" : "transparent",
                    cursor: "pointer",
                    color: active ? "#2563eb" : C.muted,
                    fontSize: 13,
                  }}
                >
                  <span>{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: 8, borderTop: "1px solid #f1f5f9" }}>
            <button onClick={() => setSidebarOpen((s) => !s)} style={{ width: "100%", padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#cbd5e1", fontSize: 11 }}>
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>
        </aside>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <header style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{activeNav}</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Dirección de Regularización Dominial • Base conectada a Supabase</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <div style={{ fontSize: 13, color: C.muted }}>{fechaActual}</div>
              <button onClick={() => loadInitialData(true)} style={btnGhost}>{refreshing ? "Actualizando..." : "Actualizar"}</button>
              <button onClick={() => setNuevoOpen(true)} style={btnPrimary}>+ Nuevo expediente</button>
            </div>
          </header>

          <main style={{ flex: 1, padding: "20px 24px", maxWidth: 1500, width: "100%", boxSizing: "border-box" }}>
            {error ? <div style={{ marginBottom: 16, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>{error}</div> : null}
            {notice ? <div style={{ marginBottom: 16, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>{notice}</div> : null}

            {loading ? (
              <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}` }}>
                <EmptyBlock title="Cargando datos del sistema" text="Esperando respuesta de Supabase para usuarios y expedientes." />
              </div>
            ) : activeNav === "Dashboard" ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
                  <SummaryCard label="Total expedientes" value={stats.total} sub="Base operativa actual" />
                  <SummaryCard label="En proceso" value={stats.proceso} sub="Seguimiento activo" />
                  <SummaryCard label="Casos críticos" value={stats.criticos} sub="Prioridad crítica" />
                  <SummaryCard label="Atrasados (+14d)" value={stats.atrasados} sub="Requieren revisión" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 14 }}>
                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Panel listo para carga real</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                      El front ya contempla campos operativos y estructura para importación futura desde Excel.
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginTop: 14 }}>
                      <div style={{ background: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.indigo }}>Campos operativos</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>observaciones</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>proxima_accion</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>ultima_actualizacion</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>dias_sin_movimiento</div>
                      </div>
                      <div style={{ background: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.indigo }}>Cobertura actual</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Con observaciones: {stats.conObservaciones}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Con próxima acción: {stats.conProximaAccion}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Localidades base: {LOCALIDADES.length}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Usuarios cargados: {users.length}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Columnas esperadas para Excel</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Referencia para la próxima importación.</div>
                    <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                      {EXCEL_TEMPLATE_COLUMNS.map((col) => (
                        <div key={col} style={{ fontSize: 11, color: C.text, background: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 9px", fontFamily: "monospace" }}>
                          {col}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
                  {[
                    ["todos", "Todos"],
                    ["pendiente", "Pendientes"],
                    ["catastro", "En catastro"],
                    ["sin_planos", "Sin planos"],
                    ["relevamiento", "Relevamiento"],
                    ["listo", "Listos p/ escriturar"],
                    ["atrasados", "Atrasados"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => { setVista(id); setPage(1); }}
                      style={{
                        padding: "6px 13px",
                        borderRadius: 20,
                        border: `1px solid ${vista === id ? C.sky : C.border}`,
                        background: vista === id ? C.sky : "#fff",
                        color: vista === id ? "#fff" : C.muted,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.dim, fontSize: 13 }}>🔍</span>
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar titular, DNI, expediente, localidad, barrio, responsable, observación o próxima acción..." style={{ ...inputStyle, paddingLeft: 32 }} />
                      </div>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...inputStyle, width: 220, flex: "0 0 auto" }}>
                        <option value="updated_desc">Más recientes</option>
                        <option value="updated_asc">Más antiguos</option>
                        <option value="dias_desc">Más demorados</option>
                        <option value="dias_asc">Menos demorados</option>
                        <option value="expediente_asc">N° expediente</option>
                        <option value="titular_asc">Titular A-Z</option>
                      </select>
                      <button onClick={() => { setSearch(""); setFEstado(""); setFArea(""); setFResp(""); setFLocalidad(""); setFBarrio(""); setFPrioridad(""); setVista("todos"); setSortBy("updated_desc"); setPage(1); }} style={btnGhost}>
                        Limpiar filtros
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 8 }}>
                      <select value={fEstado} onChange={(e) => setFEstado(e.target.value)} style={inputStyle}>
                        <option value="">Todos los estados</option>
                        {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>

                      <select value={fArea} onChange={(e) => setFArea(e.target.value)} style={inputStyle}>
                        <option value="">Todas las áreas</option>
                        {AREAS.filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>

                      <select value={fResp} onChange={(e) => setFResp(e.target.value)} style={inputStyle}>
                        <option value="">Todos los responsables</option>
                        {users.map((user) => <option key={user.id} value={user.id}>{user.nombre}</option>)}
                      </select>

                      <select value={fLocalidad} onChange={(e) => { setFLocalidad(e.target.value); setFBarrio(""); }} style={inputStyle}>
                        <option value="">Todas las localidades</option>
                        {LOCALIDADES.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                      </select>

                      <select value={fBarrio} onChange={(e) => setFBarrio(e.target.value)} style={inputStyle}>
                        <option value="">Todos los barrios</option>
                        {barriosDisponibles.map((barrio) => <option key={barrio} value={barrio}>{barrio}</option>)}
                      </select>

                      <select value={fPrioridad} onChange={(e) => setFPrioridad(e.target.value)} style={inputStyle}>
                        <option value="">Todas las prioridades</option>
                        {Object.entries(PRIORIDADES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 12, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 12, color: C.muted }}>
                        Mostrando <strong style={{ color: C.text }}>{slice.length}</strong> de <strong style={{ color: C.text }}>{filtered.length}</strong> expedientes filtrados.
                      </div>
                      <div style={{ fontSize: 12, color: C.dim }}>
                        Página {currentPage} de {totalPages}
                      </div>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1450, fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
                          {["N° Expediente", "Titular / DNI", "Localidad / Barrio", "Estado", "Subestado", "Área", "Responsable", "Doc.", "Días s/mov.", "Últ. actualización", "Prioridad", "Próx. acción", "Observaciones", ""].map((h) => (
                            <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: ".05em" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {slice.length === 0 ? (
                          <tr>
                            <td colSpan={14}>
                              <EmptyBlock title="No se encontraron expedientes" text="Ajusta los filtros o carga el primer expediente." />
                            </td>
                          </tr>
                        ) : slice.map((exp) => {
                          const zona = splitBarrio(exp.barrio);
                          return (
                            <tr key={exp.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 800 }}>{exp.num}</span>
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <div style={{ fontWeight: 700, fontSize: 12 }}>{exp.titular}</div>
                                <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{exp.dni}</div>
                              </td>
                              <td style={{ padding: "10px 12px", color: C.muted, fontSize: 11 }}>
                                <div>{zona.localidad || "—"}</div>
                                <div style={{ marginTop: 2 }}>{zona.barrio || "—"}</div>
                              </td>
                              <td style={{ padding: "10px 12px" }}><Badge estado={exp.estado} /></td>
                              <td style={{ padding: "10px 12px", color: C.muted, fontSize: 11 }}>{exp.sub}</td>
                              <td style={{ padding: "10px 12px" }}>{exp.area}</td>
                              <td style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700 }}>{usersMap[exp.resp] || "—"}</td>
                              <td style={{ padding: "10px 12px" }}><Doc doc={exp.doc} /></td>
                              <td style={{ padding: "10px 12px", textAlign: "center" }}><Dias dias={exp.dias} /></td>
                              <td style={{ padding: "10px 12px", color: C.dim, fontSize: 11 }}>{formatDate(exp.upd, true)}</td>
                              <td style={{ padding: "10px 12px" }}><Priority prioridad={exp.prio} /></td>
                              <td style={{ padding: "10px 12px", color: C.muted, fontSize: 11 }}>{truncateText(exp.proximaAccion, 34)}</td>
                              <td style={{ padding: "10px 12px", color: C.muted, fontSize: 11 }}>{truncateText(exp.observaciones, 40)}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <button onClick={() => setModalItem(exp)} style={{ ...btnPrimary, padding: "5px 11px", fontSize: 11 }}>
                                  Ver
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderTop: "1px solid #f1f5f9", background: "#fcfcfd", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      Registros {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} style={btnGhost} disabled={currentPage === 1}>Anterior</button>
                      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={btnGhost} disabled={currentPage === totalPages}>Siguiente</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <ModalExpediente item={modalItem} usersMap={usersMap} onClose={() => setModalItem(null)} />
      <NuevoExpedienteModal open={nuevoOpen} onClose={() => setNuevoOpen(false)} onSave={addExpediente} saving={saving} users={users} />
    </div>
  );
}
