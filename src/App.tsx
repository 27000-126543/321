import { Navigate, BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Approval from '@/pages/Approval';
import WorkOrder from '@/pages/WorkOrder';
import Emergency from '@/pages/Emergency';
import ExportReport from '@/pages/ExportReport';
import EventCenter from '@/pages/EventCenter';
import useStore from '@/store/useStore';

const PrivateRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const currentUser = useStore((s) => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890FF',
          colorInfo: '#1890FF',
          colorSuccess: '#52C41A',
          colorWarning: '#FA8C16',
          colorError: '#FF4D4F',
          borderRadius: 6,
          fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
        },
        components: {
          Modal: {
            contentBg: '#101E36',
            headerBg: '#101E36',
          },
          Table: {
            headerBg: 'rgba(24, 144, 255, 0.1)',
            headerColor: '#fff',
            rowHoverBg: 'rgba(24, 144, 255, 0.08)',
          },
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/approval" element={<PrivateRoute allowedRoles={['worker', 'manager', 'director']}><Approval /></PrivateRoute>} />
            <Route path="/workorder" element={<PrivateRoute allowedRoles={['worker', 'manager', 'director']}><WorkOrder /></PrivateRoute>} />
            <Route path="/emergency" element={<PrivateRoute allowedRoles={['manager', 'director']}><Emergency /></PrivateRoute>} />
            <Route path="/export" element={<PrivateRoute allowedRoles={['manager', 'director']}><ExportReport /></PrivateRoute>} />
            <Route path="/events" element={<PrivateRoute allowedRoles={['worker', 'manager', 'director']}><EventCenter /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
