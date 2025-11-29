import React from 'react';
import GlobalMarketBar from './features/GlobalMarketBar/GlobalMarketBar';
import ControlPanel from './features/ControlPanel/ControlPanel';
import TreemapContainer from './features/treemap/TreemapContainer';
import Leaderboards from './features/Leaderboards/Leaderboards';
import TokenDetailPanel from './features/TokenDetailPanel/TokenDetailPanel';

function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 text-white overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="flex-none">
        <GlobalMarketBar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar: Control Panel */}
        <div className="flex-none h-full">
          <ControlPanel />
        </div>

        {/* Center: Treemap Visualization */}
        <main className="flex-1 p-4 relative overflow-hidden h-full min-h-0 min-w-0">
          <TreemapContainer />
        </main>

        {/* Right Sidebar: Leaderboards */}
        <div className="flex-none h-full">
          <Leaderboards />
        </div>
      </div>

      {/* Overlay: Token Detail Panel */}
      <TokenDetailPanel />
    </div>
  );
}

export default App;
