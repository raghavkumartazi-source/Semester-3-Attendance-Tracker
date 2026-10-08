'use client';

import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Session } from '@/lib/types';
import { getOverallStats } from '@/lib/calculations';

interface Props {
  sessions: Session[];
}

export function OverallBreakdownChart({ sessions }: Props) {
  const reduced = useReducedMotion();
  const data = useMemo(() => getOverallStats(sessions), [sessions]);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl p-5 relative overflow-hidden flex items-center justify-between">
      <div className="z-10 relative pl-2">
        <h3 className="text-[11px] font-bold tracking-widest text-[color:var(--fg-muted)] uppercase mb-4">
          Status Breakdown
        </h3>
        <div className="space-y-3">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                style={{ backgroundColor: entry.color }} 
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[color:var(--fg)] leading-none">{entry.name}</span>
                <span className="text-[10px] text-[color:var(--fg-muted)] leading-tight mt-0.5">{entry.value} Classes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="h-[120px] w-[120px] relative z-10 flex-shrink-0 -mr-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              isAnimationActive={!reduced}
              animationBegin={200}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 4px ${entry.color}40)` }} />
              ))}
            </Pie>
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
              labelStyle={{ color: 'var(--fg-muted)' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [`${value} Classes`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Background decoration */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none rounded-r-2xl" />
    </div>
  );
}
