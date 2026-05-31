"use client";
import {
  Radar,
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type RadarData = {
  axis: string;
  value: number;
};

export default function RadarChart({ data }: { data: RadarData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReRadarChart
        cx="50%"
        cy="50%"
        outerRadius="80%"
        data={data}
        className="text-gray-300"
      >
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis 
          dataKey="axis" 
          tick={{ fill: "#94a3b8", fontSize: 12 }} 
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 1]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="Risk Profile"
          dataKey="value"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.4}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
          itemStyle={{ color: '#3b82f6' }}
        />
      </ReRadarChart>
    </ResponsiveContainer>
  );
}
