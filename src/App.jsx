import { useState, useEffect } from "react";

// ====================================================
// ⚠️ ใส่ URL ของ Google Apps Script ที่นี่
// ====================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz4lbSQ7Fj1ba8IrnsjqXZ9Z6k0VA3drJXGOhI4n9Bur2i5zc2QOphaj5cpu6jJZQB9/exec";

const MILK_PRICE = 20;
const ACCOUNTS = {
  owner: { password: "1234", role: "owner", name: "เจ้าของฟาร์ม", icon: "👑" },
  staff: { password: "0000", role: "staff", name: "พนักงาน", icon: "👷" },
};

// ---- API ----
async function apiGet(action) {
  const res = await fetch(`${SCRIPT_URL}?action=${action}`);
  return res.json();
}
async function apiPost(action, data) {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ action, ...data }),
  });
  return res.json();
}

// ---- SHARED COMPONENTS ----
const MiniBar = ({ value, max, color }) => (
  <div style={{ height: 5, background: "#252525", borderRadius: 3, overflow: "hidden", marginTop: 5 }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: 3, transition: "width .5s" }} />
  </div>
);

const BottomSheet = ({ title, color = "#6fcf6f", onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "flex-end", zIndex: 300 }}>
    <div style={{ background: "#141414", borderRadius: "22px 22px 0 0", width: "100%", padding: 24, maxHeight: "88vh", overflowY: "auto", border: "1px solid #252525", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "Prompt, sans-serif", fontWeight: 700, fontSize: 18, color }}>{title}</div>
        {onClose && <button onClick={onClose} style={{ background: "#222", border: "none", color: "#666", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>}
      </div>
      {children}
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", placeholder = "" }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 5 }}>{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", background: "#1c1c1c", border: "1px solid #2c2c2c", borderRadius: 10, color: "#f0f0f0", padding: "11px 14px", fontFamily: "Sarabun, sans-serif", fontSize: 15, boxSizing: "border-box" }} />
  </div>
);

const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 5 }}>{label}</label>
    <select value={value} onChange={onChange} style={{ width: "100%", background: "#1c1c1c", border: "1px solid #2c2c2c", borderRadius: 10, color: "#f0f0f0", padding: "11px 14px", fontFamily: "Sarabun, sans-serif", fontSize: 15, boxSizing: "border-box" }}>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

const Btn = ({ children, onClick, color = "#6fcf6f", bg = "#1a4a1a", border = "#3a7a3a", full = false, style: s = {} }) => (
  <button onClick={onClick} style={{ background: bg, border: `1px solid ${border}`, color, borderRadius: 12, padding: "13px 18px", cursor: "pointer", fontFamily: "Prompt, sans-serif", fontWeight: 600, fontSize: 14, width: full ? "100%" : undefined, ...s }}>{children}</button>
);

function Header({ user, onLogout, accent }) {
  return (
    <div style={{ background: "#0a0a0a", borderBottom: "1px solid #1a1a1a", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
      <div>
        <div style={{ fontFamily: "Prompt, sans-serif", fontWeight: 700, fontSize: 18, color: "#6fcf6f" }}>🐄 ฟาร์มโคนม</div>
        <div style={{ fontSize: 12, color: accent, marginTop: 1 }}>{user.icon} {user.name}</div>
      </div>
      <button onClick={onLogout} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#666", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontFamily: "Sarabun, sans-serif", fontSize: 13 }}>ออกจากระบบ</button>
    </div>
  );
}

function TabBar({ tabs, active, onChange, accent }) {
  return (
    <div style={{ display: "flex", background: "#0a0a0a", borderBottom: "1px solid #1a1a1a" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: "12px 4px", border: "none", cursor: "pointer",
          background: active === t.id ? "#111" : "transparent",
          color: active === t.id ? accent : "#3a3a3a",
          borderBottom: `2px solid ${active === t.id ? accent : "transparent"}`,
          fontFamily: "Sarabun, sans-serif", fontSize: 12, fontWeight: 600,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        }}>
          <span style={{ fontSize: 18 }}>{t.icon}</span>{t.label}
        </button>
      ))}
    </div>
  );
}

// Loading spinner
const Spinner = ({ color = "#6fcf6f" }) => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 36, height: 36, border: `3px solid #222`, borderTop: `3px solid ${color}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ==============================
// LOGIN
// ==============================
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("staff");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const login = () => {
    setLoading(true);
    setTimeout(() => {
      const acc = ACCOUNTS[role];
      if (acc && acc.password === pass) { onLogin({ username: role, ...acc }); }
      else { setErr("รหัสผ่านไม่ถูกต้อง"); setLoading(false); }
    }, 350);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080f08", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
      <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800&family=Sarabun:wght@300;400;600&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>🐄</div>
        <div style={{ fontFamily: "Prompt, sans-serif", fontSize: 28, fontWeight: 800, color: "#6fcf6f" }}>ฟาร์มโคนม</div>
        <div style={{ color: "#2a4a2a", fontSize: 14, marginTop: 4 }}>ระบบจัดการฟาร์ม · เชื่อมต่อ Google Sheets</div>
      </div>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[
            { key: "owner", icon: "👑", label: "เจ้าของฟาร์ม", accent: "#f4c430", bg: "#1a1400" },
            { key: "staff", icon: "👷", label: "พนักงาน", accent: "#6ab0d4", bg: "#00111a" },
          ].map(r => (
            <button key={r.key} onClick={() => { setRole(r.key); setPass(""); setErr(""); }} style={{
              flex: 1, padding: "18px 10px", cursor: "pointer", textAlign: "center",
              background: role === r.key ? r.bg : "#0f0f0f",
              border: `2px solid ${role === r.key ? r.accent : "#1e1e1e"}`,
              borderRadius: 18,
            }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{r.icon}</div>
              <div style={{ fontFamily: "Prompt, sans-serif", fontWeight: 600, fontSize: 14, color: role === r.key ? r.accent : "#444" }}>{r.label}</div>
            </button>
          ))}
        </div>
        <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 18, padding: 22 }}>
          <Field label="รหัสผ่าน" value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} type="password" placeholder="กรอกรหัสผ่าน" />
          {err && <div style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 12 }}>⚠️ {err}</div>}
          <Btn onClick={login} full color={role === "owner" ? "#f4c430" : "#6ab0d4"} bg={role === "owner" ? "#1a1400" : "#001822"} border={role === "owner" ? "#5a4a00" : "#1a4a6a"}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ →"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ==============================
// STAFF VIEW
// ==============================
function StaffView({ user, cows, setCows, logs, setLogs, onLogout, loading }) {
  const accent = "#6ab0d4";
  const [tab, setTab] = useState("task");
  const [showLog, setShowLog] = useState(false);
  const [showMed, setShowMed] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newLog, setNewLog] = useState({ date: new Date().toISOString().slice(0,10), totalMilk: "", feedCost: "", medicineCost: "", laborCost: "300", molasses: false, note: "" });
  const [medNote, setMedNote] = useState({ medicine: "", medicineDate: new Date().toISOString().slice(0,10) });

  const activeCows = cows.filter(c => c.status === "active");
  const medicineCows = cows.filter(c => c.status === "medicine");
  const today = logs[0];

  const saveLog = async () => {
    if (!newLog.totalMilk) return;
    setSaving(true);
    const revenue = parseFloat(newLog.totalMilk) * MILK_PRICE;
    const log = { ...newLog, totalMilk: +newLog.totalMilk, revenue, feedCost: +newLog.feedCost||0, medicineCost: +newLog.medicineCost||0, laborCost: +newLog.laborCost||300, recordedBy: user.name };
    await apiPost("saveLog", { log });
    setLogs([log, ...logs]);
    setSaving(false);
    setShowLog(false);
    setNewLog({ date: new Date().toISOString().slice(0,10), totalMilk: "", feedCost: "", medicineCost: "", laborCost: "300", molasses: false, note: "" });
  };

  const saveSick = async (cowId) => {
    setSaving(true);
    const updated = cows.map(c => c.id === cowId ? { ...c, status: "medicine", milk: 0, medicine: medNote.medicine||"ไม่ระบุ", medicineDate: medNote.medicineDate } : c);
    await apiPost("saveCows", { cows: updated });
    setCows(updated);
    setSaving(false);
    setShowMed(null);
  };

  const markRecovered = async (cowId) => {
    setSaving(true);
    const updated = cows.map(c => c.id === cowId ? { ...c, status: "active", milk: 8, medicine: null, medicineDate: null } : c);
    await apiPost("saveCows", { cows: updated });
    setCows(updated);
    setSaving(false);
  };

  const staffTabs = [
    { id: "task", icon: "✅", label: "งานวันนี้" },
    { id: "cows", icon: "🐄", label: "วัว" },
    { id: "history", icon: "📋", label: "ประวัติ" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0" }}>
      <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800&family=Sarabun:wght@300;400;600&display=swap" rel="stylesheet" />
      <Header user={user} onLogout={onLogout} accent={accent} />
      <TabBar tabs={staffTabs} active={tab} onChange={setTab} accent={accent} />
      <div style={{ background: "#00111a", borderBottom: "1px solid #001a28", padding: "8px 18px" }}>
        <span style={{ color: "#2a5a7a", fontSize: 12 }}>👷 พนักงาน · ข้อมูลเชื่อมต่อ Google Sheets ☁️</span>
      </div>

      <div style={{ padding: "18px 16px", maxWidth: 700, margin: "0 auto" }}>
        {loading ? <Spinner color={accent} /> : (
          <>
            {tab === "task" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#001822", border: `1px solid ${accent}33`, borderRadius: 18, padding: 20 }}>
                  <div style={{ fontFamily: "Prompt, sans-serif", fontWeight: 700, color: accent, fontSize: 16, marginBottom: 6 }}>🥛 บันทึกนมประจำวัน</div>
                  {today && <div style={{ color: "#2a5a7a", fontSize: 13, marginBottom: 14 }}>ล่าสุด: {today.date} · {today.totalMilk} กก. · โดย {today.recordedBy}</div>}
                  <Btn onClick={() => setShowLog(true)} full color={accent} bg="#001822" border={`${accent}44`}>+ บันทึกนมวันนี้</Btn>
                </div>
                {today && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "นมวันนี้", value: `${today.totalMilk} กก.`, color: accent },
                      { label: "รีดได้", value: `${activeCows.length} ตัว`, color: "#6fcf6f" },
                      { label: "หยุดพัก", value: `${medicineCows.length} ตัว`, color: "#ff8a8a" },
                      { label: "ให้มอล", value: today.molasses ? "✅" : "❌", color: "#f4c430" },
                    ].map(item => (
                      <div key={item.label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "14px 16px" }}>
                        <div style={{ fontSize: 12, color: "#444", marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: item.color, fontFamily: "Prompt, sans-serif" }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {medicineCows.length > 0 && (
                  <div style={{ background: "#180808", border: "1px solid #3a1010", borderRadius: 16, padding: 16 }}>
                    <div style={{ color: "#ff8a8a", fontFamily: "Prompt, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>⚠️ วัวที่ต้องดูแล</div>
                    {medicineCows.map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #2a1010" }}>
                        <div>
                          <div style={{ color: "#eee", fontWeight: 600 }}>{c.name}</div>
                          <div style={{ color: "#cc6666", fontSize: 12 }}>💊 {c.medicine} · {c.medicineDate}</div>
                        </div>
                        <button onClick={() => markRecovered(c.id)} disabled={saving} style={{ background: "#0a2010", border: "1px solid #2a5a2a", color: "#6fcf6f", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>หายแล้ว ✓</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "cows" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cows.map(cow => (
                  <div key={cow.id} style={{ background: cow.status === "medicine" ? "#140808" : "#0d0d0d", border: `1px solid ${cow.status === "medicine" ? "#3a1010" : "#1e1e1e"}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ fontSize: 26, width: 40, textAlign: "center", flexShrink: 0 }}>🐄</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#f0f0f0" }}>{cow.name}</div>
                      {cow.status === "active"
                        ? <><div style={{ color: "#6fcf6f", fontSize: 13, marginTop: 2 }}>🥛 {cow.milk} กก./วัน</div><MiniBar value={cow.milk} max={25} color="#6fcf6f" /></>
                        : <div style={{ color: "#ff8a8a", fontSize: 13, marginTop: 2 }}>💊 {cow.medicine} · {cow.medicineDate}</div>}
                    </div>
                    {cow.status === "active"
                      ? <button onClick={() => { setShowMed(cow.id); setMedNote({ medicine: "", medicineDate: new Date().toISOString().slice(0,10) }); }} style={{ background: "#1a0808", border: "1px solid #4a1010", color: "#ff8a8a", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, flexShrink: 0 }}>แจ้งป่วย</button>
                      : <button onClick={() => markRecovered(cow.id)} disabled={saving} style={{ background: "#0a2010", border: "1px solid #2a5a2a", color: "#6fcf6f", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, flexShrink: 0 }}>หายแล้ว</button>}
                  </div>
                ))}
              </div>
            )}

            {tab === "history" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {logs.map((log, i) => (
                  <div key={i} style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 14, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#ddd" }}>{log.date}</div>
                        <div style={{ fontSize: 12, color: "#2a2a2a", marginTop: 2 }}>โดย {log.recordedBy}{log.molasses ? " · 🌾" : ""}</div>
                      </div>
                      <div style={{ color: accent, fontWeight: 700, fontSize: 20, fontFamily: "Prompt, sans-serif" }}>{log.totalMilk} กก.</div>
                    </div>
                    {log.note && <div style={{ color: "#444", fontSize: 12, marginTop: 8 }}>📝 {log.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showLog && (
        <BottomSheet title="🥛 บันทึกนมประจำวัน" color={accent} onClose={() => setShowLog(false)}>
          <Field label="วันที่" value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} type="date" />
          <Field label="ปริมาณนมรวม (กก.)" value={newLog.totalMilk} onChange={e => setNewLog({ ...newLog, totalMilk: e.target.value })} type="number" placeholder="เช่น 73" />
          <Field label="ค่าอาหารสัตว์ (บาท)" value={newLog.feedCost} onChange={e => setNewLog({ ...newLog, feedCost: e.target.value })} type="number" />
          <Field label="ค่ายา (บาท)" value={newLog.medicineCost} onChange={e => setNewLog({ ...newLog, medicineCost: e.target.value })} type="number" />
          <Field label="ค่าแรง (บาท)" value={newLog.laborCost} onChange={e => setNewLog({ ...newLog, laborCost: e.target.value })} type="number" />
          <Field label="หมายเหตุ" value={newLog.note} onChange={e => setNewLog({ ...newLog, note: e.target.value })} placeholder="สิ่งผิดปกติวันนี้" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="mol_s" checked={newLog.molasses} onChange={e => setNewLog({ ...newLog, molasses: e.target.checked })} />
            <label htmlFor="mol_s" style={{ color: "#a8d86e", fontSize: 14 }}>🌾 วันนี้ให้มอล</label>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setShowLog(false)} color="#666" bg="#1a1a1a" border="#2a2a2a" style={{ flex: 1 }}>ยกเลิก</Btn>
            <Btn onClick={saveLog} color={accent} bg="#001822" border={`${accent}66`} style={{ flex: 2 }} disabled={saving}>{saving ? "กำลังบันทึก..." : "💾 บันทึก"}</Btn>
          </div>
        </BottomSheet>
      )}

      {showMed && (
        <BottomSheet title="🚨 แจ้งวัวป่วย" color="#ff8a8a" onClose={() => setShowMed(null)}>
          <div style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>{cows.find(c => c.id === showMed)?.name}</div>
          <Field label="ชื่อยาที่ใช้" value={medNote.medicine} onChange={e => setMedNote({ ...medNote, medicine: e.target.value })} placeholder="เช่น ยาปฏิชีวนะ" />
          <Field label="วันที่เริ่มฉีดยา" value={medNote.medicineDate} onChange={e => setMedNote({ ...medNote, medicineDate: e.target.value })} type="date" />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setShowMed(null)} color="#666" bg="#1a1a1a" border="#2a2a2a" style={{ flex: 1 }}>ยกเลิก</Btn>
            <Btn onClick={() => saveSick(showMed)} color="#ff8a8a" bg="#1a0808" border="#5a2020" style={{ flex: 2 }} disabled={saving}>{saving ? "กำลังบันทึก..." : "🚨 แจ้งป่วย"}</Btn>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

// ==============================
// OWNER VIEW
// ==============================
function OwnerView({ user, cows, setCows, logs, setLogs, onLogout, loading }) {
  const accent = "#f4c430";
  const [tab, setTab] = useState("dashboard");
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddCow, setShowAddCow] = useState(false);
  const [showEditCow, setShowEditCow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newLog, setNewLog] = useState({ date: new Date().toISOString().slice(0,10), totalMilk: "", feedCost: "", medicineCost: "", laborCost: "300", molasses: false, note: "" });
  const [newCow, setNewCow] = useState({ name: "", status: "active", milk: "", medicine: "", medicineDate: "" });
  const [editCow, setEditCow] = useState(null);

  const activeCows = cows.filter(c => c.status === "active");
  const medicineCows = cows.filter(c => c.status === "medicine");
  const today = logs[0];
  const week = logs.slice(0, 7);
  const totalRev = week.reduce((s, l) => s + l.revenue, 0);
  const totalCost = week.reduce((s, l) => s + l.feedCost + l.medicineCost + l.laborCost, 0);
  const profit = totalRev - totalCost;
  const avgMilk = activeCows.length ? (activeCows.reduce((s, c) => s + c.milk, 0) / activeCows.length).toFixed(1) : 0;

  const saveLog = async () => {
    if (!newLog.totalMilk) return;
    setSaving(true);
    const revenue = parseFloat(newLog.totalMilk) * MILK_PRICE;
    const log = { ...newLog, totalMilk: +newLog.totalMilk, revenue, feedCost: +newLog.feedCost||0, medicineCost: +newLog.medicineCost||0, laborCost: +newLog.laborCost||300, recordedBy: user.name };
    await apiPost("saveLog", { log });
    setLogs([log, ...logs]);
    setSaving(false);
    setShowAddLog(false);
  };

  const addCow = async () => {
    if (!newCow.name) return;
    setSaving(true);
    const id = cows.length ? Math.max(...cows.map(c => c.id)) + 1 : 1;
    const updated = [...cows, { ...newCow, id, milk: +newCow.milk || 0 }];
    await apiPost("saveCows", { cows: updated });
    setCows(updated);
    setSaving(false);
    setShowAddCow(false);
    setNewCow({ name: "", status: "active", milk: "", medicine: "", medicineDate: "" });
  };

  const saveCow = async () => {
    setSaving(true);
    const updated = cows.map(c => c.id === editCow.id ? editCow : c);
    await apiPost("saveCows", { cows: updated });
    setCows(updated);
    setSaving(false);
    setShowEditCow(null);
  };

  const deleteCow = async (id) => {
    if (!window.confirm("ลบวัวตัวนี้?")) return;
    setSaving(true);
    const updated = cows.filter(c => c.id !== id);
    await apiPost("saveCows", { cows: updated });
    setCows(updated);
    setSaving(false);
  };

  const ownerTabs = [
    { id: "dashboard", icon: "📊", label: "ภาพรวม" },
    { id: "cows", icon: "🐄", label: "วัว" },
    { id: "logs", icon: "🥛", label: "บันทึก" },
    { id: "finance", icon: "💰", label: "การเงิน" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0" }}>
      <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800&family=Sarabun:wght@300;400;600&display=swap" rel="stylesheet" />
      <Header user={user} onLogout={onLogout} accent={accent} />
      <TabBar tabs={ownerTabs} active={tab} onChange={setTab} accent={accent} />
      <div style={{ background: "#100e00", borderBottom: "1px solid #201a00", padding: "8px 18px" }}>
        <span style={{ color: "#5a4a00", fontSize: 12 }}>👑 เจ้าของ · ข้อมูลเชื่อมต่อ Google Sheets ☁️</span>
      </div>

      <div style={{ padding: "18px 16px", maxWidth: 700, margin: "0 auto" }}>
        {loading ? <Spinner color={accent} /> : (
          <>
            {tab === "dashboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { icon: "🥛", label: "นมวันนี้", value: `${today?.totalMilk || 0} กก.`, color: "#6fcf6f" },
                    { icon: "💵", label: "รายได้วันนี้", value: `฿${(today?.revenue || 0).toLocaleString()}`, color: accent },
                    { icon: "🐄", label: "รีดได้", value: `${activeCows.length} ตัว`, sub: `หยุดพัก ${medicineCows.length} ตัว`, color: "#6fcf6f" },
                    { icon: "📈", label: "เฉลี่ย/ตัว", value: `${avgMilk} กก.`, sub: "เป้า 15–25 กก.", color: accent },
                  ].map(c => (
                    <div key={c.label} style={{ background: "#0d0d0d", border: `1px solid ${c.color}22`, borderRadius: 16, padding: "18px 16px" }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                      <div style={{ color: "#444", fontSize: 12 }}>{c.label}</div>
                      <div style={{ color: c.color, fontSize: 24, fontWeight: 700, fontFamily: "Prompt, sans-serif", lineHeight: 1.1, marginTop: 4 }}>{c.value}</div>
                      {c.sub && <div style={{ color: "#2a2a2a", fontSize: 11, marginTop: 4 }}>{c.sub}</div>}
                    </div>
                  ))}
                </div>
                <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 18, padding: 20 }}>
                  <div style={{ color: "#333", fontSize: 13, fontFamily: "Prompt, sans-serif", fontWeight: 600, marginBottom: 16 }}>📅 สรุป 7 วัน</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { l: "รายได้", v: `฿${totalRev.toLocaleString()}`, c: "#6fcf6f" },
                      { l: "ต้นทุน", v: `฿${totalCost.toLocaleString()}`, c: "#ff6b6b" },
                      { l: "กำไร", v: `฿${profit.toLocaleString()}`, c: profit >= 0 ? accent : "#ff6b6b" },
                    ].map(item => (
                      <div key={item.l} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#2a2a2a", marginBottom: 4 }}>{item.l}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: item.c, fontFamily: "Prompt, sans-serif" }}>{item.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {medicineCows.length > 0 && (
                  <div style={{ background: "#140808", border: "1px solid #3a1010", borderRadius: 16, padding: 16 }}>
                    <div style={{ color: "#ff8a8a", fontFamily: "Prompt, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>⚠️ วัวหยุดพัก {medicineCows.length} ตัว</div>
                    {medicineCows.map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #2a1010" }}>
                        <span style={{ color: "#ccc" }}>{c.name}</span>
                        <span style={{ color: "#cc6666", fontSize: 12 }}>{c.medicine} · {c.medicineDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "cows" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Btn onClick={() => setShowAddCow(true)} full color={accent} bg="#1a1400" border="#5a4a00">+ เพิ่มวัวใหม่</Btn>
                {cows.map(cow => (
                  <div key={cow.id} style={{ background: cow.status === "medicine" ? "#140808" : "#0d0d0d", border: `1px solid ${cow.status === "medicine" ? "#3a1010" : "#1e1e1e"}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 24, width: 38, textAlign: "center", flexShrink: 0 }}>🐄</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#f0f0f0" }}>{cow.name}</div>
                      {cow.status === "active"
                        ? <><div style={{ color: "#6fcf6f", fontSize: 13, marginTop: 2 }}>🥛 {cow.milk} กก./วัน</div><MiniBar value={cow.milk} max={25} color="#6fcf6f" /></>
                        : <div style={{ color: "#ff8a8a", fontSize: 13, marginTop: 2 }}>💊 {cow.medicine} · {cow.medicineDate}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setShowEditCow(cow.id); setEditCow({ ...cow }); }} style={{ background: "#1a1400", border: `1px solid ${accent}44`, color: accent, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>แก้ไข</button>
                      <button onClick={() => deleteCow(cow.id)} style={{ background: "#1a0808", border: "1px solid #4a1010", color: "#ff6b6b", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "logs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Btn onClick={() => setShowAddLog(true)} full color={accent} bg="#1a1400" border="#5a4a00">+ บันทึกข้อมูล</Btn>
                {logs.map((log, i) => {
                  const cost = log.feedCost + log.medicineCost + log.laborCost;
                  const p = log.revenue - cost;
                  return (
                    <div key={i} style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 14, padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#ddd" }}>{log.date}</div>
                          <div style={{ fontSize: 11, color: "#2a2a2a", marginTop: 2 }}>โดย {log.recordedBy}{log.molasses ? " · 🌾" : ""}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: accent, fontWeight: 700, fontSize: 18, fontFamily: "Prompt, sans-serif" }}>{log.totalMilk} กก.</div>
                          <div style={{ fontSize: 12, color: "#6fcf6f" }}>฿{log.revenue.toLocaleString()}</div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginTop: 10 }}>
                        {[["อาหาร", log.feedCost, "#555"], ["ยา", log.medicineCost, "#ff8a8a"], ["แรง", log.laborCost, "#555"], ["กำไร", p, p >= 0 ? "#6fcf6f" : "#ff6b6b"]].map(([l, v, col]) => (
                          <div key={l} style={{ background: "#141414", borderRadius: 8, padding: "7px 4px", textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "#2a2a2a" }}>{l}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: col, fontFamily: "Prompt, sans-serif" }}>฿{v}</div>
                          </div>
                        ))}
                      </div>
                      {log.note && <div style={{ color: "#2a2a2a", fontSize: 12, marginTop: 8 }}>📝 {log.note}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "finance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 18, padding: 20 }}>
                  <div style={{ color: "#333", fontFamily: "Prompt, sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>💰 สรุปการเงิน 7 วัน</div>
                  {[
                    { l: "รายได้จากนม", v: totalRev, c: "#6fcf6f", icon: "🥛" },
                    { l: "ค่าอาหารสัตว์", v: -week.reduce((s, l) => s + l.feedCost, 0), c: "#ff6b6b", icon: "🌾" },
                    { l: "ค่ายา/สัตวแพทย์", v: -week.reduce((s, l) => s + l.medicineCost, 0), c: "#ff6b6b", icon: "💊" },
                    { l: "ค่าแรงงาน", v: -week.reduce((s, l) => s + l.laborCost, 0), c: "#ff6b6b", icon: "👷" },
                  ].map(item => (
                    <div key={item.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#111", borderRadius: 10, marginBottom: 8 }}>
                      <span style={{ color: "#666", fontSize: 14 }}>{item.icon} {item.l}</span>
                      <span style={{ color: item.c, fontWeight: 700, fontFamily: "Prompt, sans-serif", fontSize: 16 }}>
                        {item.v >= 0 ? "+" : ""}฿{Math.abs(item.v).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: "#1e1e1e", margin: "8px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: profit >= 0 ? "#0e1e0e" : "#1e0e0e", borderRadius: 12, border: `1px solid ${profit >= 0 ? "#2a4a2a" : "#4a2a2a"}` }}>
                    <span style={{ color: "#eee", fontWeight: 700, fontFamily: "Prompt, sans-serif" }}>กำไรสุทธิ 7 วัน</span>
                    <span style={{ color: profit >= 0 ? "#6fcf6f" : "#ff6b6b", fontWeight: 800, fontFamily: "Prompt, sans-serif", fontSize: 22 }}>฿{profit.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ background: "#080e18", border: "1px solid #0e1e30", borderRadius: 18, padding: 20 }}>
                  <div style={{ color: "#1a3a5a", fontFamily: "Prompt, sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>📈 คาดการณ์รายได้</div>
                  {[
                    { l: "ปัจจุบัน", milk: today?.totalMilk || 73, c: "#444" },
                    { l: "หลังให้มอล (+15%)", milk: Math.round((today?.totalMilk || 73) * 1.15), c: accent },
                    { l: "วัวครบ 13 ตัว", milk: 110, c: "#6fcf6f" },
                  ].map(item => (
                    <div key={item.l} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "#555" }}>{item.l}</span>
                        <span style={{ color: item.c, fontWeight: 700, fontFamily: "Prompt, sans-serif" }}>฿{(item.milk * MILK_PRICE * 30).toLocaleString()}/เดือน</span>
                      </div>
                      <MiniBar value={item.milk} max={130} color={item.c} />
                      <div style={{ fontSize: 11, color: "#222", marginTop: 3 }}>{item.milk} กก./วัน</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAddLog && (
        <BottomSheet title="🥛 บันทึกข้อมูลประจำวัน" color={accent} onClose={() => setShowAddLog(false)}>
          <Field label="วันที่" value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} type="date" />
          <Field label="ปริมาณนมรวม (กก.)" value={newLog.totalMilk} onChange={e => setNewLog({ ...newLog, totalMilk: e.target.value })} type="number" />
          <Field label="ค่าอาหารสัตว์ (บาท)" value={newLog.feedCost} onChange={e => setNewLog({ ...newLog, feedCost: e.target.value })} type="number" />
          <Field label="ค่ายา (บาท)" value={newLog.medicineCost} onChange={e => setNewLog({ ...newLog, medicineCost: e.target.value })} type="number" />
          <Field label="ค่าแรง (บาท)" value={newLog.laborCost} onChange={e => setNewLog({ ...newLog, laborCost: e.target.value })} type="number" />
          <Field label="หมายเหตุ" value={newLog.note} onChange={e => setNewLog({ ...newLog, note: e.target.value })} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="mol_o" checked={newLog.molasses} onChange={e => setNewLog({ ...newLog, molasses: e.target.checked })} />
            <label htmlFor="mol_o" style={{ color: "#a8d86e", fontSize: 14 }}>🌾 วันนี้ให้มอล</label>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setShowAddLog(false)} color="#666" bg="#1a1a1a" border="#2a2a2a" style={{ flex: 1 }}>ยกเลิก</Btn>
            <Btn onClick={saveLog} color={accent} bg="#1a1400" border="#5a4a00" style={{ flex: 2 }} disabled={saving}>{saving ? "กำลังบันทึก..." : "💾 บันทึก"}</Btn>
          </div>
        </BottomSheet>
      )}

      {showAddCow && (
        <BottomSheet title="🐄 เพิ่มวัวใหม่" color={accent} onClose={() => setShowAddCow(false)}>
          <Field label="ชื่อวัว" value={newCow.name} onChange={e => setNewCow({ ...newCow, name: e.target.value })} placeholder="เช่น วัวหมายเลข 14" />
          <Sel label="สถานะ" value={newCow.status} onChange={e => setNewCow({ ...newCow, status: e.target.value })} options={[{ v: "active", l: "รีดนมได้ปกติ" }, { v: "medicine", l: "หยุดพัก (ฉีดยา)" }]} />
          {newCow.status === "active" && <Field label="ปริมาณนม (กก./วัน)" value={newCow.milk} onChange={e => setNewCow({ ...newCow, milk: e.target.value })} type="number" />}
          {newCow.status === "medicine" && <>
            <Field label="ชื่อยา" value={newCow.medicine} onChange={e => setNewCow({ ...newCow, medicine: e.target.value })} />
            <Field label="วันที่เริ่มฉีดยา" value={newCow.medicineDate} onChange={e => setNewCow({ ...newCow, medicineDate: e.target.value })} type="date" />
          </>}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={() => setShowAddCow(false)} color="#666" bg="#1a1a1a" border="#2a2a2a" style={{ flex: 1 }}>ยกเลิก</Btn>
            <Btn onClick={addCow} color={accent} bg="#1a1400" border="#5a4a00" style={{ flex: 2 }} disabled={saving}>{saving ? "กำลังบันทึก..." : "➕ เพิ่มวัว"}</Btn>
          </div>
        </BottomSheet>
      )}

      {showEditCow && editCow && (
        <BottomSheet title="🐄 แก้ไขข้อมูลวัว" color={accent} onClose={() => setShowEditCow(null)}>
          <Field label="ชื่อวัว" value={editCow.name} onChange={e => setEditCow({ ...editCow, name: e.target.value })} />
          <Sel label="สถานะ" value={editCow.status} onChange={e => setEditCow({ ...editCow, status: e.target.value })} options={[{ v: "active", l: "รีดนมได้ปกติ" }, { v: "medicine", l: "หยุดพัก (ฉีดยา)" }]} />
          {editCow.status === "active" && <Field label="ปริมาณนม (กก./วัน)" value={editCow.milk} onChange={e => setEditCow({ ...editCow, milk: +e.target.value })} type="number" />}
          {editCow.status === "medicine" && <>
            <Field label="ชื่อยาที่ใช้" value={editCow.medicine || ""} onChange={e => setEditCow({ ...editCow, medicine: e.target.value })} />
            <Field label="วันที่เริ่มฉีดยา" value={editCow.medicineDate || ""} onChange={e => setEditCow({ ...editCow, medicineDate: e.target.value })} type="date" />
          </>}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={() => setShowEditCow(null)} color="#666" bg="#1a1a1a" border="#2a2a2a" style={{ flex: 1 }}>ยกเลิก</Btn>
            <Btn onClick={saveCow} color={accent} bg="#1a1400" border="#5a4a00" style={{ flex: 2 }} disabled={saving}>{saving ? "กำลังบันทึก..." : "💾 บันทึก"}</Btn>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

// ==============================
// MAIN
// ==============================
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [cows, setCows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      Promise.all([apiGet("getCows"), apiGet("getLogs")])
        .then(([c, l]) => { setCows(c); setLogs(l); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [currentUser]);

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  const props = { user: currentUser, cows, setCows, logs, setLogs, onLogout: () => { setCurrentUser(null); setCows([]); setLogs([]); }, loading };
  return currentUser.role === "owner" ? <OwnerView {...props} /> : <StaffView {...props} />;
}
