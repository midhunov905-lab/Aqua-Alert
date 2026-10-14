import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Droplets, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import api, { getErrorMessage } from '../api.js';

function AuthShell({ mode, children }) {
  return <main className="auth-layout"><div className="auth-decoration"><div className="auth-glow" /><Link to="/" className="brand brand-light"><span className="brand-mark"><Droplets size={22} /></span><span className="brand-text">aqua<span>alert</span><small>COMMUNITY WATER WATCH</small></span></Link><div className="auth-quote"><span className="overline overline-light">A SMALL REPORT CAN START A BIG CHANGE</span><h2>Every community<br />deserves <em>safe water.</em></h2><p>Good information makes it easier to see a problem, communicate it clearly, and follow it through.</p><div className="auth-decoration-bottom"><span><ShieldCheck size={16} /> Secure, role-based access</span><span>BUILT FOR COMMUNITIES · {mode === 'register' ? 'JOIN THE NETWORK' : 'WELCOME BACK'}</span></div></div></div><div className="auth-panel"><div className="auth-mobile-brand"><Droplets size={24} /> aqua<span>alert</span></div>{children}</div></main>;
}

export function LoginPage({ user, setUser }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setUser(data.user); navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) { setError(getErrorMessage(err, 'Unable to sign in.')); }
    finally { setLoading(false); }
  };
  return <AuthShell mode="login"><div className="auth-form-wrap"><span className="overline">YOUR COMMUNITY, CONNECTED</span><h1>Welcome <em>back.</em></h1><p className="auth-subtitle">Sign in to report issues or manage community reports.</p>{error && <div className="notice notice-error">{error}</div>}<form onSubmit={submit} className="form-stack"><label className="form-label">Email address<div className="input-with-icon"><Mail size={17} /><input type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></div></label><label className="form-label">Password<div className="input-with-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" /><button className="input-action" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label><button className="button button-primary button-full" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in securely'} <ArrowRight size={17} /></button></form><p className="auth-switch">New to AquaAlert? <Link to="/register">Create a citizen account</Link></p><div className="auth-trust"><ShieldCheck size={16} /> Your account is protected by secure session cookies.</div></div></AuthShell>;
}

export function RegisterPage({ user, setUser }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Your passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Please choose a password with at least 8 characters.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      setUser(data.user); navigate('/report');
    } catch (err) { setError(getErrorMessage(err, 'Unable to create your account.')); }
    finally { setLoading(false); }
  };
  return <AuthShell mode="register"><div className="auth-form-wrap"><span className="overline">JOIN THE COMMUNITY NETWORK</span><h1>Make your voice <em>count.</em></h1><p className="auth-subtitle">Create a citizen account to submit and follow up on water issues.</p>{error && <div className="notice notice-error">{error}</div>}<form onSubmit={submit} className="form-stack"><label className="form-label">Full name<div className="input-with-icon"><UserRound size={17} /><input autoComplete="name" required minLength={2} maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></div></label><label className="form-label">Email address<div className="input-with-icon"><Mail size={17} /><input type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></div></label><label className="form-label">Password<div className="input-with-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={72} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /><button className="input-action" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label><label className="form-label">Confirm password<div className="input-with-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={72} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Enter it again" /></div></label><button className="button button-primary button-full" type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create citizen account'} <ArrowRight size={17} /></button></form><p className="auth-switch">Already a member? <Link to="/login">Sign in</Link></p><div className="auth-trust"><ShieldCheck size={16} /> Citizen accounts cannot access administrator controls.</div></div></AuthShell>;
}
