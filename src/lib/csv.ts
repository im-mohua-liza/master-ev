import Papa from "papaparse";

export function toCsvResponse(filename: string, rows: Record<string, unknown>[]) {
  const csv = Papa.unparse(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
