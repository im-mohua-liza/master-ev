import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatNumber, amountInWords } from "./money";

// The standard PDF base-14 fonts (Helvetica) do not include the ₹ glyph,
// so PDFs use "Rs." instead of formatINR's ₹ symbol (which is fine on-screen).
function formatINR(value: number | null | undefined): string {
  return `Rs. ${formatNumber(value)}`;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#0f172a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  businessName: { fontSize: 16, fontWeight: 700, color: "#047857" },
  small: { fontSize: 8, color: "#475569" },
  title: { fontSize: 13, fontWeight: 700, textAlign: "center", marginVertical: 8, textTransform: "uppercase" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, gap: 12 },
  box: { flex: 1, border: "1pt solid #cbd5e1", borderRadius: 4, padding: 8 },
  boxTitle: { fontSize: 8, fontWeight: 700, color: "#64748b", marginBottom: 4, textTransform: "uppercase" },
  label: { color: "#64748b" },
  table: { border: "1pt solid #cbd5e1", borderRadius: 4, marginBottom: 10 },
  tr: { flexDirection: "row", borderBottom: "1pt solid #e2e8f0" },
  trLast: { flexDirection: "row" },
  th: { flex: 1, padding: 5, fontWeight: 700, backgroundColor: "#f1f5f9", fontSize: 8 },
  td: { flex: 1, padding: 5, fontSize: 8 },
  totalsBox: { alignSelf: "flex-end", width: 220, marginBottom: 10 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsBold: { fontWeight: 700, borderTop: "1pt solid #cbd5e1", marginTop: 3, paddingTop: 4 },
  footer: { marginTop: 16, fontSize: 8, color: "#475569" },
  signatureBox: { marginTop: 40, flexDirection: "row", justifyContent: "space-between" },
});

export interface InvoiceData {
  business: {
    businessName: string;
    address?: string | null;
    state?: string | null;
    district?: string | null;
    pin?: string | null;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
    pan?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankIFSC?: string | null;
    bankName?: string | null;
    upiId?: string | null;
    termsAndConditions?: string | null;
  };
  sale: {
    invoiceNumber: string | null;
    saleNumber: string;
    saleDate: Date;
    basePrice: number;
    discount: number;
    taxableValue: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    grandTotal: number;
    exchangeValue: number;
    amountPaid: number;
    balanceAmount: number;
    paymentStatus: string;
  };
  customer: {
    name: string;
    phone: string;
    address?: string | null;
    city?: string | null;
    pin?: string | null;
    gstin?: string | null;
  };
  vehicle: {
    vehicleCode: string;
    colour?: string | null;
    chassisNumber: string;
    motorNumber: string;
    batteryNumber: string;
    model: { brand: string; model: string; variant?: string | null };
  };
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const { business, sale, customer, vehicle } = data;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.businessName}>{business.businessName}</Text>
            <Text style={styles.small}>{business.address}</Text>
            <Text style={styles.small}>
              {[business.district, business.state, business.pin].filter(Boolean).join(", ")}
            </Text>
            <Text style={styles.small}>Phone: {business.phone ?? "-"}  Email: {business.email ?? "-"}</Text>
            {business.gstin && <Text style={styles.small}>GSTIN: {business.gstin}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.small}>Invoice No: {sale.invoiceNumber ?? sale.saleNumber}</Text>
            <Text style={styles.small}>Invoice Date: {fmtDate(sale.saleDate)}</Text>
            <Text style={styles.small}>Sale Ref: {sale.saleNumber}</Text>
          </View>
        </View>

        <Text style={styles.title}>Tax Invoice</Text>

        <View style={styles.sectionRow}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Bill To</Text>
            <Text>{customer.name}</Text>
            <Text style={styles.small}>{customer.address}</Text>
            <Text style={styles.small}>{[customer.city, customer.pin].filter(Boolean).join(" ")}</Text>
            <Text style={styles.small}>Phone: {customer.phone}</Text>
            {customer.gstin && <Text style={styles.small}>GSTIN: {customer.gstin}</Text>}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Vehicle Details</Text>
            <Text>{vehicle.model.brand} {vehicle.model.model} {vehicle.model.variant}</Text>
            <Text style={styles.small}>Colour: {vehicle.colour ?? "-"}</Text>
            <Text style={styles.small}>Chassis / VIN: {vehicle.chassisNumber}</Text>
            <Text style={styles.small}>Motor No: {vehicle.motorNumber}</Text>
            <Text style={styles.small}>Battery No: {vehicle.batteryNumber}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, { flex: 3 }]}>Description</Text>
            <Text style={styles.th}>Taxable Value</Text>
            <Text style={styles.th}>GST Rate</Text>
            <Text style={styles.th}>GST Amount</Text>
            <Text style={styles.th}>Total</Text>
          </View>
          <View style={styles.trLast}>
            <Text style={[styles.td, { flex: 3 }]}>
              {vehicle.model.brand} {vehicle.model.model} {vehicle.model.variant} — {vehicle.vehicleCode}
            </Text>
            <Text style={styles.td}>{formatINR(sale.taxableValue)}</Text>
            <Text style={styles.td}>{sale.gstRate}%</Text>
            <Text style={styles.td}>{formatINR(sale.totalGst)}</Text>
            <Text style={styles.td}>{formatINR(sale.taxableValue + sale.totalGst)}</Text>
          </View>
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}><Text style={styles.label}>Base Price</Text><Text>{formatINR(sale.basePrice)}</Text></View>
          <View style={styles.totalsRow}><Text style={styles.label}>Discount</Text><Text>- {formatINR(sale.discount)}</Text></View>
          <View style={styles.totalsRow}><Text style={styles.label}>Taxable Value</Text><Text>{formatINR(sale.taxableValue)}</Text></View>
          {sale.igst > 0 ? (
            <View style={styles.totalsRow}><Text style={styles.label}>IGST ({sale.gstRate}%)</Text><Text>{formatINR(sale.igst)}</Text></View>
          ) : (
            <>
              <View style={styles.totalsRow}><Text style={styles.label}>CGST ({(sale.gstRate / 2).toFixed(1)}%)</Text><Text>{formatINR(sale.cgst)}</Text></View>
              <View style={styles.totalsRow}><Text style={styles.label}>SGST ({(sale.gstRate / 2).toFixed(1)}%)</Text><Text>{formatINR(sale.sgst)}</Text></View>
            </>
          )}
          <View style={[styles.totalsRow, styles.totalsBold]}><Text>Grand Total</Text><Text>{formatINR(sale.grandTotal)}</Text></View>
          {sale.exchangeValue > 0 && (
            <View style={styles.totalsRow}><Text style={styles.label}>Exchange Value</Text><Text>- {formatINR(sale.exchangeValue)}</Text></View>
          )}
          <View style={styles.totalsRow}><Text style={styles.label}>Amount Paid</Text><Text>{formatINR(sale.amountPaid)}</Text></View>
          <View style={[styles.totalsRow, styles.totalsBold]}><Text>Balance Due</Text><Text>{formatINR(sale.balanceAmount)}</Text></View>
        </View>

        <Text style={styles.small}>Amount in Words: {amountInWords(sale.grandTotal)}</Text>
        <Text style={[styles.small, { marginTop: 2 }]}>Payment Status: {sale.paymentStatus}</Text>

        <View style={styles.sectionRow}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Bank Details</Text>
            <Text style={styles.small}>Bank: {business.bankName ?? "-"}</Text>
            <Text style={styles.small}>Account Name: {business.bankAccountName ?? "-"}</Text>
            <Text style={styles.small}>Account No: {business.bankAccountNumber ?? "-"}</Text>
            <Text style={styles.small}>IFSC: {business.bankIFSC ?? "-"}</Text>
            <Text style={styles.small}>UPI: {business.upiId ?? "-"}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Terms & Conditions</Text>
            <Text style={styles.small}>
              {business.termsAndConditions || "Goods once sold will not be taken back. Warranty as per manufacturer terms."}
            </Text>
          </View>
        </View>

        <View style={styles.signatureBox}>
          <Text style={styles.small}>Customer Signature</Text>
          <Text style={styles.small}>For {business.businessName} (Authorized Signatory)</Text>
        </View>

        <Text style={styles.footer}>This is a computer-generated invoice.</Text>
      </Page>
    </Document>
  );
}
