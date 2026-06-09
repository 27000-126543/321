import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Waves, Mountain, Flame, Biohazard, Siren, CheckCircle, AlertTriangle, Clock, Users, MapPin, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { EmergencyType, Worker } from '@/types';
import dayjs from 'dayjs';

const HudCorners: React.FC<{ className?: string }> = ({ className = '' }) => (
  <>
    <div className={cn('hud-corner-tl', className)} />
    <div className={cn('hud-corner-tr', className)} />
    <div className={cn('hud-corner-bl', className)} />
    <div className={cn('hud-corner-br', className)} />
  </>
);

const eventTypeConfig: { type: EmergencyType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: '涌水', label: '涌水Waves', icon: <Waves className="w-8 h-8" />, color: '#1890FF' },
  { type: '坍塌', label: '坍塌Mountain', icon: <Mountain className="w-8 h-8" />, color: '#FA8C16' },
  { type: '火灾', label: '火灾Flame', icon: <Flame className="w-8 h-8" />, color: '#FF4D4F' },
  { type: '有害气体', label: '有害气体Biohazard', icon: <Biohazard className="w-8 h-8" />, color: '#722ED1' },
];

const timelineSteps = [
  { key: '发生', label: '事件发生' },
  { key: '预案', label: '启动预案' },
  { key: '疏散', label: '疏散通知' },
  { key: '救援', label: '救援到位' },
  { key: '医疗', label: '医疗介入' },
  { key: '解除', label: '事件解除' },
];

const EvacuationSVG: React.FC<{ eventActive: boolean; affectedWorkers: Worker[] }> = ({ eventActive, affectedWorkers }) => {
  const tunnelWidth = 800;
  const tunnelHeight = 300;

  const evacuatePoints = eventActive ? useStore.getState().emergencyEvent?.evacuatePath.map(p => ({
    x: 400 + (p.x / 20) * 350,
    y: 150 + (p.z / 15) * 100,
  })) : null;

  const rescuePoints = eventActive ? useStore.getState().emergencyEvent?.rescuePath.map(p => ({
    x: 400 + (p.x / 20) * 350,
    y: 150 + (p.z / 15) * 100,
  })) : null;

  const toPathD = (points: { x: number; y: number }[] | undefined) => {
    if (!points || points.length === 0) return '';
    return points.reduce((acc, p, i) => {
      const cmd = i === 0 ? 'M' : 'L';
      return `${acc} ${cmd} ${p.x} ${p.y}`;
    }, '');
  };

  const workerPositions = affectedWorkers.slice(0, 5).map((w, i) => ({
    x: 200 + i * 90,
    y: 150 + Math.sin(i) * 30,
  }));

  return (
    <svg width={tunnelWidth} height={tunnelHeight} className="w-full h-auto">
      <defs>
        <linearGradient id="tunnelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(24, 144, 255, 0.05)" />
          <stop offset="50%" stopColor="rgba(24, 144, 255, 0.15)" />
          <stop offset="100%" stopColor="rgba(24, 144, 255, 0.05)" />
        </linearGradient>
        <linearGradient id="evacGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#52C41A" />
          <stop offset="100%" stopColor="#95DE64" />
        </linearGradient>
        <linearGradient id="rescueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1890FF" />
          <stop offset="100%" stopColor="#40A9FF" />
        </linearGradient>
        <filter id="glowGreen">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glowBlue">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="20" y="40" width={tunnelWidth - 40} height={tunnelHeight - 80} rx="20" fill="url(#tunnelGrad)" stroke="rgba(24, 144, 255, 0.3)" strokeWidth="2" />
      <line x1="20" y1="150" x2={tunnelWidth - 20} y2="150" stroke="rgba(24, 144, 255, 0.2)" strokeWidth="1" strokeDasharray="5,5" />
      <line x1="400" y1="40" x2="400" y2={tunnelHeight - 40} stroke="rgba(24, 144, 255, 0.15)" strokeWidth="1" strokeDasharray="3,3" />

      {[100, 250, 550, 700].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="55" x2={x} y2={tunnelHeight - 55} stroke="rgba(24, 144, 255, 0.12)" strokeWidth="1" />
          <circle cx={x} cy="60" r="4" fill="rgba(24, 144, 255, 0.4)" />
          <circle cx={x} cy={tunnelHeight - 60} r="4" fill="rgba(24, 144, 255, 0.4)" />
        </g>
      ))}

      {eventActive && evacuatePoints && (
        <>
          <path
            d={toPathD(evacuatePoints)}
            fill="none"
            stroke="url(#evacGrad)"
            strokeWidth="4"
            strokeDasharray="12,8"
            strokeLinecap="round"
            filter="url(#glowGreen)"
          >
            <animate attributeName="strokeDashoffset" from="0" to="-40" dur="1s" repeatCount="indefinite" />
          </path>
          {evacuatePoints.map((p, i) => (
            <circle key={`evac-${i}`} cx={p.x} cy={p.y} r="5" fill="#52C41A" filter="url(#glowGreen)">
              <animate attributeName="r" values="5;8;5" dur="1.2s" repeatCount="indefinite" begin={`${i * 0.15}s`} />
            </circle>
          ))}
        </>
      )}

      {eventActive && rescuePoints && (
        <>
          <path
            d={toPathD(rescuePoints)}
            fill="none"
            stroke="url(#rescueGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#glowBlue)"
          >
            <animate attributeName="stroke-width" values="4;5;4" dur="1.5s" repeatCount="indefinite" />
          </path>
          {rescuePoints.map((p, i) => (
            <circle key={`rescue-${i}`} cx={p.x} cy={p.y} r="5" fill="#1890FF" filter="url(#glowBlue)">
              <animate attributeName="r" values="5;8;5" dur="1.2s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
            </circle>
          ))}
        </>
      )}

      {workerPositions.map((pos, i) => (
        <g key={`worker-${i}`}>
          <circle cx={pos.x} cy={pos.y} r="8" fill="rgba(255, 173, 20, 0.3)" />
          <circle cx={pos.x} cy={pos.y} r="5" fill="#FAAD14">
            <animate attributeName="r" values="5;6;5" dur="1s" repeatCount="indefinite" />
          </circle>
          <text x={pos.x} y={pos.y - 12} textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace">
            {affectedWorkers[i]?.name || '人员'}
          </text>
        </g>
      ))}

      <g>
        <rect x="30" y="55" width="60" height="35" rx="6" fill="rgba(82, 196, 26, 0.15)" stroke="#52C41A" strokeWidth="2" />
        <text x="60" y="78" textAnchor="middle" fill="#52C41A" fontSize="12" fontWeight="bold">安全出口</text>
        <polygon points="90,72 105,72 97,65 105,72 97,79" fill="#52C41A" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />
        </polygon>
      </g>

      <g>
        <rect x={tunnelWidth - 90} y="55" width="60" height="35" rx="6" fill="rgba(24, 144, 255, 0.15)" stroke="#1890FF" strokeWidth="2" />
        <text x={tunnelWidth - 60} y="78" textAnchor="middle" fill="#1890FF" fontSize="12" fontWeight="bold">救援基地</text>
        <polygon points={`${tunnelWidth - 90},72 ${tunnelWidth - 105},72 ${tunnelWidth - 97},65 ${tunnelWidth - 105},72 ${tunnelWidth - 97},79`} fill="#1890FF" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />
        </polygon>
      </g>

      <g>
        <rect x={tunnelWidth / 2 - 35} y={tunnelHeight - 65} width="70" height="30" rx="5" fill="rgba(255, 77, 79, 0.15)" stroke="#FF4D4F" strokeWidth="1.5" strokeDasharray="4,2" />
        <text x={tunnelWidth / 2} y={tunnelHeight - 46} textAnchor="middle" fill="#FF4D4F" fontSize="11" fontWeight="bold">事故点</text>
      </g>
    </svg>
  );
};

export default function Emergency() {
  const navigate = useNavigate();
  const { emergencyEvent, startEmergency, resolveEmergency, workers, currentUser, logout } = useStore();
  const [selectedType, setSelectedType] = useState<EmergencyType>('涌水');

  const affectedWorkers = useMemo(() => {
    if (!emergencyEvent) return [];
    return workers.filter((w) => emergencyEvent.affectedPersonnel.includes(w.id));
  }, [emergencyEvent, workers]);

  const overtimeWorkers = useMemo(() => {
    return affectedWorkers.filter((w) => w.status === 'overtime');
  }, [affectedWorkers]);

  const eventActive = emergencyEvent !== null;

  const currentStepIndex = useMemo(() => {
    if (!eventActive) return -1;
    const diffMinutes = dayjs().diff(dayjs(emergencyEvent!.startTime), 'minute');
    if (diffMinutes < 1) return 0;
    if (diffMinutes < 5) return 1;
    if (diffMinutes < 10) return 2;
    if (diffMinutes < 20) return 3;
    if (diffMinutes < 40) return 4;
    return 4;
  }, [eventActive, emergencyEvent]);

  const handleStartEmergency = () => {
    startEmergency(selectedType);
  };

  const handleResolveEmergency = () => {
    resolveEmergency();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-full h-full star-bg overflow-hidden flex flex-col">
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'tech-panel relative w-full px-6 py-3 flex items-center justify-between',
          eventActive && 'animate-pulse-fast',
        )}
        style={eventActive ? { borderColor: 'rgba(255, 77, 79, 0.6)', boxShadow: '0 0 30px rgba(255, 77, 79, 0.3)' } : {}}
      >
        <HudCorners />

        <div className="flex items-center gap-4 z-10">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg',
            eventActive
              ? 'bg-gradient-to-br from-tech-red to-tech-orange shadow-tech-red/40'
              : 'bg-gradient-to-br from-tech-blue to-tech-cyan shadow-tech-blue/30',
          )}>
            <Siren className={cn('w-6 h-6 text-white', eventActive && 'animate-bounce')} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tech-title tracking-wide">应急指挥中心</h1>
            <p className="text-xs text-gray-400 mt-0.5">Emergency Command Center</p>
          </div>
          {eventActive && (
            <span className="px-3 py-1 rounded-full bg-tech-red/20 border border-tech-red/50 text-tech-red text-xs font-bold animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tech-red animate-ping" />
              应急状态 ACTIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="grid grid-cols-4 gap-2">
            {eventTypeConfig.map((config) => {
              const isSelected = selectedType === config.type;
              const isActiveEvent = eventActive && emergencyEvent?.type === config.type;
              return (
                <motion.button
                  key={config.type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedType(config.type)}
                  disabled={eventActive}
                  className={cn(
                    'relative px-4 py-2.5 rounded-lg border-2 transition-all duration-300 flex flex-col items-center gap-1 min-w-[110px]',
                    isActiveEvent
                      ? 'border-tech-red bg-tech-red/20 text-white animate-pulse-fast'
                      : isSelected
                        ? 'border-tech-blue bg-tech-blue/20 text-tech-blue shadow-[0_0_15px_rgba(24,144,255,0.4)]'
                        : 'border-tech-border/50 bg-white/5 text-gray-400 hover:border-tech-blue/50 hover:text-white hover:bg-white/10',
                    eventActive && !isActiveEvent && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {isActiveEvent && <div className="absolute inset-0 rounded-lg border-2 border-tech-red/60 animate-ping" />}
                  <div style={{ color: isActiveEvent ? '#FF4D4F' : isSelected ? config.color : undefined }}>
                    {config.icon}
                  </div>
                  <span className="text-xs font-medium">{config.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 z-10">
          {currentUser && (
            <div className="flex items-center gap-3 pl-4 border-l border-tech-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tech-purple to-tech-blue flex items-center justify-center border-2 border-tech-blue/50">
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

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="tech-panel relative rounded-xl p-4 flex flex-col"
          style={{ width: '25%' }}
        >
          <HudCorners />

          <div className="relative z-10 flex-1 flex flex-col min-h-0">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-tech-blue rounded-full" />
              当前应急状态
            </h2>

            {eventActive && emergencyEvent ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative rounded-xl p-5 border-2 border-tech-red bg-gradient-to-br from-tech-red/20 to-tech-orange/10 animate-pulse-fast shadow-[0_0_30px_rgba(255,77,79,0.3)]"
              >
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-tech-red text-white text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  ACTIVE
                </div>

                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-tech-red/30">
                  <div className="w-14 h-14 rounded-xl bg-tech-red/30 flex items-center justify-center">
                    {eventTypeConfig.find((c) => c.type === emergencyEvent.type)?.icon || <AlertTriangle className="w-7 h-7 text-tech-red" />}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">事件类型</p>
                    <p className="text-xl font-bold text-tech-red">{emergencyEvent.type}事件</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>开始时间</span>
                    </div>
                    <span className="text-white text-sm font-mono font-medium">{emergencyEvent.startTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Users className="w-4 h-4" />
                      <span>影响人数</span>
                    </div>
                    <span className="text-tech-orange text-lg font-bold font-orbitron">{emergencyEvent.affectedPersonnel.length} 人</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>超时人员</span>
                    </div>
                    <span className={cn(
                      'text-lg font-bold font-orbitron',
                      overtimeWorkers.length > 0 ? 'text-tech-red animate-pulse' : 'text-tech-green',
                    )}>
                      {overtimeWorkers.length} 人
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Shield className="w-4 h-4" />
                      <span>状态</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-tech-red/30 text-tech-red text-xs font-bold border border-tech-red/50">
                      应急响应中
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-xl p-5 border-2 border-tech-green/40 bg-gradient-to-br from-tech-green/15 to-tech-cyan/10 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-tech-green/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-tech-green" />
                </div>
                <p className="text-xl font-bold text-tech-green mb-2">当前无应急事件</p>
                <p className="text-sm text-gray-400">系统运行正常</p>
                <div className="mt-5 pt-4 border-t border-tech-border/50 space-y-2 text-left">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">在籍人员</span>
                    <span className="text-white font-medium font-orbitron">{workers.length} 人</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">地下作业</span>
                    <span className="text-tech-blue font-medium font-orbitron">{workers.filter(w => w.area !== '地面').length} 人</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">密闭舱室</span>
                    <span className={cn(
                      'font-medium font-orbitron',
                      workers.filter(w => w.area === '密闭舱室' && w.status === 'overtime').length > 0
                        ? 'text-tech-red animate-pulse'
                        : 'text-tech-green',
                    )}>
                      {workers.filter(w => w.area === '密闭舱室').length} 人
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col gap-4 flex-1 min-w-0"
          style={{ width: '50%' }}
        >
          <div className="tech-panel relative rounded-xl p-4">
            <HudCorners />
            <div className="relative z-10 flex items-center justify-center gap-6">
              <motion.button
                whileHover={{ scale: eventActive ? 1 : 1.05 }}
                whileTap={{ scale: eventActive ? 1 : 0.95 }}
                onClick={handleStartEmergency}
                disabled={eventActive}
                className={cn(
                  'relative px-12 py-5 rounded-xl font-bold text-xl transition-all duration-300 border-2 overflow-hidden group',
                  eventActive
                    ? 'opacity-50 cursor-not-allowed bg-gray-600/20 border-gray-500/40 text-gray-400'
                    : 'tech-btn-danger border-tech-red/60 text-tech-red hover:text-white shadow-[0_0_30px_rgba(255,77,79,0.3)]',
                )}
              >
                {!eventActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-tech-red/0 via-tech-red/30 to-tech-red/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <Siren className={cn('w-8 h-8', !eventActive && 'animate-pulse')} />
                  一键启动应急
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: !eventActive ? 1 : 1.05 }}
                whileTap={{ scale: !eventActive ? 1 : 0.95 }}
                onClick={handleResolveEmergency}
                disabled={!eventActive}
                className={cn(
                  'relative px-12 py-5 rounded-xl font-bold text-xl transition-all duration-300 border-2 overflow-hidden group',
                  !eventActive
                    ? 'opacity-50 cursor-not-allowed bg-gray-600/20 border-gray-500/40 text-gray-400'
                    : 'tech-btn-success border-tech-green/60 text-tech-green hover:text-white shadow-[0_0_30px_rgba(82,196,26,0.3)]',
                )}
              >
                {eventActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-tech-green/0 via-tech-green/30 to-tech-green/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <CheckCircle className="w-8 h-8" />
                  解除应急
                </span>
              </motion.button>
            </div>
          </div>

          <div className="tech-panel relative rounded-xl p-4 flex-1 flex flex-col min-h-0">
            <HudCorners />
            <div className="relative z-10 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-1 h-5 bg-tech-blue rounded-full" />
                  疏散路径与救援路径可视化
                </h2>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-1 rounded-full bg-tech-green" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #52C41A 0px, #52C41A 6px, transparent 6px, transparent 10px)' }} />
                    <span className="text-gray-400">疏散路径</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-1 rounded-full bg-tech-blue" />
                    <span className="text-gray-400">救援路径</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center bg-black/20 rounded-lg border border-tech-border/30 p-2 overflow-hidden">
                <EvacuationSVG eventActive={eventActive} affectedWorkers={eventActive ? affectedWorkers : workers.slice(0, 5)} />
              </div>
            </div>
          </div>

          <div className="tech-panel relative rounded-xl p-4">
            <HudCorners />
            <div className="relative z-10">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <span className="w-1 h-5 bg-tech-blue rounded-full" />
                应急处置时间轴
              </h2>
              <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-tech-border/60" />
                <div
                  className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-tech-red via-tech-orange to-tech-green transition-all duration-500"
                  style={{ width: `${eventActive ? `${((currentStepIndex + 1) / timelineSteps.length) * 100}%` : '0%'}` }}
                />
                <div className="relative flex justify-between">
                  {timelineSteps.map((step, index) => {
                    const isDone = eventActive && index <= currentStepIndex;
                    const isCurrent = eventActive && index === currentStepIndex;
                    return (
                      <div key={step.key} className="flex flex-col items-center" style={{ width: `${100 / timelineSteps.length}%` }}>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.08 }}
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300',
                            isCurrent
                              ? 'bg-tech-red border-tech-red shadow-[0_0_20px_rgba(255,77,79,0.6)] animate-pulse'
                              : isDone
                                ? 'bg-tech-green border-tech-green shadow-[0_0_10px_rgba(82,196,26,0.4)]'
                                : 'bg-tech-panel border-tech-border/60',
                          )}
                        >
                          {isDone ? (
                            <CheckCircle className={cn('w-5 h-5', isCurrent ? 'text-white' : 'text-white')} />
                          ) : (
                            <span className={cn('font-bold text-sm font-orbitron', isCurrent ? 'text-white' : 'text-gray-500')}>
                              {index + 1}
                            </span>
                          )}
                        </motion.div>
                        <p className={cn(
                          'text-xs mt-2 text-center font-medium',
                          isCurrent ? 'text-tech-red animate-pulse' : isDone ? 'text-tech-green' : 'text-gray-500',
                        )}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="tech-panel relative rounded-xl p-4 flex flex-col"
          style={{ width: '25%' }}
        >
          <HudCorners />

          <div className="relative z-10 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-tech-blue rounded-full" />
                受影响人员
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-tech-blue/20 text-tech-blue text-xs font-medium border border-tech-blue/40">
                {affectedWorkers.length} 人
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(eventActive ? affectedWorkers : workers.filter((w) => w.area !== '地面')).map((worker, index) => {
                const isOvertime = worker.status === 'overtime';
                return (
                  <motion.div
                    key={worker.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                    className={cn(
                      'relative p-3 rounded-lg border transition-all duration-300',
                      isOvertime
                        ? 'bg-tech-red/15 border-tech-red/50 animate-pulse-fast shadow-[0_0_15px_rgba(255,77,79,0.2)]'
                        : 'bg-white/5 border-tech-border/40 hover:bg-tech-blue/10 hover:border-tech-blue/40',
                    )}
                  >
                    {isOvertime && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-tech-red text-white text-[9px] font-bold animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        超时
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        isOvertime
                          ? 'bg-tech-red/30 border border-tech-red/50'
                          : 'bg-tech-blue/20 border border-tech-blue/40',
                      )}>
                        <span className={cn('font-bold text-sm', isOvertime ? 'text-tech-red' : 'text-tech-blue')}>
                          {worker.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn('font-bold text-sm truncate', isOvertime ? 'text-tech-red' : 'text-white')}>
                            {worker.name}
                          </p>
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 ml-2',
                            isOvertime
                              ? 'bg-tech-red/20 text-tech-red border-tech-red/40'
                              : 'bg-tech-cyan/20 text-tech-cyan border-tech-cyan/40',
                          )}>
                            {worker.jobType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{worker.area}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">
                            ({worker.position.x.toFixed(1)}, {worker.position.z.toFixed(1)})
                          </span>
                          <span className={cn(
                            'text-[10px] font-medium',
                            isOvertime ? 'text-tech-red animate-pulse' : 'text-tech-green',
                          )}>
                            {isOvertime ? '⚠ 需救援' : '✓ 联系中'}
                          </span>
                        </div>
                        {worker.enterTime && (
                          <div className="mt-1 pt-1 border-t border-tech-border/30 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">进入时间</span>
                            <span className={cn(
                              'text-[10px] font-mono',
                              isOvertime ? 'text-tech-red' : 'text-gray-400',
                            )}>
                              {worker.enterTime.slice(11)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {affectedWorkers.length === 0 && !eventActive && (
                <div className="text-center py-10 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">暂无受影响人员</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
