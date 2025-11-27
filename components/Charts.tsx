import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';
import { Subject, TEXT_COLORS } from '../types';

interface PerformanceTrendChartProps {
  subject: Subject;
}

export const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({ subject }) => {
  // Process data: Sort by date, calculate percentage
  const data = [...subject.scores]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(s => ({
      name: s.title,
      date: s.date,
      percentage: Math.round((s.value / s.max) * 100)
    }));

  // Determine stroke color from tailwind class map or fallback
  const strokeColor = TEXT_COLORS[subject.color as keyof typeof TEXT_COLORS]?.replace('text-', '#') || '#6366f1'; 
  // Note: The simple replace above is a hack for the demo. In a real app, map directly to hex codes.
  // Let's use a safe fallback map since tailwind classes aren't hex codes.
  const colorMap: Record<string, string> = {
    'bg-blue-500': '#3b82f6',
    'bg-emerald-500': '#10b981',
    'bg-violet-500': '#8b5cf6',
    'bg-rose-500': '#f43f5e',
    'bg-amber-500': '#f59e0b',
    'bg-cyan-500': '#06b6d4',
    'bg-fuchsia-500': '#d946ef',
    'bg-indigo-500': '#6366f1',
  };
  const hexColor = colorMap[subject.color] || '#6366f1';

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
        No data points to visualize yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            stroke="#94a3b8"
            tick={{fontSize: 12}}
          />
          <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{fontSize: 12}} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`${value}%`, 'Score']}
          />
          <Line 
            type="monotone" 
            dataKey="percentage" 
            stroke={hexColor} 
            strokeWidth={3}
            dot={{ r: 4, fill: hexColor, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface OverviewBarChartProps {
  subjects: Subject[];
}

export const OverviewBarChart: React.FC<OverviewBarChartProps> = ({ subjects }) => {
  const colorMap: Record<string, string> = {
    'bg-blue-500': '#3b82f6',
    'bg-emerald-500': '#10b981',
    'bg-violet-500': '#8b5cf6',
    'bg-rose-500': '#f43f5e',
    'bg-amber-500': '#f59e0b',
    'bg-cyan-500': '#06b6d4',
    'bg-fuchsia-500': '#d946ef',
    'bg-indigo-500': '#6366f1',
  };

  const data = subjects.map(sub => {
    const totalMax = sub.scores.reduce((acc, curr) => acc + curr.max, 0);
    const totalScore = sub.scores.reduce((acc, curr) => acc + curr.value, 0);
    const avg = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    return {
      name: sub.name,
      average: avg,
      color: colorMap[sub.color] || '#6366f1'
    };
  }).filter(d => d.average > 0); // Only show active subjects

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        Add scores to see the overview comparison.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 11}} interval={0} />
          <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{fontSize: 12}} />
          <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(val: number) => [`${val}%`, 'Average']} />
          <Bar dataKey="average" radius={[4, 4, 0, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
