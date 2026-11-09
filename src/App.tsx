import { useEffect, useMemo, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { DataProvider } from './hooks/useData';
import { ToastProvider, useToast } from './components/Toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChildPage from './pages/ChildPage';
import Attendance from './pages/Attendance';
import Gallery from './pages/Gallery';
import Summary from './pages/Summary';
import Settings from './pages/Settings';
import ParentPortal from './pages/ParentPortal';
import Login from './pages/Login';
import { supabase } from './lib/supabase';
import { createLocalStore } from './lib/localStore';
import { createSupabaseStore } from './lib/supabaseStore';
import { getRole, type Role } from './lib/auth';
import { useReminderTicker } from './hooks/useAlerts';

function ReminderRunner() {
  const toast = useToast();
  useReminderTicker((title) => toast({ text: title, icon: '⏰' }));
  return null;
}

function CaregiverApp() {
  return (
    <>
      <ReminderRunner />
      <Routes>
        <Route path="/parent" element={<ParentPortal preview />} />
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/child/:id" element={<ChildPage />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </>
  );
}

function Splash() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-6xl anim-pulse">🧸</div>
    </div>
  );
}

function CloudApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [role, setRole] = useState<Role | null>(null);
  const store = useMemo(() => createSupabaseStore(supabase!), []);

  useEffect(() => {
    supabase!.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase!.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (session) getRole().then(setRole);
    else setRole(null);
  }, [session?.user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (session === undefined) return <Splash />;
  if (!session) return <Login onDone={() => undefined} />;
  if (!role) return <Splash />;
  return (
    <DataProvider store={store} readOnly={role === 'parent'}>
      {role === 'caregiver' ? <CaregiverApp /> : <ParentPortal />}
    </DataProvider>
  );
}

function LocalApp() {
  const store = useMemo(() => createLocalStore(), []);
  return (
    <DataProvider store={store}>
      <CaregiverApp />
    </DataProvider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>{supabase ? <CloudApp /> : <LocalApp />}</ToastProvider>
    </HashRouter>
  );
}
