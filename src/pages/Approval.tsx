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
} from 'antd';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Home,
  ArrowRight,
} from 'lucide-react';
import panels from '@/components/panels/DashboardPanels';
import useStore from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { ColumnsType } from 'antd/es/table';
import type { PurchasePlan, PurchasePlanStatus } from '@/types';

const { TopNavbar } = panels;
const { TextArea } = Input;

const statusTabMap: Record<string, PurchasePlanStatus[] | null> = {
  all: null,
  pending: ['draft', 'level1', 'level2'],
  approved: ['approved'],
  rejected: ['rejected'],
};

const statusConfig: Record<PurchasePlanStatus, { label: string; color: string; className: string }> = {
  draft: { label: '待一级审批', color: 'default', className: 'bg-gray-500/20 text-gray-300 border-gray-500/40' },
  level1: { label: '待二级审批', color: 'blue', className: 'bg-tech-blue/20 text-tech-blue border-tech-blue/40' },
  level2: { label: '待三级审批', color: 'purple', className: 'bg-tech-purple/20 text-tech-purple border-tech-purple/40' },
  approved: { label: '已通过', color: 'green', className: 'bg-tech-green/20 text-tech-green border-tech-green/40' },
  rejected: { label: '已驳回', color: 'red', className: 'bg-tech-red/20 text-tech-red border-tech-red/40' },
};

const roleToIndex: Record<string, number> = {
  worker: 0,
  manager: 1,
  director: 2,
};

export default function Approval() {
  const navigate = useNavigate();
  const {
    purchasePlans,
    currentUser,
    approvePurchasePlan,
    rejectPurchasePlan,
  } = useStore();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PurchasePlan | null>(null);
  const [opinion, setOpinion] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredPlans = useMemo(() => {
    const filter = statusTabMap[activeTab];
    if (!filter) return purchasePlans;
    return purchasePlans.filter((p) => filter.includes(p.status));
  }, [purchasePlans, activeTab]);

  const canApprove = (plan: PurchasePlan): boolean => {
    if (!currentUser) return false;
    if (plan.status === 'approved' || plan.status === 'rejected') return false;
    const roleIdx = roleToIndex[currentUser.role];
    if (roleIdx === undefined) return false;
    if (plan.status === 'draft' && roleIdx === 0) return true;
    if (plan.status === 'level1' && roleIdx === 1) return true;
    if (plan.status === 'level2' && roleIdx === 2) return true;
    return false;
  };

  const getCurrentApprover = (plan: PurchasePlan): string => {
    if (plan.status === 'draft') return plan.approvals[0]?.user || '-';
    if (plan.status === 'level1') return plan.approvals[1]?.user || '-';
    if (plan.status === 'level2') return plan.approvals[2]?.user || '-';
    return '-';
  };

  const handleOpenModal = (plan: PurchasePlan) => {
    setSelectedPlan(plan);
    setOpinion('');
    setModalOpen(true);
  };

  const handleApprove = () => {
    if (!selectedPlan || !currentUser) return;
    const roleIdx = roleToIndex[currentUser.role];
    if (roleIdx === undefined) return;
    setLoading(true);
    setTimeout(() => {
      approvePurchasePlan(selectedPlan.id, roleIdx, opinion || '同意');
      message.success('审批通过成功');
      setLoading(false);
      setModalOpen(false);
      setSelectedPlan(null);
    }, 500);
  };

  const handleReject = () => {
    if (!selectedPlan || !currentUser) return;
    const roleIdx = roleToIndex[currentUser.role];
    if (roleIdx === undefined) return;
    if (!opinion.trim()) {
      message.warning('请填写驳回意见');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      rejectPurchasePlan(selectedPlan.id, roleIdx, opinion);
      message.error('已驳回采购计划');
      setLoading(false);
      setModalOpen(false);
      setSelectedPlan(null);
    }, 500);
  };

  const columns: ColumnsType<PurchasePlan> = [
    {
      title: '计划编号',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      render: (v: string) => <span className="font-mono text-white">{v.toUpperCase()}</span>,
    },
    {
      title: '管片规格',
      dataIndex: 'spec',
      key: 'spec',
      width: 200,
      render: (v: string) => <span className="text-gray-200">{v}</span>,
    },
    {
      title: '采购数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (v: number) => (
        <span className="text-tech-cyan font-bold font-orbitron">{v} 块</span>
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
      title: '审批状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: PurchasePlanStatus) => {
        const cfg = statusConfig[status];
        return (
          <Tag className={cn('px-3 py-1 rounded-full text-xs font-medium border', cfg.className)}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: '当前审批人',
      key: 'approver',
      width: 120,
      render: (_, record) => <span className="text-gray-300">{getCurrentApprover(record)}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        if (canApprove(record)) {
          return (
            <Button
              type="primary"
              size="small"
              icon={<FileCheck className="w-3.5 h-3.5" />}
              onClick={() => handleOpenModal(record)}
            >
              审批
            </Button>
          );
        }
        return (
          <Button
            type="link"
            size="small"
            onClick={() => handleOpenModal(record)}
            className="text-tech-cyan"
          >
            查看详情
          </Button>
        );
      },
    },
  ];

  const tabItems = [
    { key: 'all', label: `全部 (${purchasePlans.length})` },
    {
      key: 'pending',
      label: `待我审批 (${
        purchasePlans.filter((p) => {
          if (!currentUser) return false;
          const idx = roleToIndex[currentUser.role];
          return (
            (p.status === 'draft' && idx === 0) ||
            (p.status === 'level1' && idx === 1) ||
            (p.status === 'level2' && idx === 2)
          );
        }).length
      })`,
    },
    { key: 'approved', label: `已通过 (${purchasePlans.filter((p) => p.status === 'approved').length})` },
    { key: 'rejected', label: `已驳回 (${purchasePlans.filter((p) => p.status === 'rejected').length})` },
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
            <FileCheck className="w-20 h-20 text-tech-blue" />
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
                      管片审批
                    </span>
                  ),
                },
              ]}
            />
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-1">
                  <span className="w-1.5 h-8 bg-tech-blue rounded-full" />
                  管片采购审批管理
                </h1>
                <p className="text-gray-400 ml-5">
                  三级审批流程：施工员 → 项目经理 → 物资部
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
          transition={{ duration: 0.5, delay: 0.2 }}
          className="tech-panel rounded-xl p-6 relative"
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            className="mb-4"
            style={{ borderBottom: '1px solid rgba(24,144,255,0.15)' }}
          />

          <Table
            columns={columns}
            dataSource={filteredPlans}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
              className: '!mt-4',
            }}
            scroll={{ x: 1100 }}
            className="dark-table"
          />
        </motion.div>
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={
          <div className="flex items-center gap-3 text-lg font-bold text-white">
            <span className="w-1 h-5 bg-tech-blue rounded-full" />
            采购计划审批详情
          </div>
        }
        width={640}
        centered
        footer={
          <Space className="w-full justify-end">
            <Button
              onClick={() => setModalOpen(false)}
              className="!bg-white/5 !border-tech-border/50 !text-gray-300 hover:!bg-white/10"
            >
              取消
            </Button>
            {selectedPlan && canApprove(selectedPlan) && (
              <>
                <Button
                  danger
                  icon={<XCircle className="w-4 h-4" />}
                  onClick={handleReject}
                  loading={loading}
                  className="!bg-tech-red/10 !border-tech-red/50 !text-tech-red hover:!bg-tech-red/20"
                >
                  驳回
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={handleApprove}
                  loading={loading}
                >
                  通过
                </Button>
              </>
            )}
          </Space>
        }
        styles={{
          content: { background: 'rgba(16, 30, 54, 0.97)', border: '1px solid rgba(24,144,255,0.4)', borderRadius: 12 },
          header: { background: 'transparent', borderBottom: '1px solid rgba(24,144,255,0.2)' },
          body: { padding: '24px' },
          footer: { borderTop: '1px solid rgba(24,144,255,0.2)', paddingTop: '16px' },
        }}
      >
        {selectedPlan && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-white/5 border border-tech-border/30">
              <div>
                <p className="text-xs text-gray-500 mb-1">计划编号</p>
                <p className="text-sm font-mono text-white font-medium">{selectedPlan.id.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">创建时间</p>
                <p className="text-sm text-gray-300">{selectedPlan.createTime}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">管片规格</p>
                <p className="text-sm text-white">{selectedPlan.spec}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">采购数量</p>
                <p className="text-sm text-tech-cyan font-bold font-orbitron">{selectedPlan.quantity} 块</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-tech-blue" />
                审批流程
              </p>
              <Timeline
                className="!ml-2"
                items={selectedPlan.approvals.map((app, idx) => {
                  const dotColor =
                    app.status === 'approved'
                      ? '#52C41A'
                      : app.status === 'rejected'
                        ? '#FF4D4F'
                        : '#1890FF';
                  return {
                    dot:
                      app.status === 'approved' ? (
                        <CheckCircle className="w-4 h-4 text-tech-green" />
                      ) : app.status === 'rejected' ? (
                        <XCircle className="w-4 h-4 text-tech-red" />
                      ) : (
                        <Clock className="w-4 h-4 text-tech-blue animate-pulse" />
                      ),
                    color: dotColor,
                    children: (
                      <div
                        className={cn(
                          'p-3 rounded-lg border',
                          app.status === 'approved' && 'bg-tech-green/5 border-tech-green/20',
                          app.status === 'rejected' && 'bg-tech-red/5 border-tech-red/20',
                          app.status === 'pending' && 'bg-tech-blue/5 border-tech-blue/20',
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-white">
                            第{idx + 1}级 · {app.role}
                          </span>
                          <Tag
                            className={cn(
                              '!m-0 px-2 py-0 text-[10px] rounded-full border',
                              app.status === 'approved' &&
                                '!bg-tech-green/20 !text-tech-green !border-tech-green/40',
                              app.status === 'rejected' &&
                                '!bg-tech-red/20 !text-tech-red !border-tech-red/40',
                              app.status === 'pending' &&
                                '!bg-tech-blue/20 !text-tech-blue !border-tech-blue/40',
                            )}
                          >
                            {app.status === 'approved'
                              ? '已通过'
                              : app.status === 'rejected'
                                ? '已驳回'
                                : '待审批'}
                          </Tag>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">审批人：{app.user}</p>
                        {app.time && <p className="text-xs text-gray-500 mb-1">时间：{app.time}</p>}
                        {app.opinion && (
                          <p className="text-xs text-gray-300 mt-2 p-2 rounded bg-black/20 border-l-2 border-tech-blue/50">
                            意见：{app.opinion}
                          </p>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            </div>

            {selectedPlan && canApprove(selectedPlan) && (
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  审批意见 <span className="text-tech-red">*</span>
                </label>
                <TextArea
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  rows={3}
                  placeholder="请输入审批意见，驳回时必填..."
                  className="!bg-white/5 !border-tech-border/50 !text-white placeholder:!text-gray-500 focus:!border-tech-blue/60"
                  maxLength={200}
                  showCount
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
