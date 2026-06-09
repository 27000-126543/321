import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Progress, Tooltip, Modal } from 'antd';
import {
  Users,
  AlertTriangle,
  Activity,
  LogOut,
  Gauge,
  FileCheck,
  Wrench,
  Siren,
  FileDown,
} from 'lucide-react';
import dayjs from 'dayjs';
import useStore from '@/store/useStore';
import { cn } from '@/lib/utils';
import { ShieldMachine, MonitoringPoint, EventLog, StationNode, EventType, EventLevel } from '@/types';

const HudCorners: React.FC<{ className?: string }> = ({ className = '' }) => (
  <>
    <div className={cn('hud-corner-tl', className)} />
    <div className={cn('hud-corner-tr', className)} />
    <div className={cn('hud-corner-bl', className)} />
    <div className={cn('hud-corner-br', className)} />
  </>
);

const ShieldChartModalContent: React.FC<{ shield: ShieldMachine | null }> = ({ shield }) => {
  if (!shield) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{shield.name}</h3>
          <p className="text-sm text-gray-400">{shield.code}</p>
        </div>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            shield.status === 'normal' && 'bg-tech-green/20 text-tech-green border border-tech-green/40',
            shield.status === 'warning' && 'bg-tech-orange/20 text-tech-orange border border-tech-orange/40',
            shield.status === 'maintenance' && 'bg-gray-500/20 text-gray-300 border border-gray-500/40',
          )}
        >
          {shield.status === 'normal' ? '正常运行' : shield.status === 'warning' ? '预警中' : '维护中'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: '推进速度', value: shield.thrustSpeed, unit: 'mm/min', color: '#1890FF', max: 60 },
          { label: '刀盘扭矩', value: shield.cutterTorque, unit: 'kN·m', color: '#FA8C16', max: 6000 },
          { label: '注浆压力', value: shield.groutingPressure, unit: 'bar', color: '#52C41A', max: 3.5 },
          { label: '累计环数', value: shield.totalRings, unit: '环', color: '#722ED1', max: 1000 },
        ].map((item) => (
          <div key={item.label} className="tech-panel p-4 rounded-lg relative overflow-hidden">
            <HudCorners />
            <p className="text-sm text-gray-400 mb-2">{item.label}</p>
            <p className="text-2xl font-bold font-orbitron" style={{ color: item.color }}>
              {item.value} <span className="text-sm font-normal text-gray-400">{item.unit}</span>
            </p>
            <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                  backgroundColor: item.color,
                  boxShadow: `0 0 10px ${item.color}`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">{((item.value / item.max) * 100).toFixed(1)}% / {item.max}{item.unit}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TopNavbar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  const currentUser = useStore((s) => s.currentUser);
  const workers = useStore((s) => s.workers);
  const monitoringPoints = useStore((s) => s.monitoringPoints);
  const shields = useStore((s) => s.shields);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  const warningCount = monitoringPoints.filter((m) => m.status === 'danger' || m.status === 'warning').length;
  const todayRings = shields.reduce((sum, s) => sum + (s.history24h.length > 0 ? s.history24h[s.history24h.length - 1].rings - s.history24h[0].rings : 0), 0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="tech-panel relative sticky top-0 z-50 w-full h-16 px-6 flex items-center justify-between"
    >
      <HudCorners />

      <div className="flex items-center gap-3 z-10">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-tech-blue to-tech-cyan flex items-center justify-center shadow-lg shadow-tech-blue/30">
          <span className="text-white font-bold text-xl font-orbitron">M</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tech-title tracking-wide">智慧地铁调度平台</h1>
          <p className="text-xs text-gray-400">Version 2.5.1</p>
        </div>
      </div>

      <div className="flex items-center gap-8 z-10">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 px-5 py-2 rounded-lg bg-tech-blue/10 border border-tech-blue/30"
        >
          <div className="w-9 h-9 rounded-full bg-tech-blue/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-tech-blue" />
          </div>
          <div>
            <p className="text-xs text-gray-400">在籍人员</p>
            <p className="text-lg font-bold text-white font-orbitron">{workers.length}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 px-5 py-2 rounded-lg bg-tech-orange/10 border border-tech-orange/30"
        >
          <div className={cn('w-9 h-9 rounded-full bg-tech-orange/20 flex items-center justify-center', warningCount > 0 && 'animate-pulse-fast')}>
            <AlertTriangle className="w-5 h-5 text-tech-orange" />
          </div>
          <div>
            <p className="text-xs text-gray-400">预警数量</p>
            <p className={cn('text-lg font-bold font-orbitron', warningCount > 0 ? 'text-tech-orange' : 'text-white')}>{warningCount}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 px-5 py-2 rounded-lg bg-tech-green/10 border border-tech-green/30"
        >
          <div className="w-9 h-9 rounded-full bg-tech-green/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-tech-green" />
          </div>
          <div>
            <p className="text-xs text-gray-400">今日掘进环数</p>
            <p className="text-lg font-bold text-tech-green font-orbitron">{todayRings}</p>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-5 z-10">
        <div className="text-right">
          <p className="text-xs text-gray-400">当前时间</p>
          <p className="text-base font-medium text-tech-blue font-orbitron tracking-wider">{currentTime}</p>
        </div>

        {currentUser && (
          <div className="flex items-center gap-3 pl-5 border-l border-tech-border">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tech-purple to-tech-blue flex items-center justify-center border-2 border-tech-blue/50 shadow-lg shadow-tech-blue/20">
              <span className="text-white font-bold text-sm">{currentUser.username.charAt(0)}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">{currentUser.username}</p>
              <p className="text-xs text-tech-cyan">{currentUser.roleName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-lg bg-tech-red/10 border border-tech-red/30 flex items-center justify-center hover:bg-tech-red/20 hover:border-tech-red/50 transition-all duration-300 group"
            >
              <LogOut className="w-4 h-4 text-tech-red group-hover:rotate-[-15deg] transition-transform" />
            </button>
          </div>
        )}
      </div>
    </motion.header>
  );
};

interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const LeftNavPanel: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { key: 'dashboard', label: '主控台', path: '/dashboard', icon: <Gauge className="w-5 h-5" /> },
    { key: 'approval', label: '管片审批', path: '/approval', icon: <FileCheck className="w-5 h-5" /> },
    { key: 'workorder', label: '设备工单', path: '/workorder', icon: <Wrench className="w-5 h-5" /> },
    { key: 'emergency', label: '应急指挥', path: '/emergency', icon: <Siren className="w-5 h-5" /> },
    { key: 'export', label: '日报导出', path: '/export', icon: <FileDown className="w-5 h-5" /> },
  ];

  return (
    <motion.nav
      initial={{ x: -120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
      className="tech-panel fixed left-4 top-24 z-40 rounded-xl overflow-hidden transition-all duration-300 ease-out"
      style={{ width: expanded ? 180 : 60 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="relative">
        <HudCorners />

        <div className="py-4 z-10 relative">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 relative overflow-hidden group',
                  isActive
                    ? 'bg-tech-blue/20 text-tech-blue border-r-2 border-tech-blue'
                    : 'text-gray-400 hover:bg-tech-blue/10 hover:text-white',
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-tech-blue/20 to-transparent" />
                )}
                <div
                  className={cn(
                    'relative z-10 flex-shrink-0 transition-all duration-300',
                    isActive && 'drop-shadow-[0_0_8px_rgba(24,144,255,0.8)]',
                  )}
                >
                  {item.icon}
                </div>
                <span
                  className={cn(
                    'relative z-10 whitespace-nowrap text-sm font-medium transition-all duration-300',
                    expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden',
                    isActive && 'font-semibold',
                  )}
                >
                  {item.label}
                </span>
                {isActive && expanded && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-tech-blue shadow-[0_0_10px_#1890FF]"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export const ShieldInfoPanel: React.FC = () => {
  const shields = useStore((s) => s.shields);
  const selectedShieldId = useStore((s) => s.selectedShieldId);
  const setSelectedShield = useStore((s) => s.setSelectedShield);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedShield = shields.find((s) => s.id === selectedShieldId) || null;

  const handleCardClick = (id: string) => {
    setSelectedShield(id);
    setModalOpen(true);
  };

  const statusConfig = {
    normal: { label: '正常', className: 'bg-tech-green/20 text-tech-green border-tech-green/40' },
    warning: { label: '预警', className: 'bg-tech-orange/20 text-tech-orange border-tech-orange/40' },
    maintenance: { label: '维护', className: 'bg-gray-500/20 text-gray-300 border-gray-500/40' },
  };

  const progressBars = [
    { key: 'thrustSpeed', label: '推进速度', unit: 'mm/min', max: 60, color: '#1890FF', bg: 'bg-tech-blue/20' },
    { key: 'cutterTorque', label: '刀盘扭矩', unit: 'kN·m', max: 6000, color: '#FA8C16', bg: 'bg-tech-orange/20' },
    { key: 'groutingPressure', label: '注浆压力', unit: 'bar', max: 3.5, color: '#52C41A', bg: 'bg-tech-green/20' },
    { key: 'totalRings', label: '累计环数', unit: '环', max: 1000, color: '#722ED1', bg: 'bg-tech-purple/20' },
  ] as const;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
      className="tech-panel fixed left-4 bottom-4 z-30 w-80 rounded-xl overflow-hidden"
    >
      <div className="relative">
        <HudCorners />

        <div className="relative z-10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-tech-blue rounded-full" />
              盾构机状态
            </h2>
            <span className="text-xs text-gray-400">共 {shields.length} 台</span>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {shields.map((shield, index) => {
              const isSelected = selectedShieldId === shield.id;
              return (
                <motion.div
                  key={shield.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  onClick={() => handleCardClick(shield.id)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all duration-300 relative overflow-hidden',
                    isSelected
                      ? 'bg-tech-blue/15 border-tech-blue shadow-[0_0_20px_rgba(24,144,255,0.3)]'
                      : 'bg-white/5 border-tech-border/50 hover:bg-tech-blue/10 hover:border-tech-blue/50',
                  )}
                >
                  {isSelected && <div className="absolute inset-0 border-2 border-tech-blue/50 rounded-lg pointer-events-none animate-glow" />}

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-white">{shield.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{shield.code}</p>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', statusConfig[shield.status].className)}>
                      {statusConfig[shield.status].label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {progressBars.map((bar) => {
                      const value = shield[bar.key];
                      const percent = Math.min((value / bar.max) * 100, 100);
                      return (
                        <div key={bar.key}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-400">{bar.label}</span>
                            <span className="text-white font-medium">
                              {value}
                              <span className="text-gray-500 ml-0.5">{bar.unit}</span>
                            </span>
                          </div>
                          <div className={cn('h-1.5 rounded-full overflow-hidden', bar.bg)}>
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{
                                width: `${percent}%`,
                                backgroundColor: bar.color,
                                boxShadow: `0 0 6px ${bar.color}`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        centered
        width={560}
        styles={{
          content: { background: 'rgba(16, 30, 54, 0.95)', border: '1px solid rgba(24,144,255,0.4)', borderRadius: 12 },
          header: { background: 'transparent', borderBottom: '1px solid rgba(24,144,255,0.2)' },
          body: { padding: '24px' },
        }}
        title={null}
      >
        <ShieldChartModalContent shield={selectedShield} />
      </Modal>
    </motion.div>
  );
};

const eventTypeColors: Record<EventType, string> = {
  预警: 'bg-tech-red/20 text-tech-red border-tech-red/40',
  审批: 'bg-tech-blue/20 text-tech-blue border-tech-blue/40',
  工单: 'bg-tech-orange/20 text-tech-orange border-tech-orange/40',
  应急: 'bg-tech-purple/20 text-tech-purple border-tech-purple/40',
  进度: 'bg-tech-green/20 text-tech-green border-tech-green/40',
};

const eventLevelColors: Record<EventLevel, string> = {
  info: 'bg-tech-cyan',
  warning: 'bg-tech-orange',
  danger: 'bg-tech-red',
};

export const RightEventPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'warning' | 'event'>('warning');
  const monitoringPoints = useStore((s) => s.monitoringPoints);
  const eventLogs = useStore((s) => s.eventLogs);

  const warnings = monitoringPoints.filter((m) => m.status === 'danger' || m.status === 'warning');
  const sortedEvents = [...eventLogs].sort((a, b) => b.time.localeCompare(a.time));

  const getStatusBadge = (status: MonitoringPoint['status']) => {
    if (status === 'danger') return <span className="w-2.5 h-2.5 rounded-full bg-tech-red animate-blink-red shadow-[0_0_8px_#FF4D4F]" />;
    return <span className="w-2.5 h-2.5 rounded-full bg-tech-orange animate-blink-orange shadow-[0_0_8px_#FA8C16]" />;
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
      className="tech-panel fixed right-4 top-24 bottom-4 z-30 w-80 rounded-xl overflow-hidden flex flex-col"
    >
      <div className="relative flex-1 flex flex-col">
        <HudCorners />

        <div className="relative z-10 flex border-b border-tech-border/50">
          <button
            onClick={() => setActiveTab('warning')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-all duration-300 relative',
              activeTab === 'warning' ? 'text-tech-blue' : 'text-gray-400 hover:text-white',
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>预警</span>
              {warnings.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-tech-red text-white text-[10px] font-bold min-w-[18px] text-center">
                  {warnings.length}
                </span>
              )}
            </div>
            {activeTab === 'warning' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-tech-blue rounded-full shadow-[0_0_10px_#1890FF]" />}
          </button>
          <button
            onClick={() => setActiveTab('event')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-all duration-300 relative',
              activeTab === 'event' ? 'text-tech-blue' : 'text-gray-400 hover:text-white',
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Activity className="w-4 h-4" />
              <span>事件</span>
            </div>
            {activeTab === 'event' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-tech-blue rounded-full shadow-[0_0_10px_#1890FF]" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto z-10 max-h-[calc(100vh-200px)]">
          {activeTab === 'warning' ? (
            <div className="p-3 space-y-2">
              {warnings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">暂无预警信息</p>
                </div>
              ) : (
                warnings.map((point, index) => (
                  <motion.div
                    key={point.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-3 rounded-lg bg-white/5 border border-tech-border/30 hover:bg-tech-blue/10 hover:border-tech-blue/40 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(point.status)}
                        <span className="font-mono text-sm text-white font-medium">{point.code}</span>
                      </div>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          point.status === 'danger'
                            ? 'bg-tech-red/20 text-tech-red'
                            : 'bg-tech-orange/20 text-tech-orange',
                        )}
                      >
                        {point.status === 'danger' ? '危险' : '警告'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">沉降值</span>
                      <span
                        className={cn(
                          'text-sm font-bold font-orbitron',
                          point.status === 'danger' ? 'text-tech-red' : 'text-tech-orange',
                        )}
                      >
                        {point.currentValue} <span className="text-xs font-normal text-gray-500">mm</span>
                      </span>
                    </div>
                    <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((point.currentValue / point.threshold) * 100, 100)}%`,
                          backgroundColor: point.status === 'danger' ? '#FF4D4F' : '#FA8C16',
                        }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                      <span>阈值 {point.threshold}mm</span>
                      <span>预警 {point.warningThreshold}mm</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {sortedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Activity className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">暂无事件日志</p>
                </div>
              ) : (
                sortedEvents.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="p-3 rounded-lg bg-white/5 border border-tech-border/30 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-1.5 flex-shrink-0">
                        <span className={cn('w-2 h-2 rounded-full inline-block shadow-[0_0_6px_currentColor]', {
                          'bg-tech-red text-tech-red': log.level === 'danger',
                          'bg-tech-orange text-tech-orange': log.level === 'warning',
                          'bg-tech-cyan text-tech-cyan': log.level === 'info',
                        })} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', eventTypeColors[log.type])}>
                            {log.type}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">{log.time}</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed break-words">{log.content}</p>
                        {log.operator && (
                          <p className="text-[10px] text-gray-500 mt-1">操作人：{log.operator}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const nodeStatusColors: Record<StationNode['status'], string> = {
  pending: 'bg-gray-500',
  inProgress: 'bg-tech-blue',
  completed: 'bg-tech-green',
  delayed: 'bg-tech-red',
};

const nodeStatusText: Record<StationNode['status'], string> = {
  pending: '未开始',
  inProgress: '进行中',
  completed: '已完成',
  delayed: '已延期',
};

export const BottomProgressPanel: React.FC = () => {
  const stationNodes = useStore((s) => s.stationNodes);
  const keyNodes = stationNodes.filter((n) => n.isKeyNode);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
      className="tech-panel fixed left-96 right-96 bottom-4 z-30 h-28 rounded-xl overflow-hidden scan-line-overlay"
    >
      <div className="relative w-full h-full">
        <HudCorners />

        <div className="relative z-10 p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-1 h-4 bg-tech-cyan rounded-full" />
              车站施工进度 - 关键节点
            </h2>
            <div className="flex items-center gap-4 text-[10px] text-gray-400">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tech-green" />已完成</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tech-blue" />进行中</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tech-red" />已延期</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500" />未开始</div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-between relative">
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-tech-blue/50 via-tech-cyan/50 to-tech-blue/50 -translate-y-1/2" />

            <div className="relative z-10 w-full flex items-center justify-around">
              {keyNodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  {node.status === 'delayed' && node.suggestion ? (
                    <Tooltip
                      title={<span className="text-xs">{node.suggestion}</span>}
                      color="#FF4D4F"
                      placement="top"
                    >
                      <div className="cursor-help">
                        <Progress
                          type="circle"
                          percent={node.progress}
                          size={44}
                          strokeColor={nodeStatusColors[node.status]}
                          trailColor="rgba(255,255,255,0.08)"
                          strokeWidth={5}
                          format={(p) => <span className="text-[10px] font-bold text-white">{p}%</span>}
                        />
                      </div>
                    </Tooltip>
                  ) : (
                    <Progress
                      type="circle"
                      percent={node.progress}
                      size={44}
                      strokeColor={nodeStatusColors[node.status]}
                      trailColor="rgba(255,255,255,0.08)"
                      strokeWidth={5}
                      format={(p) => <span className="text-[10px] font-bold text-white">{p}%</span>}
                    />
                  )}

                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]',
                        {
                          'bg-tech-green text-tech-green': node.status === 'completed',
                          'bg-tech-blue text-tech-blue': node.status === 'inProgress',
                          'bg-tech-red text-tech-red animate-pulse': node.status === 'delayed',
                          'bg-gray-500': node.status === 'pending',
                        },
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs font-medium',
                        node.status === 'delayed' ? 'text-tech-red' : node.status === 'completed' ? 'text-tech-green' : 'text-white',
                      )}
                    >
                      {node.name}
                    </span>
                  </div>
                  <span className={cn('text-[10px] mt-0.5', node.status === 'delayed' ? 'text-tech-red' : 'text-gray-500')}>
                    {nodeStatusText[node.status]}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default {
  TopNavbar,
  LeftNavPanel,
  ShieldInfoPanel,
  RightEventPanel,
  BottomProgressPanel,
};
