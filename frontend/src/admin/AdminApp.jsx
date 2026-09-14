import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import AdminLayout from './AdminLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Articles from './pages/Articles.jsx';
import ArticleForm from './pages/ArticleForm.jsx';
import Rubrics from './pages/Rubrics.jsx';
import Issues from './pages/Issues.jsx';
import Pages from './pages/Pages.jsx';
import PageForm from './pages/PageForm.jsx';
import Submissions from './pages/Submissions.jsx';
import Settings from './pages/Settings.jsx';
import './admin.css';

function Protected({ children }) {
  const { admin, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="adm-splash">Yuklanmoqda…</div>;
  if (!admin) return <Navigate to="/admin/kirish" replace state={{ from: location.pathname }} />;
  return children;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="kirish" element={<Login />} />
        <Route
          element={
            <Protected>
              <AdminLayout />
            </Protected>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="maqolalar" element={<Articles />} />
          <Route path="maqolalar/yangi" element={<ArticleForm />} />
          <Route path="maqolalar/:id" element={<ArticleForm />} />
          <Route path="ruknlar" element={<Rubrics />} />
          <Route path="sonlar" element={<Issues />} />
          <Route path="sahifalar" element={<Pages />} />
          <Route path="sahifalar/yangi" element={<PageForm />} />
          <Route path="sahifalar/:id" element={<PageForm />} />
          <Route path="arizalar" element={<Submissions />} />
          <Route path="sozlamalar" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
