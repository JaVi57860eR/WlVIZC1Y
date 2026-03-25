import React, { useState, useEffect, useRef } from 'react';
import { View, Strategy, BacktestResult, MarketData, RiskMetric, AppNotification } from './types';
import { generateMockMarketData, generateMockStrategy, generateEquityCurve, generateCorrelationMatrix } from './utils';

// Icons
import { LayoutDashboard, Code, LineChart, BarChart3, Settings, Bell, Search, User, Menu, X, Trash2, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// Views
import Dashboard from './views/Dashboard';
import StrategyEditor from './views/StrategyEditor';
import Backtest from './views/Backtest';
import SettingsView from './views/Settings';

const App: React.FC = () => {
  // Global State
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [activeStrategy, setActiveStrategy] = useState<Strategy>(generateMockStrategy('Momentum Alpha'));
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [riskData, setRiskData] = useState<RiskMetric[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Top Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Initial Data Load
  useEffect(() => {
    // Simulate fetching initial data
    setMarketData(generateMockMarketData());
    setRiskData(generateCorrelationMatrix());
    
    // Simulate initial notifications
    setNotifications([
      { id: '1', title: 'Order Filled', message: 'Bought 100 AAPL @ 175.43', time: '2m ago', type: 'success', read: false },
      { id: '2', title: 'Risk Alert', message: 'Portfolio Beta high (1.25)', time: '15m ago', type: 'warning', read: false },
      { id: '3', title: 'System Update', message: 'Maintenance scheduled for 2 AM', time: '1h ago', type: 'info', read: true },
    ]);

    // Simulate a background market tick
    const interval = setInterval(() => {
       setMarketData(prev => prev.map(item => ({
         ...item,
         price: item.price + (Math.random() - 0.5) * 0.5,
         timestamp: new Date()
       })));
    }, 2000);

    // Click outside to close notifications
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRunBacktest = () => {
    // Simulate backtest processing delay
    setCurrentView(View.BACKTEST);
    setBacktestResults(null); // Reset to show loading state if we implemented it, or just blank
    
    setTimeout(() => {
        // Generate pseudo-random results based on "execution"
        const result: BacktestResult = {
            strategyId: activeStrategy.id,
            sharpeRatio: parseFloat((1.2 + Math.random()).toFixed(2)),
            totalReturn: parseFloat((15 + Math.random() * 20).toFixed(2)),
            maxDrawdown: parseFloat((-5 - Math.random() * 10).toFixed(2)),
            winRate: parseFloat((45 + Math.random() * 20).toFixed(1)),
            equityCurve: generateEquityCurve(90, 10000),
            trades: []
        };
        setBacktestResults(result);
    }, 1500);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  // Filter market data based on search query
  const filteredMarketData = marketData.filter(item => 
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const NavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
    <button
      onClick={() => { setCurrentView(view); setIsMobileMenuOpen(false); }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-colors ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-50">
         <div className="flex items-center gap-2 font-bold text-xl text-white">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <LineChart className="w-5 h-5 text-white" />
            </div>
            QuantOS
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-40 flex flex-col`}>
        <div className="p-6 hidden md:flex items-center gap-3 font-bold text-2xl text-white tracking-tight">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <LineChart className="w-5 h-5 text-white" />
           </div>
           QuantOS
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">Platform</div>
          <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem view={View.STRATEGY} icon={Code} label="Strategy Lab" />
          <NavItem view={View.BACKTEST} icon={BarChart3} label="Backtest" />
          
          <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-8">System</div>
          <NavItem view={View.SETTINGS} icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-lg border border-slate-800">
             <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <User className="w-4 h-4" />
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">Quant Analyst</p>
                <p className="text-xs text-slate-500 truncate">Pro Plan</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
           <div className="flex items-center gap-4 text-slate-400">
              <span className="text-sm hidden sm:block">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
           </div>
           <div className="flex items-center gap-4 relative">
              {/* Search */}
              <div className="relative hidden sm:block group">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search tickers..." 
                   className="bg-slate-800 border border-slate-700 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-500 w-64 transition-all"
                 />
              </div>

              {/* Notifications */}
              <div ref={notificationRef} className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                  )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                  <div className="absolute top-12 right-0 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                      <h3 className="font-semibold text-sm text-slate-200">Notifications</h3>
                      {notifications.length > 0 && (
                        <button onClick={clearNotifications} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          No new notifications
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-700/50">
                          {notifications.map(n => (
                            <div key={n.id} className={`p-3 hover:bg-slate-700/50 transition-colors ${n.read ? 'opacity-60' : 'bg-slate-800/50'}`}>
                              <div className="flex gap-3">
                                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                                  n.type === 'success' ? 'bg-emerald-500' : 
                                  n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                }`} />
                                <div>
                                  <h4 className="text-sm font-medium text-slate-200 leading-none mb-1">{n.title}</h4>
                                  <p className="text-xs text-slate-400 leading-relaxed mb-1">{n.message}</p>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">{n.time}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
           </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-900">
           {currentView === View.DASHBOARD && (
             <Dashboard 
               marketData={filteredMarketData} 
               recentResults={backtestResults} 
               riskData={riskData}
             />
           )}
           {currentView === View.STRATEGY && (
             <StrategyEditor 
                strategy={activeStrategy}
                onUpdateStrategy={setActiveStrategy}
                onRunBacktest={handleRunBacktest}
             />
           )}
           {currentView === View.BACKTEST && backtestResults && (
             <Backtest strategy={activeStrategy} results={backtestResults} />
           )}
           {currentView === View.BACKTEST && !backtestResults && (
             <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-slate-300">No Backtest Results</h3>
                <p>Run a strategy from the Strategy Lab to see results here.</p>
                <button 
                  onClick={() => setCurrentView(View.STRATEGY)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Go to Strategy Lab
                </button>
             </div>
           )}
           {currentView === View.SETTINGS && (
              <SettingsView />
           )}
        </div>
      </main>
    </div>
  );
};

export default App;