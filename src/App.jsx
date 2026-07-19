import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/auth/RequireAuth';
import AuthProvider from './store/AuthProvider';
import AppProvider from './store/AppProvider';

// Pages are code-split so each route's JS loads on demand — the login screen
// no longer downloads the whole authenticated app up front.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const ListsPage = lazy(() => import('./pages/ListsPage'));
const PollsPage = lazy(() => import('./pages/PollsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const GroupSettingsPage = lazy(() => import('./pages/GroupSettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route index element={<CalendarPage />} />
                  <Route path="lists" element={<ListsPage />} />
                  <Route path="polls" element={<PollsPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="groups/:groupId/settings" element={<GroupSettingsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
