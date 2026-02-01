import React, { useMemo } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Area,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { formatDate } from '../utils/helpers';
import './Chart.css';

const Chart = ({ items, language, translations }) => {
  const chartData = useMemo(() => {
    const dateCounts = {};
    const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    items.forEach(item => {
      if (item.pubDate) {
        try {
          const date = new Date(item.pubDate);
          let monthYear;
          
          if (language === 'ar') {
            // Arabic month names
            const month = arabicMonths[date.getMonth()];
            const year = date.getFullYear();
            monthYear = `${month} ${year}`;
          } else {
            monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }
          
          // Store both display name and original date for sorting
          if (!dateCounts[monthYear]) {
            dateCounts[monthYear] = { count: 0, date: date };
          }
          dateCounts[monthYear].count += 1;
        } catch (error) {
          // Skip invalid dates
        }
      }
    });

    return Object.entries(dateCounts)
      .map(([name, data]) => ({ name, value: data.count, date: data.date }))
      .sort((a, b) => a.date - b.date)
      .map(({ name, value }) => ({ name, value }));
  }, [items, language]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="tooltip-header">{label}</div>
          <div className="tooltip-content">
            <span className="tooltip-label">{language === 'ar' ? ' عدد العناصر ' : 'Items'}:</span>
            <span className="tooltip-value">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <h3>{language === 'ar' ? 'توزيع الأخبار حسب التاريخ' : 'Items Distribution Over Time'}</h3>
        <p>{language === 'ar' ? 'لا توجد بيانات للعرض' : 'No data available'}</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3>{language === 'ar' ? 'توزيع الأخبار حسب التاريخ' : 'Items Distribution Over Time'}</h3>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart 
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 15 }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D65A31" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#D65A31" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D65A31" stopOpacity={1}/>
              <stop offset="100%" stopColor="#D65A31" stopOpacity={0.7}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--border-soft)" 
            opacity={0.4}
            vertical={false}
          />
          <XAxis 
            dataKey="name" 
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: 'var(--border-soft)', strokeWidth: 1 }}
            tickLine={{ stroke: 'var(--border-soft)' }}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: 'var(--border-soft)', strokeWidth: 1 }}
            tickLine={{ stroke: 'var(--border-soft)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: 'var(--text-primary)', paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => {
              if (value === 'value') {
                return language === 'ar' ? ' عدد العناصر ' : 'Items';
              }
              return value;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            fill="url(#areaGradient)"
            stroke="none"
            animationDuration={1500}
            animationEasing="ease-out"
            hide={true}
          />
          <Bar 
            dataKey="value" 
            fill="url(#barGradient)"
            name={language === 'ar' ? ' عدد العناصر ' : 'Items'}
            radius={[8, 8, 0, 0]}
            animationDuration={1200}
            animationBegin={300}
            animationEasing="ease-out"
            isAnimationActive={true}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index % 2 === 0 ? 'url(#barGradient)' : '#D65A31'}
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="value"
            stroke="#D65A31"
            strokeWidth={3}
            dot={{ fill: '#D65A31', r: 5, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
            animationDuration={1500}
            animationBegin={600}
            animationEasing="ease-out"
            isAnimationActive={true}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;

