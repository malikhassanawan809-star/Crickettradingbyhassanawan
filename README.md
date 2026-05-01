import { useState, useEffect } from "react";

// Initial Balance setting (Sirf pehli baar ke liye)
const INITIAL_BALANCE_DEFAULT = 10000;
const STATUS_COLORS = { active: "#00e5a0", won: "#4fc3f7", lost: "#ff6b6b", void: "#aaa" };

export default function CricketTracker() {
  // 1. DATA RECOVER: Browser ki memory se purana data uthana
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem("bet_balance");
    return saved !== null ? JSON.parse(saved) : INITIAL_BALANCE_DEFAULT;
  });

  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem("bet_trades");
    return saved !== null ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("bet_history");
    return saved !== null ? JSON.parse(saved) : [];
  });

  // 2. DATA SAVE: Jab bhi balance ya trades tabdeel hon, browser mein save kar do
  useEffect(() => {
    localStorage.setItem("bet_balance", JSON.stringify(balance));
    localStorage.setItem("bet_trades", JSON.stringify(trades));
    localStorage.setItem("bet_history", JSON.stringify(history));
  }, [balance, trades, history]);

  const [form, setForm] = useState({ match: "", team: "", stake: "", odds: "", type: "Back" });
  const [liveRate, setLiveRate] = useState("");
  const [tab, setTab] = useState("betting");

  // --- Functions (Deposit/Withdraw/Trade) ---
  const handleDeposit = (amt) => {
    const amount = parseFloat(amt);
    setBalance(prev => prev + amount);
    setHistory([{ id: Date.now(), type: 'Deposit', amount, date: new Date().toLocaleString(), status: 'Success' }, ...history]);
  };

  const handleWithdraw = (amt) => {
    const amount = parseFloat(amt);
    if (amount > balance) return alert("Balance kam hai!");
    setBalance(prev => prev - amount);
    setHistory([{ id: Date.now(), type: 'Withdraw', amount, date: new Date().toLocaleString(), status: 'Success' }, ...history]);
  };

  const handleAddTrade = () => {
    const s = parseFloat(form.stake);
    const o = parseFloat(form.odds);
    if (!s || !o) return;

    const risk = form.type === "Back" ? s : s * (o - 1);
    if (risk > balance) return alert("Balance kam hai!");

    const newTrade = {
      ...form,
      id: Date.now(),
      risk,
      win: form.type === "Back" ? s * (o - 1) : s,
      status: "active"
    };

    setTrades([newTrade, ...trades]);
    setBalance(prev => prev - risk);
    setForm({ ...form, match: "", team: "", stake: "", odds: "" });
  };

  const settleTrade = (id, result) => {
    const t = trades.find(tr => tr.id === id);
    let pnl = result === 'won' ? t.risk + t.win : result === 'void' ? t.risk : 0;
    
    setBalance(prev => prev + pnl);
    setTrades(trades.filter(tr => tr.id !== id));
    setHistory([{ id: Date.now(), type: `Bet ${result}`, amount: pnl - t.risk, date: new Date().toLocaleString(), status: result }, ...history]);
  };

  return (
    <div style={{ background: "#0a0f1e", color: "white", minHeight: "100vh", fontFamily: "sans-serif" }}>
      {/* Top Bar */}
      <div style={{ background: "#16213e", padding: "15px", display: "flex", justifyContent: "space-between", borderBottom: "2px solid #00e5a0" }}>
        <b style={{ color: "#00e5a0" }}>PRO-BET 360 DEMO</b>
        <span>Balance: ₨ {balance.toLocaleString()}</span>
      </div>

      {/* Nav Tabs */}
      <div style={{ display: "flex", background: "#1a1a2e" }}>
        {["betting", "statement", "wallet"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "12px", background: tab === t ? "#00e5a0" : "transparent", color: tab === t ? "#000" : "#fff", border: "none", fontWeight: "bold", textTransform: "uppercase" }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "15px" }}>
        {tab === "betting" && (
          <>
            {/* Input Section */}
            <div style={{ background: "#16213e", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input placeholder="Match" value={form.match} onChange={e => setForm({...form, match: e.target.value})} style={inp} />
                <input placeholder="Team" value={form.team} onChange={e => setForm({...form, team: e.target.value})} style={inp} />
                <input placeholder="Rate" type="number" value={form.odds} onChange={e => setForm({...form, odds: e.target.value})} style={inp} />
                <input placeholder="Stake" type="number" value={form.stake} onChange={e => setForm({...form, stake: e.target.value})} style={inp} />
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inp}>
                  <option value="Back">BACK</option>
                  <option value="Lay">LAY</option>
                </select>
                <button onClick={handleAddTrade} style={{ background: "#00e5a0", border: "none", fontWeight: "bold", borderRadius: "4px" }}>PLACE BET</button>
              </div>
            </div>

            {/* Exit Calc */}
            <input placeholder="⚡ Live Rate for Loss Cut/Book Set" type="number" value={liveRate} onChange={e => setLiveRate(e.target.value)} style={{ ...inp, width: "95%", borderColor: "#00e5a0", marginBottom: "20px" }} />

            {/* Active Bets */}
            {trades.map(t => {
                const lr = parseFloat(liveRate);
                const lc = lr > 1 ? (t.risk / (lr - 1)).toFixed(0) : "0";
                const bs = lr > 1 ? ((t.risk + t.win) / lr).toFixed(0) : "0";
                return (
                  <div key={t.id} style={{ background: "#16213e", padding: "12px", marginBottom: "10px", borderRadius: "5px", borderLeft: `5px solid ${t.type === 'Back' ? '#4fc3f7' : '#ff6b6b'}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span><b>{t.match}</b> ({t.team})</span>
                      <div>
                        <button onClick={() => settleTrade(t.id, 'won')} style={{ background: "#4fc3f7", border: "none", marginRight: "5px", borderRadius: "3px" }}>W</button>
                        <button onClick={() => settleTrade(t.id, 'lost')} style={{ background: "#ff6b6b", border: "none", borderRadius: "3px" }}>L</button>
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "5px", color: "#888" }}>
                      {t.type} @ {t.odds} | Win: <span style={{color: "#00e5a0"}}>+{t.win}</span> | Risk: <span style={{color: "#ff6b6b"}}>-{t.risk}</span>
                    </div>
                    {lr > 1 && (
                      <div style={{ marginTop: "10px", padding: "8px", background: "#0a0f1e", borderRadius: "4px", fontSize: "11px", color: "#00e5a0", border: "1px dashed #333" }}>
                        💡 LOSS CUT: Lay {lc} | BOOK SET: Lay {bs}
                      </div>
                    )}
                  </div>
                );
            })}
          </>
        )}

        {tab === "statement" && (
          <div style={{ background: "#16213e", borderRadius: "8px" }}>
            <table style={{ width: "100%", fontSize: "12px", textAlign: "left" }}>
              <tr style={{ background: "#111" }}><th style={p10}>Date</th><th style={p10}>Details</th><th style={p10}>P/L</th></tr>
              {history.map(h => (
                <tr key={h.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={p10}>{h.date.split(',')[0]}</td>
                  <td style={p10}>{h.type}</td>
                  <td style={{ ...p10, color: h.amount >= 0 ? "#00e5a0" : "#ff6b6b" }}>{h.amount.toFixed(0)}</td>
                </tr>
              ))}
            </table>
          </div>
        )}

        {tab === "wallet" && (
          <div style={{ background: "#16213e", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <p>Current Balance: ₨ {balance.toLocaleString()}</p>
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
               <button onClick={() => { const a = prompt("Deposit Amount?"); if(a) handleDeposit(a); }} style={wBtn}>DEPOSIT</button>
               <button onClick={() => { const a = prompt("Withdraw Amount?"); if(a) handleWithdraw(a); }} style={{ ...wBtn, background: "#ff6b6b" }}>WITHDRAW</button>
            </div>
            <button onClick={() => { if(window.confirm("Poora data clear karein?")) { localStorage.clear(); window.location.reload(); } }} style={{ marginTop: "30px", background: "none", border: "1px solid #444", color: "#444", fontSize: "10px" }}>RESET SYSTEM</button>
          </div>
        )}
      </div>
    </div>
  );
}

const inp = { padding: "10px", background: "#0a0f1e", border: "1px solid #1e2d40", color: "#fff", borderRadius: "4px" };
const p10 = { padding: "10px" };
const wBtn = { flex: 1, padding: "12px", background: "#00e5a0", border: "none", fontWeight: "bold", borderRadius: "5px", cursor: "pointer" };
