import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Building2, Camera, Check, Loader2 } from 'lucide-react';
import useStore from '@/store/useStore';
import type { UserRole } from '@/types';

const roles: { key: UserRole; name: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { key: 'worker', name: '施工员', desc: '一线施工操作与数据确认', icon: <User className="w-8 h-8" />, color: 'from-teal-500 to-cyan-600' },
  { key: 'manager', name: '项目经理', desc: '项目审批与调度指挥', icon: <Shield className="w-8 h-8" />, color: 'from-blue-500 to-indigo-600' },
  { key: 'director', name: '公司领导', desc: '全局决策与报表导出', icon: <Building2 className="w-8 h-8" />, color: 'from-purple-500 to-pink-600' },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      // Fallback: 模拟人脸识别
    }
  };

  const handleScan = async (role: UserRole) => {
    setSelectedRole(role);
    setScanning(true);
    setScanProgress(0);
    await startCamera();

    const timer = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            login(role);
            navigate('/dashboard');
          }, 500);
          return 100;
        }
        return p + 4;
      });
    }, 80);
  };

  return (
    <div className="w-full h-full star-bg relative overflow-hidden flex flex-col">
      <div className="scan-line-overlay absolute inset-0 pointer-events-none" />

      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-tech-blue/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-tech-cyan/10 to-transparent pointer-events-none" />

      <div className="flex-shrink-0 pt-10 pb-6 text-center relative z-10">
        <h1 className="tech-title text-4xl md:text-5xl font-bold tracking-wider mb-3">
          智慧地铁施工综合调度平台
        </h1>
        <p className="text-tech-blue/80 text-sm tracking-widest font-orbitron">
          INTELLIGENT METRO CONSTRUCTION DISPATCHING PLATFORM
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-tech-border" />
          <span>3D可视化 · 实时监测 · 应急调度</span>
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-tech-border" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <AnimatePresence mode="wait">
          {!selectedRole ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
            >
              {roles.map((r) => (
                <motion.div
                  key={r.key}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleScan(r.key)}
                  className="tech-panel p-8 cursor-pointer group relative overflow-hidden"
                >
                  <div className="hud-corner-tl" /><div className="hud-corner-tr" />
                  <div className="hud-corner-bl" /><div className="hud-corner-br" />
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-6 group-hover:shadow-2xl transition-all mx-auto`}>
                    {r.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-center mb-2 font-orbitron tracking-wide">{r.name}</h3>
                  <p className="text-white/60 text-sm text-center mb-6">{r.desc}</p>
                  <button className="tech-btn tech-btn-primary w-full flex items-center justify-center gap-2 py-3">
                    <Camera className="w-4 h-4" />
                    人脸识别登录
                  </button>
                  <div className={`absolute inset-0 bg-gradient-to-br ${r.color} opacity-0 group-hover:opacity-5 transition-all duration-500 pointer-events-none`} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="scan"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="tech-panel p-10 w-full max-w-2xl relative"
            >
              <div className="hud-corner-tl" /><div className="hud-corner-tr" />
              <div className="hud-corner-bl" /><div className="hud-corner-br" />

              <div className="text-center mb-6">
                <div className={`inline-block w-16 h-16 rounded-xl bg-gradient-to-br ${roles.find(r => r.key === selectedRole)?.color} flex items-center justify-center mb-4`}>
                  {roles.find(r => r.key === selectedRole)?.icon}
                </div>
                <h2 className="text-2xl font-bold mb-1">正在识别 <span className="tech-title">{roles.find(r => r.key === selectedRole)?.name}</span></h2>
                <p className="text-white/50 text-sm">请保持面部正对摄像头</p>
              </div>

              <div className="relative mx-auto w-full max-w-md aspect-square rounded-full overflow-hidden border-4 border-tech-blue/60">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-tech-blue/20 to-tech-cyan/10" />
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover rounded-full opacity-80"
                  muted playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="absolute w-[80%] h-1 bg-gradient-to-r from-transparent via-tech-green to-transparent"
                    style={{ top: `${scanProgress}%`, transition: 'top 0.08s linear' }}
                  />
                </div>

                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(24,144,255,0.15)" strokeWidth="2" />
                  <circle
                    cx="50" cy="50" r="48"
                    fill="none"
                    stroke="url(#scanGradient)"
                    strokeWidth="3"
                    strokeDasharray={`${scanProgress * 3.01} 301`}
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />
                  <defs>
                    <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#52C41A" />
                      <stop offset="100%" stopColor="#1890FF" />
                    </linearGradient>
                  </defs>
                </svg>

                {scanProgress >= 100 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-tech-green/20 backdrop-blur-sm"
                  >
                    <Check className="w-24 h-24 text-tech-green drop-shadow-lg" />
                  </motion.div>
                )}
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">特征提取进度</span>
                  <span className="font-orbitron text-tech-blue">{scanProgress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-tech-green via-tech-cyan to-tech-blue"
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ duration: 0.08 }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-white/50">
                  {scanning && scanProgress < 100 && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>
                    {scanProgress < 30 ? '正在采集人脸特征...' :
                     scanProgress < 70 ? '特征比对中，请稍候...' :
                     scanProgress < 100 ? '身份验证即将完成...' :
                     '验证成功，正在登录...'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedRole(null);
                  setScanning(false);
                  setScanProgress(0);
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                  }
                }}
                className="mt-8 tech-btn w-full"
              >
                ← 返回角色选择
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 py-4 text-center text-xs text-white/30 relative z-10">
        <p>© 2026 智慧地铁建设工程指挥部 · 系统版本 v2.6.0 · 所有操作均记录日志</p>
      </div>
    </div>
  );
}
