import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CalendarPage from './pages/CalendarPage';
import ListsPage from './pages/ListsPage';
import PollsPage from './pages/PollsPage';
import ChatPage from './pages/ChatPage';
import GroupsPage from './pages/GroupsPage';
import GroupSettingsPage from './pages/GroupSettingsPage';
import AppProvider from './store/AppProvider';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<AppShell />}>
            <Route index element={<CalendarPage />} />
            <Route path="lists" element={<ListsPage />} />
            <Route path="polls" element={<PollsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="groups/:groupId/settings" element={<GroupSettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
