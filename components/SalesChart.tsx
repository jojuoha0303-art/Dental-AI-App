import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ClinicRow } from "../types/clinic";

export const SalesChart = ({ data }: { data: ClinicRow[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <XAxis dataKey="年月" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="保険売上" stackId="a" fill="#3b82f6" />
      <Bar dataKey="自費売上" stackId="a" fill="#22c55e" />
    </BarChart>
  </ResponsiveContainer>
);
