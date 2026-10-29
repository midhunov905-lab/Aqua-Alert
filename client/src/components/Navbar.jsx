import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Droplets, LogOut, Menu, ShieldCheck, Waves, X } from 'lucide-react';
import { useState } from 'react';
import api from '../api.js';

export default function Navbar({ user, setUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Expired sessions can still be cleared locally.
    }

    setUser(null);
    setMobileOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link
          className="brand"
          to="/"
          onClick={closeMenu}
          aria-label="AquaAlert home"
        >
          <span className="brand-mark">
            <Droplets size={22} strokeWidth={2.5} />
          </span>

          <span className="brand-text">
            aqua<span>alert</span>
            <small>COMMUNITY WATER WATCH</small>
          </span>
        </Link>

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileOpen}
          aria-controls="primary-navigation"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>

        <nav
          id="primary-navigation"
          className={`main-nav ${mobileOpen ? 'is-open' : ''}`}
        >
          <NavLink to="/map" onClick={closeMenu}>
            Live map
          </NavLink>

          {user && user.role === 'citizen' && (
            <NavLink to="/report" onClick={closeMenu}>
              Report an issue
            </NavLink>
          )}

          {user && user.role === 'citizen' && (
            <NavLink to="/dashboard" onClick={closeMenu}>
              My reports
            </NavLink>
          )}

          {user && user.role === 'admin' && (
            <NavLink to="/admin" onClick={closeMenu}>
              <ShieldCheck size={15} />
              Admin console
            </NavLink>
          )}

          {user ? (
            <div className="nav-user-area">
              <span className="nav-user">
                <span className="avatar-dot">
                  {user.name?.slice(0, 1).toUpperCase()}
                </span>
                {user.name?.split(' ')[0]}
              </span>

              <button
                type="button"
                className="button button-quiet button-small"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          ) : (
            <div className="nav-actions">
              <Link
                className="nav-sign-in"
                to="/login"
                onClick={closeMenu}
              >
                Sign in
              </Link>

              <Link
                className="button button-primary button-small"
                to="/register"
                onClick={closeMenu}
              >
                Join the network
                <Waves size={15} />
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
