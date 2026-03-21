import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Crown, Lock, TrendingUp } from 'lucide-react';

// Özelleştirilmiş Tooltip (Bilgi Kutucuğu)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '10px 15px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <p style={{ color: 'var(--text-dim)', margin: '0 0 5px 0', fontSize: '0.9rem' }}>{label}</p>
        <p style={{ color: '#f59e0b', margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
          Skor: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function WeeklyAnalysis({ isPremium = false, onUpgradeClick, data = [], forceThreeDay = false }) {
  // --- YENİ EKLEME: GRAFİK HATASINI ÖNLEYEN STATE ---
  const [isMounted, setIsMounted] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const chartContainerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return undefined;

    const updateSize = () => {
      const el = chartContainerRef.current;
      const hasValidSize = Boolean(el && el.clientWidth > 10 && el.clientHeight > 10);
      setIsChartReady(hasValidSize);
    };

    updateSize();

    let observer;
    if (typeof ResizeObserver !== 'undefined' && chartContainerRef.current) {
      observer = new ResizeObserver(() => updateSize());
      observer.observe(chartContainerRef.current);
    }

    window.addEventListener('resize', updateSize);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [isMounted]);
  // ------------------------------------------------

  // PRO değilse grafikte sadece son 3 günü göster
  const displayData = forceThreeDay ? data.slice(-3) : (isPremium ? data : data.slice(-3));

  // Boş veri durumlarında uygulamanın çökmesini engellemek için güvenlik kontrolleri
  const maxScore = data.length > 0 ? Math.max(...data.map((d) => d.score)) : 0;
  const bestDayData = data.length > 0 ? data.find((d) => d.score === maxScore) : { day: '-', score: 0 };
  const averageScore = data.length > 0 ? (data.reduce((acc, curr) => acc + curr.score, 0) / data.length) : 1;
  const percentBetter = averageScore > 0 ? Math.round(((maxScore - averageScore) / averageScore) * 100) : 0;

  return (
    <div style={{ width: '100%', marginBottom: '25px' }}>
      <div className="card" style={{ padding: '25px', position: 'relative', overflow: 'hidden', border: isPremium ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)' }}>
        
        {isPremium && !forceThreeDay && (
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', position: 'relative', zIndex: 10 }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', color: 'var(--text-main)' }}>
              {forceThreeDay ? 'Haftalık Analiz (Son 3 Gün)' : (isPremium ? 'Haftalık Odaklanma' : 'Haftalık Analiz (Son 3 Gün)')}
            </h2>
            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              {forceThreeDay ? 'Son 3 günün üretkenlik analizi' : (isPremium ? 'Son 7 günün üretkenlik analizi' : 'Son 3 günün üretkenlik analizi')}
            </p>
          </div>
          {isPremium && !forceThreeDay ? (
            <div className="premium-glow" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px' }}>
              <Crown size={16} /> PREMIUM
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--input-bg)', color: 'var(--text-dim)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px' }}>
              {forceThreeDay ? 'HERKESE AÇIK' : 'ÜCRETSİZ'}
            </div>
          )}
        </div>

        {/* --- DÜZELTME: GRAFİK KONTEYNERİNE SABİT YÜKSEKLİK VE MOUNTED KONTROLÜ --- */}
        <div ref={chartContainerRef} style={{ width: '100%', height: '300px', minHeight: '300px', position: 'relative', zIndex: 10, display: 'block' }}>
          {isMounted && isChartReady && (
            <ResponsiveContainer width="100%" height={300} minWidth={1} minHeight={300} debounce={50}>
              <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScorePremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-dim)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis stroke="var(--text-dim)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar dataKey="score" fill="url(#colorScorePremium)" radius={[6, 6, 0, 0]} barSize={32} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ marginTop: '25px', padding: '15px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', gap: '15px', transition: 'opacity 0.3s', opacity: 1, position: 'relative', zIndex: 10 }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '12px', color: '#f59e0b', flexShrink: 0 }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)' }}>Harika İlerliyorsun!</h4>
            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Bu haftanın en verimli günü <strong style={{ color: '#f59e0b' }}>{bestDayData.day}</strong> oldu. O gün, haftalık ortalamana göre <strong style={{ color: '#f59e0b' }}>%{percentBetter} daha odaklıydın</strong>.
            </p>
          </div>
        </div>
      </div>

      {!isPremium && !forceThreeDay && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.22)' }}>
            <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' }}>
              <Lock size={28} color="white" />
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem', color: 'var(--text-main)' }}>Detaylı Analizi Aç</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: '1.5' }}>
              Hangi günlerde daha verimli çalıştığını gör, performansını zirveye taşı.
            </p>
            <button className="premium-glow" onClick={onUpgradeClick} style={{ width: '100%', padding: '12px', background: 'linear-gradient(to right, #f59e0b, #ea580c)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Crown size={20} /> Premium'a Geç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
