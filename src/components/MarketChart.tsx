'use client'

import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

interface OddsHistoryPoint {
  time: number; // timestamp
  yesOdds: number;
}

interface MarketChartProps {
  data: OddsHistoryPoint[];
  contractAddress?: `0x${string}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '12px',
        backdropFilter: 'blur(8px)',
      }}>
        <p style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '14px' }}>
          <strong>Time: {label}</strong>
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ 
            color: entry.color, 
            margin: '4px 0', 
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <span>{entry.name}:</span>
            <span><strong>{entry.value.toFixed(1)}%</strong></span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const MarketChart: React.FC<MarketChartProps> = ({ data, contractAddress }) => {
  const formattedData = data.map(point => ({
    ...point,
    time: new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    noOdds: 100 - point.yesOdds,
  }));

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 300 }}>
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
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Line type="monotone" dataKey="yesOdds" name="YES Odds" stroke="#10B981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="noOdds" name="NO Odds" stroke="#EF4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {contractAddress && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            margin: '0 0 8px 0', 
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            Contract Address:
          </p>
          <a
            href={`https://sepolia.etherscan.io/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#60A5FA',
              textDecoration: 'none',
              fontFamily: 'monospace',
              fontSize: '13px',
              wordBreak: 'break-all'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            {shortenAddress(contractAddress)}
          </a>
        </div>
      )}
    </div>
  );
}; 