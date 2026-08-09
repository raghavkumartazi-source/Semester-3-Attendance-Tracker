'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Session } from '@/lib/types';
import { getAttendanceTrends } from '@/lib/calculations';
import { format, parseISO } from 'date-fns';

interface Props {
  sessions: Session[];
}

export function AttendanceTrendChart({ sessions }: Props) {
  const data = useMemo(() => getAttendanceTrends(sessions), [sessions]);

  if (data.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center h-48">
        <p className="text-sm font-semibold text-white/50 mb-1">No Data Yet</p>
        <p className="text-xs text-white/30">Start marking attendance to see trends.</p>
      </div>
    );
  }

  const latestPercentage = data[data.length - 1]?.percentage || 0;
  const strokeColor = latestPercentage >= 75 ? '#10B981' : '#EF4444'; // Emerald or Red
  const fillColor = latestPercentage >= 75 ? 'url(#colorSafe)' : 'url(#colorDanger)';

  return (
    <div className="glass-panel rounded-2xl p-5 overflow-hidden relative">
      <div className="mb-4">
        <h3 className="text-[11px] font-bold tracking-widest text-white/60 uppercase">
          Attendance Trend
        </h3>
        <p className="text-xl font-bold text-white mt-0.5">
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
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
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              minTickGap={20}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              ticks={[0, 50, 75, 100]}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(10, 10, 15, 0.9)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                backdropFilter: 'blur(10px)'
              }}
              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
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
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
