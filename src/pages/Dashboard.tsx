import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Scene3D from '@/components/scene/Scene3D';
import panels from '@/components/panels/DashboardPanels';
import ShieldChartModal from '@/components/panels/ShieldChartModal';
import useStore from '@/store/useStore';

const { TopNavbar, LeftNavPanel, ShieldInfoPanel, RightEventPanel, BottomProgressPanel } = panels;

export default function Dashboard() {
  const {
    selectedShieldId,
    setSelectedShield,
    setSelectedMonitoring,
    setHighlightMonitoring,
  } = useStore();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const shieldId = searchParams.get('shieldId');
    if (shieldId) {
      setSelectedShield(shieldId);
    }
    const mpId = searchParams.get('mpId');
    if (mpId) {
      setSelectedMonitoring(mpId);
      setHighlightMonitoring(mpId);
      setTimeout(() => setHighlightMonitoring(null), 5000);
    }
  }, [searchParams, setSelectedShield, setSelectedMonitoring, setHighlightMonitoring]);

  useEffect(() => {
    const timer = setInterval(() => {}, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full relative star-bg overflow-hidden">
      <div className="absolute inset-0">
        <Scene3D />
      </div>

      <div className="relative w-full h-full pointer-events-none">
        <div className="pointer-events-auto">
          <TopNavbar />
        </div>

        <div className="pointer-events-auto">
          <LeftNavPanel />
        </div>

        <div className="pointer-events-auto absolute left-4 bottom-4">
          <ShieldInfoPanel />
        </div>

        <div className="pointer-events-auto absolute right-4 top-24 bottom-4">
          <RightEventPanel />
        </div>

        <div className="pointer-events-auto absolute left-[260px] right-[360px] bottom-4">
          <BottomProgressPanel />
        </div>
      </div>

      <ShieldChartModal
        shieldId={selectedShieldId}
        onClose={() => setSelectedShield(null)}
      />
    </div>
  );
}
