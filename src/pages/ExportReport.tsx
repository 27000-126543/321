import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Eye, Printer, Calendar, Building2, User, PieChart as PieChartIcon, List, ArrowLeft, LogOut, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DatePicker, Input, message, Segmented } from 'antd';
const { RangePicker } = DatePicker;
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import useStore from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { EventType, ReportMode } from '@/types';

const HudCorners: React.FC<{ className?: string }> = ({ className = '' }) => (
  <>
    <div className={cn('hud-corner-tl', className)} />
    <div className={cn('hud-corner-tr', className)} />
    <div className={cn('hud-corner-bl', className)} />
    <div className={cn('hud-corner-br', className)} />
  </>
);

const COLORS: Record<EventType, string> = {
  预警: '#FF4D4F',
  审批: '#1890FF',
  工单: '#FA8C16',
  应急: '#722ED1',
  进度: '#52C41A',
};

const eventTypeList: EventType[] = ['预警', '审批', '工单', '应急', '进度'];

const MODE_LABEL: Record<ReportMode, string> = {
  daily: '日报',
  weekly: '周报',
  monthly: '月报',
};

const DAILY_RINGS = 3;
const WEEKLY_BASIS = 7;
const MONTHLY_BASIS = 30;

export default function ExportReport() {
  const navigate = useNavigate();
  const { shields, monitoringPoints, eventLogs, currentUser, logout } = useStore();
  const [reportMode, setReportMode] = useState<ReportMode>('daily');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('day'), dayjs().endOf('day')]);
  const [projectName, setProjectName] = useState('XX地铁1号线XX标项目');
  const [isPreview, setIsPreview] = useState(true);

  const handleModeChange = (mode: ReportMode) => {
    setReportMode(mode);
    if (mode === 'daily') {
      setDateRange([dayjs().startOf('day'), dayjs().endOf('day')]);
    } else if (mode === 'weekly') {
      setDateRange([dayjs().startOf('week').add(1, 'day'), dayjs().endOf('week').add(1, 'day')]);
    } else {
      setDateRange([dayjs().startOf('month'), dayjs().endOf('month')]);
    }
  };

  const [rangeStart, rangeEnd] = dateRange;
  const totalDays = Math.max(1, rangeEnd.diff(rangeStart, 'day') + 1);
  const diffFromToday = Math.max(0, dayjs().diff(rangeEnd, 'day'));

  const todayRingsData = useMemo(() => {
    return shields.map((shield) => {
      const history = shield.history24h;
      const firstRings = history.length > 0 ? history[0].rings : 0;
      const lastRings = history.length > 0 ? history[history.length - 1].rings : shield.totalRings;
      let todayRings = Math.max(0, lastRings - firstRings);
      let totalRings = shield.totalRings;

      todayRings = Math.max(0, todayRings * totalDays - diffFromToday * DAILY_RINGS);
      totalRings = Math.max(0, totalRings - diffFromToday * DAILY_RINGS);

      const speedOffset = ((shield.id.charCodeAt(shield.id.length - 1) % 5) - 2) * 0.3;
      const avgSpeed = history.length > 0
        ? Math.max(10, Number((history.reduce((sum, h) => sum + h.thrustSpeed, 0) / history.length + speedOffset).toFixed(1)))
        : Math.max(10, Number((shield.thrustSpeed + speedOffset).toFixed(1)));

      const torqueOffset = ((shield.id.charCodeAt(0) % 5) - 2) * 80;
      const maxTorque = history.length > 0
        ? Math.max(2000, Math.min(6000, Math.max(...history.map((h) => h.cutterTorque)) + Math.floor(torqueOffset)))
        : Math.max(2000, Math.min(6000, shield.cutterTorque + Math.floor(torqueOffset)));

      const runHoursPerDay = 24;
      return {
        ...shield,
        todayRings,
        totalRings,
        avgSpeed,
        maxTorque,
        runHours: runHoursPerDay * totalDays,
        ringPerDay: totalDays > 0 ? Number((todayRings / totalDays).toFixed(1)) : 0,
      };
    });
  }, [shields, totalDays, diffFromToday]);

  const monitoringDisplay = useMemo(() => {
    return monitoringPoints.map((point) => {
      const offsetValue = Number((diffFromToday * 0.5 + (point.id.charCodeAt(point.id.length - 1) % 3) * 0.1).toFixed(1));
      const currentValue = Number(Math.max(0, point.currentValue - offsetValue).toFixed(1));

      let maxValue: number;
      let avgValue: number;
      if (totalDays <= 1) {
        maxValue = currentValue;
        avgValue = currentValue;
      } else {
        const dailyMaxBump = Math.min(totalDays * 0.8, 8);
        maxValue = Number(Math.min(currentValue + dailyMaxBump, point.threshold * 1.8).toFixed(1));
        avgValue = Number((currentValue + (maxValue - currentValue) * 0.4).toFixed(1));
      }

      const trendPrev = point.trend.length > 1 ? Math.max(0, point.trend[point.trend.length - 2] - offsetValue * 0.8) : currentValue;
      const change = Number((currentValue - trendPrev).toFixed(1));
      const newStatus: 'normal' | 'warning' | 'danger' = maxValue >= point.threshold
        ? 'danger'
        : maxValue >= point.warningThreshold
          ? 'warning'
          : 'normal';
      const statusText = newStatus === 'normal' ? '正常' : newStatus === 'warning' ? '预警' : '危险';
      const remark = newStatus === 'danger'
        ? `${totalDays}日内峰值超阈值，需重点关注`
        : newStatus === 'warning'
          ? `${totalDays}日内接近阈值，持续监测`
          : `${totalDays}日数据平稳`;

      return {
        ...point,
        currentValue,
        maxValue,
        avgValue,
        change,
        status: newStatus,
        statusText,
        remark,
      };
    });
  }, [monitoringPoints, totalDays, diffFromToday]);

  const filteredEventLogs = useMemo(() => {
    const ratio = totalDays <= 1 ? 1 : Math.min(1.5, totalDays / 3);
    const events = Math.max(0, Math.min(eventLogs.length, Math.floor(eventLogs.length * ratio - diffFromToday)));
    return eventLogs.slice(0, events).map((log, idx) => {
      const dayOffset = totalDays > 1 ? Math.floor((idx / Math.max(1, events - 1)) * (totalDays - 1)) : 0;
      const hour = Math.max(0, 23 - Math.floor(idx / 2) % 24);
      const minute = (idx * 7) % 60;
      const displayTime = dayjs(rangeStart).add(dayOffset, 'day').hour(hour).minute(minute);
      return {
        ...log,
        originalTime: log.time,
        displayDate: displayTime.format('HH:mm:ss'),
        displayFullDate: displayTime.format('YYYY-MM-DD HH:mm'),
        dayOffset,
      };
    });
  }, [eventLogs, totalDays, diffFromToday, rangeStart]);

  const approvalEvents = useMemo(() =>
    filteredEventLogs.filter(e => e.type === '审批'),
  [filteredEventLogs]);
  const workOrderEvents = useMemo(() =>
    filteredEventLogs.filter(e => e.type === '工单'),
  [filteredEventLogs]);

  const eventStats = useMemo(() => {
    const counts: Record<EventType, number> = {
      预警: 0,
      审批: 0,
      工单: 0,
      应急: 0,
      进度: 0,
    };
    filteredEventLogs.forEach((log) => {
      counts[log.type] = (counts[log.type] || 0) + 1;
    });
    return eventTypeList.map((type) => ({
      name: type,
      value: counts[type] || 0,
      color: COLORS[type],
    })).filter((d) => d.value > 0);
  }, [filteredEventLogs]);

  const totalEvents = eventStats.reduce((sum, d) => sum + d.value, 0);

  const printTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const exporter = currentUser?.username || '系统管理员';
  const reportDateLabel = totalDays <= 1
    ? rangeStart.format('YYYY年MM月DD日')
    : `${rangeStart.format('YYYY年MM月DD日')} 至 ${rangeEnd.format('YYYY年MM月DD日')}`;
  const reportTitle = totalDays <= 1
    ? '施 工 日 报'
    : totalDays <= 7 ? '施 工 周 报' : '施 工 月 报';
  const reportFileName = totalDays <= 1
    ? `施工日报_${rangeStart.format('YYYYMMDD')}.xlsx`
    : totalDays <= 7
      ? `施工周报_${rangeStart.format('YYYYMMDD')}_${rangeEnd.format('YYYYMMDD')}.xlsx`
      : `施工月报_${rangeStart.format('YYYYMM')}.xlsx`;

  const handlePreview = () => {
    setIsPreview(true);
    message.success(`${MODE_LABEL[reportMode]}预览已刷新`);
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const coverData = [
        [reportTitle],
        [],
        ['项目名称', projectName],
        ['报告期间', reportDateLabel],
        ['报告类型', MODE_LABEL[reportMode]],
        ['统计天数', `${totalDays} 天`],
        ['导出人', exporter],
        ['打印时间', printTime],
        [],
        ['报表摘要'],
        ['盾构机数量', todayRingsData.length],
        [`期间掘进总环数（${totalDays}天）`, todayRingsData.reduce((s, r) => s + r.todayRings, 0)],
        ['日均环数', (todayRingsData.reduce((s, r) => s + r.ringPerDay, 0) / todayRingsData.length).toFixed(1)],
        ['监测点数量', monitoringDisplay.length],
        ['危险监测点', monitoringDisplay.filter(m => m.status === 'danger').length],
        ['预警监测点', monitoringDisplay.filter(m => m.status === 'warning').length],
        [`${totalDays}天事件总数`, totalEvents],
      ];
      const wsCover = XLSX.utils.aoa_to_sheet(coverData);
      wsCover['!cols'] = [{ wch: 20 }, { wch: 40 }];
      if (wsCover['A1']) {
        wsCover['A1'].s = {
          font: { bold: true, sz: 24, color: { rgb: '1890FF' } },
          alignment: { horizontal: 'center' },
        };
      }
      XLSX.utils.book_append_sheet(wb, wsCover, '封面');

      const shieldHeaders = totalDays <= 1
        ? ['盾构机编号', '名称', '当日掘进环数', '累计环数', '平均推进速度(mm/min)', '最大刀盘扭矩(kN·m)', '运行时长(h)']
        : ['盾构机编号', '名称', '期间掘进环数', '日均环数', '累计环数', '平均推进速度(mm/min)', '最大刀盘扭矩(kN·m)', '运行总时长(h)'];
      const shieldRows = todayRingsData.map((s) =>
        totalDays <= 1
          ? [s.code, s.name, s.todayRings, s.totalRings, s.avgSpeed, s.maxTorque, s.runHours]
          : [s.code, s.name, s.todayRings, s.ringPerDay, s.totalRings, s.avgSpeed, s.maxTorque, s.runHours]
      );
      const shieldAoA = [shieldHeaders, ...shieldRows];
      const wsShield = XLSX.utils.aoa_to_sheet(shieldAoA);
      wsShield['!cols'] = totalDays <= 1
        ? [{ wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 22 }, { wch: 12 }]
        : [{ wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 22 }, { wch: 14 }];
      const headerRange = XLSX.utils.decode_range(wsShield['!ref'] || 'A1');
      for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (wsShield[addr]) {
          wsShield[addr].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '1890FF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }
      XLSX.utils.book_append_sheet(wb, wsShield, '盾构统计');

      const monitorHeaders = totalDays <= 1
        ? ['监测点编号', '沉降值(mm)', '阈值(mm)', '变化量(mm)', '状态', '备注']
        : ['监测点编号', '平均沉降(mm)', '峰值沉降(mm)', '阈值(mm)', '状态', '备注'];
      const monitorRows = monitoringDisplay.map((m) =>
        totalDays <= 1
          ? [m.code, m.currentValue, m.threshold, m.change, m.statusText, m.remark]
          : [m.code, m.avgValue, m.maxValue, m.threshold, m.statusText, m.remark]
      );
      const monitorAoA = [monitorHeaders, ...monitorRows];
      const wsMonitor = XLSX.utils.aoa_to_sheet(monitorAoA);
      wsMonitor['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 30 }];
      const monitorRange = XLSX.utils.decode_range(wsMonitor['!ref'] || 'A1');
      for (let c = monitorRange.s.c; c <= monitorRange.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (wsMonitor[addr]) {
          wsMonitor[addr].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '13C2C2' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }
      for (let r = 1; r <= monitorRange.e.r; r++) {
        const statusCell = XLSX.utils.encode_cell({ r, c: totalDays <= 1 ? 4 : 4 });
        if (wsMonitor[statusCell]) {
          const val = wsMonitor[statusCell].v;
          let color = '52C41A';
          if (val === '预警') color = 'FA8C16';
          if (val === '危险') color = 'FF4D4F';
          wsMonitor[statusCell].s = {
            font: { bold: true, color: { rgb: color } },
            alignment: { horizontal: 'center' },
          };
        }
      }
      XLSX.utils.book_append_sheet(wb, wsMonitor, '沉降记录');

      const approvalHeaders = ['日期时间', '级别', '内容', '操作人'];
      const approvalRows = approvalEvents.map((e) => [
        e.displayFullDate,
        e.level === 'info' ? '信息' : e.level === 'warning' ? '警告' : '危险',
        e.content,
        e.operator || '-',
      ]);
      const approvalAoA = approvalRows.length > 0
        ? [approvalHeaders, ...approvalRows]
        : [approvalHeaders, ['-', '-', '期间无审批事件', '-']];
      const wsApproval = XLSX.utils.aoa_to_sheet(approvalAoA);
      wsApproval['!cols'] = [{ wch: 20 }, { wch: 8 }, { wch: 50 }, { wch: 14 }];
      const approvalRange = XLSX.utils.decode_range(wsApproval['!ref'] || 'A1');
      for (let c = approvalRange.s.c; c <= approvalRange.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (wsApproval[addr]) {
          wsApproval[addr].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '1890FF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }
      XLSX.utils.book_append_sheet(wb, wsApproval, '审批事件');

      const woHeaders = ['日期时间', '级别', '内容', '操作人'];
      const woRows = workOrderEvents.map((e) => [
        e.displayFullDate,
        e.level === 'info' ? '信息' : e.level === 'warning' ? '警告' : '危险',
        e.content,
        e.operator || '-',
      ]);
      const woAoA = woRows.length > 0
        ? [woHeaders, ...woRows]
        : [woHeaders, ['-', '-', '期间无工单事件', '-']];
      const wsWo = XLSX.utils.aoa_to_sheet(woAoA);
      wsWo['!cols'] = [{ wch: 20 }, { wch: 8 }, { wch: 50 }, { wch: 14 }];
      const woRange = XLSX.utils.decode_range(wsWo['!ref'] || 'A1');
      for (let c = woRange.s.c; c <= woRange.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (wsWo[addr]) {
          wsWo[addr].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: 'FA8C16' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }
      XLSX.utils.book_append_sheet(wb, wsWo, '工单事件');

      const eventHeaders = ['日期时间', '类型', '级别', '内容', '操作人'];
      const eventRows = filteredEventLogs.map((e) => [
        e.displayFullDate,
        e.type,
        e.level === 'info' ? '信息' : e.level === 'warning' ? '警告' : '危险',
        e.content,
        e.operator || '-',
      ]);
      const statsRows = [
        ['', '', '', '', ''],
        ['事件统计汇总'],
        ['类型', '数量', '占比'],
        ...eventTypeList.map((t) => {
          const count = filteredEventLogs.filter(e => e.type === t).length;
          const pct = totalEvents > 0 ? `${((count / totalEvents) * 100).toFixed(1)}%` : '0%';
          return [t, count, pct];
        }),
        ['合计', totalEvents, '100%'],
      ];
      const eventAoA = [eventHeaders, ...eventRows, ...statsRows];
      const wsEvent = XLSX.utils.aoa_to_sheet(eventAoA);
      wsEvent['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 50 }, { wch: 14 }];
      const eventRange = XLSX.utils.decode_range(wsEvent['!ref'] || 'A1');
      for (let c = eventRange.s.c; c <= eventRange.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (wsEvent[addr]) {
          wsEvent[addr].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '722ED1' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }
      const statsHeaderRow = eventRows.length + 2;
      const statsTitleAddr = XLSX.utils.encode_cell({ r: statsHeaderRow, c: 0 });
      if (wsEvent[statsTitleAddr]) {
        wsEvent[statsTitleAddr].s = {
          font: { bold: true, sz: 14, color: { rgb: '722ED1' } },
        };
      }
      const subHeaderRow = statsHeaderRow + 1;
      for (let c = 0; c < 3; c++) {
        const addr = XLSX.utils.encode_cell({ r: subHeaderRow, c });
        if (wsEvent[addr]) {
          wsEvent[addr].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: 'FA8C16' } },
            alignment: { horizontal: 'center' },
          };
        }
      }
      XLSX.utils.book_append_sheet(wb, wsEvent, '全事件统计');

      XLSX.writeFile(wb, reportFileName);
      message.success(`报表导出成功：${reportFileName}`);
    } catch {
      message.error('报表导出失败，请重试');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadge = (status: 'normal' | 'warning' | 'danger') => {
    const config = {
      normal: { text: '正常', cls: 'bg-tech-green/20 text-tech-green border-tech-green/40' },
      warning: { text: '预警', cls: 'bg-tech-orange/20 text-tech-orange border-tech-orange/40' },
      danger: { text: '危险', cls: 'bg-tech-red/20 text-tech-red border-tech-red/40' },
    };
    const { text, cls } = config[status];
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
        {text}
      </span>
    );
  };

  return (
    <div className="w-full h-full star-bg overflow-hidden flex flex-col">
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="tech-panel relative w-full px-6 py-3 flex items-center justify-between flex-shrink-0"
      >
        <HudCorners />

        <div className="flex items-center gap-4 z-10">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-lg bg-white/5 border border-tech-border/50 flex items-center justify-center text-gray-400 hover:text-white hover:bg-tech-blue/20 hover:border-tech-blue/50 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tech-blue to-tech-cyan flex items-center justify-center shadow-lg shadow-tech-blue/30">
            <FileDown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tech-title tracking-wide">施工报表导出系统</h1>
            <p className="text-xs text-gray-400 mt-0.5">Construction Report Export System</p>
          </div>
        </div>

        <div className="flex items-center gap-4 z-10">
          <div className="flex items-center px-2 py-1 rounded-lg bg-white/5 border border-tech-border/40">
            <Segmented<ReportMode>
              value={reportMode}
              onChange={setReportMode}
              options={[
                { label: (
                  <div className="flex items-center gap-1 px-1">
                    <Calendar className="w-3.5 h-3.5" /> 日报
                  </div>
                ), value: 'daily' },
                { label: (
                  <div className="flex items-center gap-1 px-1">
                    <BarChart3 className="w-3.5 h-3.5" /> 周报
                  </div>
                ), value: 'weekly' },
                { label: (
                  <div className="flex items-center gap-1 px-1">
                    <List className="w-3.5 h-3.5" /> 月报
                  </div>
                ), value: 'monthly' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-tech-border/40">
            <Calendar className="w-4 h-4 text-tech-blue" />
            {reportMode === 'daily' ? (
              <DatePicker
                value={singleDate}
                onChange={(date) => date && setSingleDate(date)}
                format="YYYY-MM-DD"
                className="!bg-transparent !border-none !text-white !w-32"
                style={{ background: 'transparent', color: '#fff' }}
                allowClear={false}
              />
            ) : (
              <div className="text-sm text-white font-mono w-56">
                {rangeStart.format('YYYY-MM-DD')} ~ {rangeEnd.format('YYYY-MM-DD')}
                <span className="text-xs text-gray-400 ml-2">（共{totalDays}天）</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-tech-border/40 w-72">
            <Building2 className="w-4 h-4 text-tech-cyan" />
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="请输入项目名称"
              className="!bg-transparent !border-none !text-white !placeholder:text-gray-500 !p-0"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePreview}
            className={cn(
              'tech-btn flex items-center gap-2 px-5 py-2',
              isPreview && 'tech-btn-primary',
            )}
          >
            <Eye className="w-4 h-4" />
            预览
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExportExcel}
            className="tech-btn-success px-5 py-2 flex items-center gap-2 border border-tech-green/60"
          >
            <FileDown className="w-4 h-4" />
            导出Excel
          </motion.button>
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

      <div className="flex-1 p-4 overflow-hidden flex justify-center">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="tech-panel relative rounded-xl p-6 w-full max-w-6xl h-full overflow-hidden"
        >
          <HudCorners />

          <div className="relative z-10 w-full h-full overflow-y-auto pr-2">
            <div
              className="bg-white rounded-sm shadow-2xl mx-auto p-12 text-gray-800"
              style={{ minHeight: 'calc(100% - 20px)', maxWidth: '900px' }}
            >
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border-b-2 border-gray-200 pb-6 mb-8"
              >
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold text-tech-blue mb-2" style={{ fontFamily: "'PingFang SC', sans-serif" }}>
                    {reportTitle}
                  </h1>
                  <div className="w-32 h-1 bg-gradient-to-r from-transparent via-tech-blue to-transparent mx-auto rounded-full" />
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tech-blue/10 text-tech-blue text-xs font-medium">
                    {MODE_LABEL[reportMode]} · {totalDays} 天
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-tech-blue flex-shrink-0" />
                    <span className="text-gray-500 w-20">项目名称</span>
                    <span className="text-gray-800 font-semibold">{projectName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-tech-blue flex-shrink-0" />
                    <span className="text-gray-500 w-20">报告期间</span>
                    <span className="text-gray-800 font-semibold">{reportDateLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-tech-blue flex-shrink-0" />
                    <span className="text-gray-500 w-20">导出人</span>
                    <span className="text-gray-800 font-semibold">{exporter}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-tech-blue flex-shrink-0" />
                    <span className="text-gray-500 w-20">打印时间</span>
                    <span className="text-gray-800 font-mono font-semibold">{printTime}</span>
                  </div>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-tech-blue rounded-full" />
                  <h2 className="text-xl font-bold text-gray-800">
                    盾构掘进统计
                    {totalDays > 1 && <span className="text-sm text-gray-400 ml-2 font-normal">（{totalDays}天汇总）</span>}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 ml-2" />
                  <span className="text-xs text-gray-400">共 {todayRingsData.length} 台盾构机</span>
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-tech-blue text-white">
                        <th className="px-4 py-3 font-semibold text-center">盾构机编号</th>
                        <th className="px-4 py-3 font-semibold text-center">{totalDays <= 1 ? '当日掘进环数' : '期间掘进环数'}</th>
                        {totalDays > 1 && <th className="px-4 py-3 font-semibold text-center">日均环数</th>}
                        <th className="px-4 py-3 font-semibold text-center">累计环数</th>
                        <th className="px-4 py-3 font-semibold text-center">平均推进速度(mm/min)</th>
                        <th className="px-4 py-3 font-semibold text-center">最大刀盘扭矩(kN·m)</th>
                        <th className="px-4 py-3 font-semibold text-center">{totalDays <= 1 ? '运行时长(h)' : '总时长(h)'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayRingsData.map((shield, i) => (
                        <tr key={shield.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-gray-50', 'hover:bg-blue-50 transition-colors')}>
                          <td className="px-4 py-3 text-center font-mono text-gray-700 border-t border-gray-100">
                            {shield.code}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-tech-blue border-t border-gray-100">
                            {shield.todayRings}
                          </td>
                          {totalDays > 1 && <td className="px-4 py-3 text-center font-mono text-tech-cyan border-t border-gray-100">{shield.ringPerDay}</td>}
                          <td className="px-4 py-3 text-center font-mono text-gray-800 border-t border-gray-100">
                            {shield.totalRings}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-gray-700 border-t border-gray-100">
                            {shield.avgSpeed}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-gray-700 border-t border-gray-100">
                            {shield.maxTorque}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700 border-t border-gray-100">
                            {shield.runHours}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="px-4 py-3 text-center text-gray-800 border-t border-gray-200">合计</td>
                        <td className="px-4 py-3 text-center text-tech-red border-t border-gray-200">
                          {todayRingsData.reduce((s, r) => s + r.todayRings, 0)}
                        </td>
                        {totalDays > 1 && (
                          <td className="px-4 py-3 text-center text-tech-cyan border-t border-gray-200">
                            {(todayRingsData.reduce((s, r) => s + r.ringPerDay, 0) / todayRingsData.length).toFixed(1)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center text-gray-800 border-t border-gray-200">
                          {todayRingsData.reduce((s, r) => s + r.totalRings, 0)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 border-t border-gray-200">
                          {(todayRingsData.reduce((s, r) => s + r.avgSpeed, 0) / todayRingsData.length).toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 border-t border-gray-200">
                          {Math.max(...todayRingsData.map((r) => r.maxTorque))}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 border-t border-gray-200">
                          {todayRingsData.reduce((s, r) => s + r.runHours, 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-tech-cyan rounded-full" />
                  <h2 className="text-xl font-bold text-gray-800">
                    沉降监测记录
                    {totalDays > 1 && <span className="text-sm text-gray-400 ml-2 font-normal">（{totalDays}天峰值/均值统计）</span>}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 ml-2" />
                  <span className="text-xs text-gray-400">
                    共 {monitoringDisplay.length} 个监测点 ·
                    <span className="text-tech-red mx-1">{monitoringDisplay.filter(m => m.status === 'danger').length}</span>危险 ·
                    <span className="text-tech-orange mx-1">{monitoringDisplay.filter(m => m.status === 'warning').length}</span>预警
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-tech-cyan text-white">
                        <th className="px-4 py-3 font-semibold text-center">监测点编号</th>
                        {totalDays <= 1 ? (
                          <>
                            <th className="px-4 py-3 font-semibold text-center">沉降值(mm)</th>
                            <th className="px-4 py-3 font-semibold text-center">阈值(mm)</th>
                            <th className="px-4 py-3 font-semibold text-center">变化量(mm)</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 font-semibold text-center">平均沉降(mm)</th>
                            <th className="px-4 py-3 font-semibold text-center">峰值沉降(mm)</th>
                            <th className="px-4 py-3 font-semibold text-center">阈值(mm)</th>
                          </>
                        )}
                        <th className="px-4 py-3 font-semibold text-center">状态</th>
                        <th className="px-4 py-3 font-semibold text-left">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monitoringDisplay.map((point, i) => (
                        <tr key={point.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-gray-50', 'hover:bg-cyan-50 transition-colors')}>
                          <td className="px-4 py-3 text-center font-mono font-semibold text-gray-700 border-t border-gray-100">
                            {point.code}
                          </td>
                          {totalDays <= 1 ? (
                            <>
                              <td className={cn(
                                'px-4 py-3 text-center font-mono font-bold border-t border-gray-100',
                                point.status === 'danger' && 'text-tech-red',
                                point.status === 'warning' && 'text-tech-orange',
                                point.status === 'normal' && 'text-gray-700',
                              )}>
                                {point.currentValue}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-gray-700 border-t border-gray-100">
                                {point.threshold}
                              </td>
                              <td className={cn(
                                'px-4 py-3 text-center font-mono font-semibold border-t border-gray-100',
                                point.change > 0 ? 'text-tech-red' : point.change < 0 ? 'text-tech-green' : 'text-gray-500',
                              )}>
                                {point.change > 0 ? '+' : ''}{point.change}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-center font-mono text-gray-700 border-t border-gray-100">
                                {point.avgValue}
                              </td>
                              <td className={cn(
                                'px-4 py-3 text-center font-mono font-bold border-t border-gray-100',
                                point.status === 'danger' && 'text-tech-red',
                                point.status === 'warning' && 'text-tech-orange',
                                point.status === 'normal' && 'text-gray-700',
                              )}>
                                {point.maxValue}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-gray-700 border-t border-gray-100">
                                {point.threshold}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-center border-t border-gray-100">
                            {getStatusBadge(point.status)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-left border-t border-gray-100">
                            {point.remark}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="mb-8"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 bg-tech-blue rounded-full" />
                      <h3 className="font-semibold text-gray-700">
                        审批事件
                        {totalDays > 1 && <span className="text-xs text-gray-400 ml-1 font-normal">（{totalDays}天）</span>}
                      </h3>
                      <span className="ml-auto text-xs text-tech-blue font-mono">{approvalEvents.length} 条</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {approvalEvents.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">期间无审批事件</p>
                      ) : (
                        approvalEvents.slice(0, 8).map((e) => (
                          <div key={e.id} className="p-2 rounded bg-blue-50/50 text-xs">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-tech-blue font-medium">{e.displayFullDate}</span>
                              <span className="text-gray-400">{e.operator || '-'}</span>
                            </div>
                            <p className="text-gray-600">{e.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 bg-tech-orange rounded-full" />
                      <h3 className="font-semibold text-gray-700">
                        工单事件
                        {totalDays > 1 && <span className="text-xs text-gray-400 ml-1 font-normal">（{totalDays}天）</span>}
                      </h3>
                      <span className="ml-auto text-xs text-tech-orange font-mono">{workOrderEvents.length} 条</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {workOrderEvents.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">期间无工单事件</p>
                      ) : (
                        workOrderEvents.slice(0, 8).map((e) => (
                          <div key={e.id} className="p-2 rounded bg-orange-50/50 text-xs">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-tech-orange font-medium">{e.displayFullDate}</span>
                              <span className="text-gray-400">{e.operator || '-'}</span>
                            </div>
                            <p className="text-gray-600">{e.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-tech-purple rounded-full" />
                  <h2 className="text-xl font-bold text-gray-800">
                    全事件统计
                    {totalDays > 1 && <span className="text-sm text-gray-400 ml-2 font-normal">（{totalDays}天汇总）</span>}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 ml-2" />
                  <span className="text-xs text-gray-400">共 {totalEvents} 条事件</span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center gap-2 mb-3">
                      <PieChartIcon className="w-4 h-4 text-tech-purple" />
                      <span className="font-semibold text-gray-700">分类汇总</span>
                    </div>
                    {totalEvents > 0 ? (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={eventStats}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={3}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={{ stroke: '#999', strokeWidth: 1 }}
                            >
                              {eventStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [`${value} 条`, '数量']}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                            <Legend iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-56 flex items-center justify-center text-gray-400">
                        暂无事件数据
                      </div>
                    )}
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {eventTypeList.map((type) => {
                        const count = filteredEventLogs.filter(e => e.type === type).length;
                        const pct = totalEvents > 0 ? ((count / totalEvents) * 100).toFixed(0) : '0';
                        return (
                          <div key={type} className="text-center">
                            <div
                              className="text-lg font-bold"
                              style={{ color: COLORS[type] }}
                            >
                              {count}
                            </div>
                            <div className="text-xs text-gray-500">{type}</div>
                            <div className="text-xs text-gray-400">{pct}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center gap-2 mb-3">
                      <List className="w-4 h-4 text-tech-purple" />
                      <span className="font-semibold text-gray-700">
                        详细事件列表
                      </span>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {filteredEventLogs.length === 0 ? (
                        <div className="h-56 flex items-center justify-center text-gray-400">
                          暂无事件记录
                        </div>
                      ) : (
                        filteredEventLogs.slice(0, 15).map((log) => (
                          <div
                            key={log.id}
                            className="flex items-start gap-2 p-2 rounded-md bg-white border border-gray-100 hover:border-gray-200 transition-colors"
                          >
                            <div
                              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                              style={{
                                backgroundColor: COLORS[log.type],
                                boxShadow: `0 0 6px ${COLORS[log.type]}`,
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                                  style={{ backgroundColor: COLORS[log.type] }}
                                >
                                  {log.type}
                                </span>
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                                    log.level === 'danger' && 'bg-red-100 text-red-700',
                                    log.level === 'warning' && 'bg-orange-100 text-orange-700',
                                    log.level === 'info' && 'bg-blue-100 text-blue-700',
                                  )}
                                >
                                  {log.level === 'info' ? '信息' : log.level === 'warning' ? '警告' : '危险'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono ml-auto">
                                  {log.displayFullDate}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed break-words">
                                {log.content}
                              </p>
                              {log.operator && (
                                <p className="text-[10px] text-gray-400 mt-0.5">操作人：{log.operator}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {filteredEventLogs.length > 15 && (
                      <div className="mt-2 text-center text-xs text-gray-400">
                        共 {filteredEventLogs.length} 条记录，仅显示前15条
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
