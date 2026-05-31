import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { LangProvider, useLang } from './LangContext';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/pages/DashboardPage';
import ChessboardPage from './components/pages/ChessboardPage';
import TasksPage from './components/pages/TasksPage';
import GuestsPage from './components/pages/GuestsPage';
import FinancePage from './components/pages/FinancePage';
import MedicalPage from './components/pages/MedicalPage';
import SosPage from './components/pages/SosPage';
import UsersPage from './components/pages/UsersPage';
import SettingsOverlay from './components/SettingsOverlay';
import RolesOverlay from './components/RolesOverlay';

function Navbar({ onOpenSettings, onOpenRoles, onLogout, onToggleLang }: {
  onOpenSettings: () => void;
  onOpenRoles: () => void;
  onLogout: () => void;
  onToggleLang: () => void;
}) {
  const { currentUser } = useAuth();
  const { RL, roleName, lang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <nav className="bg-white shadow-sm border-b px-3 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">РП</div>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-800">Родные Пенаты</h1>
          <p className="text-xs text-gray-500">{roleName(currentUser.role)} — {currentUser.first_name} {currentUser.last_name}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500" title="Настройки">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-50 py-1">
                <button onClick={() => { onOpenSettings(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                  {RL('tabSettings')}
                </button>
                <button onClick={() => { onOpenRoles(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {RL('roles')}
                </button>
                <button onClick={() => { onToggleLang(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between">
                  <span className="flex items-center gap-2"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.12"/></svg> {RL('language')}</span>
                  <span className="text-xs text-gray-400">{lang.toUpperCase()}</span>
                </button>
                <hr className="my-1" />
                <button onClick={() => { onLogout(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  {RL('logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function TabBar({ tabs, activeTab, onSelect }: { tabs: string[]; activeTab: string; onSelect: (t: string) => void }) {
  const { TL } = useLang();
  return (
    <div className="px-3 sm:px-6 pt-3">
      <div className="flex gap-0 border-b overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => onSelect(t)}
            className={`px-3 sm:px-4 py-2 font-medium text-sm whitespace-nowrap ${t === activeTab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
            {TL(t) || t}
          </button>
        ))}
      </div>
    </div>
  );
}

function MainApp() {
  const { currentUser, logout } = useAuth();
  const { toggleLang } = useLang();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);

  const getVisibleTabs = useCallback(() => {
    if (!currentUser) return ['dashboard'];
    const adminTabs = (currentUser.role === 'owner' || currentUser.role === 'manager') ? ['users'] : [];
    return ['dashboard', ...adminTabs, 'chessboard', 'tasks', 'guests', 'finance', 'medical', 'sos'];
  }, [currentUser]);

  if (!currentUser) return <LoginPage />;

  const tabs = getVisibleTabs();

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />;
      case 'chessboard': return <ChessboardPage />;
      case 'tasks': return <TasksPage />;
      case 'guests': return <GuestsPage />;
      case 'finance': return <FinancePage />;
      case 'medical': return <MedicalPage />;
      case 'sos': return <SosPage />;
      case 'users': return <UsersPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenRoles={() => setRolesOpen(true)}
        onLogout={logout}
        onToggleLang={toggleLang}
      />
      <TabBar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
      <div className="p-3 sm:p-6">{renderPage()}</div>
      <SettingsOverlay open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <RolesOverlay open={rolesOpen} onClose={() => setRolesOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LangProvider>
  );
}

export default App;
