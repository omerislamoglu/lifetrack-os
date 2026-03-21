import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AnalyticsChart = ({ data, chartColor }) => {
  const safeColor = chartColor || 'var(--brand-blue)';
  const gradientId = `analyticsAreaGradient-${String(safeColor).replace(/[^a-zA-Z0-9]/g, '')}`;

  const filteredData = useMemo(() =>
    Array.isArray(data) ? data.filter((item) => (item?.Skor || 0) > 0) : [],
    [data]
  );

  return (
    <div style={{ width: '100%', height: '300px', minHeight: '300px', display: 'block' }}>
      <ResponsiveContainer width="100%" height={300} minWidth={1} minHeight={300} debounce={50}>
        <AreaChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={safeColor} stopOpacity={0.45} />
              <stop offset="95%" stopColor={safeColor} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="var(--text-dim)" tick={{ fontSize: 12 }} tickMargin={10} interval={0} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-dim)" domain={[0, 100]} tick={{ fontSize: 12 }} width={40} tickLine={false} axisLine={false} />
          <CartesianGrid stroke="transparent" vertical={false} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} cursor={false} />
          <Area
            type="monotone"
            dataKey="Skor"
            stroke={safeColor}
            strokeWidth={3}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            activeDot={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;
