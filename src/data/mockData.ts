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
} from '@/types';
import dayjs from 'dayjs';

const generate24hHistory = (baseSpeed: number, baseTorque: number, basePressure: number, startRings: number) => {
  const data = [];
  for (let i = 23; i >= 0; i--) {
    const time = dayjs().subtract(i, 'hour').format('HH:00');
    data.push({
      time,
      thrustSpeed: Number((baseSpeed + (Math.random() - 0.5) * 20).toFixed(1)),
      cutterTorque: Number((baseTorque + (Math.random() - 0.5) * 800).toFixed(0)),
      groutingPressure: Number((basePressure + (Math.random() - 0.5) * 0.4).toFixed(2)),
      rings: startRings + Math.floor((24 - i) * (Math.random() * 0.8 + 0.3)),
    });
  }
  return data;
};

export const mockUsers: UserAccount[] = [
  { id: 'u1', username: '张建国', role: 'worker', roleName: '施工员', faceData: 'face_worker_001' },
  { id: 'u2', username: '李明辉', role: 'manager', roleName: '项目经理', faceData: 'face_manager_001' },
  { id: 'u3', username: '王志强', role: 'director', roleName: '公司领导', faceData: 'face_director_001' },
];

export const mockShields: ShieldMachine[] = [
  {
    id: 's1',
    name: '中铁装备1号',
    code: 'SDJ-001',
    position: { x: 0, y: -2, z: -8 },
    rotation: { x: 0, y: 0, z: 0 },
    thrustSpeed: 45.2,
    cutterTorque: 4200,
    groutingPressure: 2.35,
    totalRings: 328,
    cutterRotationSpeed: 1.2,
    status: 'normal',
    history24h: generate24hHistory(45, 4200, 2.3, 305),
  },
  {
    id: 's2',
    name: '中铁装备2号',
    code: 'SDJ-002',
    position: { x: 0, y: -2, z: 8 },
    rotation: { x: 0, y: Math.PI, z: 0 },
    thrustSpeed: 38.7,
    cutterTorque: 3900,
    groutingPressure: 2.18,
    totalRings: 256,
    cutterRotationSpeed: 1.0,
    status: 'warning',
    history24h: generate24hHistory(38, 3900, 2.1, 240),
  },
];

export const mockMonitoringPoints: MonitoringPoint[] = Array.from({ length: 8 }, (_, i) => {
  const baseValue = 5 + Math.random() * 10;
  const isDanger = i === 3;
  const isWarning = i === 6;
  return {
    id: `mp${i + 1}`,
    code: `DB-${String(i + 1).padStart(3, '0')}`,
    position: { x: -15 + i * 4.5, y: 0.5, z: -2 + (i % 2) * 4 },
    currentValue: isDanger ? 32.5 : isWarning ? 20.3 : Number(baseValue.toFixed(1)),
    threshold: 30,
    warningThreshold: 20,
    trend: Array.from({ length: 10 }, () => Number((baseValue + (Math.random() - 0.5) * 6).toFixed(1))),
    status: (isDanger ? 'danger' : isWarning ? 'warning' : 'normal') as MonitoringPoint['status'],
  };
});

const specs = ['φ6200×300×1200', 'φ6200×350×1200', 'φ6200×300×1500'];
export const mockSegments: Segment[] = Array.from({ length: 18 }, (_, i) => {
  const spec = specs[i % 3];
  const baseQty = 40 - (i % 3) * 12;
  const safeStock = 20;
  const quantity = Math.max(5, baseQty - Math.floor(Math.random() * 15));
  const isLow = quantity < safeStock && quantity >= 10;
  const isCritical = quantity < 10;
  return {
    id: `seg${i + 1}`,
    spec,
    ageDays: 3 + Math.floor(Math.random() * 25),
    quantity,
    safeStock,
    position: { row: Math.floor(i / 6), col: i % 6, layer: i % 3 },
    status: (isCritical ? 'critical' : isLow ? 'low' : 'normal') as Segment['status'],
  };
});

export const mockPurchasePlans: PurchasePlan[] = [
  {
    id: 'pp1',
    segmentId: 'seg1',
    spec: 'φ6200×300×1200',
    quantity: 50,
    createTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    status: 'level1',
    approvals: [
      { role: '施工员', user: '张建国', status: 'approved', time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), opinion: '现场库存不足，同意采购' },
      { role: '项目经理', user: '李明辉', status: 'pending' },
      { role: '物资部', user: '系统', status: 'pending' },
    ],
  },
  {
    id: 'pp2',
    segmentId: 'seg2',
    spec: 'φ6200×350×1200',
    quantity: 40,
    createTime: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    status: 'approved',
    approvals: [
      { role: '施工员', user: '张建国', status: 'approved', time: dayjs().subtract(4.5, 'hour').format('YYYY-MM-DD HH:mm:ss'), opinion: '确有需要' },
      { role: '项目经理', user: '李明辉', status: 'approved', time: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'), opinion: '同意，尽快安排' },
      { role: '物资部', user: '陈伟', status: 'approved', time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), opinion: '已安排供应商，明日到货' },
    ],
  },
];

export const mockWorkers: Worker[] = [
  { id: 'w1', name: '刘强', jobType: '盾构司机', position: { x: 0, y: -1.5, z: -8 }, area: '盾构机内', status: 'normal' },
  { id: 'w2', name: '赵伟', jobType: '注浆工', position: { x: 1.5, y: -1.5, z: -9.5 }, area: '密闭舱室', enterTime: dayjs().subtract(40, 'minute').format('YYYY-MM-DD HH:mm:ss'), status: 'overtime' },
  { id: 'w3', name: '孙磊', jobType: '管片拼装工', position: { x: 12, y: -1, z: -3 }, area: '基坑', status: 'normal' },
  { id: 'w4', name: '周涛', jobType: '测量员', position: { x: -12, y: 0.3, z: 5 }, area: '地面', status: 'normal' },
  { id: 'w5', name: '吴刚', jobType: '安全员', position: { x: -8, y: -1, z: 2 }, area: '基坑', status: 'normal' },
  { id: 'w6', name: '郑浩', jobType: '电工', position: { x: 0, y: -1.5, z: 8.5 }, area: '盾构机内', status: 'normal' },
  { id: 'w7', name: '黄鹏', jobType: '管片拼装工', position: { x: 14, y: -1, z: 0 }, area: '基坑', status: 'normal' },
];

export const mockStationNodes: StationNode[] = [
  { id: 'n1', name: '围护结构施工', plannedStart: '2026-03-01', plannedEnd: '2026-04-15', actualStart: '2026-03-02', actualEnd: '2026-04-20', progress: 100, isKeyNode: true, status: 'delayed', suggestion: '后续工序需增加人员投入，追回5天工期' },
  { id: 'n2', name: '基坑土方开挖', plannedStart: '2026-04-10', plannedEnd: '2026-06-01', actualStart: '2026-04-18', progress: 72, isKeyNode: true, status: 'inProgress' },
  { id: 'n3', name: '支撑体系安装', plannedStart: '2026-04-20', plannedEnd: '2026-06-10', progress: 58, isKeyNode: false, status: 'inProgress' },
  { id: 'n4', name: '主体结构底板', plannedStart: '2026-05-15', plannedEnd: '2026-07-15', progress: 35, isKeyNode: true, status: 'inProgress' },
  { id: 'n5', name: '主体结构侧墙', plannedStart: '2026-06-15', plannedEnd: '2026-08-20', progress: 8, isKeyNode: false, status: 'inProgress' },
  { id: 'n6', name: '主体结构顶板', plannedStart: '2026-07-20', plannedEnd: '2026-09-30', progress: 0, isKeyNode: true, status: 'pending' },
];

export const mockMaintenanceOrders: MaintenanceOrder[] = [
  {
    id: 'mo1',
    shieldId: 's1',
    shieldName: '中铁装备1号',
    type: '300环保养',
    triggerRings: 300,
    createTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    status: 'pending',
    items: ['更换主轴承密封件', '检查液压系统油位', '清洗过滤器', '刀盘刀具磨损检测', '电气系统绝缘测试'],
  },
  {
    id: 'mo2',
    shieldId: 's2',
    shieldName: '中铁装备2号',
    type: '300环保养',
    triggerRings: 300,
    createTime: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
    status: 'completed',
    items: ['更换主轴承密封件', '检查液压系统油位', '清洗过滤器'],
    handler: '张建国',
  },
];

export const mockEventLogs: EventLog[] = [
  {
    id: 'e1',
    time: dayjs().subtract(5, 'minute').format('HH:mm:ss'),
    type: '预警',
    level: 'danger',
    content: '监测点DB-004沉降值32.5mm，超过阈值30mm',
    operator: '系统',
    handleStatus: 'pending',
    handleRecords: [],
    relatedType: 'monitoringPoint',
    relatedId: 'mp4',
    relatedName: 'DB-004',
  },
  {
    id: 'e2',
    time: dayjs().subtract(15, 'minute').format('HH:mm:ss'),
    type: '预警',
    level: 'warning',
    content: '注浆工赵伟进入密闭舱室超过30分钟',
    operator: '系统',
    handleStatus: 'inProgress',
    handleRecords: [
      { id: 'hr1', status: 'inProgress', handler: '张建国', time: dayjs().subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'), remark: '已通知救援组前往查看' },
    ],
    relatedType: 'worker',
    relatedId: 'w4',
    relatedName: '赵伟',
  },
  {
    id: 'e3',
    time: dayjs().subtract(30, 'minute').format('HH:mm:ss'),
    type: '审批',
    level: 'info',
    content: '施工员张建国通过采购计划PP1',
    operator: '张建国',
    handleStatus: 'closed',
    handleRecords: [],
    relatedType: 'purchasePlan',
    relatedId: 'pp1',
    relatedName: 'PP1',
  },
  {
    id: 'e4',
    time: dayjs().subtract(1, 'hour').format('HH:mm:ss'),
    type: '工单',
    level: 'warning',
    content: '中铁装备1号累计掘进328环，触发300环保养',
    operator: '系统',
    handleStatus: 'pending',
    handleRecords: [],
    relatedType: 'maintenanceOrder',
    relatedId: 'mo1',
    relatedName: 'MO1-300环保养',
  },
  {
    id: 'e5',
    time: dayjs().subtract(2, 'hour').format('HH:mm:ss'),
    type: '进度',
    level: 'warning',
    content: '围护结构施工节点延期5天完成',
    operator: '系统',
    handleStatus: 'closed',
    handleRecords: [
      { id: 'hr2', status: 'closed', handler: '李明辉', time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), remark: '已调整后续节点计划' },
    ],
  },
  {
    id: 'e6',
    time: dayjs().subtract(3, 'hour').format('HH:mm:ss'),
    type: '预警',
    level: 'warning',
    content: '监测点DB-007沉降值20.3mm，接近阈值',
    operator: '系统',
    handleStatus: 'pending',
    handleRecords: [],
    relatedType: 'monitoringPoint',
    relatedId: 'mp7',
    relatedName: 'DB-007',
  },
  {
    id: 'e7',
    time: dayjs().subtract(5, 'hour').format('HH:mm:ss'),
    type: '审批',
    level: 'info',
    content: '采购计划PP2已完成三级审批',
    operator: '陈伟',
    handleStatus: 'closed',
    handleRecords: [],
    relatedType: 'purchasePlan',
    relatedId: 'pp2',
    relatedName: 'PP2',
  },
];

export const mockEvacuatePath = [
  { x: 0, y: -2, z: -8 },
  { x: 0, y: -2, z: -4 },
  { x: -6, y: -1, z: -2 },
  { x: -12, y: 0, z: 2 },
  { x: -16, y: 0.5, z: 6 },
];

export const mockRescuePath = [
  { x: 16, y: 0.5, z: -6 },
  { x: 10, y: 0, z: -4 },
  { x: 4, y: -1, z: -6 },
  { x: 0, y: -2, z: -8 },
];

export const mockEmergencyEvent: EmergencyEvent | null = null;
