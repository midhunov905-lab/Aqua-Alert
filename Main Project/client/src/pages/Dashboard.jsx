import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, FileText, MapPin, Pencil, Plus, RefreshCw, Search, Trash2, Waves } from 'lucide-react';
import api, { getErrorMessage } from '../api.js';

const STATUSES = ['All statuses', 'New', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const statusClass = (status) => `status-pill status-${status.toLowerCase().replaceAll(' ', '-')}`;
const dateLabel = (dateString) => {
  const parsed = new Date(`${dateString.replace(' ', 'T')}Z`);
  return Number.isNaN(parsed.getTime()) ? dateString : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(parsed);
};

export default function Dashboard({ user }) {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('All statuses');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const location = useLocation();
  const loadReports = async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/reports'); setReports(data.reports); }
    catch (err) { setError(getErrorMessage(err, 'Could not load your reports.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadReports(); if (location.state?.flash) { setFlash(location.state.flash); window.history.replaceState({}, document.title); } }, []);
  const visibleReports = useMemo(() => reports.filter((report) => (status === 'All statuses' || report.status === status) && (!search || `${report.title} ${report.locationText} ${report.issueType}`.toLowerCase().includes(search.toLowerCase()))), [reports, status, search]);
  const count = (value) => reports.filter((report) => value === 'Active' ? ['New', 'Under Review', 'In Progress'].includes(report.status) : report.status === value).length;
  const deleteReport = async (report) => {
    if (!window.confirm(`Delete “${report.title}”? This action cannot be undone.`)) return;
    setError('');
    try { await api.delete(`/reports/${report.id}`); setReports((current) => current.filter((item) => item.id !== report.id)); setFlash('Report deleted.'); }
    catch (err) { setError(getErrorMessage(err, 'Could not delete this report.')); }
  };
  return (
    <main className="page-main dashboard-page">
      <section className="dashboard-top"><div className="container dashboard-welcome"><div><div className="eyebrow"><span className="live-dot" /> CITIZEN DASHBOARD</div><h1>Your reports, <em>in view.</em></h1><p>Hi {user.name.split(' ')[0]}, here's the latest on the water issues you've shared.</p></div><Link to="/report" className="button button-lime"><Plus size={18} /> Create a report</Link></div></section>
      <section className="container dashboard-body">
        {flash && <div className="notice notice-success"><CheckCircle2 size={17} /> {flash}<button type="button" className="notice-dismiss" onClick={() => setFlash('')} aria-label="Dismiss message">×</button></div>}
        {error && <div className="notice notice-error">{error}</div>}
        <div className="dashboard-stat-grid"><div className="dashboard-stat-card"><span className="dash-stat-icon"><FileText size={19} /></span><span className="dash-stat-label">All reports</span><strong>{reports.length}</strong><small>Submitted by you</small></div><div className="dashboard-stat-card"><span className="dash-stat-icon dash-stat-gold"><Clock3 size={19} /></span><span className="dash-stat-label">In progress</span><strong>{count('Active')}</strong><small>New, review, or underway</small></div><div className="dashboard-stat-card"><span className="dash-stat-icon dash-stat-green"><CheckCircle2 size={19} /></span><span className="dash-stat-label">Resolved</span><strong>{count('Resolved')}</strong><small>Status marked complete</small></div><div className="dashboard-stat-card"><span className="dash-stat-icon dash-stat-purple"><Waves size={19} /></span><span className="dash-stat-label">Water shortages</span><strong>{reports.filter((report) => report.issueType === 'Water Shortage').length}</strong><small>Your supply reports</small></div></div>
        <div className="list-section-header"><div><span className="overline">YOUR SUBMISSIONS</span><h2>Report history <span className="count-bubble">{visibleReports.length}</span></h2></div><button className="button button-quiet button-small" onClick={loadReports} disabled={loading}><RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh</button></div>
        <div className="report-list-toolbar"><label className="search-field"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your reports…" aria-label="Search your reports" /></label><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter your reports by status">{STATUSES.map((x) => <option key={x}>{x}</option>)}</select></div>
        {loading ? <div className="loading-state">Loading your reports…</div> : visibleReports.length === 0 ? <div className="empty-state"><span className="empty-state-icon"><FileText size={26} /></span><strong>{reports.length ? 'No reports match those filters' : 'Your first report starts here.'}</strong><p>{reports.length ? 'Try a different search or status.' : 'Report a water quality, shortage, or infrastructure issue to add it to the community record.'}</p>{!reports.length && <Link to="/report" className="button button-primary">Create your first report <ArrowRight size={16} /></Link>}</div> : <div className="citizen-report-grid">{visibleReports.map((report) => <article className="citizen-report-card" key={report.id}><div className="citizen-report-card-top"><span className={`type-tag type-${report.issueType.toLowerCase().replaceAll(' ', '-')}`}>{report.issueType}</span><span className={statusClass(report.status)}>{report.status}</span></div><h3>{report.title}</h3><p className="report-location-line"><MapPin size={15} /> {report.locationText}</p><p className="report-summary-text">{report.description}</p>{report.photoUrl && <a className="report-photo-link" href={report.photoUrl} target="_blank" rel="noreferrer"><img src={report.photoUrl} alt="Report evidence" /><span>View evidence photo</span></a>}<div className="citizen-report-meta"><span><CalendarDays size={14} /> {dateLabel(report.createdAt)}</span><span>Report #{String(report.id).padStart(4, '0')}</span></div>{report.adminNote && <div className="admin-note"><strong>Administrator note</strong><p>{report.adminNote}</p></div>}<div className="citizen-report-actions">{report.status === 'New' ? <><Link to={`/report/${report.id}/edit`} className="button button-quiet button-small"><Pencil size={14} /> Edit</Link><button className="button button-quiet-danger button-small" onClick={() => deleteReport(report)}><Trash2 size={14} /> Delete</button></> : <span className="status-lock-note"><Clock3 size={14} /> Editing closed after review begins</span>}<Link to="/map" className="report-map-link">Map <ArrowRight size={14} /></Link></div></article>)}</div>}
        <div className="dashboard-footnote"><MapPin size={16} /><span>Report locations are shown on the community map. Please keep location details appropriate for public sharing.</span></div>
      </section>
    </main>
  );
}
