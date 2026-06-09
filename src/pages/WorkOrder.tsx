import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Tag,
  Button,
  Modal,
  Checkbox,
  message,
  Space,
  Statistic,
  Row,
  Col,
  Breadcrumb,
} from 'antd';
import {
  Wrench,
  PlayCircle,
  CheckCircle2,
  Eye,
  Clock,
  Home,
  ArrowRight,
  AlertCircle,
  Settings,
  CheckSquare,
} from 'lucide-react';
import panels from '@/components/panels/DashboardPanels';
import useStore from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { ColumnsType } from 'antd/es/table';
import type { MaintenanceOrder, OrderStatus } from '@/types';

const { TopNavbar } = panels;

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-tech-orange/20 text-tech-orange border-tech-orange/40' },
  inProgress: { label: '进行中', className: 'bg-tech-blue/20 text-tech-blue border-tech-blue/40' },
  completed: { label: '已完成', className: 'bg-tech-green/20 text-tech-green border-tech-green/40' },
};

const AnimatedNumber: React.FC<{ value: number; duration?: number; className?: string }> = ({
  value,
  duration = 1000,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValueRef.current + (value - startValueRef.current) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
};

export default function WorkOrder() {
  const navigate = useNavigate();
  const {
    maintenanceOrders,
    currentUser,
    completeMaintenance,
    startMaintenance,
  } = useStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pendingCount = maintenanceOrders.filter((o) => o.status === 'pending').length;
  const inProgressCount = maintenanceOrders.filter((o) => o.status === 'inProgress').length;
  const completedCount = maintenanceOrders.filter((o) => o.status === 'completed').length;

  const handleStartProcess = (order: MaintenanceOrder) => {
    if (!currentUser) return;
    startMaintenance(order.id, currentUser.username);
    message.success(`已开始处理工单 ${order.id.toUpperCase()}`);
  };

  const handleOpenCompleteModal = (order: MaintenanceOrder) => {
    setSelectedOrder(order);
    setCheckedItems([]);
    setModalOpen(true);
  };

  const handleOpenDetailModal = (order: MaintenanceOrder) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const handleComplete = () => {
    if (!selectedOrder || !currentUser) return;
    if (checkedItems.length !== selectedOrder.items.length) {
      message.warning(`请完成全部 ${selectedOrder.items.length} 项保养内容`);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      completeMaintenance(selectedOrder.id, currentUser.username);
      message.success(`工单 ${selectedOrder.id.toUpperCase()} 已完成`);
      setLoading(false);
      setModalOpen(false);
      setSelectedOrder(null);
    }, 500);
  };

  const allChecked = selectedOrder ? checkedItems.length === selectedOrder.items.length : false;

  const columns: ColumnsType<MaintenanceOrder> = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      render: (v: string) => <span className="font-mono text-white">{v.toUpperCase()}</span>,
    },
    {
      title: '盾构机名称',
      dataIndex: 'shieldName',
      key: 'shieldName',
      width: 160,
      render: (v: string) => <span className="text-gray-200">{v}</span>,
    },
    {
      title: '保养类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (v: string) => {
        const colorCls =
          v === '300环保养'
            ? 'bg-tech-cyan/20 text-tech-cyan border-tech-cyan/40'
            : v === '500环保养'
              ? 'bg-tech-purple/20 text-tech-purple border-tech-purple/40'
              : 'bg-tech-orange/20 text-tech-orange border-tech-orange/40';
        return (
          <Tag className={cn('px-3 py-1 rounded-full text-xs font-medium border', colorCls)}>
            {v}
          </Tag>
        );
      },
    },
    {
      title: '触发环数',
      dataIndex: 'triggerRings',
      key: 'triggerRings',
      width: 120,
      render: (v: number) => (
        <span className="text-tech-cyan font-bold font-orbitron">{v} 环</span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (v: string) => <span className="text-gray-400 text-sm">{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => {
        const cfg = statusConfig[status];
        return (
          <Tag className={cn('px-3 py-1 rounded-full text-xs font-medium border', cfg.className)}>
            {status === 'inProgress' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-tech-blue mr-1.5 animate-pulse" />}
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 120,
      render: (v?: string) => (
        <span className={cn(v ? 'text-gray-300' : 'text-gray-500')}>{v || '-'}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => {
        if (record.status === 'pending') {
          return (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircle className="w-3.5 h-3.5" />}
              onClick={() => handleStartProcess(record)}
            >
              开始处理
            </Button>
          );
        }
        if (record.status === 'inProgress') {
          return (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={() => handleOpenCompleteModal(record)}
              className="!bg-tech-green !border-tech-green hover:!bg-tech-green/80"
            >
              完成工单
            </Button>
          );
        }
        return (
          <Button
            type="link"
            size="small"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => handleOpenDetailModal(record)}
            className="text-tech-cyan"
          >
            查看详情
          </Button>
        );
      },
    },
  ];

  const statCards = [
    {
      key: 'pending',
      label: '待处理',
      value: pendingCount,
      icon: <AlertCircle className="w-7 h-7" />,
      gradient: 'from-tech-orange/30 to-tech-orange/5',
      color: '#FA8C16',
      border: 'border-tech-orange/30',
      shadow: 'shadow-tech-orange/20',
    },
    {
      key: 'inProgress',
      label: '进行中',
      value: inProgressCount,
      icon: <Settings className="w-7 h-7" />,
      gradient: 'from-tech-blue/30 to-tech-blue/5',
      color: '#1890FF',
      border: 'border-tech-blue/30',
      shadow: 'shadow-tech-blue/20',
    },
    {
      key: 'completed',
      label: '已完成',
      value: completedCount,
      icon: <CheckSquare className="w-7 h-7" />,
      gradient: 'from-tech-green/30 to-tech-green/5',
      color: '#52C41A',
      border: 'border-tech-green/30',
      shadow: 'shadow-tech-green/20',
    },
  ];

  return (
    <div className="w-full min-h-screen star-bg">
      <TopNavbar />

      <div className="pt-4 pb-8 px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="tech-panel rounded-xl p-6 mb-6 relative"
        >
          <div className="absolute top-4 right-6 opacity-20">
            <Wrench className="w-20 h-20 text-tech-blue" />
          </div>
          <div className="relative z-10">
            <Breadcrumb
              className="mb-4"
              items={[
                {
                  title: (
                    <span className="flex items-center gap-1 text-gray-400 cursor-pointer hover:text-tech-blue transition-colors">
                      <Home className="w-3.5 h-3.5" onClick={() => navigate('/dashboard')} />
                      首页
                    </span>
                  ),
                },
                {
                  title: (
                    <span className="flex items-center gap-1 text-gray-300">
                      <ArrowRight className="w-3 h-3" />
                      设备工单
                    </span>
                  ),
                },
              ]}
            />
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-1">
                  <span className="w-1.5 h-8 bg-tech-blue rounded-full" />
                  盾构机维护工单管理
                </h1>
                <p className="text-gray-400 ml-5">
                  自动化保养工单生成 · 保养项目清单确认 · 维护记录追溯
                </p>
              </div>
              <Space>
                <div className="text-right">
                  <p className="text-xs text-gray-500">当前用户</p>
                  <p className="text-sm font-medium text-tech-cyan">
                    {currentUser?.username} · {currentUser?.roleName}
                  </p>
                </div>
              </Space>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <Row gutter={16}>
            {statCards.map((card, index) => (
              <Col span={8} key={card.key}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className={cn(
                    'tech-panel relative rounded-xl p-5 border bg-gradient-to-br overflow-hidden',
                    card.gradient,
                    card.border,
                    'shadow-lg',
                    card.shadow,
                  )}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
                    style={{ backgroundColor: card.color }}
                  />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">{card.label}</p>
                      <div className="flex items-baseline gap-1">
                        <AnimatedNumber
                          value={card.value}
                          className="text-4xl font-bold font-orbitron"
                        />
                        <span className="text-sm text-gray-500">单</span>
                      </div>
                    </div>
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center backdrop-blur-sm"
                      style={{
                        backgroundColor: `${card.color}20`,
                        color: card.color,
                        boxShadow: `0 0 20px ${card.color}30`,
                      }}
                    >
                      {card.icon}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 relative z-10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">占比</span>
                      <span className="font-mono" style={{ color: card.color }}>
                        {maintenanceOrders.length > 0
                          ? ((card.value / maintenanceOrders.length) * 100).toFixed(1)
                          : '0.0'}
                        %
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${maintenanceOrders.length > 0
                            ? (card.value / maintenanceOrders.length) * 100
                            : 0}%`,
                        }}
                        transition={{ duration: 0.8, delay: 0.3 + 0.1 * index, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: card.color,
                          boxShadow: `0 0 8px ${card.color}`,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="tech-panel rounded-xl p-6 relative"
        >
          <Table
            columns={columns}
            dataSource={maintenanceOrders}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
              className: '!mt-2',
            }}
            scroll={{ x: 1150 }}
            className="dark-table"
          />
        </motion.div>
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={
          <div className="flex items-center gap-3 text-lg font-bold text-white">
            <span className="w-1 h-5 bg-tech-green rounded-full" />
            完成保养工单 - 项目确认清单
          </div>
        }
        width={560}
        centered
        footer={
          <Space className="w-full justify-end">
            <Button
              onClick={() => setModalOpen(false)}
              className="!bg-white/5 !border-tech-border/50 !text-gray-300 hover:!bg-white/10"
            >
              取消
            </Button>
            <Button
              type="primary"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleComplete}
              loading={loading}
              disabled={!allChecked}
              className="!bg-tech-green !border-tech-green hover:!bg-tech-green/80 disabled:!bg-tech-green/30"
            >
              确认完成 ({checkedItems.length}/{selectedOrder?.items.length || 0})
            </Button>
          </Space>
        }
        styles={{
          content: { background: 'rgba(16, 30, 54, 0.97)', border: '1px solid rgba(24,144,255,0.4)', borderRadius: 12 },
          header: { background: 'transparent', borderBottom: '1px solid rgba(24,144,255,0.2)' },
          body: { padding: '24px' },
          footer: { borderTop: '1px solid rgba(24,144,255,0.2)', paddingTop: '16px' },
        }}
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-white/5 border border-tech-border/30">
              <div>
                <p className="text-xs text-gray-500 mb-1">工单编号</p>
                <p className="text-sm font-mono text-white font-medium">{selectedOrder.id.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">盾构机</p>
                <p className="text-sm text-white">{selectedOrder.shieldName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">保养类型</p>
                <p className="text-sm text-tech-purple font-medium">{selectedOrder.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">触发环数</p>
                <p className="text-sm text-tech-cyan font-medium font-orbitron">{selectedOrder.triggerRings} 环</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-tech-green" />
                  保养项目确认
                </p>
                <Checkbox
                  checked={allChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCheckedItems([...selectedOrder.items]);
                    } else {
                      setCheckedItems([]);
                    }
                  }}
                  className="!text-xs text-gray-400"
                >
                  全选
                </Checkbox>
              </div>

              <div className="space-y-2 p-2 rounded-lg bg-black/20 border border-tech-border/20 max-h-64 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => {
                  const isChecked = checkedItems.includes(item);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isChecked) {
                          setCheckedItems(checkedItems.filter((i) => i !== item));
                        } else {
                          setCheckedItems([...checkedItems, item]);
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200',
                        isChecked
                          ? 'bg-tech-green/10 border-tech-green/40'
                          : 'bg-white/5 border-tech-border/30 hover:bg-white/10 hover:border-tech-blue/30',
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          isChecked
                            ? 'bg-tech-green border-tech-green'
                            : 'border-gray-500',
                        )}
                      >
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className={cn(
                          'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0',
                          isChecked
                            ? 'bg-tech-green/20 text-tech-green'
                            : 'bg-white/5 text-gray-400',
                        )}>
                          {idx + 1}
                        </span>
                        <span className={cn(
                          'text-sm transition-all',
                          isChecked ? 'text-white line-through opacity-80' : 'text-gray-200',
                        )}>
                          {item}
                        </span>
                      </div>
                      {isChecked && (
                        <Tag className="!m-0 !bg-tech-green/20 !text-tech-green !border-tech-green/40 rounded-full text-[10px] px-2 py-0">
                          已完成
                        </Tag>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-tech-blue/5 border border-tech-blue/20">
                <span className="text-xs text-gray-400">完成进度</span>
                <span className="text-sm font-bold font-orbitron text-tech-blue">
                  {checkedItems.length} / {selectedOrder.items.length}
                  <span className="ml-1 text-gray-500 font-normal text-xs">
                    ({((checkedItems.length / selectedOrder.items.length) * 100).toFixed(0)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        title={
          <div className="flex items-center gap-3 text-lg font-bold text-white">
            <span className="w-1 h-5 bg-tech-blue rounded-full" />
            工单详情
          </div>
        }
        width={520}
        centered
        footer={
          <Button
            onClick={() => setDetailModalOpen(false)}
            type="primary"
            className="!ml-auto"
          >
            关闭
          </Button>
        }
        styles={{
          content: { background: 'rgba(16, 30, 54, 0.97)', border: '1px solid rgba(24,144,255,0.4)', borderRadius: 12 },
          header: { background: 'transparent', borderBottom: '1px solid rgba(24,144,255,0.2)' },
          body: { padding: '24px' },
          footer: { borderTop: '1px solid rgba(24,144,255,0.2)', paddingTop: '16px' },
        }}
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-white/5 border border-tech-border/30">
              <div>
                <p className="text-xs text-gray-500 mb-1">工单编号</p>
                <p className="text-sm font-mono text-white font-medium">{selectedOrder.id.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">创建时间</p>
                <p className="text-sm text-gray-300">{selectedOrder.createTime}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">盾构机</p>
                <p className="text-sm text-white">{selectedOrder.shieldName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">保养类型</p>
                <p className="text-sm text-tech-purple font-medium">{selectedOrder.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">触发环数</p>
                <p className="text-sm text-tech-cyan font-medium font-orbitron">{selectedOrder.triggerRings} 环</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">处理人</p>
                <p className="text-sm text-white">{selectedOrder.handler || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">状态</p>
                <Tag className={cn('px-3 py-1 rounded-full text-xs font-medium border', statusConfig[selectedOrder.status].className)}>
                  {statusConfig[selectedOrder.status].label}
                </Tag>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-tech-blue" />
                保养项目清单
              </p>
              <div className="space-y-2 p-2 rounded-lg bg-black/20 border border-tech-border/20 max-h-52 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-tech-border/30"
                  >
                    <div className="w-5 h-5 rounded-md bg-tech-green/20 border border-tech-green/40 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-tech-green" />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-md bg-tech-blue/20 text-tech-blue flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-200">{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
