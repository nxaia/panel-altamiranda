import { useState } from "react";

const CLIENTES = [
  { id: "fabian", nombre: "Fabián Salguero", color: "#FF6B35", initial: "FS" },
  { id: "nestor", nombre: "Néstor Hidalgo", color: "#2EC4B6", initial: "NH" },
];

const EMPRESAS = [
  { id: 1, nombre: "TATITO", clienteId: "fabian", color: "#FF6B35", initial: "TA", rol: "Administración general", tipo: "admin", sucursales: 5, status: "Activo" },
  { id: 2, nombre: "SOL SRL", clienteId: "fabian", color: "#F7B731", initial: "SL", rol: "Auditoría de franquicia", tipo: "auditoria", sucursales: 1, status: "Activo" },
  { id: 3, nombre: "DEPAL SRL", clienteId: "fabian", color: "#E84393", initial: "DP", rol: "Supervisión + Auditoría + Gerentes", tipo: "supervision", sucursales: 1, status: "Activo" },
  { id: 4, nombre: "CELOG", clienteId: "fabian", color: "#9B5DE5", initial: "CL", rol: "Capacitación vendedora mayorista", tipo: "capacitacion", sucursales: 1, status: "Activo" },
  { id: 5, nombre: "MANAOS", clienteId: "nestor", color: "#2EC4B6", initial: "MN", rol: "Aumentar ventas", tipo: "ventas", sucursales: 1, status: "Activo" },
  { id: 6, nombre: "DNH", clienteId: "nestor", color: "#4CC9F0", initial: "DN", rol: "Supervisión y auditoría", tipo: "auditoria", sucursales: 1, status: "Activo" },
];

const CHECKLIST_AUDITORIA = [
  "Revisión de stock y faltantes",
  "Control de fechas de vencimiento",
  "Orden y limpieza del local",
  "Verificación de precios y cartelería",
  "Revisión de caja / facturación",
  "Control de proveedores del día",
  "Estado del equipo de trabajo",
  "Cumplimiento de estándares de franquicia",
];

const CHECKLIST_SUPERVISION = [
  "Reunión con gerente / encargado",
  "Revisión de objetivos del período",
  "Control de proveedores activos",
  "Reordenamiento de áreas críticas",
  "Evaluación del equipo interno",
  "Seguimiento de indicadores clave",
];

const ROXANA_INICIAL = [
  { semana: "Semana 1", llamadas: 42, ventas: 18, monto: 85000 },
  { semana: "Semana 2", llamadas: 48, ventas: 22, monto: 98000 },
  { semana: "Semana 3", llamadas: 51, ventas: 25, monto: 112000 },
];

const C = {
  bg: "#0F1117", card: "#1A1D2E", border: "#2A2D3E", text: "#E8E8F0", muted: "#9CA3AF", dim: "#6B7280"
};
const card = (extra) => ({ background: C.card, borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, ...extra });
const btn = (color, ghost) => ({ background: ghost ? "transparent" : color, color: ghost ? color : "white", border: `1px solid ${color}`, borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 });
const inp = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none" };
const lbl = { fontSize: 11, color: C.muted, marginBottom: 6, display: "block" };
const badge = (color) => ({ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: color + "22", color, border: `1px solid ${color}44`, fontWeight: 600, display: "inline-block" });

async function callAI(system, userMsg, onChunk) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 1000, stream: true,
      system, messages: [{ role: "user", content: userMsg }],
    }),
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
    {loading && !text ? <span style={{ color: C.muted }}>✨ Generando...</span> : text}
    {loading && text && "▌"}
  </div>;
}

function Dashboard({ setTab }) {
  const modulos = [
    { tab: "auditoria", icon: "🔍", title: "Auditoría", desc: "Checklist presencial SOL, DEPAL, DNH", color: "#F7B731" },
    { tab: "supervision", icon: "👁️", title: "Supervisión", desc: "Operativa DEPAL y DNH", color: "#E84393" },
    { tab: "roxana", icon: "📞", title: "Roxana / CELOG", desc: "Seguimiento ventas mayoristas", color: "#9B5DE5" },
    { tab: "manaos", icon: "🚀", title: "Estrategia MANAOS", desc: "Plan de ventas con IA", color: "#2EC4B6" },
    { tab: "planes", icon: "🎯", title: "Planes IA", desc: "Generá planes de operación", color: "#FF6B35" },
    { tab: "asistente", icon: "🤖", title: "Asistente IA", desc: "Consultá cualquier cosa", color: "#4CC9F0" },
  ];
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Buenos días, Ale 👋</div>
        <div style={{ color: C.muted, fontSize: 14 }}>Panel de gestión — 2 clientes · 6 empresas activas</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Clientes", value: "2", icon: "👤", color: "#FF6B35" },
          { label: "Empresas", value: "6", icon: "🏢", color: "#2EC4B6" },
          { label: "Módulos IA", value: "4", icon: "🤖", color: "#9B5DE5" },
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
                  <div>
                    <div style={{ fontWeight: 700 }}>{e.nombre}</div>
                    <span style={badge(e.color)}>{e.tipo}</span>
                  </div>
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

function Auditoria() {
  const empresas = EMPRESAS.filter(e => e.tipo === "auditoria");
  const [empresa, setEmpresa] = useState(empresas[0].id);
  const [checks, setChecks] = useState({});
  const [obs, setObs] = useState("");
  const [saved, setSaved] = useState([]);
  const [aiOut, setAiOut] = useState(""); const [aiLoad, setAiLoad] = useState(false);
  const toggle = (i) => setChecks(p => ({ ...p, [i]: !p[i] }));
  const done = CHECKLIST_AUDITORIA.filter((_, i) => checks[i]).length;
  const pct = Math.round((done / CHECKLIST_AUDITORIA.length) * 100);
  const emp = EMPRESAS.find(e => e.id === Number(empresa));
  const guardar = () => { setSaved(p => [{ id: Date.now(), empresa: emp.nombre, fecha: new Date().toLocaleDateString("es-AR"), pct, obs }, ...p]); setChecks({}); setObs(""); };
  const genResumen = async () => {
    setAiLoad(true); setAiOut("");
    const items = CHECKLIST_AUDITORIA.map((c, i) => `${checks[i] ? "✅" : "❌"} ${c}`).join("\n");
    await callAI(`Sos un consultor de negocios del NOA argentino. Generás resúmenes ejecutivos de auditorías de forma clara y accionable.`, `Empresa: ${emp.nombre}\nAuditoría al ${pct}%\nObservaciones: ${obs || "ninguna"}\n${items}\n\nResumen ejecutivo con puntos críticos y próximos pasos.`, t => setAiOut(t));
    setAiLoad(false);
  };
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>🔍 Auditoría de Franquicia</div>
      <div style={card({ marginBottom: 20 })}>
        <div style={{ marginBottom: 14 }}><span style={lbl}>Empresa</span><select style={sel} value={empresa} onChange={e => { setEmpresa(e.target.value); setChecks({}); }}>{empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: C.bg, borderRadius: 8, height: 8, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: emp ? `linear-gradient(90deg, ${emp.color}, ${emp.color}88)` : "#FF6B35", borderRadius: 8, transition: "width .3s" }} /></div>
          <div style={{ fontSize: 13, fontWeight: 700, color: emp ? emp.color : "#FF6B35" }}>{pct}%</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {CHECKLIST_AUDITORIA.map((item, i) => (
            <div key={i} onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: checks[i] ? (emp ? emp.color + "11" : "#FF6B3511") : C.bg, borderRadius: 8, cursor: "pointer", border: `1px solid ${checks[i] ? (emp ? emp.color + "44" : "#FF6B3544") : C.border}` }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${checks[i] ? (emp ? emp.color : "#FF6B35") : "#4B5563"}`, background: checks[i] ? (emp ? emp.color : "#FF6B35") : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{checks[i] ? "✓" : ""}</div>
              <span style={{ fontSize: 13, color: checks[i] ? C.text : C.muted }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 14 }}><span style={lbl}>Observaciones</span><textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} placeholder="Anotá lo que encontraste..." value={obs} onChange={e => setObs(e.target.value)} /></div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={guardar} style={btn(emp ? emp.color : "#FF6B35")}>💾 Guardar</button>
          <button onClick={genResumen} disabled={aiLoad} style={{ ...btn(emp ? emp.color : "#FF6B35", true), opacity: aiLoad ? 0.5 : 1 }}>✨ Resumen IA</button>
        </div>
        <AIBox text={aiOut} loading={aiLoad} />
      </div>
      {saved.map(s => <div key={s.id} style={card({ marginBottom: 10 })}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700 }}>{s.empresa}</span><span style={badge(s.pct >= 80 ? "#2EC4B6" : "#F7B731")}>{s.pct}%</span></div>{s.obs && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>💬 {s.obs}</div>}</div>)}
    </div>
  );
}

function Supervision() {
  const empresas = [EMPRESAS[2], EMPRESAS[5]];
  const [empresa, setEmpresa] = useState(empresas[0].id);
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
    await callAI(`Sos un consultor de negocios del NOA argentino especializado en supervisión operativa de PyMEs.`, `Empresa: ${emp.nombre}\nSupervisión al ${pct}%\nObservaciones: ${obs || "ninguna"}\n${items}\n\nPlan de acción con próximos pasos prioritarios.`, t => setAiOut(t));
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
  const [semana, setSemana] = useState(""); const [llamadas, setLlamadas] = useState(""); const [ventas, setVentas] = useState(""); const [monto, setMonto] = useState("");
  const [aiOut, setAiOut] = useState(""); const [aiLoad, setAiLoad] = useState(false);
  const agregar = () => { if (!semana || !llamadas) return; setRegistros(p => [...p, { semana, llamadas: Number(llamadas), ventas: Number(ventas), monto: Number(monto) }]); setSemana(""); setLlamadas(""); setVentas(""); setMonto(""); };
  const analizar = async () => {
    setAiLoad(true); setAiOut("");
    const datos = registros.map(r => `${r.semana}: ${r.llamadas} llamadas, ${r.ventas} ventas, $${r.monto.toLocaleString()}`).join("\n");
    await callAI(`Sos un coach de ventas especializado en ventas mayoristas telefónicas para distribuidoras en Argentina.`, `Vendedora: Roxana (CELOG)\nDatos:\n${datos}\n\nAnalizá la evolución y generá recomendaciones concretas para mejorar conversión y volumen.`, t => setAiOut(t));
    setAiLoad(false);
  };
  const ultima = registros[registros.length - 1];
  const anteult = registros[registros.length - 2];
  const convRate = ultima ? Math.round((ultima.ventas / ultima.llamadas) * 100) : 0;
  const trend = ultima && anteult ? ultima.ventas - anteult.ventas : 0;
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>📞 Roxana — CELOG</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Seguimiento de ventas mayoristas</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[{ label: "Llamadas últ. semana", value: ultima ? ultima.llamadas : "-", color: "#9B5DE5" }, { label: "Ventas cerradas", value: ultima ? ultima.ventas : "-", color: "#2EC4B6" }, { label: "Conversión", value: `${convRate}%`, color: trend >= 0 ? "#2EC4B6" : "#FF6B35" }].map((s, i) => <div key={i} style={card()}><div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{s.label}</div></div>)}
      </div>
      <div style={card({ marginBottom: 20 })}>
        <div style={{ fontWeight: 700, marginBottom: 14, color: "#9B5DE5" }}>📊 Historial</div>
        {registros.map((r, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}><span style={{ fontWeight: 600 }}>{r.semana}</span><span style={{ color: C.muted }}>{r.llamadas} 📞</span><span style={{ color: "#2EC4B6" }}>{r.ventas} ventas</span><span style={{ color: C.dim }}>${r.monto.toLocaleString()}</span></div>)}
      </div>
      <div style={card({ marginBottom: 20 })}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>➕ Nueva semana</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 12 }}>
          <div><span style={lbl}>Semana</span><input style={inp} placeholder="Ej: Semana 4" value={semana} onChange={e => setSemana(e.target.value)} /></div>
          <div><span style={lbl}>Llamadas</span><input style={inp} type="number" value={llamadas} onChange={e => setLlamadas(e.target.value)} /></div>
          <div><span style={lbl}>Ventas cerradas</span><input style={inp} type="number" value={ventas} onChange={e => setVentas(e.target.value)} /></div>
          <div><span style={lbl}>Monto ($)</span><input style={inp} type="number" value={monto} onChange={e => setMonto(e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={agregar} style={btn("#9B5DE5")}>💾 Guardar</button>
          <button onClick={analizar} disabled={aiLoad} style={{ ...btn("#9B5DE5", true), opacity: aiLoad ? 0.5 : 1 }}>✨ Analizar IA</button>
        </div>
        <AIBox text={aiOut} loading={aiLoad} />
      </div>
    </div>
  );
}

function Manaos() {
  const [contexto, setContexto] = useState(""); const [aiOut, setAiOut] = useState(""); const [aiLoad, setAiLoad] = useState(false); const [planes, setPlanes] = useState([]);
  const generar = async () => {
    setAiLoad(true); setAiOut("");
    const result = await callAI(`Sos un consultor de ventas especializado en distribución de bebidas en Argentina (NOA). Diseñás estrategias concretas y accionables para PyMEs. Sin buzzwords.`, `Empresa: MANAOS\nObjetivo: Aumentar ventas\nContexto: ${contexto || "no especificado"}\nNo hay estrategia definida.\n\nGenerá estrategia completa: diagnóstico, canales, acciones 30/60/90 días, métricas y recursos.`, t => setAiOut(t));
    setPlanes(p => [{ id: Date.now(), contexto, contenido: result }, ...p]);
    setAiLoad(false);
  };
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>🚀 Estrategia — MANAOS</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Cliente: Néstor Hidalgo · Objetivo: Aumentar ventas</div>
      <div style={card({ marginBottom: 20, borderColor: "#2EC4B644" })}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: "#2EC4B6" }}>✨ Generá una estrategia con IA</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>La IA va a crear un plan desde cero basado en el contexto que le des.</div>
        <span style={lbl}>Contexto actual (opcional)</span>
        <textarea style={{ ...inp, minHeight: 80, resize: "vertical", marginBottom: 14 }} placeholder="Ej: Venden en kioscos del centro, tienen 3 vendedores, no están llegando a barrios periféricos..." value={contexto} onChange={e => setContexto(e.target.value)} />
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
    const result = await callAI(`Sos un consultor de negocios experto en PyMEs del NOA argentino. Generás planes de operación con: Objetivo, Acciones clave (responsable + fecha), Métricas, Alertas de riesgo.`, `Empresa: ${empresa}\nObjetivo: ${objetivo}\nPlazo: ${plazo}\nGenerá el plan completo.`, t => setAiOut(t));
    setPlanes(p => [{ id: Date.now(), empresa, objetivo, plazo, contenido: result }, ...p]); setAiLoad(false);
  };
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>🎯 Planes de Operación</div>
      <div style={card({ marginBottom: 20 })}>
        <div style={{ fontWeight: 700, marginBottom: 14, color: "#FF6B35" }}>✨ Nuevo plan con IA</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><span style={lbl}>Empresa</span><select style={sel} value={empresa} onChange={e => setEmpresa(e.target.value)}>{EMPRESAS.map(e => <option key={e.id}>{e.nombre}</option>)}</select></div>
          <div><span style={lbl}>Plazo</span><select style={sel} value={plazo} onChange={e => setPlazo(e.target.value)}>{["15 días", "30 días", "60 días", "90 días"].map(p => <option key={p}>{p}</option>)}</select></div>
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
  const [msgs, setMsgs] = useState([{ role: "assistant", text: "Hola Ale! Conozco todas tus empresas — TATITO, SOL SRL, DEPAL, CELOG, MANAOS y DNH. Preguntame cualquier cosa 💪" }]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false);
  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim(); setInput("");
    const next = [...msgs, { role: "user", text: txt }, { role: "assistant", text: "" }];
    setMsgs(next); setLoading(true);
    const sys = `Sos el asistente personal de Ale Altamiranda, consultor de negocios del NOA argentino.
Clientes: FABIÁN SALGUERO (TATITO 5 franquicias, SOL SRL auditoría, DEPAL SRL supervisión+auditoría+gerentes, CELOG capacitás a Roxana vendedora mayorista) y NÉSTOR HIDALGO (MANAOS aumentar ventas, DNH supervisión+auditoría 15 productos sin quesos/fiambres).
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
  { id: "dashboard", label: "🏠" },
  { id: "empresas", label: "🏢" },
  { id: "auditoria", label: "🔍" },
  { id: "supervision", label: "👁️" },
  { id: "roxana", label: "📞" },
  { id: "manaos", label: "🚀" },
  { id: "planes", label: "🎯" },
  { id: "asistente", label: "🤖" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #FF6B35, #F7B731)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>A</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Altamiranda Gestión</div>
            <div style={{ fontSize: 10, color: C.dim }}>Fabián Salguero · Néstor Hidalgo</div>
          </div>
        </div>
        <span style={badge("#9B5DE5")}>✨ IA Activa</span>
      </div>
      <div style={{ background: C.card, display: "flex", gap: 2, padding: "6px 16px", borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} title={t.id} style={{ background: tab === t.id ? "#FF6B35" : "transparent", color: tab === t.id ? "white" : C.muted, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 16, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</button>)}
      </div>
      <div style={{ padding: "20px", maxWidth: 860, margin: "0 auto" }}>
        {tab === "dashboard" && <Dashboard setTab={setTab} />}
        {tab === "empresas" && <Empresas />}
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
