import React, { useState } from 'react';
import { TravellerProvider, useTraveller } from './context/TravellerContext';
import { Header } from './components/Header';
import { WorkbenchView } from './components/WorkbenchView';
import { TravellerList } from './components/TravellerList';
import { NCRDashboard } from './components/NCRDashboard';
import { ToolCribView } from './components/ToolCribView';
import { CoCDashboard } from './components/CoCDashboard';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { NewTravellerModal } from './components/NewTravellerModal';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'workbench' | 'travellers' | 'ncrs' | 'tools' | 'coc'>('workbench');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNewTravellerOpen, setIsNewTravellerOpen] = useState(false);

  const { setActiveTravellerId } = useTraveller();

  const handleSelectTraveller = (id: string) => {
    setActiveTravellerId(id);
    setCurrentTab('workbench');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenNewTraveller={() => setIsNewTravellerOpen(true)}
      />

      {/* Main Tab Area */}
      <main className="max-w-7xl w-full mx-auto px-4 py-5 flex-1">
        {currentTab === 'workbench' && <WorkbenchView />}
        {currentTab === 'travellers' && (
          <TravellerList
            onSelectTraveller={handleSelectTraveller}
            onOpenNewTraveller={() => setIsNewTravellerOpen(true)}
          />
        )}
        {currentTab === 'ncrs' && <NCRDashboard onSelectTraveller={handleSelectTraveller} />}
        {currentTab === 'tools' && <ToolCribView />}
        {currentTab === 'coc' && <CoCDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-4 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>DIGITAL TRAVELLER SYSTEM • REV 2.4.0 • SHOP FLOOR WORKBENCH</span>
          <span>COMPLIANCE: IPC-A-610 CLASS 3 • AS9100D • ISO 13485</span>
        </div>
      </footer>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* New Traveler Creation Modal */}
      <NewTravellerModal
        isOpen={isNewTravellerOpen}
        onClose={() => setIsNewTravellerOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <TravellerProvider>
      <AppContent />
    </TravellerProvider>
  );
}

export default App;
