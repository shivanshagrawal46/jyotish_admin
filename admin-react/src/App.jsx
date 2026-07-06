import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Login from './pages/Login.jsx';
import Categories from './pages/Categories.jsx';
import SubCategories from './pages/SubCategories.jsx';
import Contents from './pages/Contents.jsx';
import Notifications from './pages/Notifications.jsx';
import ResourceManager from './components/ResourceManager.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/categories" replace />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:categoryId/subcategories" element={<SubCategories />} />
        <Route path="/subcategories/:subId/contents" element={<Contents />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/r/:resource" element={<ResourceManager />} />
      </Route>
      <Route path="*" element={<Navigate to="/categories" replace />} />
    </Routes>
  );
}
