import { ClinicRow } from "../types/clinic";

type Props = {
  data: ClinicRow[];
};

export const KpiCards: React.FC<Props> = ({ data }) => {
  const totalSales = data.reduce((s, r) => s + r.売上合計, 0);
  const totalPatients = data.reduce((s, r) => s + r.来院患者数, 0);
  const selfRate =
    totalSales === 0
      ? 0
      : (data.reduce((s, r) => s + r.自費売上, 0) / totalSales) * 100;

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <Card label="売上高" value={`${totalSales.toLocaleString()} 円`} />
      <Card label="来院患者数" value={`${totalPatients} 名`} />
      <Card label="自費率" value={`${selfRate.toFixed(1)} %`} />
    </div>
  );
};

const Card = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      padding: 16,
      borderRadius: 8,
      background: "#f8fafc",
      minWidth: 160,
    }}
  >
    <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: "bold" }}>{value}</div>
  </div>
);
