'use client'

import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

interface OddsHistoryPoint {
  time: number; // timestamp
  yesOdds: number;
}

interface MarketChartProps {
  data: OddsHistoryPoint[];
}

export const MarketChart: React.FC<MarketChartProps> = ({ data }) => {
  const formattedData = data.map(point => ({
    ...point,
    time: new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    noOdds: 100 - point.yesOdds,
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={formattedData}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
          <XAxis 
            dataKey="time" 
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
          />
          <YAxis 
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend wrapperStyle={{ color: '#fff' }} />
          <Line type="monotone" dataKey="yesOdds" name="YES Odds" stroke="#10B981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="noOdds" name="NO Odds" stroke="#EF4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 