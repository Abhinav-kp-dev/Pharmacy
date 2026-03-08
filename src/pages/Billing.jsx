import { useState } from "react";
import { makeStyles, getTheme, ACCENT, WARNING, SUCCESS } from "../theme.js";
import { useToast } from "../components/Toast.jsx";
import { downloadPDF } from "../utils/pdfGenerator.js";
import { API_URL } from "../config.js";

export default function Billing({ darkMode, medicines, patients, onRefresh }) {
    const toast = useToast();
    const theme = getTheme(darkMode);
    const cs = makeStyles(theme, darkMode);

    const [cart, setCart] = useState([]);
    const [searchMed, setSearchMed] = useState("");
    const [patientSearch, setPatientSearch] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientDrop, setShowPatientDrop] = useState(false);
    const [discount, setDiscount] = useState("");
    const [applyGST, setApplyGST] = useState(false);
    const [payMethod, setPayMethod] = useState("Cash");
    const [notes, setNotes] = useState("");
    const [prescriptionFile, setPrescriptionFile] = useState(null);
    const [saving, setSaving] = useState(false);

    const billMeds = medicines.filter(m => searchMed.length > 0 && m.name.toLowerCase().includes(searchMed.toLowerCase()) && m.qty > 0);
    const filteredPat = patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()));

    const subtotal = cart.reduce((s, i) => s + i.price * i.cartQty, 0);
    const discountAmt = Math.min(parseFloat(discount) || 0, subtotal);
    const taxAmt = applyGST ? (subtotal - discountAmt) * 0.12 : 0;
    const total = subtotal - discountAmt + taxAmt;

    function addToCart(med) {
        setCart(prev => {
            const ex = prev.find(i => i.id === med.id);
            if (ex) {
                if (ex.cartQty >= med.qty) { toast("Stock limit reached", "warning"); return prev; }
                return prev.map(i => i.id === med.id ? { ...i, cartQty: i.cartQty + 1 } : i);
            }
            return [...prev, { ...med, cartQty: 1 }];
        });
        setSearchMed("");
    }

    function changeQty(id, delta) {
        setCart(prev => prev.map(i => {
            if (i.id !== id) return i;
            const nq = i.cartQty + delta;
            if (nq <= 0) return null;
            if (nq > i.qty) return i;
            return { ...i, cartQty: nq };
        }).filter(Boolean));
    }

    async function generateBill() {
        if (!cart.length) { toast("Add medicines to cart", "warning"); return; }
        if (!selectedPatient && !patientSearch) { toast("Enter patient name", "warning"); return; }
        setSaving(true);
        try {
            let prescription_url = null;
            if (prescriptionFile) {
                const fd = new FormData();
                fd.append("prescription", prescriptionFile);
                const up = await fetch(`${API_URL}/upload-prescription`, { method: "POST", body: fd });
                if (up.ok) {
                    const upData = await up.json();
                    prescription_url = upData.url;
                } else {
                    toast("Failed to upload prescription", "warning");
                }
            }

            const r = await fetch(`${API_URL}/sales`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patientId: selectedPatient?.id || patientSearch,
                    items: cart, discount: discountAmt, tax: taxAmt, paymentMethod: payMethod, notes, prescription_url
                })
            });
            if (r.ok) {
                const d = await r.json();
                const billData = { items: [...cart], patient: selectedPatient?.name || patientSearch, subtotal, discountAmt, taxAmt, total, id: d.invoice_id, date: new Date().toLocaleString(), payMethod };
                downloadPDF(billData);

                setCart([]); setSelectedPatient(null); setPatientSearch(""); setDiscount(""); setApplyGST(false); setNotes(""); setPrescriptionFile(null);
                onRefresh();
                toast("Bill generated & Invoice downloading!");
            } else {
                const e = await r.json(); toast(e.error || "Billing failed", "error");
            }
        } catch (err) {
            console.error("Billing error:", err);
            toast("Error generating bill", "error");
        }
        setSaving(false);
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ ...cs.sectionTitle(24), display: "flex", alignItems: "center", gap: 12 }}>
                    Sales & Billing
                </h2>
                <p style={{ color: theme.muted, margin: "8px 0 0", fontSize: 14, fontWeight: 500 }}>
                    Point of Sale Terminal • Create invoices and process transactions
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}>
                {/* Left — medicine search */}
                <div style={cs.card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.text }}>Search Medicines</h3>
                        <span style={{ 
                            padding: "6px 12px", background: `${SUCCESS}15`, borderRadius: 20,
                            fontSize: 11, fontWeight: 600, color: SUCCESS
                        }}>{medicines.filter(m => m.qty > 0).length} in stock</span>
                    </div>
                    <div style={{ position: "relative", marginBottom: 20 }}>
                        <input placeholder="Type medicine name to search..." style={{ ...cs.input, paddingLeft: 42 }} value={searchMed} onChange={e => setSearchMed(e.target.value)} />
                        {billMeds.length > 0 && (
                            <div style={{ 
                                position: "absolute", top: "100%", left: 0, right: 0, 
                                border: `1px solid ${theme.border}`, borderRadius: 12, 
                                background: theme.card, zIndex: 50, maxHeight: 320, 
                                overflowY: "auto", boxShadow: theme.shadowLg, marginTop: 6 
                            }}>
                                {billMeds.slice(0, 10).map(m => (
                                    <div key={m.id} onClick={() => addToCart(m)} style={{ 
                                        padding: "14px 16px", cursor: "pointer", 
                                        display: "flex", justifyContent: "space-between", alignItems: "center", 
                                        borderBottom: `1px solid ${theme.border}`, transition: "background 0.15s" 
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = theme.accentSoft}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{m.name}</div>
                                            <div style={{ fontSize: 12, color: theme.muted }}>
                                                <span style={{ 
                                                    padding: "2px 8px", borderRadius: 12, 
                                                    background: `${ACCENT}15`, color: ACCENT, 
                                                    fontSize: 10, fontWeight: 600, marginRight: 8 
                                                }}>{m.category}</span>
                                                Stock: <span style={{ fontWeight: 600, color: m.qty < 15 ? WARNING : SUCCESS }}>{m.qty}</span>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: ACCENT, fontSize: 16 }}>₹{m.price}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", marginBottom: 12, letterSpacing: "0.08em" }}>Quick Add</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                            {medicines.filter(m => m.qty > 0).slice(0, 12).map(m => (
                                <button key={m.id} onClick={() => addToCart(m)} className="btn-hover" style={{ 
                                    ...cs.btn("secondary"), padding: "8px 14px", fontSize: 12,
                                    border: `1px solid ${theme.border}`, borderRadius: 10
                                }}>{m.name.split(" ")[0]}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right — cart */}
                <div style={cs.card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.text }}>Cart</h3>
                        {cart.length > 0 && (
                            <span style={{ 
                                padding: "6px 14px", background: `${ACCENT}15`, borderRadius: 20,
                                fontSize: 12, fontWeight: 700, color: ACCENT
                            }}>{cart.length} items</span>
                        )}
                    </div>

                    {/* Patient */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={cs.label}>Patient</label>
                        <div style={{ position: "relative" }}>
                            <input placeholder="Search or enter patient name…" style={{ ...cs.input, paddingLeft: 14 }} value={patientSearch}
                                onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null); setShowPatientDrop(true); }}
                                onFocus={() => setShowPatientDrop(true)} onBlur={() => setTimeout(() => setShowPatientDrop(false), 200)} />
                            {showPatientDrop && patientSearch.length > 0 && filteredPat.length > 0 && (
                                <div style={{ 
                                    position: "absolute", top: "100%", left: 0, right: 0, 
                                    border: `1px solid ${theme.border}`, borderRadius: 10, 
                                    background: theme.card, zIndex: 50, maxHeight: 200, 
                                    overflowY: "auto", boxShadow: theme.shadowLg, marginTop: 4 
                                }}>
                                    {filteredPat.slice(0, 5).map(p => (
                                        <div key={p.id} onClick={() => { setSelectedPatient(p); setPatientSearch(p.name); setShowPatientDrop(false); }}
                                            style={{ 
                                                padding: "12px 14px", cursor: "pointer", 
                                                display: "flex", justifyContent: "space-between", 
                                                borderBottom: `1px solid ${theme.border}`, fontSize: 13, 
                                                transition: "background 0.15s" 
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = theme.accentSoft}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                                            <span style={{ color: theme.muted, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{p.patient_id}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart items */}
                    <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 16 }}>
                        {cart.length === 0 ? (
                            <div style={{ 
                                color: theme.muted, fontSize: 13, textAlign: "center", 
                                padding: "32px 20px", background: theme.bgSubtle, 
                                borderRadius: 12, border: `1px dashed ${theme.border}` 
                            }}>
                                <span style={{ fontSize: 32, display: "block", marginBottom: 12, opacity: 0.5 }}></span>
                                Cart is empty. Search for medicines above.
                            </div>
                        ) :
                            cart.map(i => (
                                <div key={i.id} style={{ 
                                    display: "flex", alignItems: "center", gap: 12, marginBottom: 10, 
                                    padding: "12px 14px", background: theme.accentSoft, 
                                    borderRadius: 12, border: `1px solid ${theme.border}` 
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{i.name}</div>
                                        <div style={{ fontSize: 12, color: theme.muted }}>
                                            ₹{i.price} × {i.cartQty} = <strong style={{ color: ACCENT }}>₹{(i.price * i.cartQty).toFixed(2)}</strong>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        <button onClick={() => changeQty(i.id, -1)} style={{ 
                                            ...cs.btn("secondary"), padding: "4px 10px", fontSize: 14, 
                                            borderRadius: 8, minWidth: 32 
                                        }}>−</button>
                                        <span style={{ fontSize: 14, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{i.cartQty}</span>
                                        <button onClick={() => changeQty(i.id, +1)} style={{ 
                                            ...cs.btn(), padding: "4px 10px", fontSize: 14, 
                                            borderRadius: 8, minWidth: 32 
                                        }}>+</button>
                                        <button onClick={() => setCart(c => c.filter(x => x.id !== i.id))} style={{ 
                                            ...cs.btn("danger"), padding: "4px 8px", fontSize: 12, 
                                            borderRadius: 8, marginLeft: 4 
                                        }}>X</button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    {/* Discount + GST */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                            <label style={cs.label}>Discount (₹)</label>
                            <input type="number" min="0" style={cs.input} value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
                        </div>
                        <div>
                            <label style={cs.label}>Payment Method</label>
                            <select style={cs.input} value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                                {["Cash", "Card", "UPI", "Credit"].map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: theme.text, cursor: "pointer" }}>
                            <input type="checkbox" checked={applyGST} onChange={e => setApplyGST(e.target.checked)} style={{ width: 16, height: 16 }} />
                            Apply GST (12%)
                        </label>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={cs.label}>Upload Prescription</label>
                        <input type="file" style={{ ...cs.input, padding: "6px" }} accept="image/*,.pdf"
                            onChange={e => setPrescriptionFile(e.target.files?.[0] || null)} />
                        {prescriptionFile && <div style={{ fontSize: 11, color: ACCENT, marginTop: 4 }}>File attached: {prescriptionFile.name}</div>}
                    </div>

                    {/* Totals */}
                    <div style={{ 
                        borderTop: `1px solid ${theme.border}`, paddingTop: 16, marginTop: 8,
                        background: theme.bgSubtle, borderRadius: 12, padding: 16, marginLeft: -16, marginRight: -16 
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.muted, marginBottom: 8 }}>
                            <span>Subtotal</span><span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {discountAmt > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: SUCCESS, marginBottom: 8 }}>
                                <span>Discount</span><span style={{ fontWeight: 600 }}>-₹{discountAmt.toFixed(2)}</span>
                            </div>
                        )}
                        {taxAmt > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.muted, marginBottom: 8 }}>
                                <span>GST (12%)</span><span style={{ fontWeight: 600 }}>+₹{taxAmt.toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ 
                            display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 20, 
                            color: theme.text, paddingTop: 12, borderTop: `2px solid ${theme.border}`, marginTop: 8 
                        }}>
                            <span>Total</span>
                            <span style={{ color: ACCENT }}>₹{total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button className="btn-hover" style={{ 
                        ...cs.btn(), width: "100%", padding: 14, fontSize: 15, fontWeight: 700,
                        marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 
                    }} onClick={generateBill} disabled={saving || !cart.length}>
                        {saving ? (
                            <>
                                <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></span>
                                Processing...
                            </>
                        ) : (
                            <>Generate Bill</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
