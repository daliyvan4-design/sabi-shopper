"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "EN_ATTENTE" | "PAYE" | "COMMANDE" | "EXPEDIE" | "LIVRE";

type Item = {
  url: string;
  yuan: number;
  price: number; // FCFA
  qty: number;
  note: string;
};

function normalizePhone(raw: string) {
  return (raw || "").replace(/\D/g, "");
}

function roundYuan(n: number) {
  return Math.round(n * 100) / 100;
}

function roundFcfa(n: number) {
  return Math.round(n);
}

const statusLabel: Record<Status, string> = {
  EN_ATTENTE: "🟡 En attente",
  PAYE: "✅ Payé",
  COMMANDE: "🛒 Commandé",
  EXPEDIE: "🚚 Expédié",
  LIVRE: "📦 Livré",
};

export default function DevisClient({
  id,
  initialUrls,
}: {
  id: string;
  initialUrls: string[];
}) {
  const storageKey = `sabi_devis_${id}`;

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [shipping, setShipping] = useState<number>(0);
  const [rate, setRate] = useState<number>(100);

  // ✅ Paiement & statut
  const [status, setStatus] = useState<Status>("EN_ATTENTE");
  const [waveAmount, setWaveAmount] = useState<number>(0);
  const [waveRef, setWaveRef] = useState<string>("");

  // ✅ Dimensions CBM (cm)
  const [cbmL, setCbmL] = useState<number>(0);
  const [cbmW, setCbmW] = useState<number>(0);
  const [cbmH, setCbmH] = useState<number>(0);

  const [items, setItems] = useState<Item[]>(
    (initialUrls || []).map((u) => ({ url: u, yuan: 0, price: 0, qty: 1, note: "" }))
  );

  // --- Charger sauvegarde (localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (saved?.clientName) setClientName(saved.clientName);
      if (saved?.clientPhone) setClientPhone(saved.clientPhone);
      if (typeof saved?.shipping === "number") setShipping(saved.shipping);
      if (typeof saved?.rate === "number") setRate(saved.rate);

      if (saved?.status) setStatus(saved.status);
      if (typeof saved?.waveAmount === "number") setWaveAmount(saved.waveAmount);
      if (typeof saved?.waveRef === "string") setWaveRef(saved.waveRef);

      // ✅ CBM
      if (typeof saved?.cbmL === "number") setCbmL(saved.cbmL);
      if (typeof saved?.cbmW === "number") setCbmW(saved.cbmW);
      if (typeof saved?.cbmH === "number") setCbmH(saved.cbmH);

      if (Array.isArray(saved?.items)) {
        const byUrl = new Map<string, Item>();
        saved.items.forEach((it: any) => {
          if (it?.url) {
            byUrl.set(it.url, {
              url: it.url,
              yuan: Number(it.yuan) || 0,
              price: Number(it.price) || 0,
              qty: Math.max(1, Number(it.qty) || 1),
              note: String(it.note || ""),
            });
          }
        });

        setItems((prev) => prev.map((p) => byUrl.get(p.url) || p));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- Sauvegarde auto
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          clientName,
          clientPhone,
          shipping,
          rate,
          status,
          waveAmount,
          waveRef,
          cbmL,
          cbmW,
          cbmH,
          items,
        })
      );
    } catch {
      // ignore
    }
  }, [clientName, clientPhone, shipping, rate, status, waveAmount, waveRef, cbmL, cbmW, cbmH, items, storageKey]);

  // Quand le taux change : synchro
  useEffect(() => {
    if (!rate || rate <= 0) return;
    setItems((prev) =>
      prev.map((it) => {
        const hasY = (Number(it.yuan) || 0) > 0;
        const hasF = (Number(it.price) || 0) > 0;

        if (hasY) return { ...it, price: roundFcfa((Number(it.yuan) || 0) * rate) };
        if (hasF) return { ...it, yuan: roundYuan((Number(it.price) || 0) / rate) };
        return it;
      })
    );
  }, [rate]);

  const subtotal = useMemo(() => {
    return items.reduce((s, it) => {
      const p = Number(it.price) || 0;
      const q = Math.max(1, Number(it.qty) || 1);
      return s + p * q;
    }, 0);
  }, [items]);

  const commissionRate = subtotal < 100000 ? 0.15 : 0.1;
  const commission = Math.round(subtotal * commissionRate);
  const total = subtotal + commission + (Number(shipping) || 0);

  const paymentDelta = (Number(waveAmount) || 0) - total;

  // ✅ CBM (m³) à partir de cm
  const cbm = useMemo(() => {
    const L = Math.max(0, Number(cbmL) || 0);
    const W = Math.max(0, Number(cbmW) || 0);
    const H = Math.max(0, Number(cbmH) || 0);
    return (L / 100) * (W / 100) * (H / 100);
  }, [cbmL, cbmW, cbmH]);

  const devisText = useMemo(() => {
    const lines = items.map((it, idx) => {
      const p = Number(it.price) || 0;
      const y = Number(it.yuan) || 0;
      const q = Math.max(1, Number(it.qty) || 1);
      const lineTotal = p * q;
      const note = (it.note || "").trim();

      const yuanInfo = y > 0 ? ` (${y} ¥)` : "";
      return `Article ${idx + 1}: ${p.toLocaleString("fr-FR")} FCFA${yuanInfo} x${q} = ${lineTotal.toLocaleString("fr-FR")} FCFA${note ? ` — ${note}` : ""}`;
    });

    lines.push("");
    lines.push(`Taux: 1 ¥ = ${rate.toLocaleString("fr-FR")} FCFA`);
    if (cbm > 0) lines.push(`CBM: ${cbm.toFixed(4)} m³`);
    lines.push(`Sous-total: ${subtotal.toLocaleString("fr-FR")} FCFA`);
    lines.push(`Commission (${Math.round(commissionRate * 100)}%): ${commission.toLocaleString("fr-FR")} FCFA`);
    lines.push(`Frais (option): ${(Number(shipping) || 0).toLocaleString("fr-FR")} FCFA`);
    lines.push(`TOTAL: ${total.toLocaleString("fr-FR")} FCFA`);
    return lines.join("\n");
  }, [items, rate, cbm, subtotal, commissionRate, commission, shipping, total]);

  function setYuan(idx: number, v: string) {
    const y = Math.max(0, Number(v || 0));
    setItems((prev) =>
      prev.map((x, i) => (i === idx ? { ...x, yuan: roundYuan(y), price: y > 0 ? roundFcfa(y * rate) : 0 } : x))
    );
  }

  function setFcfa(idx: number, v: string) {
    const fcfa = Math.max(0, Number(v || 0));
    setItems((prev) =>
      prev.map((x, i) => (i === idx ? { ...x, price: roundFcfa(fcfa), yuan: fcfa > 0 ? roundYuan(fcfa / rate) : 0 } : x))
    );
  }

  function setQty(idx: number, n: number) {
    const safe = Math.max(1, Math.min(999, Number(n || 1)));
    setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, qty: safe } : x)));
  }

  function incQty(idx: number) {
    setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, qty: Math.min(999, (Number(x.qty) || 1) + 1) } : x)));
  }

  function decQty(idx: number) {
    setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, qty: Math.max(1, (Number(x.qty) || 1) - 1) } : x)));
  }

  function setNote(idx: number, v: string) {
    setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, note: v } : x)));
  }

  async function copyDevis() {
    try {
      await navigator.clipboard.writeText(devisText);
      alert("✅ Copié !");
    } catch {
      alert("❌ Impossible de copier.");
    }
  }

  async function copyCBM() {
    try {
      await navigator.clipboard.writeText(cbm.toFixed(4));
      alert("✅ CBM copié !");
    } catch {
      alert("❌ Impossible de copier.");
    }
  }

  function sendWhatsAppToClient() {
    const phone = normalizePhone(clientPhone);
    if (!phone || phone.length < 8) {
      alert("Ajoute le numéro WhatsApp du client (ex: 2250788655341).");
      return;
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const devisUrl = `${base}/devis/${id}`;

    const msg = `
Bonjour${clientName ? ` ${clientName}` : ""} 👋
Voici ton devis Sabi Personal Shopper Chine.

${devisText}

Statut: ${statusLabel[status]}
Lien du devis :
${devisUrl}

Paiement via Wave ✅
    `.trim();

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  }

  function sendPaymentReminder() {
    const phone = normalizePhone(clientPhone);
    if (!phone || phone.length < 8) {
      alert("Ajoute le numéro WhatsApp du client (ex: 2250788655341).");
      return;
    }

    const msg = `
Bonjour${clientName ? ` ${clientName}` : ""} 👋
Petit rappel pour finaliser ta commande Sabi Personal Shopper Chine.

Montant à payer: ${total.toLocaleString("fr-FR")} FCFA
Paiement via Wave ✅

Dès que c’est payé, envoie-moi la référence Wave.
    `.trim();

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  }

  function QtyStepper({ idx, qty }: { idx: number; qty: number }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button type="button" onClick={() => decQty(idx)} style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid rgba(0,0,0,.18)", background: "#fff", fontSize: 20, fontWeight: 900, cursor: "pointer" }}>–</button>
        <input inputMode="numeric" pattern="[0-9]*" value={qty} onChange={(e) => setQty(idx, Number(e.target.value || 1))} style={{ width: 70, height: 44, textAlign: "center", borderRadius: 12, border: "1px solid rgba(0,0,0,.18)", fontWeight: 900, fontSize: 16 }} />
        <button type="button" onClick={() => incQty(idx)} style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid rgba(0,0,0,.18)", background: "#fff", fontSize: 20, fontWeight: 900, cursor: "pointer" }}>+</button>
      </div>
    );
  }

  function Card({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 16, padding: 12 }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Devis</h1>
          <p style={{ color: "#555", marginTop: 6 }}>Dossier : <b>{id}</b></p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={copyDevis} style={{ padding: "12px 14px", borderRadius: 999, border: "1px solid rgba(0,0,0,.15)", background: "#fff", fontWeight: 900, cursor: "pointer" }}>
            Copier
          </button>
          <button onClick={sendWhatsAppToClient} style={{ padding: "12px 14px", borderRadius: 999, border: "none", background: "#111", color: "white", fontWeight: 900, cursor: "pointer" }}>
            Envoyer au client
          </button>
          <button onClick={sendPaymentReminder} style={{ padding: "12px 14px", borderRadius: 999, border: "1px solid rgba(0,0,0,.15)", background: "#fff", fontWeight: 900, cursor: "pointer" }}>
            Rappel paiement
          </button>
        </div>
      </div>

      {/* Statut / Paiement */}
      <div style={{ marginTop: 12, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Card>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Statut</div>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)", fontWeight: 800 }}>
            <option value="EN_ATTENTE">🟡 En attente</option>
            <option value="PAYE">✅ Payé</option>
            <option value="COMMANDE">🛒 Commandé</option>
            <option value="EXPEDIE">🚚 Expédié</option>
            <option value="LIVRE">📦 Livré</option>
          </select>
        </Card>

        <Card>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Montant reçu (Wave)</div>
          <input type="number" min={0} value={waveAmount} onChange={(e) => setWaveAmount(Number(e.target.value || 0))} placeholder="Ex: 150000" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }} />
          <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
            Différence: <b>{paymentDelta.toLocaleString("fr-FR")} FCFA</b> {paymentDelta === 0 ? "(OK)" : paymentDelta < 0 ? "(reste à payer)" : "(trop-perçu)"}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Référence Wave (option)</div>
          <input value={waveRef} onChange={(e) => setWaveRef(e.target.value)} placeholder="Ex: TXN-..." style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }} />
        </Card>
      </div>

      {/* Paramètres / Client / CBM */}
      <div style={{ marginTop: 12, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Card>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Taux Yuan → FCFA</div>
          <input type="number" min={1} value={rate} onChange={(e) => setRate(Math.max(1, Number(e.target.value || 1)))} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }} />
        </Card>

        <Card>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Nom du client</div>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex: Jojo" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }} />
        </Card>

        <Card>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>WhatsApp du client</div>
          <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="2250788655341" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }} />
        </Card>

        <Card>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Frais (optionnel)</div>
          <input type="number" min={0} value={shipping} onChange={(e) => setShipping(Number(e.target.value || 0))} placeholder="Ex: 5000" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }} />
        </Card>

        {/* ✅ CBM: juste dimensions */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>📦 Dimensions (cm) → CBM</div>
            <button onClick={copyCBM} disabled={cbm <= 0} style={{ padding: "10px 12px", borderRadius: 999, border: "1px solid rgba(0,0,0,.15)", background: "#fff", fontWeight: 900, cursor: cbm > 0 ? "pointer" : "not-allowed" }}>
              Copier CBM
            </button>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <input inputMode="decimal" placeholder="L" value={cbmL} onChange={(e) => setCbmL(Number(e.target.value || 0))} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }} />
            <input inputMode="decimal" placeholder="l" value={cbmW} onChange={(e) => setCbmW(Number(e.target.value || 0))} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }} />
            <input inputMode="decimal" placeholder="h" value={cbmH} onChange={(e) => setCbmH(Number(e.target.value || 0))} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }} />
          </div>

          <div style={{ marginTop: 10, fontWeight: 900 }}>
            CBM : {cbm > 0 ? <span>{cbm.toFixed(4)} m³</span> : <span style={{ color: "#666" }}>—</span>}
          </div>
        </Card>
      </div>

      {/* Articles */}
      <div style={{ marginTop: 16, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {items.map((it, idx) => {
          const q = Math.max(1, Number(it.qty) || 1);
          const p = Number(it.price) || 0;
          const lineTotal = p * q;

          return (
            <div key={it.url} style={{ border: "1px solid #ddd", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt="" style={{ width: "100%", height: 180, objectFit: "cover" }} />
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Article {idx + 1}</div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#666", fontWeight: 800, marginBottom: 6 }}>Prix (¥)</div>
                      <input type="number" min={0} value={it.yuan} onChange={(e) => setYuan(idx, e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,.18)", height: 44 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#666", fontWeight: 800, marginBottom: 6 }}>Prix (FCFA)</div>
                      <input type="number" min={0} value={it.price} onChange={(e) => setFcfa(idx, e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,.18)", height: 44 }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: "#666", fontWeight: 800, marginBottom: 6 }}>Quantité</div>
                    <QtyStepper idx={idx} qty={q} />
                  </div>
                </div>

                <div style={{ marginTop: 10, fontWeight: 900 }}>
                  Total ligne : {lineTotal.toLocaleString("fr-FR")} FCFA
                </div>

                <input value={it.note} onChange={(e) => setNote(idx, e.target.value)} placeholder="Note (taille, couleur, lien 1688...)" style={{ width: "100%", marginTop: 10, padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,.18)", height: 44 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Récap */}
      <div style={{ marginTop: 18, background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 16, padding: 14, lineHeight: 2 }}>
        <div>Statut : <b>{statusLabel[status]}</b></div>
        <div>Taux : <b>1 ¥ = {rate.toLocaleString("fr-FR")} FCFA</b></div>
        {cbm > 0 && <div>CBM : <b>{cbm.toFixed(4)} m³</b></div>}
        <div>Sous-total : <b>{subtotal.toLocaleString("fr-FR")} FCFA</b></div>
        <div>Commission ({Math.round(commissionRate * 100)}%) : <b>{commission.toLocaleString("fr-FR")} FCFA</b></div>
        <div>Frais : <b>{(Number(shipping) || 0).toLocaleString("fr-FR")} FCFA</b></div>
        <div style={{ fontSize: 20 }}>TOTAL : <b>{total.toLocaleString("fr-FR")} FCFA</b></div>
      </div>
    </div>
  );
}
