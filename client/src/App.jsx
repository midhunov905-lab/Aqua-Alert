import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { ArrowLeft, Droplets } from 'lucide-react';
import api from './api.js';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import MapPage from './pages/MapPage.jsx';
import ReportForm from './pages/ReportForm.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { LoginPage, RegisterPage } from './pages/AuthPages.jsx';

function ProtectedRoute({ user, loading, roles, children }) {
  if (loading) return <main className="page-main"><div className="container loading-state">Checking your session…</div></main>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

function NotFound() {
  return <main className="not-found"><span className="not-found-mark"><Droplets size={28} /></span><span className="overline">404 · WRONG TURN</span><h1>This page drifted <em>away.</em></h1><p>The page you're looking for doesn't exist or may have moved.</p><Link className="button button-primary" to="/"><ArrowLeft size={16} /> Back to AquaAlert</Link></main>;
}

function Footer() {
  return <footer className="site-footer"><div className="container footer-main"><Link className="brand brand-footer" to="/"><span className="brand-mark"><Droplets size={20} /></span><span className="brand-text">aqua<span>alert</span><small>COMMUNITY WATER WATCH</small></span></Link><p>Make water issues visible.<br />Help your community move forward.</p><div className="footer-links"><Link to="/map">Community map</Link><Link to="/report">Report an issue</Link><Link to="/login">Admin sign in</Link></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} AquaAlert · Academic full-stack project</span><span>Built for community awareness and administrative follow-up.</span></div></footer>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => setUser(null)).finally(() => setCheckingSession(false));
  }, []);
  return <><Navbar user={user} setUser={setUser} /><Routes>
    <Route path="/" element={<Home user={user} />} />
    <Route path="/map" element={<MapPage />} />
    <Route path="/login" element={<LoginPage user={user} setUser={setUser} />} />
    <Route path="/register" element={<RegisterPage user={user} setUser={setUser} />} />
    <Route path="/report" element={<ProtectedRoute user={user} loading={checkingSession} roles={['citizen']}><ReportForm /></ProtectedRoute>} />
    <Route path="/report/:id/edit" element={<ProtectedRoute user={user} loading={checkingSession} roles={['citizen']}><ReportForm /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute user={user} loading={checkingSession} roles={['citizen']}><Dashboard user={user} /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute user={user} loading={checkingSession} roles={['admin']}><AdminDashboard user={user} /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes><Footer /></>;
}
