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
  "Lastenia": ["Centro", "Otro"],
};

const LOGIN_USERS = [
  { id: "estela-palacios", nombre: "Estela Palacios", rol: "Directora", area: "Dirección", tecnico: false },
  { id: "carlos-chauvet", nombre: "Carlos Chauvet", rol: "Área técnica", area: "Técnica", tecnico: true },
];

const PAGE_SIZE = 8;
const ACCESS_HISTORY_KEY = "cig_panel_access_history_v1";

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

function truncateText(value, max = 70) {
  const text = cleanText(value);
  if (!text) return "—";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function normalizeExpediente(row) {
  return {
    id: row.id,
    num: row.numero_expediente || `EXP-${row.id}`,
    titular: row.titular || "—",
    dni: row.dni || "—",
    barrio: row.barrio || "—",
    estado: row.estado || "pendiente",
    area: row.area_actual || "—",
    resp: row.responsable_id || "",
    doc: row.documentacion || "incompleta",
    dias: Number(row.dias_sin_avance || row.dias_sin_movimiento || 0),
    upd: row.ultima_actualizacion || row.updated_at || row.created_at || null,
    prio: row.prioridad || "baja",
    observaciones: row.observaciones || "",
    proximaAccion: row.proxima_accion || "",
    editableTecnico: row.editable_tecnico ?? true,
    origenCarga: row.origen_carga || "manual",
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
          maxWidth: 700,
          margin: "0 16px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,.15)",
        }}
      >
        <div style={{ background: "linear-gradient(135deg,#38bdf8,#0ea5e9)", padding: "22px 24px", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, color: "#bae6fd", fontWeight: 600, textTransform: "uppercase" }}>
                Expediente
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 3 }}>{item.num}</div>
            </div>
            <button onClick={onClose} style={{ border: "none", background: "transparent", color: "#bae6fd", fontSize: 18, cursor: "pointer" }}>
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><div style={labelStyle}>Titular</div><div>{item.titular}</div></div>
          <div><div style={labelStyle}>DNI</div><div>{item.dni}</div></div>
          <div><div style={labelStyle}>Localidad</div><div>{zona.localidad || "—"}</div></div>
          <div><div style={labelStyle}>Barrio</div><div>{zona.barrio || "—"}</div></div>
          <div><div style={labelStyle}>Estado</div><div><Badge estado={item.estado} /></div></div>
          <div><div style={labelStyle}>Área</div><div>{item.area}</div></div>
          <div><div style={labelStyle}>Responsable</div><div>{usersMap[item.resp] || "—"}</div></div>
          <div><div style={labelStyle}>Documentación</div><div><Doc doc={item.doc} /></div></div>
          <div><div style={labelStyle}>Prioridad</div><div><Priority prioridad={item.prio} /></div></div>
          <div><div style={labelStyle}>Sin movimiento</div><div><Dias dias={item.dias} /></div></div>
          <div><div style={labelStyle}>Última actualización</div><div>{formatDate(item.upd)}</div></div>
          <div><div style={labelStyle}>Próxima acción</div><div>{item.proximaAccion || "—"}</div></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={labelStyle}>Observaciones</div>
            <div style={{ color: C.muted, lineHeight: 1.55 }}>{item.observaciones || "—"}</div>
          </div>
          <div><div style={labelStyle}>Origen de carga</div><div>{item.origenCarga || "—"}</div></div>
          <div><div style={labelStyle}>Editable técnico</div><div>{item.editableTecnico ? "Sí" : "No"}</div></div>
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
  const [fPrioridad, setFPrioridad] = useState("");
  const [vista, setVista] = useState("todos");
  const [page, setPage] = useState(1);
  const [modalItem, setModalItem] = useState(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedLoginUserId, setSelectedLoginUserId] = useState(LOGIN_USERS[0].id);
  const [activeUser, setActiveUser] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [accessSyncStatus, setAccessSyncStatus] = useState({ kind: "", text: "" });
  const [accessHistory, setAccessHistory] = useState([]);

  const fechaActual = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  const usersMap = useMemo(() => buildUsersMap(users), [users]);

  const stats = useMemo(() => ({
    total: data.length,
    proceso: data.filter((e) => e.estado === "en_proceso").length,
    criticos: data.filter((e) => e.prio === "critica").length,
    atrasados: data.filter((e) => e.dias >= 14).length,
  }), [data]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACCESS_HISTORY_KEY);
      setAccessHistory(raw ? JSON.parse(raw) : []);
    } catch {
      setAccessHistory([]);
    }
  }, []);

  useEffect(() => {
    if (activeUser) {
      loadInitialData();
    }
  }, [activeUser]);

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

    const entry = {
      nombre: selectedUser.nombre,
      rol: selectedUser.rol,
      fecha_ingreso: new Date().toISOString(),
    };

    let syncStatus = {
      kind: "success",
      text: "Ingreso registrado correctamente en el sistema central.",
    };

    const insertResult = await supabase.from("panel_accesos").insert(entry);

    if (insertResult.error) {
      syncStatus = {
        kind: "warning",
        text: "Ingreso registrado localmente. Pendiente sincronización central.",
      };
      console.error("Error registrando acceso en Supabase:", insertResult.error);
    }

    const localEntry = {
      ...entry,
      tecnico: selectedUser.tecnico,
      area: selectedUser.area,
    };

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
    if (!supabase) return;

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      numero_expediente: nextExpedienteNumber(data),
      titular: form.titular.trim(),
      dni: form.dni.trim(),
      barrio: composeBarrio(form.localidad, form.barrio),
      estado: form.estado,
      area_actual: form.area,
      responsable_id: form.resp || null,
      documentacion: "incompleta",
      dias_sin_avance: 0,
      prioridad: "baja",
      observaciones: "",
      proxima_accion: "",
      ultima_actualizacion: new Date().toISOString(),
      origen_carga: "manual",
      editable_tecnico: true,
      updated_at: new Date().toISOString(),
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

  const filtered = useMemo(() => {
    let d = [...data];

    if (vista === "pendiente") d = d.filter((e) => e.estado === "pendiente" || e.estado === "pendiente_documentacion");
    else if (vista === "catastro") d = d.filter((e) => e.area === "Catastro");
    else if (vista === "listo") d = d.filter((e) => e.estado === "listo");
    else if (vista === "atrasados") d = d.filter((e) => e.dias >= 14);
    else if (vista === "tecnicos") d = d.filter((e) => e.editableTecnico);

    const q = search.trim().toLowerCase();
    if (q) {
      d = d.filter((e) =>
        toSearchable(e.titular).includes(q) ||
        toSearchable(e.dni).includes(q) ||
        toSearchable(e.num).includes(q) ||
        toSearchable(e.barrio).includes(q) ||
        toSearchable(usersMap[e.resp] || "").includes(q) ||
        toSearchable(e.observaciones).includes(q) ||
        toSearchable(e.proximaAccion).includes(q)
      );
    }

    if (fEstado) d = d.filter((e) => e.estado === fEstado);
    if (fArea) d = d.filter((e) => e.area === fArea);
    if (fResp) d = d.filter((e) => e.resp === fResp);
    if (fPrioridad) d = d.filter((e) => e.prio === fPrioridad);
    if (fLocalidad) d = d.filter((e) => splitBarrio(e.barrio).localidad === fLocalidad);

    return d;
  }, [data, vista, search, fEstado, fArea, fResp, fLocalidad, fPrioridad, usersMap]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const navItems = [
    { label: "Dashboard", icon: "⊞" },
    { label: "Expedientes", icon: "📋" },
    { label: "Importar Excel", icon: "⇪" },
    { label: "Nuevo expediente", icon: "＋" },
  ];

  const accessSyncStyle =
    accessSyncStatus.kind === "success"
      ? { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }
      : accessSyncStatus.kind === "warning"
      ? { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }
      : null;

  if (!activeUser) {
    return (
      <LoginScreen
        selectedUserId={selectedLoginUserId}
        onSelectUser={setSelectedLoginUserId}
        onIngresar={handleLogin}
        loginLoading={loginLoading}
        loginError={loginError}
      />
    );
  }

  return (
    <div style={{ margin: 0, fontFamily: "Segoe UI, sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside
          style={{
            width: sidebarOpen ? 196 : 82,
            background: "#fff",
            borderRight: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
        >
          <div
            style={{
              padding: "18px 12px 16px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: sidebarOpen ? 88 : 56,
                height: sidebarOpen ? 88 : 56,
                borderRadius: sidebarOpen ? 22 : 16,
                background: "#fff",
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 30px rgba(15,23,42,.06)",
              }}
            >
              <img
                src="/logo-icono.png"
                alt="Municipio"
                style={{
                  width: sidebarOpen ? 68 : 40,
                  height: sidebarOpen ? 68 : 40,
                  objectFit: "contain",
                }}
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
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              style={{
                width: "100%",
                padding: 6,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#cbd5e1",
                fontSize: 11,
              }}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>
        </aside>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <header
            style={{
              background: "#fff",
              borderBottom: `1px solid ${C.border}`,
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{activeNav}</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                Dirección de Regularización Dominial • Base conectada a Supabase
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: `1px solid ${C.border}`,
                  background: "#f8fafc",
                  color: C.slate,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {activeUser.nombre} · {activeUser.rol}
              </div>
              <button
                onClick={() => {
                  setActiveUser(null);
                  setSelectedLoginUserId(LOGIN_USERS[0].id);
                  setActiveNav("Dashboard");
                  setLoginError("");
                  setNotice("");
                  setAccessSyncStatus({ kind: "", text: "" });
                }}
                style={btnGhost}
              >
                Salir
              </button>
              <div style={{ fontSize: 13, color: C.muted }}>{fechaActual}</div>
              <button onClick={() => loadInitialData(true)} style={btnGhost}>{refreshing ? "Actualizando..." : "Actualizar"}</button>
              <button onClick={() => setNuevoOpen(true)} style={btnPrimary}>+ Nuevo expediente</button>
            </div>
          </header>

          <main style={{ flex: 1, padding: "20px 24px", maxWidth: 1400, width: "100%", boxSizing: "border-box" }}>
            {error ? (
              <div style={{ marginBottom: 16, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>
                {error}
              </div>
            ) : null}

            {notice ? (
              <div style={{ marginBottom: 16, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>
                {notice}
              </div>
            ) : null}

            {accessSyncStyle ? (
              <div style={{ ...accessSyncStyle, marginBottom: 16, borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>
                {accessSyncStatus.text}
              </div>
            ) : null}

            {loading ? (
              <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}` }}>
                <EmptyBlock title="Cargando datos del sistema" text="Esperando respuesta de Supabase para usuarios y expedientes." />
              </div>
            ) : activeNav === "Dashboard" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {[
                    ["Total expedientes", stats.total, "Base operativa actual"],
                    ["En proceso", stats.proceso, "Seguimiento activo"],
                    ["Casos críticos", stats.criticos, "Prioridad crítica"],
                    ["Atrasados (+14d)", stats.atrasados, "Requieren revisión"],
                  ].map(([label, value, note]) => (
                    <div key={label} style={{ background: "#fff", border: `1px solid ${C.border}`, padding: "14px 18px", borderRadius: 16 }}>
                      <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
                      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{value}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: C.dim }}>{note}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: 14, marginTop: 14 }}>
                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>
                      Ingreso actual
                    </div>
                    <div style={{ marginTop: 12, fontSize: 18, fontWeight: 800 }}>{activeUser.nombre}</div>
                    <div style={{ marginTop: 4, color: C.muted }}>{activeUser.rol}</div>
                    <div style={{ marginTop: 16, fontSize: 12, color: C.dim }}>
                      Último ingreso: {formatDateTime(activeUser.lastLoginAt)}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: C.dim }}>
                      Perfil técnico: {activeUser.tecnico ? "Sí" : "No"}
                    </div>
                  </div>

                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>
                      Últimos ingresos registrados
                    </div>
                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                      {accessHistory.length === 0 ? (
                        <div style={{ color: C.dim, fontSize: 13 }}>Aún no hay accesos registrados.</div>
                      ) : (
                        accessHistory.slice(0, 4).map((entry, index) => (
                          <div key={`${entry.nombre}-${entry.fecha_ingreso}-${index}`} style={{ background: C.softBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ fontWeight: 700 }}>{entry.nombre}</div>
                            <div style={{ marginTop: 4, color: C.muted, fontSize: 13 }}>{entry.rol}</div>
                            <div style={{ marginTop: 6, color: C.dim, fontSize: 12 }}>{formatDateTime(entry.fecha_ingreso)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>
                      Panel listo para carga real
                    </div>
                    <div style={{ marginTop: 10, color: C.muted, fontSize: 13, lineHeight: 1.55 }}>
                      El sistema ya contempla campos operativos y estructura para importación futura desde Excel.
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                      <div style={{ background: C.softBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: C.indigo }}>Campos operativos</div>
                        <div style={{ marginTop: 10, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                          observaciones<br />
                          proxima_accion<br />
                          ultima_actualizacion<br />
                          dias_sin_movimiento
                        </div>
                      </div>
                      <div style={{ background: C.softBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: C.indigo }}>Cobertura actual</div>
                        <div style={{ marginTop: 10, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                          Con observaciones: {data.filter((d) => cleanText(d.observaciones)).length}<br />
                          Con próxima acción: {data.filter((d) => cleanText(d.proximaAccion)).length}<br />
                          Localidades base: {LOCALIDADES.length}<br />
                          Usuarios cargados: {users.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: 18, marginTop: 14, maxWidth: 520 }}>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>
                    Columnas esperadas para Excel
                  </div>
                  <div style={{ marginTop: 6, color: C.muted, fontSize: 13 }}>Referencia para la próxima importación.</div>
                  <div style={{ display: "grid", gap: 7, marginTop: 14 }}>
                    {[
                      "numero_expediente",
                      "titular",
                      "dni",
                      "localidad",
                      "barrio",
                      "estado",
                      "area_actual",
                      "responsable_id",
                      "documentacion",
                      "prioridad",
                      "observaciones",
                      "proxima_accion",
                      "ultima_actualizacion",
                      "editable_tecnico",
                    ].map((column) => (
                      <div key={column} style={{ background: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 10px", fontSize: 12, fontFamily: "monospace" }}>
                        {column}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : activeNav === "Importar Excel" ? (
              <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: 22 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.slate }}>Importar archivo Excel</div>
                <div style={{ marginTop: 8, color: C.muted, fontSize: 13, lineHeight: 1.55 }}>
                  Módulo preparado para la próxima etapa. Desde acá se va a subir el archivo general y se mostrará una vista previa antes de cargarlo al sistema.
                </div>

                <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
                  <div style={{ border: `1px dashed ${C.border}`, borderRadius: 16, padding: 20, background: "#f8fafc" }}>
                    <div style={{ fontWeight: 700, color: C.slate }}>Carga prevista</div>
                    <div style={{ marginTop: 8, color: C.muted, fontSize: 13, lineHeight: 1.65 }}>
                      1. Selección de archivo .xlsx, .xls o .csv<br />
                      2. Lectura y normalización de columnas<br />
                      3. Vista previa y validación<br />
                      4. Inserción a Supabase con control de duplicados
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <input type="file" accept=".xlsx,.xls,.csv" style={inputStyle} disabled />
                    </div>
                    <div style={{ marginTop: 10, color: C.dim, fontSize: 12 }}>
                      Esta sección ya está visible y lista para conectarse con la lógica de importación.
                    </div>
                  </div>

                  <div style={{ background: C.softBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ fontWeight: 700, color: C.slate }}>Requisitos recomendados</div>
                    <div style={{ marginTop: 10, color: C.muted, fontSize: 13, lineHeight: 1.75 }}>
                      • número de expediente o identificador<br />
                      • titular<br />
                      • dni<br />
                      • localidad y barrio<br />
                      • estado y área actual<br />
                      • observaciones y próxima acción si existen
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
                    ["listo", "Listos"],
                    ["atrasados", "Atrasados"],
                    ["tecnicos", "Editable técnico"],
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
                      <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.dim, fontSize: 13 }}>🔍</span>
                        <input
                          value={search}
                          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                          placeholder="Buscar nombre, DNI, expediente, observaciones o responsable..."
                          style={{ ...inputStyle, paddingLeft: 32 }}
                        />
                      </div>
                      <button
                        onClick={() => { setSearch(""); setFEstado(""); setFArea(""); setFResp(""); setFLocalidad(""); setFPrioridad(""); setVista("todos"); setPage(1); }}
                        style={btnGhost}
                      >
                        Limpiar filtros
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                      <select value={fEstado} onChange={(e) => { setFEstado(e.target.value); setPage(1); }} style={inputStyle}>
                        <option value="">Todos los estados</option>
                        {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>

                      <select value={fArea} onChange={(e) => { setFArea(e.target.value); setPage(1); }} style={inputStyle}>
                        <option value="">Todas las áreas</option>
                        {AREAS.filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>

                      <select value={fResp} onChange={(e) => { setFResp(e.target.value); setPage(1); }} style={inputStyle}>
                        <option value="">Todos los responsables</option>
                        {users.map((user) => <option key={user.id} value={user.id}>{user.nombre}</option>)}
                      </select>

                      <select value={fLocalidad} onChange={(e) => { setFLocalidad(e.target.value); setPage(1); }} style={inputStyle}>
                        <option value="">Todas las localidades</option>
                        {LOCALIDADES.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                      </select>

                      <select value={fPrioridad} onChange={(e) => { setFPrioridad(e.target.value); setPage(1); }} style={inputStyle}>
                        <option value="">Todas las prioridades</option>
                        {Object.entries(PRIORIDADES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1180, fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
                          {["N° Expediente", "Titular / DNI", "Localidad / Barrio", "Estado", "Área", "Responsable", "Doc.", "Sin movimiento", "Actualización", "Prioridad", "Próxima acción", ""].map((h) => (
                            <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: ".05em" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {slice.length === 0 ? (
                          <tr>
                            <td colSpan={12}>
                              <EmptyBlock title="No se encontraron expedientes" text="Ajustá los filtros o cargá el primer expediente." />
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
                              <td style={{ padding: "10px 12px" }}>{exp.area}</td>
                              <td style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700 }}>{usersMap[exp.resp] || "—"}</td>
                              <td style={{ padding: "10px 12px" }}><Doc doc={exp.doc} /></td>
                              <td style={{ padding: "10px 12px", textAlign: "center" }}><Dias dias={exp.dias} /></td>
                              <td style={{ padding: "10px 12px", color: C.dim, fontSize: 11 }}>{formatDate(exp.upd)}</td>
                              <td style={{ padding: "10px 12px" }}><Priority prioridad={exp.prio} /></td>
                              <td style={{ padding: "10px 12px", color: C.muted, fontSize: 11 }}>{truncateText(exp.proximaAccion, 42)}</td>
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

                  <div style={{ padding: "12px 18px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} registros
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
