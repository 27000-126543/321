export type UserRole = 'worker' | 'manager' | 'director';

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  roleName: string;
  faceData: string;
  lastLogin?: string;
}

export interface ShieldMachine {
  id: string;
  name: string;
  code: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  thrustSpeed: number;
  cutterTorque: number;
  groutingPressure: number;
  totalRings: number;
  cutterRotationSpeed: number;
  status: 'normal' | 'warning' | 'maintenance';
  history24h: {
    time: string;
    thrustSpeed: number;
    cutterTorque: number;
    groutingPressure: number;
    rings: number;
  }[];
}

export interface MonitoringPoint {
  id: string;
  code: string;
  position: { x: number; y: number; z: number };
  currentValue: number;
  threshold: number;
  warningThreshold: number;
  trend: number[];
  status: 'normal' | 'warning' | 'danger';
}

export type SegmentStatus = 'normal' | 'low' | 'critical';

export interface Segment {
  id: string;
  spec: string;
  ageDays: number;
  quantity: number;
  safeStock: number;
  position: { row: number; col: number; layer: number };
  status: SegmentStatus;
}

export type PurchasePlanStatus = 'draft' | 'level1' | 'level2' | 'approved' | 'rejected';

export interface PurchasePlan {
  id: string;
  segmentId: string;
  spec: string;
  quantity: number;
  createTime: string;
  status: PurchasePlanStatus;
  approvals: {
    role: string;
    user: string;
    time?: string;
    opinion?: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
}

export type JobType = '盾构司机' | '注浆工' | '管片拼装工' | '测量员' | '安全员' | '电工';
export type WorkArea = '地面' | '基坑' | '盾构机内' | '密闭舱室';

export interface Worker {
  id: string;
  name: string;
  jobType: JobType;
  position: { x: number; y: number; z: number };
  area: WorkArea;
  enterTime?: string;
  status: 'normal' | 'overtime';
}

export type NodeStatus = 'pending' | 'inProgress' | 'completed' | 'delayed';

export interface StationNode {
  id: string;
  name: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  progress: number;
  isKeyNode: boolean;
  status: NodeStatus;
  suggestion?: string;
}

export type MaintenanceType = '300环保养' | '500环保养' | '1000环大修';
export type OrderStatus = 'pending' | 'inProgress' | 'completed';

export interface MaintenanceOrder {
  id: string;
  shieldId: string;
  shieldName: string;
  type: MaintenanceType;
  triggerRings: number;
  createTime: string;
  status: OrderStatus;
  items: string[];
  handler?: string;
}

export type EventType = '预警' | '审批' | '工单' | '应急' | '进度';
export type EventLevel = 'info' | 'warning' | 'danger';

export interface EventLog {
  id: string;
  time: string;
  type: EventType;
  level: EventLevel;
  content: string;
  operator?: string;
}

export type EmergencyType = '涌水' | '坍塌' | '火灾' | '有害气体';

export interface EmergencyEvent {
  id: string;
  type: EmergencyType;
  position: { x: number; y: number; z: number };
  startTime: string;
  status: 'active' | 'resolved';
  evacuatePath: { x: number; y: number; z: number }[];
  rescuePath: { x: number; y: number; z: number }[];
  affectedPersonnel: string[];
}
