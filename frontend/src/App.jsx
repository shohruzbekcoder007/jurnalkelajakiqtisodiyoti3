import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import TopBar from './components/TopBar.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Archive from './pages/Archive.jsx';
import Rubrics from './pages/Rubrics.jsx';
import StaticPage from './pages/StaticPage.jsx';
import Submit from './pages/Submit.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import NotFound from './pages/NotFound.jsx';

// Admin panel alohida bundle sifatida yuklanadi
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  // Yangi brauzerlarda scrollTo Promise qaytaradi — effekt hech narsa qaytarmasligi kerak
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PublicLayout() {
  return (
    <div className="app">
      <TopBar />
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={null}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/arxiv" element={<Archive />} />
          <Route path="/ruknlar" element={<Rubrics />} />
          <Route path="/maqola/:slug" element={<ArticleDetail />} />
          <Route path="/maqola-yuborish" element={<Submit />} />
          <Route path="/sahifa/:slug" element={<StaticPageBySlug />} />
          <Route path="/jurnal-haqida" element={<StaticPage slug="jurnal-haqida" />} />
          <Route path="/tahrir-kengashi" element={<StaticPage slug="tahrir-kengashi" />} />
          <Route path="/jurnal-manzili" element={<StaticPage slug="jurnal-manzili" />} />
          <Route path="/chop-etish-tartibi" element={<StaticPage slug="chop-etish-tartibi" />} />
          <Route path="/axborot-xati" element={<StaticPage slug="axborot-xati" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

// Admin paneldan yaratilgan yangi sahifalar /sahifa/:slug manzilida ochiladi
function StaticPageBySlug() {
  const { pathname } = useLocation();
  return <StaticPage slug={decodeURIComponent(pathname.split('/').pop())} />;
}
