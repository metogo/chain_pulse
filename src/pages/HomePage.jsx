import React from 'react';
import GlobalMarketBar from '../features/GlobalMarketBar/GlobalMarketBar';
import MarketPulseBar from '../features/MarketPulseBar/MarketPulseBar';
import ControlPanel from '../features/ControlPanel/ControlPanel';
import MainView from '../features/MainView/MainView';
import Leaderboards from '../features/Leaderboards/Leaderboards';

const HomePage = () => {
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 text-white overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="flex-none">
        <GlobalMarketBar />
      </div>

      {/* Market Pulse Bar */}
      <div className="flex-none">
        <MarketPulseBar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar: Control Panel */}
        <div className="flex-none h-full">
          <ControlPanel />
        </div>

        {/* Center: Main View (Treemap or List) */}
        <main className="flex-1 p-4 relative overflow-hidden h-full min-h-0 min-w-0">
          <MainView />
        </main>

        {/* Right Sidebar: Leaderboards */}
        <div className="flex-none h-full">
          <Leaderboards />
        </div>
      </div>

    </div>
  );
};

export default HomePage;