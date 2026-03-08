import { makeStyles, getTheme, ACCENT, PURPLE, WARNING, BLUE, DANGER } from "../theme.js";

const collections = [
    {
        name: "users",
        color: ACCENT,
        fields: [
            { name: "_id", type: "ObjectId", pk: true },
            { name: "username", type: "String", unique: true },
            { name: "password", type: "String" },
            { name: "name", type: "String" },
            { name: "email", type: "String" },
            { name: "role", type: "String", note: "admin|staff" },
            { name: "status", type: "String", note: "Active|Inactive" },
            { name: "last_login", type: "Date" },
            { name: "created_at", type: "Date" },
        ]
    },
    {
        name: "medicines",
        color: PURPLE,
        fields: [
            { name: "_id", type: "ObjectId", pk: true },
            { name: "medicine_id", type: "String", unique: true },
            { name: "name", type: "String" },
            { name: "category", type: "String" },
            { name: "manufacturer", type: "String" },
            { name: "quantity", type: "Number" },
            { name: "price", type: "Number" },
            { name: "expiry_date", type: "String" },
            { name: "supplier", type: "String" },
            { name: "reorder_level", type: "Number", note: "default:15" },
        ]
    },
    {
        name: "patients",
        color: BLUE,
        fields: [
            { name: "_id", type: "ObjectId", pk: true },
            { name: "patient_id", type: "String", unique: true },
            { name: "name", type: "String" },
            { name: "age", type: "Number" },
            { name: "gender", type: "String" },
            { name: "phone", type: "String" },
            { name: "email", type: "String" },
            { name: "address", type: "String" },
            { name: "last_visit", type: "String" },
            { name: "total_purchases", type: "Number" },
        ]
    },
    {
        name: "suppliers",
        color: WARNING,
        fields: [
            { name: "_id", type: "ObjectId", pk: true },
            { name: "supplier_id", type: "String", unique: true },
            { name: "name", type: "String" },
            { name: "contact_person", type: "String" },
            { name: "phone", type: "String" },
            { name: "email", type: "String" },
            { name: "address", type: "String" },
            { name: "status", type: "String", note: "Active|Inactive" },
        ]
    },
    {
        name: "sales",
        color: DANGER,
        fields: [
            { name: "_id", type: "ObjectId", pk: true },
            { name: "invoice_id", type: "String", unique: true },
            { name: "patient_id", type: "ObjectId", fk: "patients" },
            { name: "patient_name", type: "String" },
            { name: "items", type: "Array", note: "[{medicine_id, name, qty, price}]" },
            { name: "total_amount", type: "Number" },
            { name: "discount", type: "Number" },
            { name: "tax", type: "Number" },
            { name: "net_amount", type: "Number" },
            { name: "payment_method", type: "String" },
            { name: "status", type: "String", note: "Completed" },
            { name: "created_at", type: "Date" },
        ]
    },
    {
        name: "stocktransactions",
        color: "#64748B",
        fields: [
            { name: "_id", type: "ObjectId", pk: true },
            { name: "medicine_id", type: "ObjectId", fk: "medicines" },
            { name: "medicine_name", type: "String" },
            { name: "transaction_type", type: "String", note: "IN|OUT" },
            { name: "quantity", type: "Number" },
            { name: "reference_type", type: "String", note: "SALE|MANUAL" },
            { name: "reference_id", type: "ObjectId" },
            { name: "notes", type: "String" },
            { name: "created_at", type: "Date" },
        ]
    },
];

export default function DBSchema({ darkMode }) {
    const theme = getTheme(darkMode);
    const cs = makeStyles(theme, darkMode);

    return (
        <div>
            <h2 style={cs.sectionTitle()}>Database Schema</h2>
            <p style={{ color: theme.muted, margin: "4px 0 18px", fontSize: 13 }}>MongoDB Atlas — medos database — {collections.length} collections</p>

            {/* Relationship legend */}
            <div style={{ ...cs.card, marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase" }}>Legend:</span>
                {[["PK", "Primary Key (_id)"], ["FK", "Foreign Key (ref)"], ["U", "Indexed / Unique"]].map(([ic, lbl]) => (
                    <span key={lbl} style={{ fontSize: 12, color: theme.muted, display: "flex", alignItems: "center", gap: 5 }}>{ic} {lbl}</span>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {collections.map(col => (
                    <div key={col.name} style={{ ...cs.card, borderTop: `3px solid ${col.color}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <div>
                                <div style={{ fontFamily: "monospace", fontWeight: 700, color: col.color, fontSize: 14 }}>{col.name}</div>
                                <div style={{ fontSize: 10, color: theme.muted }}>{col.fields.length} fields</div>
                            </div>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={{ ...cs.th, padding: "6px 8px" }}>Field</th>
                                    <th style={{ ...cs.th, padding: "6px 8px" }}>Type</th>
                                    <th style={{ ...cs.th, padding: "6px 8px" }}>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {col.fields.map((f, i) => (
                                    <tr key={i}>
                                        <td style={{ ...cs.td, padding: "7px 8px", fontFamily: "monospace", fontSize: 12, fontWeight: f.pk || f.fk ? 700 : 400, color: f.pk ? ACCENT : f.fk ? PURPLE : theme.text }}>
                                            {f.pk ? "PK " : f.fk ? "FK " : f.unique ? "U " : ""}
                                            {f.name}
                                        </td>
                                        <td style={{ ...cs.td, padding: "7px 8px", fontSize: 11, color: WARNING, fontFamily: "monospace" }}>{f.type}</td>
                                        <td style={{ ...cs.td, padding: "7px 8px", fontSize: 10, color: theme.muted }}>{f.fk ? `→ ${f.fk}` : f.note || ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
}
