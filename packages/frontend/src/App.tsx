import { MobileApp } from './mobile/MobileApp';
import { AgentDashboard } from './dashboard/AgentDashboard';

function App() {
  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center gap-8 p-8">
      {/* Left: Mobile App */}
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold text-gray-600 mb-4">
          Customer View
        </h2>
        <MobileApp />
      </div>

      {/* Right: Agent Dashboard */}
      <div className="flex flex-col h-[812px] w-[600px]">
        <h2 className="text-lg font-semibold text-gray-600 mb-4">
          Agent Dashboard (Judges View)
        </h2>
        <div className="flex-1 rounded-xl overflow-hidden shadow-2xl">
          <AgentDashboard />
        </div>
      </div>
    </div>
  );
}

export default App;
