import React, { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const DashboardChart = ({ data, isPremium }) => {

  const filteredData = useMemo(() =>
    Array.isArray(data) ? data.filter((item) => (item?.Skor || 0) >= 0) : [],
    [data]
  );

  // En yüksek skoru bul
  const bestDayData = useMemo(() => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) {
      return { name: 'Pazartesi', Skor: 0 }; // Fallback
    }
    const max = filteredData.reduce((prev, current) =>
      (prev?.Skor || 0) > (current?.Skor || 0) ? prev : current,
      filteredData[0]
    );
    return max;
  }, [filteredData]);

  // Turuncu gradient rengi fonksiyonu
  const getOrangeGradient = (index, total) => {
    const startColor = { r: 245, g: 158, b: 11 };   // #f59e0b
    const endColor = { r: 249, g: 115, b: 22 };     // #f97316
    const ratio = total > 1 ? index / (total - 1) : 0;
    const r = Math.round(startColor.r * (1 - ratio) + endColor.r * ratio);
    const g = Math.round(startColor.g * (1 - ratio) + endColor.g * ratio);
    const b = Math.round(startColor.b * (1 - ratio) + endColor.b * ratio);
    return `rgba(${r}, ${g}, ${b}, 0.85)`;
  };

  // Defs for gradient
  const renderCustomized = (entry, index) => {
    return getOrangeGradient(index, filteredData.length);
  };

  // Sadece BarChart - turuncu sütun grafiği
  return (
    <div style={{ width: '100%' }}>
      {/* Chart Panel */}
      <div style={{
        width: '100%',
        height: '350px',
        background: 'rgba(31, 41, 55, 0.4)',
        border: '1px solid rgba(255, 140, 0, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.9}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255, 140, 0, 0.1)" />
            <XAxis dataKey="name" stroke="var(--text-dim)" tick={{ fontSize: 12 }} tickMargin={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-dim)" tick={{ fontSize: 12 }} width={35} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                border: '1px solid rgba(255, 140, 0, 0.5)',
                borderRadius: '8px',
                color: '#FF8C00',
                fontWeight: 600
              }}
              cursor={{ fill: 'rgba(255, 140, 0, 0.1)' }}
            />
            <Bar dataKey="Skor" radius={[8, 8, 0, 0]} fill="url(#colorOrange)">
              {filteredData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getOrangeGradient(index, filteredData.length)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Haftalık İçgörü Kutusu - Herzaman Göster (Koşulsuz) */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(255, 140, 0, 0.08)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 140, 0, 0.3)',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
      }}>
        <TrendingUp size={24} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: '0 0 8px 0',
            color: '#FF8C00',
            fontSize: '0.95rem',
            fontWeight: 700
          }}>
            Harika İlerliyorsun!
          </h3>
          <p style={{
            margin: 0,
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            fontWeight: 500
          }}>
            Bu haftanın en verimli günü <strong>{bestDayData.name}</strong> oldu. O gün <strong>{bestDayData.Skor} hedef</strong> tamamladın.
          </p>
          <p style={{
            margin: '8px 0 0 0',
            color: 'var(--text-dim)',
            fontSize: '0.85rem',
            lineHeight: 1.5
          }}>
            Benzer ritme devam etmeyi dene! 💪
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DashboardChart);
