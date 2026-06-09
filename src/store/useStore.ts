import { create } from 'zustand';
import type {
  ShieldMachine,
  MonitoringPoint,
  Segment,
  PurchasePlan,
  Worker,
  StationNode,
  MaintenanceOrder,
  EventLog,
  EmergencyEvent,
  UserAccount,
  UserRole,
  EmergencyType,
  EventHandleStatus,
} from '@/types';
import {
  mockShields,
  mockMonitoringPoints,
  mockSegments,
  mockPurchasePlans,
  mockWorkers,
  mockStationNodes,
  mockMaintenanceOrders,
  mockEventLogs,
  mockUsers,
  mockEvacuatePath,
  mockRescuePath,
} from '@/data/mockData';
import dayjs from 'dayjs';

interface AppState {
  currentUser: UserAccount | null;
  loginLogs: { time: string; user: string; role: string; success: boolean }[];
  shields: ShieldMachine[];
  monitoringPoints: MonitoringPoint[];
  segments: Segment[];
  purchasePlans: PurchasePlan[];
  workers: Worker[];
  stationNodes: StationNode[];
  maintenanceOrders: MaintenanceOrder[];
  eventLogs: EventLog[];
  emergencyEvent: EmergencyEvent | null;
  selectedShieldId: string | null;
  selectedSegmentId: string | null;
  selectedMonitoringId: string | null;

  login: (role: UserRole) => boolean;
  logout: () => void;

  updateShieldParams: () => void;
  updateMonitoring: () => void;
  updateWorkers: () => void;
  addEventLog: (log: Partial<Omit<EventLog, 'id' | 'time'>> & Pick<EventLog, 'type' | 'level' | 'content'>) => void;
  updateEventStatus: (eventId: string, status: EventHandleStatus, handler: string, remark?: string) => void;

  startEmergency: (type: EmergencyType) => void;
  resolveEmergency: () => void;

  approvePurchasePlan: (planId: string, roleIndex: number, opinion: string) => void;
  rejectPurchasePlan: (planId: string, roleIndex: number, opinion: string) => void;

  completeMaintenance: (orderId: string, handler: string) => void;
  startMaintenance: (orderId: string, handler: string) => void;

  setSelectedShield: (id: string | null) => void;
  setSelectedSegment: (id: string | null) => void;
  setSelectedMonitoring: (id: string | null) => void;

  adjustShieldParamsBySettlement: (shieldId: string) => void;
  generatePurchasePlanIfNeeded: () => void;
  generateMaintenanceOrderIfNeeded: () => void;
  checkOvertimePersonnel: () => void;
  checkDelayedNodes: () => void;
}

const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  loginLogs: [],
  shields: mockShields,
  monitoringPoints: mockMonitoringPoints,
  segments: mockSegments,
  purchasePlans: mockPurchasePlans,
  workers: mockWorkers,
  stationNodes: mockStationNodes,
  maintenanceOrders: mockMaintenanceOrders,
  eventLogs: mockEventLogs,
  emergencyEvent: null,
  selectedShieldId: null,
  selectedSegmentId: null,
  selectedMonitoringId: null,

  login: (role) => {
    const user = mockUsers.find((u) => u.role === role);
    if (user) {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      set({
        currentUser: { ...user, lastLogin: now },
        loginLogs: [...get().loginLogs, { time: now, user: user.username, role: user.roleName, success: true }],
      });
      return true;
    }
    return false;
  },

  logout: () => set({ currentUser: null }),

  updateShieldParams: () => {
    set({
      shields: get().shields.map((s) => ({
        ...s,
        thrustSpeed: Number((s.thrustSpeed + (Math.random() - 0.5) * 4).toFixed(1)),
        cutterTorque: Math.max(2000, Math.min(6000, s.cutterTorque + Math.floor((Math.random() - 0.5) * 200))),
        groutingPressure: Number(Math.max(1, Math.min(3.5, s.groutingPressure + (Math.random() - 0.5) * 0.1)).toFixed(2)),
        totalRings: s.totalRings + (Math.random() > 0.9 ? 1 : 0),
        history24h: s.history24h.length < 25
          ? [...s.history24h]
          : [...s.history24h.slice(1), {
              time: dayjs().format('HH:00'),
              thrustSpeed: s.thrustSpeed,
              cutterTorque: s.cutterTorque,
              groutingPressure: s.groutingPressure,
              rings: s.totalRings,
            }],
      })),
    });
  },

  updateMonitoring: () => {
    const newPoints = get().monitoringPoints.map((m) => {
      const delta = (Math.random() - 0.5) * 3;
      const newValue = Number(Math.max(0, m.currentValue + delta).toFixed(1));
      const newStatus: MonitoringPoint['status'] = newValue >= m.threshold
        ? 'danger'
        : newValue >= m.warningThreshold
          ? 'warning'
          : 'normal';
      return {
        point: m,
        newValue,
        newStatus,
        shouldTrigger: newStatus === 'danger' && m.status !== 'danger',
      };
    });
    newPoints.forEach((np) => {
      if (np.shouldTrigger) {
        get().addEventLog({
          type: '预警',
          level: 'danger',
          content: `监测点${np.point.code}沉降值${np.newValue}mm，超过阈值${np.point.threshold}mm`,
          operator: '系统',
          relatedType: 'monitoringPoint',
          relatedId: np.point.id,
          relatedName: np.point.code,
        });
        get().shields.forEach((s) => get().adjustShieldParamsBySettlement(s.id));
      }
    });
    set({
      monitoringPoints: newPoints.map((np) => ({
        ...np.point,
        currentValue: np.newValue,
        status: np.newStatus,
        trend: [...np.point.trend.slice(1), np.newValue],
      })),
    });
  },

  updateWorkers: () => {
    const newWorkers = get().workers.map((w) => {
      const isOvertime = w.area === '密闭舱室' && w.enterTime
        ? dayjs().diff(dayjs(w.enterTime), 'minute') > 30
        : false;
      return {
        worker: w,
        isOvertime,
        shouldTrigger: isOvertime && w.status !== 'overtime',
      };
    });
    newWorkers.forEach((nw) => {
      if (nw.shouldTrigger) {
        get().addEventLog({
          type: '预警',
          level: 'warning',
          content: `${nw.worker.jobType}${nw.worker.name}进入密闭舱室超过30分钟`,
          operator: '系统',
          relatedType: 'worker',
          relatedId: nw.worker.id,
          relatedName: nw.worker.name,
        });
      }
    });
    set({
      workers: newWorkers.map((nw) => ({
        ...nw.worker,
        position: {
          x: nw.worker.position.x + (Math.random() - 0.5) * 0.3,
          y: nw.worker.position.y,
          z: nw.worker.position.z + (Math.random() - 0.5) * 0.3,
        },
        status: nw.isOvertime ? 'overtime' : 'normal',
      })),
    });
  },

  addEventLog: (log) => {
    const defaultStatus: EventHandleStatus = log.type === '预警' ? 'pending' : 'closed';
    set({
      eventLogs: [
        {
          id: `e${Date.now()}${Math.floor(Math.random() * 1000)}`,
          time: dayjs().format('HH:mm:ss'),
          handleStatus: log.handleStatus ?? defaultStatus,
          handleRecords: log.handleRecords ?? [],
          ...log,
        },
        ...get().eventLogs.slice(0, 99),
      ],
    });
  },

  updateEventStatus: (eventId, status, handler, remark) => {
    const event = get().eventLogs.find((e) => e.id === eventId);
    if (!event) return;
    const newRecord = {
      id: `hr${Date.now()}`,
      status,
      handler,
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      remark,
    };
    set({
      eventLogs: get().eventLogs.map((e) =>
        e.id === eventId
          ? {
              ...e,
              handleStatus: status,
              handleRecords: [...(e.handleRecords || []), newRecord],
            }
          : e
      ),
    });
  },

  startEmergency: (type) => {
    const affected = get().workers.filter((w) => w.area !== '地面').map((w) => w.id);
    set({
      emergencyEvent: {
        id: `em${Date.now()}`,
        type,
        position: { x: 0, y: -2, z: -6 },
        startTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        status: 'active',
        evacuatePath: mockEvacuatePath,
        rescuePath: mockRescuePath,
        affectedPersonnel: affected,
      },
    });
    get().addEventLog({ type: '应急', level: 'danger', content: `启动${type}应急预案，疏散路径已生成`, operator: get().currentUser?.username || '系统' });
  },

  resolveEmergency: () => {
    const event = get().emergencyEvent;
    if (event) {
      get().addEventLog({ type: '应急', level: 'info', content: `${event.type}事件已解除`, operator: get().currentUser?.username || '系统' });
    }
    set({ emergencyEvent: null });
  },

  approvePurchasePlan: (planId, roleIndex, opinion) => {
    const plan = get().purchasePlans.find((p) => p.id === planId);
    if (!plan) return;
    const newApprovals = [...plan.approvals];
    const roleData = newApprovals[roleIndex];
    newApprovals[roleIndex] = {
      ...roleData,
      status: 'approved',
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      opinion,
    };
    const allApproved = newApprovals.every((a) => a.status === 'approved');
    const nextStatus: PurchasePlan['status'] = allApproved
      ? 'approved'
      : roleIndex === 0
        ? 'level1'
        : roleIndex === 1
          ? 'level2'
          : 'approved';
    get().addEventLog({
      type: '审批',
      level: 'info',
      content: `${roleData.role}${roleData.user}通过采购计划${plan.id.toUpperCase()}`,
      operator: get().currentUser?.username,
    });
    set({
      purchasePlans: get().purchasePlans.map((p) =>
        p.id === planId ? { ...p, approvals: newApprovals, status: nextStatus } : p,
      ),
    });
  },

  rejectPurchasePlan: (planId, roleIndex, opinion) => {
    const plan = get().purchasePlans.find((p) => p.id === planId);
    if (!plan) return;
    const newApprovals = [...plan.approvals];
    const roleData = newApprovals[roleIndex];
    newApprovals[roleIndex] = {
      ...roleData,
      status: 'rejected',
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      opinion,
    };
    get().addEventLog({
      type: '审批',
      level: 'warning',
      content: `${roleData.role}${roleData.user}驳回采购计划${plan.id.toUpperCase()}`,
      operator: get().currentUser?.username,
      relatedType: 'purchasePlan',
      relatedId: plan.id,
      relatedName: plan.id.toUpperCase(),
    });
    set({
      purchasePlans: get().purchasePlans.map((p) =>
        p.id === planId ? { ...p, approvals: newApprovals, status: 'rejected' } : p,
      ),
    });
  },

  startMaintenance: (orderId, handler) => {
    const order = get().maintenanceOrders.find((o) => o.id === orderId);
    set({
      maintenanceOrders: get().maintenanceOrders.map((o) =>
        o.id === orderId ? { ...o, status: 'inProgress', handler } : o,
      ),
    });
    get().addEventLog({
      type: '工单',
      level: 'info',
      content: `保养工单${orderId.toUpperCase()}开始处理`,
      operator: handler,
      relatedType: 'maintenanceOrder',
      relatedId: orderId,
      relatedName: order ? `${orderId.toUpperCase()}-${order.type}` : orderId.toUpperCase(),
    });
  },

  completeMaintenance: (orderId, handler) => {
    const order = get().maintenanceOrders.find((o) => o.id === orderId);
    set({
      maintenanceOrders: get().maintenanceOrders.map((o) =>
        o.id === orderId ? { ...o, status: 'completed', handler } : o,
      ),
    });
    get().addEventLog({
      type: '工单',
      level: 'info',
      content: `保养工单${orderId.toUpperCase()}已完成`,
      operator: handler,
      relatedType: 'maintenanceOrder',
      relatedId: orderId,
      relatedName: order ? `${orderId.toUpperCase()}-${order.type}` : orderId.toUpperCase(),
    });
  },

  setSelectedShield: (id) => set({ selectedShieldId: id }),
  setSelectedSegment: (id) => set({ selectedSegmentId: id }),
  setSelectedMonitoring: (id) => set({ selectedMonitoringId: id }),

  adjustShieldParamsBySettlement: (shieldId) => {
    const shield = get().shields.find((s) => s.id === shieldId);
    set({
      shields: get().shields.map((s) => {
        if (s.id !== shieldId) return s;
        return {
          ...s,
          groutingPressure: Number(Math.min(3.5, s.groutingPressure + 0.2).toFixed(2)),
          thrustSpeed: Number(Math.max(20, s.thrustSpeed - 10).toFixed(1)),
          status: 'warning',
        };
      }),
    });
    get().addEventLog({
      type: '预警',
      level: 'warning',
      content: `已自动调整盾构机注浆压力+0.2bar，推进速度-10mm/min`,
      operator: '系统',
      relatedType: 'shield',
      relatedId: shieldId,
      relatedName: shield?.name,
    });
  },

  generatePurchasePlanIfNeeded: () => {
    const criticalSegments = get().segments.filter((s) => s.status === 'critical' || s.status === 'low');
    criticalSegments.forEach((seg) => {
      const exists = get().purchasePlans.some((p) => p.segmentId === seg.id && p.status !== 'rejected' && p.status !== 'approved');
      if (!exists) {
        const planId = `pp${Date.now()}`;
        const newPlan: PurchasePlan = {
          id: planId,
          segmentId: seg.id,
          spec: seg.spec,
          quantity: seg.safeStock * 2,
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          status: 'draft',
          approvals: [
            { role: '施工员', user: '张建国', status: 'pending' },
            { role: '项目经理', user: '李明辉', status: 'pending' },
            { role: '物资部', user: '系统', status: 'pending' },
          ],
        };
        set({ purchasePlans: [newPlan, ...get().purchasePlans] });
        get().addEventLog({
          type: '审批',
          level: 'warning',
          content: `管片${seg.spec}库存不足，自动生成采购计划`,
          operator: '系统',
          relatedType: 'purchasePlan',
          relatedId: planId,
          relatedName: planId.toUpperCase(),
        });
      }
    });
  },

  generateMaintenanceOrderIfNeeded: () => {
    get().shields.forEach((s) => {
      const thresholds: MaintenanceOrder['type'][] = ['300环保养', '500环保养', '1000环大修'];
      const rings = [300, 500, 1000];
      rings.forEach((r, i) => {
        if (s.totalRings >= r && s.totalRings < r + 50) {
          const exists = get().maintenanceOrders.some(
            (o) => o.shieldId === s.id && o.type === thresholds[i],
          );
          if (!exists) {
            const orderId = `mo${Date.now()}${i}`;
            const newOrder: MaintenanceOrder = {
              id: orderId,
              shieldId: s.id,
              shieldName: s.name,
              type: thresholds[i],
              triggerRings: r,
              createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              status: 'pending',
              items: ['更换主轴承密封件', '检查液压系统', '刀盘刀具检测', '电气系统检查'],
            };
            set({ maintenanceOrders: [newOrder, ...get().maintenanceOrders] });
            get().addEventLog({
              type: '工单',
              level: 'warning',
              content: `${s.name}累计掘进${s.totalRings}环，触发${thresholds[i]}`,
              operator: '系统',
              relatedType: 'maintenanceOrder',
              relatedId: orderId,
              relatedName: `${orderId.toUpperCase()}-${thresholds[i]}`,
            });
          }
        }
      });
    });
  },

  checkOvertimePersonnel: () => {
    get().workers.forEach((w) => {
      if (w.area === '密闭舱室' && w.enterTime) {
        const minutes = dayjs().diff(dayjs(w.enterTime), 'minute');
        if (minutes > 30 && w.status !== 'overtime') {
          get().addEventLog({
            type: '预警',
            level: 'danger',
            content: `${w.jobType}${w.name}密闭舱室超时${minutes}分钟，请立即救援`,
            operator: '系统',
            relatedType: 'worker',
            relatedId: w.id,
            relatedName: w.name,
          });
          set({
            workers: get().workers.map((x) => (x.id === w.id ? { ...x, status: 'overtime' } : x)),
          });
        }
      }
    });
  },

  checkDelayedNodes: () => {
    get().stationNodes.forEach((node) => {
      if (node.status === 'inProgress' && node.isKeyNode && !node.suggestion) {
        const planEnd = dayjs(node.plannedEnd);
        if (dayjs().isAfter(planEnd) && node.progress < 95) {
          set({
            stationNodes: get().stationNodes.map((n) =>
              n.id === node.id ? { ...n, status: 'delayed', suggestion: '建议增加作业班组，两班倒赶工，预计可缩短30%工期' } : n,
            ),
          });
          get().addEventLog({
            type: '进度',
            level: 'warning',
            content: `关键节点【${node.name}】进度延期，已推送调整建议`,
            operator: '系统',
          });
        }
      }
    });
  },
}));

export default useStore;
