'use client';

import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Session } from '@/lib/types';
import { getAttendanceTrends } from '@/lib/calculations';
import { format, parseISO } from 'date-fns';

interface Props {
  sessions: Session[];
}

export function AttendanceTrendChart({ sessions }: Props) {
  const reduced = useReducedMotion();
  const data = useMemo(() => getAttendanceTrends(sessions), [sessions]);

  if (data.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center h-48">
        <p className="text-sm font-semibold text-[color:var(--fg-muted)] mb-1">No Data Yet</p>
        <p className="text-xs text-[color:var(--fg-muted)]">Start marking attendance to see trends.</p>
      </div>
    );
  }

  const latestPercentage = data[data.length - 1]?.percentage || 0;
  const strokeColor = latestPercentage >= 75 ? '#10B981' : '#EF4444'; // Emerald or Red
  const fillColor = latestPercentage >= 75 ? 'url(#colorSafe)' : 'url(#colorDanger)';

  return (
    <div className="glass-panel rounded-2xl p-5 overflow-hidden relative">
      <div className="mb-4">
        <h3 className="text-[11px] font-bold tracking-widest text-[color:var(--fg-muted)] uppercase">
          Attendance Trend
        </h3>
        <p className="text-xl font-bold text-[color:var(--fg)] mt-0.5">
          {latestPercentage.toFixed(1)}%
        </p>
      </div>
      
      <div className="h-[140px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDanger" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false}
              tickFormatter={(val) => {
                try {
                  return format(parseISO(val), 'MMM d');
                } catch {
                  return val;
                }
              }}
              tick={{ fill: 'var(--fg-muted)', fontSize: 10 }}
              minTickGap={20}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'var(--fg-muted)', fontSize: 10 }}
              ticks={[0, 50, 75, 100]}
            />
            <Tooltip
              isAnimationActive={!reduced}
              contentStyle={{ 
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                color: 'var(--fg)',
                fontSize: '12px',
                boxShadow: '0 4px 14px rgb(30 32 38 / 8%)',
              }}
              itemStyle={{ color: 'var(--fg)', fontWeight: 'bold' }}
              labelStyle={{ color: 'var(--fg-muted)', marginBottom: '4px' }}
              labelFormatter={(label) => {
                try {
                  return format(parseISO(label as string), 'MMMM d, yyyy');
                } catch {
                  return label;
                }
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value}%`, 'Attendance']}
            />
            <Area 
              type="monotone" 
              dataKey="percentage" 
              stroke={strokeColor} 
              strokeWidth={3}
              fillOpacity={1} 
              fill={fillColor} 
              isAnimationActive={!reduced}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
