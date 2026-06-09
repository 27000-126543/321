import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Tabs,
  Table,
  Tag,
  Button,
  Modal,
  Input,
  Timeline,
  message,
  Breadcrumb,
  Space,
  DatePicker,
  Select,
  Row,
  Col,
  Card,
  Statistic,
  Tooltip,
  Divider,
  Dropdown,
  MenuProps,
} from 'antd';
import {
  AlertCircle,
  Home,
  ArrowRight,
  Filter,
  RefreshCw,
  Eye,
  ArrowLeftCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  FileCheck,
  Wrench,
  Gauge,
  MapPin,
  User,
  Siren,
  ChevronDown,
  Send,
} from 'lucide-react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import panels from '@/components/panels/DashboardPanels';
import useStore from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { ColumnsType } from 'antd/es/table';
import type {
  EventLog,
  EventType,
  EventLevel,
  EventHandleStatus,
  EventRelatedType,
} from '@/types';

const { TopNavbar } = panels;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const typeConfig: Record<EventType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  预警: { label: '预警', color: '#FF4D4F', bg: 'bg-tech-red/10 text-tech-red border-tech-red/40', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  审批: { label: '审批', color: '#1890FF', bg: 'bg-tech-blue/10 text-tech-blue border-tech-blue/40', icon: <FileCheck className="w-3.5 h-3.5" /> },
  工单: { label: '工单', color: '#FA8C16', bg: 'bg-tech-orange/10 text-tech-orange border-tech-orange/40', icon: <Wrench className="w-3.5 h-3.5" /> },
  应急: { label: '应急', color: '#722ED1', bg: 'bg-tech-purple/10 text-tech-purple border-tech-purple/40', icon: <Siren className="w-3.5 h-3.5" /> },
  进度: { label: '进度', color: '#52C41A', bg: 'bg-tech-green/10 text-tech-green border-tech-green/40', icon: <Gauge className="w-3.5 h-3.5" /> },
};

const levelConfig: Record<EventLevel, { label: string; color: string }> = {
  info: { label: '信息', color: '#1890FF' },
  warning: { label: '警告', color: '#FA8C16' },
  danger: { label: '危险', color: '#FF4D4F' },
};

const handleStatusConfig: Record<EventHandleStatus, { label: string; cls: string; dot: string }> = {
  pending: { label: '待处理', cls: 'bg-tech-red/10 text-tech-red border-tech-red/40', dot: 'bg-tech-red animate-pulse' },
  inProgress: { label: '处理中', cls: 'bg-tech-orange/10 text-tech-orange border-tech-orange/40', dot: 'bg-tech-orange animate-pulse' },
  closed: { label: '已关闭', cls: 'bg-tech-green/10 text-tech-green border-tech-green/40', dot: 'bg-tech-green' },
};

const relatedTypeLabels: Record<EventRelatedType, string> = {
  purchasePlan: '采购计划',
  maintenanceOrder: '保养工单',
  shield: '盾构机',
  monitoringPoint: '监测点',
  worker: '人员',
  emergency: '应急事件',
};

const relatedTypeIcons: Record<EventRelatedType, React.ReactNode> = {
  purchasePlan: <FileCheck className="w-3 h-3" />,
  maintenanceOrder: <Wrench className="w-3 h-3" />,
  shield: <Gauge className="w-3 h-3" />,
  monitoringPoint: <MapPin className="w-3 h-3" />,
  worker: <User className="w-3 h-3" />,
  emergency: <Siren className="w-3 h-3" />,
};

export default function EventCenter() {
  const navigate = useNavigate();
  const { eventLogs, currentUser, updateEventStatus } = useStore();

  const [typeFilter, setTypeFilter] = useState<EventType[] | undefined>();
  const [levelFilter, setLevelFilter] = useState<EventLevel[] | undefined>();
  const [statusFilter, setStatusFilter] = useState<EventHandleStatus[] | undefined>();
  const [operatorFilter, setOperatorFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [handleRemark, setHandleRemark] = useState('');
  const [handleLoading, setHandleLoading] = useState(false);

  const stats = useMemo(() => {
    const counts = {
      total: eventLogs.length,
      pending: 0,
      inProgress: 0,
      closed: 0,
      danger: 0,
      warning: 0,
    };
    eventLogs.forEach((e) => {
      if (e.handleStatus === 'pending') counts.pending++;
      else if (e.handleStatus === 'inProgress') counts.inProgress++;
      else counts.closed++;
      if (e.level === 'danger') counts.danger++;
      else if (e.level === 'warning') counts.warning++;
    });
    return counts;
  }, [eventLogs]);

  const operators = useMemo(() => {
    const set = new Set<string>();
    eventLogs.forEach((e) => e.operator && set.add(e.operator));
    return Array.from(set);
  }, [eventLogs]);

  const filteredEvents = useMemo(() => {
    return eventLogs.filter((e) => {
      if (typeFilter && typeFilter.length > 0 && !typeFilter.includes(e.type)) return false;
      if (levelFilter && levelFilter.length > 0 && !levelFilter.includes(e.level)) return false;
      if (statusFilter && statusFilter.length > 0 && !statusFilter.includes(e.handleStatus || 'closed')) return false;
      if (operatorFilter && e.operator !== operatorFilter) return false;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const eventTime = dayjs(e.time, 'YYYY-MM-DD HH:mm:ss');
        if (!eventTime.isValid()) return false;
        if (eventTime.isBefore(dateRange[0].startOf('day')) || eventTime.isAfter(dateRange[1].endOf('day'))) return false;
      }
      return true;
    });
  }, [eventLogs, typeFilter, levelFilter, statusFilter, operatorFilter, dateRange]);

  const handleViewDetail = (event: EventLog) => {
    setSelectedEvent(event);
    setHandleRemark('');
    setDetailOpen(true);
  };

  const handleUpdateStatus = async (targetStatus: EventHandleStatus) => {
    if (!selectedEvent || !currentUser) return;
    setHandleLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 300));
      updateEventStatus(selectedEvent.id, targetStatus, currentUser.username, handleRemark || undefined);
      message.success(`已更新为：${handleStatusConfig[targetStatus].label}`);
      setHandleRemark('');
      setSelectedEvent({
        ...selectedEvent,
        handleStatus: targetStatus,
        handleRecords: [
          ...(selectedEvent.handleRecords || []),
          {
            id: `hr${Date.now()}`,
            status: targetStatus,
            handler: currentUser.username,
            time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            remark: handleRemark || undefined,
          },
        ],
      });
    } catch {
      message.error('操作失败，请重试');
    } finally {
      setHandleLoading(false);
    }
  };

  const goToRelated = (event: EventLog) => {
    if (!event.relatedType || !event.relatedId) return;
    const id = event.relatedId;
    switch (event.relatedType) {
      case 'purchasePlan':
        navigate(`/approval?planId=${id}`);
        break;
      case 'maintenanceOrder':
        navigate(`/workorder?orderId=${id}`);
        break;
      case 'shield':
        navigate(`/dashboard?shieldId=${id}`);
        break;
      case 'monitoringPoint':
        navigate(`/dashboard?mpId=${id}`);
        break;
      case 'worker':
        navigate(`/dashboard?workerId=${id}`);
        break;
      case 'emergency':
        navigate('/emergency');
        break;
    }
  };

  const handleMenu: MenuProps['items'] = [
    {
      key: 'inProgress',
      label: (
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-tech-orange" /> 标记处理中
        </span>
      ),
      onClick: () => handleUpdateStatus('inProgress'),
    },
    {
      key: 'closed',
      label: (
        <span className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-tech-green" /> 关闭事件
        </span>
      ),
      onClick: () => handleUpdateStatus('closed'),
    },
  ];

  const columns: ColumnsType<EventLog> = [
    {
      title: '时间',
      dataIndex: 'time',
      width: 110,
      fixed: 'left',
      render: (v) => <span className="font-mono text-gray-300">{v}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (t: EventType) => {
        const cfg = typeConfig[t];
        return (
          <Tag className={cn('border flex items-center gap-1 !px-2 !py-1 rounded-md', cfg.bg)}>
            {cfg.icon}
            <span className="text-xs font-medium">{cfg.label}</span>
          </Tag>
        );
      },
      filters: (['预警', '审批', '工单', '应急', '进度'] as EventType[]).map((t) => ({ text: typeConfig[t].label, value: t })),
      onFilter: (val, record) => record.type === val,
    },
    {
      title: '级别',
      dataIndex: 'level',
      width: 90,
      render: (l: EventLevel) => {
        const cfg = levelConfig[l];
        return (
          <span style={{ color: cfg.color }} className="font-semibold text-xs">
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: '事件内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (v: string, record) => (
        <Tooltip title={v}>
          <div className="flex items-start gap-2">
            <span className="text-gray-200 text-sm">{v}</span>
            {record.relatedType && (
              <Tooltip title={`查看${relatedTypeLabels[record.relatedType]}: ${record.relatedName || record.relatedId}`}>
                <button
                  onClick={() => goToRelated(record)}
                  className="flex-shrink-0 w-5 h-5 rounded bg-tech-blue/10 text-tech-blue hover:bg-tech-blue/20 flex items-center justify-center transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              </Tooltip>
            )}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '关联对象',
      width: 140,
      render: (_, record) => {
        if (!record.relatedType) return <span className="text-gray-500 text-xs">-</span>;
        return (
          <Tag className="!border-gray-600 !text-gray-300 !bg-white/5 flex items-center gap-1 rounded-md">
            {relatedTypeIcons[record.relatedType]}
            <span className="text-xs">{relatedTypeLabels[record.relatedType]}</span>
            {record.relatedName && <span className="text-tech-cyan font-mono text-xs">·{record.relatedName}</span>}
          </Tag>
        );
      },
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 100,
      render: (v) => <span className="text-gray-300 text-xs">{v || '-'}</span>,
    },
    {
      title: '处置状态',
      dataIndex: 'handleStatus',
      width: 110,
      render: (s: EventHandleStatus | undefined) => {
        const status = s || 'closed';
        const cfg = handleStatusConfig[status];
        return (
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border', cfg.cls)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {cfg.label}
          </span>
        );
      },
      filters: (['pending', 'inProgress', 'closed'] as EventHandleStatus[]).map((s) => ({
        text: handleStatusConfig[s].label,
        value: s,
      })),
      onFilter: (val, record) => (record.handleStatus || 'closed') === val,
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => handleViewDetail(record)}
            className="!bg-tech-blue/10 !border-tech-blue/40 !text-tech-blue hover:!bg-tech-blue/20"
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const resetFilters = () => {
    setTypeFilter(undefined);
    setLevelFilter(undefined);
    setStatusFilter(undefined);
    setOperatorFilter(undefined);
    setDateRange(null);
  };

  return (
    <div className="w-full h-full star-bg overflow-hidden flex flex-col">
      <TopNavbar />

      <div className="flex-1 overflow-hidden flex flex-col px-4 pb-4 pt-2">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-3 flex items-center justify-between"
        >
          <Breadcrumb className="!text-gray-400 text-xs">
            <Breadcrumb.Item className="!text-gray-500 flex items-center gap-1 cursor-pointer hover:!text-tech-cyan transition-colors" onClick={() => navigate('/dashboard')}>
              <Home className="w-3 h-3" /> 主控台
            </Breadcrumb.Item>
            <Breadcrumb.Separator><ArrowRight className="w-3 h-3" /></Breadcrumb.Separator>
            <Breadcrumb.Item className="!text-tech-cyan font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> 事件中心
            </Breadcrumb.Item>
          </Breadcrumb>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-5 gap-3 mb-3 flex-shrink-0"
        >
          {[
            { label: '事件总数', value: stats.total, color: '#60A5FA', icon: <AlertCircle className="w-5 h-5" /> },
            { label: '待处理', value: stats.pending, color: '#FF4D4F', icon: <XCircle className="w-5 h-5" /> },
            { label: '处理中', value: stats.inProgress, color: '#FA8C16', icon: <Clock className="w-5 h-5" /> },
            { label: '已关闭', value: stats.closed, color: '#52C41A', icon: <CheckCircle2 className="w-5 h-5" /> },
            { label: '高风险', value: stats.danger + stats.warning, color: '#722ED1', icon: <Siren className="w-5 h-5" /> },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="tech-panel rounded-xl p-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className="text-2xl font-bold font-orbitron" style={{ color: s.color }}>
                    {s.value}
                  </p>
                </div>
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${s.color}15`, color: s.color }}
                >
                  {s.icon}
                </div>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: `linear-gradient(90deg, transparent, ${s.color}66, transparent)` }}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="tech-panel rounded-xl p-3 mb-3 flex-shrink-0"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-gray-400 mr-2">
              <Filter className="w-3.5 h-3.5 text-tech-blue" />
              <span className="font-medium">筛选条件：</span>
            </div>
            <Select
              mode="multiple"
              allowClear
              placeholder="事件类型"
              style={{ width: 180 }}
              value={typeFilter}
              onChange={setTypeFilter}
              size="small"
              className="!bg-white/5"
              options={(['预警', '审批', '工单', '应急', '进度'] as EventType[]).map((t) => ({
                label: typeConfig[t].label,
                value: t,
              }))}
            />
            <Select
              mode="multiple"
              allowClear
              placeholder="级别"
              style={{ width: 140 }}
              value={levelFilter}
              onChange={setLevelFilter}
              size="small"
              options={(['info', 'warning', 'danger'] as EventLevel[]).map((l) => ({
                label: levelConfig[l].label,
                value: l,
              }))}
            />
            <Select
              mode="multiple"
              allowClear
              placeholder="处置状态"
              style={{ width: 160 }}
              value={statusFilter}
              onChange={setStatusFilter}
              size="small"
              options={(['pending', 'inProgress', 'closed'] as EventHandleStatus[]).map((s) => ({
                label: handleStatusConfig[s].label,
                value: s,
              }))}
            />
            <Select
              allowClear
              placeholder="操作人"
              style={{ width: 140 }}
              value={operatorFilter}
              onChange={setOperatorFilter}
              size="small"
              showSearch
              options={operators.map((o) => ({ label: o, value: o }))}
            />
            <RangePicker
              showTime
              size="small"
              style={{ width: 300 }}
              value={dateRange}
              onChange={setDateRange as any}
              format="YYYY-MM-DD HH:mm"
              placeholder={['开始时间', '结束时间']}
            />
            <div className="flex-1" />
            <Button
              size="small"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={resetFilters}
              className="!bg-white/5 !border-tech-border !text-gray-300 hover:!bg-white/10"
            >
              重置
            </Button>
            <span className="text-xs text-gray-500">
              筛选结果：<span className="text-tech-cyan font-semibold">{filteredEvents.length}</span> 条
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="tech-panel rounded-xl flex-1 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-tech-border/50">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-tech-red" />
              全事件追溯中心
            </h2>
            <span className="text-xs text-gray-500">
              共 <span className="text-tech-cyan font-semibold">{filteredEvents.length}</span> 条事件记录
            </span>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <Table
              columns={columns}
              dataSource={filteredEvents}
              rowKey="id"
              size="small"
              pagination={{
                pageSize: 15,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              className="!bg-transparent event-center-table"
              scroll={{ x: 1100, y: 'calc(100vh - 500px)' }}
            />
          </div>
        </motion.div>
      </div>

      <Modal
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={680}
        title={
          selectedEvent ? (
            <div className="flex items-center gap-3 py-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border',
                  typeConfig[selectedEvent.type].bg
                )}
              >
                {typeConfig[selectedEvent.type].icon}
                {typeConfig[selectedEvent.type].label}
              </span>
              <span className="text-sm text-gray-300 font-mono">{selectedEvent.time}</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ml-auto',
                  handleStatusConfig[selectedEvent.handleStatus || 'closed'].cls
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', handleStatusConfig[selectedEvent.handleStatus || 'closed'].dot)} />
                {handleStatusConfig[selectedEvent.handleStatus || 'closed'].label}
              </span>
            </div>
          ) : null
        }
        className="event-detail-modal"
      >
        {selectedEvent && (
          <div className="space-y-5 pt-2">
            <div className="tech-panel rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-2">事件内容</p>
              <p className="text-sm text-white leading-relaxed">{selectedEvent.content}</p>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <div className="bg-white/5 rounded-lg p-3 border border-tech-border/40">
                  <p className="text-xs text-gray-400 mb-1">事件级别</p>
                  <p
                    className="font-semibold"
                    style={{ color: levelConfig[selectedEvent.level].color }}
                  >
                    {levelConfig[selectedEvent.level].label}
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div className="bg-white/5 rounded-lg p-3 border border-tech-border/40">
                  <p className="text-xs text-gray-400 mb-1">操作人</p>
                  <p className="text-sm text-white font-medium">{selectedEvent.operator || '-'}</p>
                </div>
              </Col>
            </Row>

            {selectedEvent.relatedType && (
              <div className="bg-tech-blue/5 rounded-lg p-4 border border-tech-blue/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> 关联对象
                    </p>
                    <p className="text-sm text-white flex items-center gap-2">
                      {relatedTypeIcons[selectedEvent.relatedType]}
                      {relatedTypeLabels[selectedEvent.relatedType]}
                      {selectedEvent.relatedName && (
                        <span className="font-mono text-tech-cyan ml-1">· {selectedEvent.relatedName}</span>
                      )}
                    </p>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<ArrowLeftCircle className="w-3.5 h-3.5" />}
                    onClick={() => goToRelated(selectedEvent)}
                  >
                    跳转查看
                  </Button>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-tech-purple rounded-full" />
                <h3 className="text-sm font-semibold text-white">处置历史</h3>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-tech-border/40">
                {(!selectedEvent.handleRecords || selectedEvent.handleRecords.length === 0) ? (
                  <p className="text-xs text-gray-500 text-center py-4">暂无处置记录</p>
                ) : (
                  <Timeline
                    items={[
                      {
                        color: '#1890FF',
                        dot: <Clock className="w-4 h-4" />,
                        children: (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-tech-cyan font-medium">事件创建</span>
                              <span className="text-[10px] text-gray-500 font-mono">{selectedEvent.time}</span>
                            </div>
                            <p className="text-xs text-gray-400">系统/操作人触发事件</p>
                          </div>
                        ),
                      },
                      ...(selectedEvent.handleRecords || []).map((hr) => {
                        const cfg = handleStatusConfig[hr.status];
                        return {
                          color: cfg.dot.includes('tech-green')
                            ? '#52C41A'
                            : cfg.dot.includes('tech-orange')
                              ? '#FA8C16'
                              : '#FF4D4F',
                          children: (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn('text-xs font-medium', cfg.cls.split(' ')[1])}>
                                  {cfg.label}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">{hr.time}</span>
                              </div>
                              <p className="text-xs text-gray-300 mb-0.5">处置人：<span className="text-white">{hr.handler}</span></p>
                              {hr.remark && <p className="text-xs text-gray-400">备注：{hr.remark}</p>}
                            </div>
                          ),
                        };
                      }),
                    ]}
                  />
                )}
              </div>
            </div>

            {(selectedEvent.handleStatus === 'pending' || selectedEvent.handleStatus === 'inProgress') && (
              <div className="space-y-3 pt-2 border-t border-tech-border/40">
                <TextArea
                  rows={2}
                  placeholder="请输入处置备注（可选）"
                  value={handleRemark}
                  onChange={(e) => setHandleRemark(e.target.value)}
                  className="!bg-white/5 !border-tech-border !text-white !placeholder:text-gray-500 resize-none"
                />
                <div className="flex items-center gap-3 justify-end">
                  <Button onClick={() => setDetailOpen(false)} className="!bg-white/5 !border-tech-border !text-gray-300">
                    取消
                  </Button>
                  <Dropdown menu={{ items: handleMenu }} placement="bottomRight" disabled={handleLoading}>
                    <Button
                      type="primary"
                      icon={<Send className="w-3.5 h-3.5" />}
                      loading={handleLoading}
                    >
                      更新处置状态 <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </Dropdown>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
