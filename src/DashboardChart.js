import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardChart = ({ data, chartColor }) => {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="name" stroke="var(--text-dim)" />
          <YAxis stroke="var(--text-dim)" domain={[0, 100]} />
          <Tooltip contentStyle={{backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)'}} />
          <Line type="monotone" dataKey="Skor" stroke={chartColor} strokeWidth={4} activeDot={{r: 8}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardChart;