import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface CohortAnalyticsWidgetProps {
  data: {
    title: string;
    type: 'age' | 'gender' | 'conditions';
    items: { name: string; value: number }[];
  };
}

const CohortAnalyticsWidget: React.FC<CohortAnalyticsWidgetProps> = ({ data }) => {
  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">{data.title}</h3>
        <span className="text-[10px] font-medium text-slate-400 uppercase">OMOP</span>
      </div>

      <div className="flex-1 min-h-[200px]">
        {data.type === 'age' || data.type === 'conditions' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8' }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px',
                  fontSize: '10px',
                  color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.items.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
             <PieChart>
                <Pie
                  data={data.items}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.items.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px',
                    fontSize: '10px',
                  }}
                />
             </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {data.items.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 capitalize">{item.name}</span>
            <span className="text-[10px] font-black text-slate-900 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CohortAnalyticsWidget;
