import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, CheckCircle2, ClipboardList, MapPin, RefreshCw, Search, ShieldCheck, Trash2, Users, Waves, Save } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { getErrorMessage } from '../api.js';
import MapView from '../components/MapView.jsx';

const STATUSES = ['New', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const TYPES = ['All types', 'Contamination', 'Water Shortage', 'Infrastructure Damage'];
const statusClass = (status) => `status-pill status-${status.toLowerCase().replaceAll(' ', '-')}`;
const dateLabel = (dateString) => {
  const parsed = new Date(`${dateString.replace(' ', 'T')}Z`);
  return Number.isNaN(parsed.getTime()) ? dateString : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
};

export default function AdminDashboard({ user }) {
  const [reports, setReports] = useState([]);
  const [issueType, setIssueType] = useState('All types');
  const [status, setStatus] = useState('All statuses');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/reports');
      setReports(data.reports);
      setNoteDrafts(Object.fromEntries(data.reports.map((report) => [report.id, report.adminNote || ''])));
    } catch (err) { setError(getErrorMessage(err, 'Could not load reports.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => reports.filter((report) =>
    (issueType === 'All types' || report.issueType === issueType) &&
    (status === 'All statuses' || report.status === status) &&
    (!search || `${report.title} ${report.locationText} ${report.description} ${report.reporterName} ${report.issueType}`.toLowerCase().includes(search.toLowerCase()))
  ), [reports, issueType, status, search]);
  const active = reports.filter((r) => ['New', 'Under Review', 'In Progress'].includes(r.status)).length;
  const resolved = reports.filter((r) => r.status === 'Resolved').length;
  const chartData = [
    { name: 'Contamination', total: reports.filter((r) => r.issueType === 'Contamination').length },
    { name: 'Shortage', total: reports.filter((r) => r.issueType === 'Water Shortage').length },
    { name: 'Infrastructure', total: reports.filter((r) => r.issueType === 'Infrastructure Damage').length },
  ];
  const updateStatus = async (report, newStatus) => {
    if (newStatus === report.status) return;
    setUpdatingId(report.id); setError(''); setNotice('');
    try {
      const adminNote = noteDrafts[report.id] ?? report.adminNote ?? '';
      const { data } = await api.put(`/reports/${report.id}`, { status: newStatus, adminNote });
      setReports((current) => current.map((item) => item.id === report.id ? data.report : item));
      setNoteDrafts((current) => ({ ...current, [report.id]: data.report.adminNote || '' }));
      setNotice(`Report #${String(report.id).padStart(4, '0')} moved to ${newStatus}.`);
    } catch (err) { setError(getErrorMessage(err, 'Could not update this report.')); }
    finally { setUpdatingId(null); }
  };
  const saveAdminNote = async (report) => {
    setUpdatingId(report.id); setError(''); setNotice('');
    try {
      const adminNote = noteDrafts[report.id] ?? '';
      const { data } = await api.put(`/reports/${report.id}`, { status: report.status, adminNote });
      setReports((current) => current.map((item) => item.id === report.id ? data.report : item));
      setNoteDrafts((current) => ({ ...current, [report.id]: data.report.adminNote || '' }));
      setNotice(`Administrative note saved for report #${String(report.id).padStart(4, '0')}.`);
    } catch (err) { setError(getErrorMessage(err, 'Could not save the note.')); }
    finally { setUpdatingId(null); }
  };
  const deleteReport = async (report) => {
    if (!window.confirm(`Permanently delete report “${report.title}”?`)) return;
    try { await api.delete(`/reports/${report.id}`); setReports((current) => current.filter((item) => item.id !== report.id)); setNotice(`Report #${report.id} deleted.`); }
    catch (err) { setError(getErrorMessage(err, 'Could not delete this report.')); }
  };
  return (
    <main className="page-main admin-page">
      <section className="dashboard-top admin-dashboard-top"><div className="container dashboard-welcome"><div><div className="eyebrow"><span className="live-dot" /> ADMINISTRATIVE WORKSPACE</div><h1>Community <em>overview.</em></h1><p>Review incoming reports, prioritize local concerns, and keep response statuses up to date.</p></div><div className="admin-user-chip"><span className="admin-shield"><ShieldCheck size={20} /></span><span><b>{user.name}</b><small>Authorized administrator</small></span></div></div></section>
      <section className="container dashboard-body admin-dashboard-body">
        {notice && <div className="notice notice-success"><CheckCircle2 size={17} /> {notice}<button type="button" className="notice-dismiss" onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}{error && <div className="notice notice-error">{error}</div>}
        <div className="dashboard-stat-grid admin-stat-grid"><div className="dashboard-stat-card"><span className="dash-stat-icon"><ClipboardList size={19} /></span><span className="dash-stat-label">Total reports</span><strong>{reports.length}</strong><small>All community submissions</small></div><div className="dashboard-stat-card"><span className="dash-stat-icon dash-stat-gold"><Activity size={19} /></span><span className="dash-stat-label">Need attention</span><strong>{active}</strong><small>Open or under review</small></div><div className="dashboard-stat-card"><span className="dash-stat-icon dash-stat-green"><CheckCircle2 size={19} /></span><span className="dash-stat-label">Resolved</span><strong>{resolved}</strong><small>Marked as resolved</small></div><div className="dashboard-stat-card"><span className="dash-stat-icon dash-stat-purple"><Users size={19} /></span><span className="dash-stat-label">Citizen reports</span><strong>{reports.length}</strong><small>Submitted through the platform</small></div></div>
        <div className="admin-analytics-grid"><section className="analytics-card"><div className="analytics-card-heading"><div><span className="overline">ISSUE BREAKDOWN</span><h2>Reported by category</h2></div><span className="analytics-icon"><Waves size={18} /></span></div><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 3 }}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8eeee" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#687d7e', fontSize: 11 }} interval={0} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#687d7e', fontSize: 11 }} /><Tooltip cursor={{ fill: '#f2f8f7' }} contentStyle={{ border: '1px solid #dce8e5', borderRadius: 10, fontSize: 12 }} /><Bar dataKey="total" name="Reports" fill="#159c9b" radius={[5, 5, 0, 0]} maxBarSize={48} /></BarChart></ResponsiveContainer></div></section><section className="analytics-card admin-map-preview"><div className="analytics-card-heading"><div><span className="overline">GEOGRAPHIC VIEW</span><h2>Issue locations</h2></div><Link to="/map" className="inline-link">Open map <ArrowUpRight size={15} /></Link></div><MapView reports={reports} height="242px" zoom={4} /><div className="admin-map-bottom"><span><MapPin size={14} /> {reports.length} mapped reports</span><span><span className="live-dot" /> Latest data</span></div></section></div>
        <section className="admin-report-section"><div className="list-section-header"><div><span className="overline">REPORT MANAGEMENT</span><h2>Incoming reports <span className="count-bubble">{visible.length}</span></h2></div><button className="button button-quiet button-small" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh data</button></div>
          <div className="admin-filters"><label className="search-field"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, location, description or reporter…" aria-label="Search reports" /></label><select value={issueType} onChange={(e) => setIssueType(e.target.value)} aria-label="Filter by issue type">{TYPES.map((x) => <option key={x}>{x}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option>All statuses</option>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select></div>
          {loading ? <div className="loading-state">Loading incoming reports…</div> : visible.length === 0 ? <div className="empty-state"><span className="empty-state-icon"><ClipboardList size={26} /></span><strong>No reports found</strong><p>Try clearing your filters. New citizen reports will appear here.</p></div> : <div className="admin-report-list">{visible.map((report) => <article className="admin-report-card" key={report.id}><div className="admin-report-main"><div className="admin-report-card-top"><span className={`type-tag type-${report.issueType.toLowerCase().replaceAll(' ', '-')}`}>{report.issueType}</span><span className={statusClass(report.status)}>{report.status}</span><span className="report-id-label">#{String(report.id).padStart(4, '0')}</span></div><h3>{report.title}</h3><div className="admin-report-detail-line"><span><MapPin size={14} /> {report.locationText}</span><span><Users size={14} /> {report.reporterName}</span><span>{dateLabel(report.createdAt)}</span></div><p className="report-summary-text">{report.description}</p>{report.photoUrl && <a className="admin-photo-link" href={report.photoUrl} target="_blank" rel="noreferrer">View evidence photo ↗</a>}{report.adminNote && <div className="admin-note"><strong>Current admin note</strong><p>{report.adminNote}</p></div>}</div><div className="admin-report-controls"><label className="form-label">Update status<select className="text-input status-select" value={report.status} disabled={updatingId === report.id} onChange={(e) => updateStatus(report, e.target.value)}>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-label">Coordinates<span className="coordinate-small">{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span></label><label className="form-label admin-note-editor">Administrative note<textarea rows={3} maxLength={1000} value={noteDrafts[report.id] ?? report.adminNote ?? ''} onChange={(e) => setNoteDrafts((current) => ({ ...current, [report.id]: e.target.value }))} placeholder="Add follow-up context…" /></label><button className="button button-quiet button-small" disabled={updatingId === report.id} onClick={() => saveAdminNote(report)}><Save size={14} /> Save note</button><button className="button button-quiet-danger button-small admin-delete-button" onClick={() => deleteReport(report)}><Trash2 size={14} /> Delete report</button></div></article>)}</div>}
        </section>
        <div className="admin-footer-note"><ShieldCheck size={16} /><span>Administrative actions change shared report records. Review report details and local procedures before marking an issue resolved.</span></div>
      </section>
    </main>
  );
}
