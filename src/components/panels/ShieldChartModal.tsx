import React from 'react';
import { Modal, Row, Col, Card, Statistic } from 'antd';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Gauge, Disc, Waves, Layers } from 'lucide-react';
import useStore from '@/store/useStore';

interface ShieldChartModalProps {
  shieldId: string | null;
  onClose: () => void;
}

const ShieldChartModal: React.FC<ShieldChartModalProps> = ({ shieldId, onClose }) => {
  const shields = useStore((state) => state.shields);

  if (!shieldId) return null;

  const shield = shields.find((s) => s.id === shieldId);
  if (!shield) return null;

  const paramCards = [
    {
      title: '推进速度',
      value: shield.thrustSpeed,
      suffix: 'mm/min',
      icon: Gauge,
      color: '#1890FF',
      bgColor: 'rgba(24, 144, 255, 0.1)',
    },
    {
      title: '刀盘扭矩',
      value: shield.cutterTorque,
      suffix: 'kN·m',
      icon: Disc,
      color: '#FA8C16',
      bgColor: 'rgba(250, 140, 22, 0.1)',
    },
    {
      title: '注浆压力',
      value: shield.groutingPressure,
      suffix: 'bar',
      icon: Waves,
      color: '#52C41A',
      bgColor: 'rgba(82, 196, 26, 0.1)',
    },
    {
      title: '累计环数',
      value: shield.totalRings,
      suffix: '环',
      icon: Layers,
      color: '#722ED1',
      bgColor: 'rgba(114, 46, 209, 0.1)',
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: '#101E36',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '12px 16px',
            color: '#fff',
          }}
        >
          <div style={{ marginBottom: 8, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: entry.color,
                  display: 'inline-block',
                }}
              />
              <span style={{ color: 'rgba(255,255,255,0.7)', width: 80 }}>{entry.name}</span>
              <span style={{ fontWeight: 600, color: entry.color }}>
                {entry.value}
                {entry.dataKey === 'thrustSpeed'
                  ? ' mm/min'
                  : entry.dataKey === 'cutterTorque'
                    ? ' kN·m'
                    : entry.dataKey === 'groutingPressure'
                      ? ' bar'
                      : ' 环'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Modal
      open={!!shieldId}
      onCancel={onClose}
      footer={null}
      width={900}
      title={
        <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
          {shield.name} ({shield.code})
        </span>
      }
      styles={{
        header: {
          background: '#0A1628',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        },
        content: {
          background: '#101E36',
        },
        body: {
          background: '#101E36',
          padding: 24,
        },
        mask: {
          background: 'rgba(0, 0, 0, 0.7)',
        },
      }}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {paramCards.map((item, index) => {
          const IconComp = item.icon;
          return (
            <Col span={12} key={index}>
              <Card
                styles={{
                  body: {
                    padding: 20,
                    background: item.bgColor,
                    borderRadius: 12,
                    border: `1px solid ${item.color}33`,
                  },
                }}
                bordered={false}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      background: `${item.color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color,
                      flexShrink: 0,
                    }}
                  >
                    <IconComp size={26} strokeWidth={2} />
                  </div>
                  <Statistic
                    title={
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                        {item.title}
                      </span>
                    }
                    value={item.value}
                    suffix={
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                        {item.suffix}
                      </span>
                    }
                    valueStyle={{ color: item.color, fontSize: 26, fontWeight: 700 }}
                  />
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card
        styles={{
          body: {
            padding: '20px 16px 16px',
            background: '#0A1628',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
          },
        }}
        bordered={false}
        title={
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>24小时参数趋势</span>
        }
        style={{ background: 'transparent' }}
      >
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart
            data={shield.history24h}
            margin={{ top: 16, right: 60, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              angle={-35}
              textAnchor="end"
              height={60}
              interval={1}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}
              formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="thrustSpeed"
              name="推进速度"
              stroke="#1890FF"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cutterTorque"
              name="刀盘扭矩"
              stroke="#FA8C16"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="groutingPressure"
              name="注浆压力"
              stroke="#52C41A"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rings"
              name="累计环数"
              stroke="#722ED1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </Modal>
  );
};

export default ShieldChartModal;
