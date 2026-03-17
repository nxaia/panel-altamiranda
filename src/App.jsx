import { useState, useEffect } from "react";

const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

const CLIENTES = [
  { id: "fabian", nombre: "Fabián Salguero", color: "#FF6B35", initial: "FS" },
  { id: "nestor", nombre: "Néstor Hidalgo", color: "#2EC4B6", initial: "NH" },
];

const EMPRESAS = [
  { id: 1, nombre: "TATITO", clienteId: "fabian", color: "#FF6B35", initial: "TA", rol: "Administración general", tipo: "admin", sucursales: 5 },
  { id: 2, nombre: "SOL SRL", clienteId: "fabian", color: "#F7B731", initial: "SL", rol: "Auditoría de franquicia", tipo: "auditoria", sucursales: 1 },
  { id: 3, nombre: "DEPAL SRL", clienteId: "fabian", color: "#E84393", initial: "DP", rol: "Supervisión + Auditoría + Gerentes", tipo: "supervision", sucursales: 1 },
  { id: 4, nombre: "CELOG", clienteId: "fabian", color: "#9B5DE5", initial: "CL", rol: "Capacitación vendedora mayorista", tipo: "capacitacion", sucursales: 1 },
  { id: 5, nombre: "MANAOS", clienteId: "nestor", color: "#2EC4B6", initial: "MN", rol: "Aumentar ventas", tipo: "ventas", sucursales: 1 },
  { id: 6, nombre: "DNH", clienteId: "nestor", color: "#4CC9F0", initial: "DN", rol: "Supervisión y auditoría", tipo: "auditoria", sucursales: 1 },
];

const CHECKLIST_AUDITORIA = [
  "Revisión de stock y faltantes","Control de fechas de vencimiento","Orden y limpieza del local",
  "Verificación de precios y cartelería","Revisión de caja / facturación","Control de proveedores del día",
  "Estado del equipo de trabajo","Cumplimiento de estándares de franquicia",
];

const CHECKLIST_SUPERVISION = [
  "Reunión con gerente / encargado","Revisión de objetivos del período","Control de proveedores activos",
  "Reordenamiento de áreas críticas","Evaluación del equipo interno","Seguimiento de indicadores clave",
];

const ROXANA_INICIAL = [
  { semana: "Semana 1", llamadas: 42, contactos: 28, oportunidades: 12, seguimientos: 8, ventas: 18, monto: 85000 },
  { semana: "Semana 2", llamadas: 48, contactos: 32, oportunidades: 15, seguimientos: 10, ventas: 22, monto: 98000 },
  { semana: "Semana 3", llamadas: 51, contactos: 35, oportunidades: 18, seguimientos: 12, ventas: 25, monto: 112000 },
];

const RUTINA_DIARIA = [
  "Revisión de contactos a llamar del día",
  "Bloques de llamados definidos cumplidos",
  "Registro inmediato de resultados de cada llamado",
  "Seguimientos pendientes revisados",
  "Discurso de apertura preparado antes de llamar",
];

const DIAGNOSTICO_SOL = {
  franquiciado: "Gonzalo Miguel Angel",
  local: "SOL — Av. Juan B. Justo 1554",
  fecha: "14/03/26",
  puntaje: 6,
  calificaciones: {
    "Gestión general": 6, "Orden del local": 7, "Limpieza": 7, "Imagen visual": 7,
    "Exhibición productos": 8, "Uso de góndolas": 6, "Claridad de roles": 6,
    "Rendimiento personal": 6, "Compromiso equipo": 7, "Organización operativa": 5,
    "Aprovechamiento tiempo": 5, "Desempeño ventas": 6, "Potencial crecimiento": 7,
  },
  fortalezas: ["Atención al cliente", "Puntualidad del personal", "Layout basado en 15 años en consumo masivo", "Sector fiambrería bien exhibido"],
  problemas: ["Falta delegación y roles claros", "Personal solo despacha, no vende", "Nula presencia en redes sociales", "Precios poco competitivos vs mayoristas de la zona", "Desorden cuando llegan pedidos del centro logístico", "Sin sistema de stock"],
  pedidos: ["Acciones unificadas entre franquicias (sorteos)", "Redes sociales", "Promociones con tarjetas", "Capacitación en atención al cliente", "Sistema de stock", "Anticipación a fechas clave"],
};

const C = { bg: "#0F1117", card: "#1A1D2E", border: "#2A2D3E", text: "#E8E8F0", muted: "#9CA3AF", dim: "#6B7280" };
const card = (extra) => ({ background: C.card, borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, ...extra });
const btn = (color, ghost) => ({ background: ghost ? "transparent" : color, color: ghost ? color : "white", border: `1px solid ${color}`, borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 });
const inp = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none" };
const lbl = { fontSize: 11, color: C.muted, marginBottom: 6, display: "block" };
const badge = (color) => ({ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: color + "22", color, border: `1px solid ${color}44`, fontWeight: 600, display: "inline-block" });

async function callAI(system, userMsg, onChunk) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, stream: true, system, messages: [{ role: "user", content: userMsg }] }),
  });
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split("\n").filter(l => l.startsWith("data: "))) {
      try { const d = JSON.parse(line.slice(6)); const t = d.delta?.text || ""; if (t) { full += t; onChunk(full); } } catch {}
    }
  }
  return full;
}

function AIBox({ text, loading }) {
  if (!text && !loading) return null;
  return <div style={{ marginTop: 14, background: C.bg, borderRadius: 10, padding: 14, border: `1px solid ${C.border}`, fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", minHeight: 50 }}>
    {loading && !text ? <span style={{ color: C.muted }}>✨ Generando...</span> : text}{loading && text && "▌"}
  </div>;
}

function Reloj() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const hora = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const fecha = `${DIAS[now.getDay()]} ${now.getDate()} de ${MESES[now.getMonth()]}`;
  return (
    <div style={{ background: C.card, borderRadius: 12, padding: "12px 20px", border: `1px solid ${C.border}`, marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#FF6B35", letterSpacing: -1 }}>{hora}</div>
      <div style={{ fontSize: 14, color: C.muted }}>{fecha}</div>
    </div>
  );
}

function Dashboard({ setTab }) {
  const modulos = [
    { tab: "diagnostico", icon: "📋", title: "Diagnóstico Franquicias", desc: "Plan de acción SOL basado en encuesta real", color: "#F7B731" },
    { tab: "auditoria", icon: "🔍", title: "Auditoría", desc: "Checklist presencial SOL, DEPAL, DNH", color: "#E84393" },
    { tab: "supervision", icon: "👁️", title: "Supervisión", desc: "Operativa DEPAL y DNH", color: "#2EC4B6" },
    { tab: "roxana", icon: "📞", title: "Roxana / CELOG", desc: "KPIs y seguimiento telemarketer", color: "#9B5DE5" },
    { tab: "manaos", icon: "🚀", title: "Estrategia MANAOS", desc: "Plan de ventas con IA", color: "#4CC9F0" },
    { tab: "planes", icon: "🎯", title: "Planes IA", desc: "Generá planes de operación", color: "#FF6B35" },
  ];
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Buenos días, Ale 👋</div>
        <div style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>Panel de gestión — 2 clientes · 6 empresas activas</div>
        <Reloj />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Clientes", value: "2", icon: "👤", color: "#FF6B35" },
          { label: "Empresas", value: "6", icon: "🏢", color: "#2EC4B6" },
          { label: "Módulos IA", value: "5", icon: "🤖", color: "#9B5DE5" },
        ].map((s, i) => (
          <div key={i} style={card()}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: C.muted, marginBottom: 12, letterSpacing: 1 }}>MÓDULOS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {modulos.map(m => (
          <div key={m.tab} onClick={() => setTab(m.tab)} style={{ ...card({ cursor: "pointer", borderColor: m.color + "44" }) }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontWeight: 700, color: m.color, marginBottom: 4 }}>{m.title}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Empresas() {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>🏢 Empresas</div>
      {CLIENTES.map(cl => (
        <div key={cl.id} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: cl.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{cl.initial}</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{cl.nombre}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {EMPRESAS.filter(e => e.clienteId === cl.id).map(e => (
              <div key={e.id} style={card({ borderLeft: `3px solid ${e.color}` })}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: e.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>{e.initial}</div>
                  <div><div style={{ fontWeight: 700 }}>{e.nombre}</div><span style={badge(e.color)}>{e.tipo}</span></div>
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>{e.rol}</div>
                {e.sucursales > 1 && <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>📍 {e.sucursales} sucursales</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Diagnostico() {
  const [aiOut, setAiOut] = useState(""); const [aiLoad, setAiLoad] = useState(false);
  const [seguimiento, setSeguimiento] = useState({});
  const d = DIAGNOSTICO_SOL;
  const promedio = Math.round(Object.values(d.calificaciones).reduce((a, b) => a + b, 0) / Object.values(d.calificaciones).length * 10) / 10;
  const color = promedio >= 7 ? "#2EC4B6" : promedio >= 5 ? "#F7B731" : "#FF6B35";

  const genPlan = async () => {
    setAiLoad(true); setAiOut("");
    const sys = `Sos un consultor de negocios experto en franquicias y retail del NOA argentino. 
Generás planes de acción concretos, priorizados y accionables basados en diagnósticos reales de franquiciados.
Conocés el contexto: TATITO/SOL son franquicias de fiambres, lácteos y productos de supermercado de DEPAL SRL (Fabián Salguero).
El consultor que gestiona es Alejandro Altamiranda.`;
    const prompt = `Diagnóstico real del franquiciado ${d.franquiciado} — ${d.local} (${d.fecha})
Puntaje general: ${d.puntaje}/10
Promedio calificaciones: ${promedio}/10

CALIFICACIONES:
${Object.entries(d.calificaciones).map(([k, v]) => `${k}: ${v}/10`).join("\n")}

FORTALEZAS:
${d.fortalezas.map(f => `- ${f}`).join("\n")}

PROBLEMAS DETECTADOS:
${d.problemas.map(p => `- ${p}`).join("\n")}

LO QUE PIDE EL FRANQUICIADO:
${d.pedidos.map(p => `- ${p}`).join("\n")}

Generá un plan de acción completo con:
1. Diagnóstico ejecutivo (2-3 líneas)
2. Top 3 prioridades inmediatas (esta semana)
3. Acciones a 30 días con responsable y métrica
4. Acciones a 60-90 días
5. Recomendación específica para Alejandro sobre cómo abordar a este franquiciado`;
    await callAI(sys, prompt, t => setAiOut(t));
    setAiLoad(false);
  };

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>📋 Diagnóstico Franquicias</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Encuesta real · Marzo 2026</div>

      <div style={{ ...card({ marginBottom: 16, borderColor: color + "44" }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{d.franquiciado}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{d.local}</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Respondido: {d.fecha}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color }}>{d.puntaje}/10</div>
            <div style={{ fontSize: 10, color: C.muted }}>autoevaluación</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
          {Object.entries(d.calificaciones).slice(0, 9).map(([k, v]) => (
            <div key={k} style={{ background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: v >= 7 ? "#2EC4B6" : v >= 5 ? "#F7B731" : "#FF6B35" }}>{v}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{k}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "#2EC4B611", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2EC4B6", marginBottom: 8 }}>✅ FORTALEZAS</div>
            {d.fortalezas.map((f, i) => <div key={i} style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>· {f}</div>)}
          </div>
          <div style={{ background: "#FF6B3511", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#FF6B35", marginBottom: 8 }}>⚠️ PROBLEMAS</div>
            {d.problemas.slice(0, 4).map((p, i) => <div key={i} style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>· {p}</div>)}
          </div>
        </div>

        <button onClick={genPlan} disabled={aiLoad} style={{ ...btn("#F7B731"), opacity: aiLoad ? 0.5 : 1, width: "100%" }}>
          {aiLoad ? "Generando plan..." : "✨ Generar Plan de Acción con IA"}
        </button>
        <AIBox text={aiOut} loading={aiLoad} />
      </div>

      {aiOut && (
        <div style={card({ borderColor: "#F7B73144" })}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: "#F7B731" }}>📌 Seguimiento del plan</div>
          {["Prioridad 1 — Definir roles claros con el equipo", "Prioridad 2 — Capacitación en ventas activas al personal", "Prioridad 3 — Arrancar presencia en redes sociales", "30 días — Sistema de stock básico operativo", "30 días — Reorganización de funciones documentada", "60 días — Primera acción promocional (sorteo)", "90 días — Revisión de resultados y ajuste de plan"].map((item, i) => (
            <div key={i} onClick={() => setSeguimiento(p => ({ ...p, [i]: !p[i] }))}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: seguimiento[i] ? "#F7B73111" : C.bg, borderRadius: 8, cursor: "pointer", border: `1px solid ${seguimiento[i] ? "#F7B73144" : C.border}`, marginBottom: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${seguimiento[i] ? "#F7B731" : "#4B5563"}`, background: seguimiento[i] ? "#F7B731" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{seguimiento[i] ? "✓" : ""}</div>
              <span style={{ fontSize: 13, color: seguimiento[i] ? C.text : C.muted, textDecoration: seguimiento[i] ? "line-through" : "none" }}>{item}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
            {Object.values(seguimiento).filter(Boolean).length}/{7} implementados
          </div>
        </div>
      )}

      <div style={{ ...card({ marginTop: 16, borderColor: "#2A2D3E" }) }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8 }}>📬 Encuestas pendientes</div>
        <div style={{ fontSize: 13, color: C.dim }}>Esperando respuesta de otros franquiciados de TATITO... Cuando lleguen, se agregan acá automáticamente.</div>
      </div>
    </div>
  );
}

function Auditoria() {
  const empresas = EMPRESAS.filter(e => e.tipo === "auditoria");
  const [empresa, setEmpresa] = useState(String(empresas[0].id));
  const [checks, setChecks] = useState({});
  const [obs, setObs] = useState("");
  const [saved, setSaved] = useState([]);
  const [aiOut, setAiOut] = useState(""); const [aiLoad, setAiLoad] = useState(false);
  const toggle = (i) => setChecks(p => ({ ...p, [i]: !p[i] }));
  const done = CHECKLIST_AUDITORIA.filter((_, i) => checks[i]).length;
  const pct = Math.round((done / CHECKLIST_AUDITORIA.length) * 100);
  const emp = EMPRESAS.find(e => e.id === Number(empresa)) || empresas[0];
  const guardar = () => { setSaved(p => [{ id: Date.now(), empresa: emp.nombre, fecha: new Date().toLocaleDateString("es-AR"), pct, obs }, ...p]); setChecks({}); setObs(""); };
  const genResumen = async () => {
    setAiLoad(true); setAiOut("");
    const items = CHECKLIST_AUDITORIA.map((c, i) => `${checks[i] ? "✅" : "❌"} ${c}`).join("\n");
    await callAI("Sos un consultor de negocios del NOA argentino. Generás resúmenes ejecutivos de auditorías claros y accionables.", `Empresa: ${emp.nombre}\nAuditoría al ${pct}%\nObservaciones: ${obs || "ninguna"}\n${items}\n\nResumen ejecutivo con puntos críticos y próximos pasos.`, t => setAiOut(t));
    setAiLoad(false);
  };
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>🔍 Auditoría de Franquicia</div>
      <div style={card({ marginBottom: 20 })}>
        <div style={{ marginBottom: 14 }}><span style={lbl}>Empresa</span><select style={sel} value={empresa} onChange={e => { setEmpresa(e.target.value); setChecks({}); }}>{empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: C.bg, borderRadius: 8, height: 8, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${emp.color}, ${emp.color}88)`, borderRadius: 8, transition: "width .3s" }} /></div>
          <div style={{ fontSize: 13, fontWeight: 700, color: emp.color }}>{pct}%</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {CHECKLIST_AUDITORIA.map((item, i) => (
            <div key={i} onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: checks[i] ? emp.color + "11" : C.bg, borderRadius: 8, cursor: "pointer", border: `1px solid ${checks[i] ? emp.color + "44" : C.border}` }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${checks[i] ? emp.color : "#4B5563"}`, background: checks[i] ? emp.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{checks[i] ? "✓" : ""}</div>
              <span style={{ fontSize: 13, color: checks[i] ? C.text : C.muted }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 14 }}><span style={lbl}>Observaciones</span><textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} placeholder="Anotá lo que encontraste..." value={obs} onChange={e => setObs(e.target.value)} /></div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={guardar} style={btn(emp.color)}>💾 Guardar</button>
          <button onClick={genResumen} disabled={aiLoad} style={{ ...btn(emp.color, true), opacity: aiLoad ? 0.5 : 1 }}>✨ Resumen IA</button>
        </div>
        <AIBox text={aiOut} loading={aiLoad} />
      </div>
      {saved.map(s => <div key={s.id} style={card({ marginBottom: 10 })}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700 }}>{s.empresa}</span><span style={badge(s.pct >= 80 ? "#2EC4B6" : "#F7B731")}>{s.pct}%</span></div>{s.obs && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>💬 {s.obs}</div>}</div>)}
    </div>
  );
}

function Supervision() {
  const empresas = [EMPRESAS[2], EMPRESAS[5]];
  const [empresa, setEmpresa] = useState(String(empresas[0].id));
  const [checks, setChecks] = useState({});
  const [obs, setObs] = useState("");
  const [saved, setSaved] = useState([]);
  const [aiOut, setAiOut] = useState(""); const [aiLoad, setAiLoad] = useState(false);
  const toggle = (i) => setChecks(p => ({ ...p, [i]: !p[i] }));
  const done = CHECKLIST_SUPERVISION.filter((_, i) => checks[i]).length;
  const pct = Math.round((done / CHECKLIST_SUPERVISION.length) * 100);
  const emp = EMPRESAS.find(e => e.id === Number(empresa)) || empresas[0];
  const guardar = () => { setSaved(p => [{ id: Date.now(), empresa: emp.nombre, fecha: new Date().toLocaleDateString("es-AR"), pct, obs }, ...p]); setChecks({}); setObs(""); };
  const genPlan = async () => {
    setAiLoad(true); setAiOut("");
    const items = CHECKLIST_SUPERVISION.map((c, i) => `${checks[i] ? "✅" : "❌"} ${c}`).join("\n");
    await callAI("Sos un consultor de negocios del NOA argentino especializado en supervisión operativa de PyMEs.", `Empresa: ${emp.nombre}\nSupervisión al ${pct}%\nObservaciones: ${obs || "ninguna"}\n${items}\n\nPlan de acción con próximos pasos prioritarios.`, t => setAiOut(t));
    setAiLoad(false);
  };
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>👁️ Supervisión Operativa</div>
      <div style={card({ marginBottom: 20 })}>
        <div style={{ marginBottom: 14 }}><span style={lbl}>Empresa</span><select style={sel} value={empresa} onChange={e => { setEmpresa(e.target.value); setChecks({}); }}>{empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: C.bg, borderRadius: 8, height: 8, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${emp.color}, ${emp.color}88)`, borderRadius: 8, transition: "width .3s" }} /></div>
          <div style={{ fontSize: 13, fontWeight: 700, color: emp.color }}>{pct}%</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {CHECKLIST_SUPERVISION.map((item, i) => (
            <div key={i} onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: checks[i] ? emp.color + "11" : C.bg, borderRadius: 8, cursor: "pointer", border: `1px solid ${checks[i] ? emp.color + "44" : C.border}` }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${checks[i] ? emp.color : "#4B5563"}`, background: checks[i] ? emp.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{checks[i] ? "✓" : ""}</div>
              <span style={{ fontSize: 13, color: checks[i] ? C.text : C.muted }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 14 }}><span style={lbl}>Observaciones</span><textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} placeholder="Situación del equipo, proveedores, decisiones..." value={obs} onChange={e => setObs(e.target.value)} /></div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={guardar} style={btn(emp.color)}>💾 Guardar</button>
          <button onClick={genPlan} disabled={aiLoad} style={{ ...btn(emp.color, true), opacity: aiLoad ? 0.5 : 1 }}>✨ Plan IA</button>
        </div>
        <AIBox text={aiOut} loading={aiLoad} />
      </div>
      {saved.map(s => <div key={s.id} style={card({ marginBottom: 10 })}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700 }}>{s.empresa}</span><span style={{ fontSize: 12, color: C.muted }}>📅 {s.fecha} · {s.pct}%</span></div>{s.obs && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>💬 {s.obs}</div>}</div>)}
    </div>
  );
}

function Roxana() {
  const [registros, setRegistros] = useState(ROXANA_INICIAL);
  const [semana, setSemana] = useState(""); const [llamadas, setLlamadas] = useState("");
  const [contactos, setContactos] = useState(""); const [oportunidades, setOportunidades] = useState("");
  const [seguimientos, setSeguimientos] = useState(""); const [ventas, setVentas] = useState(""); const [monto, setMonto] = useState("");
  const [rutina, setRutina] = useState({});
  const [aiOut, setAiOut] = useState(""); const [aiLoad, setAiLoad] = useState(false);
  const [vista, setVista] = useState("kpis");
  const agregar = () => {
    if (!semana || !llamadas) return;
    setRegistros(p => [...p, { semana, llamadas: Number(llamadas), contactos: Number(contactos), oportunidades: Number(oportunidades), seguimientos: Number(seguimientos), ventas: Number(ventas), monto: Number(monto) }]);
    setSemana(""); setLlamadas(""); setContactos(""); setOportunidades(""); setSeguimientos(""); setVentas(""); setMonto("");
  };
  const analizar = async () => {
    setAiLoad(true); setAiOut("");
    const datos = registros.map(r => `${r.semana}: ${r.llamadas} llamadas, ${r.contactos} contactos efectivos, ${r.oportunidades} oportunidades, ${r.seguimientos} seguimientos, ${r.ventas} ventas, $${r.monto.toLocaleString()}`).join("\n");
    await callAI(`Sos un coach de ventas especializado en telemarketing B2B para distribuidoras en Argentina. Conocés el Manual Operativo de CELOG: el telemarketer debe hacer llamadas de captación, reactivación y seguimiento. KPIs clave: llamadas realizadas, contactos efectivos, oportunidades generadas, seguimientos concretados.`,
      `Vendedora: Roxana (CELOG)\nDatos semanales:\n${datos}\n\nAnalizá su evolución en todos los KPIs e identificá en qué momento del proceso está fallando. Generá recomendaciones concretas.`, t => setAiOut(t));
    setAiLoad(false);
  };
  const ultima = registros[registros.length - 1];
  const anteult = registros[registros.length - 2];
  const convRate = ultima ? Math.round((ultima.ventas / ultima.llamadas) * 100) : 0;
  const efectividad = ultima ? Math.round((ultima.contactos / ultima.llamadas) * 100) : 0;
  const convOport = ultima && ultima.contactos ? Math.round((ultima.oportunidades / ultima.contactos) * 100) : 0;
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>📞 Roxana — CELOG</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Telemarketer Comercial B2B · Manual Operativo activo</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["kpis","rutina","nueva"].map(v => (
          <button key={v} onClick={() => setVista(v)} style={{ ...btn(vista === v ? "#9B5DE5" : "#2A2D3E"), fontSize: 12 }}>
            {v === "kpis" ? "📊 KPIs" : v === "rutina" ? "✅ Rutina diaria" : "➕ Cargar semana"}
          </button>
        ))}
      </div>
      {vista === "kpis" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Llamadas realizadas", value: ultima ? ultima.llamadas : "-", color: "#9B5DE5", sub: anteult ? `vs ${anteult.llamadas} sem. ant.` : "" },
              { label: "Contactos efectivos", value: ultima ? ultima.contactos : "-", color: "#F7B731", sub: `${efectividad}% efectividad` },
              { label: "Oportunidades generadas", value: ultima ? ultima.oportunidades : "-", color: "#2EC4B6", sub: `${convOport}% de contactos` },
              { label: "Seguimientos concretados", value: ultima ? ultima.seguimientos : "-", color: "#E84393", sub: ultima && ultima.oportunidades ? `${Math.round((ultima.seguimientos / ultima.oportunidades) * 100)}% de oportunidades` : "" },
              { label: "Ventas cerradas", value: ultima ? ultima.ventas : "-", color: "#FF6B35", sub: `${convRate}% conversión` },
              { label: "Monto total", value: ultima ? `$${ultima.monto.toLocaleString()}` : "-", color: "#4CC9F0", sub: "último período" },
            ].map((s, i) => (
              <div key={i} style={card()}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.text, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                {s.sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
          <div style={card({ marginBottom: 16 })}>
            <div style={{ fontWeight: 700, marginBottom: 14, color: "#9B5DE5" }}>📊 Historial semanal</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Semana","Llamadas","Contactos","Oportunidades","Seguimientos","Ventas","Monto"].map(h => <th key={h} style={{ padding: "8px 6px", color: C.muted, fontWeight: 600, textAlign: "left" }}>{h}</th>)}
                </tr></thead>
                <tbody>{registros.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "8px 6px", fontWeight: 600 }}>{r.semana}</td>
                    <td style={{ padding: "8px 6px", color: "#9B5DE5" }}>{r.llamadas}</td>
                    <td style={{ padding: "8px 6px", color: "#F7B731" }}>{r.contactos}</td>
                    <td style={{ padding: "8px 6px", color: "#2EC4B6" }}>{r.oportunidades}</td>
                    <td style={{ padding: "8px 6px", color: "#E84393" }}>{r.seguimientos}</td>
                    <td style={{ padding: "8px 6px", color: "#FF6B35" }}>{r.ventas}</td>
                    <td style={{ padding: "8px 6px", color: C.muted }}>${r.monto.toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <button onClick={analizar} disabled={aiLoad} style={{ ...btn("#9B5DE5"), opacity: aiLoad ? 0.5 : 1 }}>
            {aiLoad ? "Analizando..." : "✨ Análisis completo con IA"}
          </button>
          <AIBox text={aiOut} loading={aiLoad} />
        </div>
      )}
      {vista === "rutina" && (
        <div style={card()}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: "#9B5DE5" }}>✅ Rutina diaria de Roxana</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Basada en el Manual Operativo CELOG</div>
          {RUTINA_DIARIA.map((item, i) => (
            <div key={i} onClick={() => setRutina(p => ({ ...p, [i]: !p[i] }))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: rutina[i] ? "#9B5DE522" : C.bg, borderRadius: 8, cursor: "pointer", border: `1px solid ${rutina[i] ? "#9B5DE544" : C.border}`, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${rutina[i] ? "#9B5DE5" : "#4B5563"}`, background: rutina[i] ? "#9B5DE5" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{rutina[i] ? "✓" : ""}</div>
              <span style={{ fontSize: 13, color: rutina[i] ? C.text : C.muted }}>{item}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>{Object.values(rutina).filter(Boolean).length}/{RUTINA_DIARIA.length} completados hoy</div>
        </div>
      )}
      {vista === "nueva" && (
        <div style={card()}>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>➕ Cargar nueva semana</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}><span style={lbl}>Semana</span><input style={inp} placeholder="Ej: Semana 4" value={semana} onChange={e => setSemana(e.target.value)} /></div>
            <div><span style={lbl}>Llamadas realizadas</span><input style={inp} type="number" placeholder="0" value={llamadas} onChange={e => setLlamadas(e.target.value)} /></div>
            <div><span style={lbl}>Contactos efectivos</span><input style={inp} type="number" placeholder="0" value={contactos} onChange={e => setContactos(e.target.value)} /></div>
            <div><span style={lbl}>Oportunidades generadas</span><input style={inp} type="number" placeholder="0" value={oportunidades} onChange={e => setOportunidades(e.target.value)} /></div>
            <div><span style={lbl}>Seguimientos concretados</span><input style={inp} type="number" placeholder="0" value={seguimientos} onChange={e => setSeguimientos(e.target.value)} /></div>
            <div><span style={lbl}>Ventas cerradas</span><input style={inp} type="number" placeholder="0" value={ventas} onChange={e => setVentas(e.target.value)} /></div>
            <div><span style={lbl}>Monto total ($)</span><input style={inp} type="number" placeholder="0" value={monto} onChange={e => setMonto(e.target.value)} /></div>
          </div>
          <button onClick={agregar} disabled={!semana || !llamadas} style={{ ...btn("#9B5DE5"), opacity: !semana || !llamadas ? 0.5 : 1 }}>💾 Guardar semana</button>
        </div>
      )}
    </div>
  );
}

function Manaos() {
  const [contexto, setContexto] = useState(""); const [aiOut, setAiOut] = useState(""); const [aiLoad, setAiLoad] = useState(false); const [planes, setPlanes] = useState([]);
  const generar = async () => {
    setAiLoad(true); setAiOut("");
    const result = await callAI("Sos un consultor de ventas especializado en distribución de bebidas en Argentina (NOA). Diseñás estrategias concretas y accionables para PyMEs. Sin buzzwords.", `Empresa: MANAOS\nObjetivo: Aumentar ventas\nContexto: ${contexto || "no especificado"}\nNo hay estrategia definida.\n\nGenerá estrategia completa: diagnóstico, canales, acciones 30/60/90 días, métricas y recursos.`, t => setAiOut(t));
    setPlanes(p => [{ id: Date.now(), contexto, contenido: result }, ...p]);
    setAiLoad(false);
  };
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>🚀 Estrategia — MANAOS</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Cliente: Néstor Hidalgo · Objetivo: Aumentar ventas</div>
      <div style={card({ marginBottom: 20, borderColor: "#2EC4B644" })}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: "#2EC4B6" }}>✨ Generá una estrategia con IA</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>La IA va a crear un plan desde cero.</div>
        <span style={lbl}>Contexto actual (opcional)</span>
        <textarea style={{ ...inp, minHeight: 80, resize: "vertical", marginBottom: 14 }} placeholder="Ej: Venden en kioscos del centro, tienen 3 vendedores..." value={contexto} onChange={e => setContexto(e.target.value)} />
        <button onClick={generar} disabled={aiLoad} style={{ ...btn("#2EC4B6"), opacity: aiLoad ? 0.5 : 1 }}>{aiLoad ? "Generando..." : "✨ Generar Estrategia"}</button>
        <AIBox text={aiOut} loading={aiLoad} />
      </div>
      {planes.map(p => <div key={p.id} style={card({ marginBottom: 12 })}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontWeight: 700 }}>Estrategia MANAOS</span><span style={badge("#2EC4B6")}>Plan IA</span></div>{p.contexto && <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>📝 {p.contexto}</div>}<details><summary style={{ fontSize: 12, color: "#2EC4B6", cursor: "pointer" }}>Ver estrategia →</summary><div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{p.contenido}</div></details></div>)}
    </div>
  );
}

function Planes() {
  const [empresa, setEmpresa] = useState(EMPRESAS[0].nombre); const [objetivo, setObjetivo] = useState(""); const [plazo, setPlazo] = useState("30 días");
  const [aiOut, setAiOut] = useState(""); const [aiLoad, setAiLoad] = useState(false); const [planes, setPlanes] = useState([]);
  const generar = async () => {
    if (!objetivo.trim()) return; setAiLoad(true); setAiOut("");
    const result = await callAI("Sos un consultor de negocios experto en PyMEs del NOA argentino. Generás planes de operación con: Objetivo, Acciones clave (responsable + fecha), Métricas, Alertas de riesgo.", `Empresa: ${empresa}\nObjetivo: ${objetivo}\nPlazo: ${plazo}\nGenerá el plan completo.`, t => setAiOut(t));
    setPlanes(p => [{ id: Date.now(), empresa, objetivo, plazo, contenido: result }, ...p]); setAiLoad(false);
  };
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>🎯 Planes de Operación</div>
      <div style={card({ marginBottom: 20 })}>
        <div style={{ fontWeight: 700, marginBottom: 14, color: "#FF6B35" }}>✨ Nuevo plan con IA</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><span style={lbl}>Empresa</span><select style={sel} value={empresa} onChange={e => setEmpresa(e.target.value)}>{EMPRESAS.map(e => <option key={e.id}>{e.nombre}</option>)}</select></div>
          <div><span style={lbl}>Plazo</span><select style={sel} value={plazo} onChange={e => setPlazo(e.target.value)}>{["15 días","30 días","60 días","90 días"].map(p => <option key={p}>{p}</option>)}</select></div>
        </div>
        <span style={lbl}>Objetivo</span>
        <textarea style={{ ...inp, minHeight: 70, resize: "vertical", marginBottom: 14 }} placeholder="¿Qué querés lograr?" value={objetivo} onChange={e => setObjetivo(e.target.value)} />
        <button onClick={generar} disabled={aiLoad || !objetivo.trim()} style={{ ...btn("#FF6B35"), opacity: aiLoad || !objetivo.trim() ? 0.5 : 1 }}>{aiLoad ? "Generando..." : "✨ Generar Plan"}</button>
        <AIBox text={aiOut} loading={aiLoad} />
      </div>
      {planes.map(p => <div key={p.id} style={card({ marginBottom: 10 })}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontWeight: 700 }}>{p.empresa}</span><span style={badge("#FF6B35")}>{p.plazo}</span></div><div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>🎯 {p.objetivo}</div><details><summary style={{ fontSize: 12, color: "#FF6B35", cursor: "pointer" }}>Ver plan →</summary><div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{p.contenido}</div></details></div>)}
    </div>
  );
}

function Asistente() {
  const [msgs, setMsgs] = useState([{ role: "assistant", text: "Hola Ale! Conozco todas tus empresas y los documentos reales — el Manual de CELOG, el diagnóstico de SOL y el contrato de TATITO. Preguntame cualquier cosa 💪" }]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false);
  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim(); setInput("");
    const next = [...msgs, { role: "user", text: txt }, { role: "assistant", text: "" }];
    setMsgs(next); setLoading(true);
    const sys = `Sos el asistente personal de Ale Altamiranda, consultor de negocios del NOA argentino.

CLIENTES Y EMPRESAS:
- FABIÁN SALGUERO: TATITO (5 franquicias, administración general, contrato 36 meses desde 01/04/2024 vence 31/03/2027), SOL SRL (1 PdV, auditoría presencial), DEPAL SRL (supervisión proveedores + auditoría + reordenamiento + supervisión gerentes), CELOG (distribución alimentos y bebidas, Ale capacita a Roxana - telemarketer comercial B2B)
- NÉSTOR HIDALGO: MANAOS (objetivo aumentar ventas, sin estrategia definida), DNH (15 productos similares a CELOG sin quesos/fiambres, supervisión y auditoría)

DIAGNÓSTICO SOL (Gonzalo Miguel Angel, 14/03/26, puntaje 6/10):
- Problemas: falta delegación, personal solo despacha, sin redes sociales, precios poco competitivos, desorden en recepción de pedidos, sin sistema de stock
- Fortalezas: atención al cliente, puntualidad, buen layout
- Pide: sorteos, redes sociales, acciones unificadas entre franquicias

MANUAL OPERATIVO ROXANA (CELOG):
- Rol: telemarketer comercial B2B, genera oportunidades comerciales
- KPIs: llamadas realizadas, contactos efectivos, oportunidades generadas, seguimientos concretados
- Proceso: antes del llamado (preparar), durante (escuchar, guiar), después (registrar)
- Tipos de llamada: captación, reactivación, seguimiento

Respondés en español rioplatense, directo y práctico.`;
    await callAI(sys, txt, t => { setMsgs(p => { const u = [...p]; u[u.length - 1] = { role: "assistant", text: t }; return u; }); });
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>🤖 Asistente IA</div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {msgs.map((m, i) => <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}><div style={{ maxWidth: "82%", padding: "11px 15px", borderRadius: 12, fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", background: m.role === "user" ? "#FF6B35" : C.card, border: m.role === "assistant" ? `1px solid ${C.border}` : "none" }}>{m.text || (loading && i === msgs.length - 1 ? <span style={{ color: C.muted }}>✨ Pensando...</span> : "")}</div></div>)}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <input style={{ ...inp, flex: 1 }} placeholder="Preguntá sobre cualquiera de tus empresas..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
        <button onClick={send} disabled={loading || !input.trim()} style={{ ...btn("#FF6B35"), opacity: loading || !input.trim() ? 0.5 : 1 }}>→</button>
      </div>
    </div>
  );
}

const TABS = [
  { id: "dashboard", label: "🏠 Inicio" },
  { id: "empresas", label: "🏢 Empresas" },
  { id: "planes", label: "🎯 Planes" },
  { id: "asistente", label: "🤖 IA" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #FF6B35, #F7B731)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>A</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Altamiranda Gestión</div>
        </div>
        <span style={badge("#9B5DE5")}>✨ IA Activa</span>
      </div>
      <div style={{ background: C.card, display: "flex", gap: 2, padding: "6px 16px", borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? "#FF6B35" : "transparent", color: tab === t.id ? "white" : C.muted, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 700 : 400, whiteSpace: "nowrap" }}>{t.label}</button>)}
      </div>
      <div style={{ padding: "20px", maxWidth: 860, margin: "0 auto" }}>
        {tab === "dashboard" && <Dashboard setTab={setTab} />}
        {tab === "empresas" && <Empresas />}
        {tab === "diagnostico" && <Diagnostico />}
        {tab === "auditoria" && <Auditoria />}
        {tab === "supervision" && <Supervision />}
        {tab === "roxana" && <Roxana />}
        {tab === "manaos" && <Manaos />}
        {tab === "planes" && <Planes />}
        {tab === "asistente" && <Asistente />}
      </div>
    </div>
  );
}
