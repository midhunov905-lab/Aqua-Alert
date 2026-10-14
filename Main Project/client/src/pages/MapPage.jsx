import { useEffect, useMemo, useState } from 'react';
import { Activity, Filter, MapPin, RefreshCw, Search } from 'lucide-react';
import api from '../api.js';
import MapView from '../components/MapView.jsx';

const TYPES = ['All types', 'Contamination', 'Water Shortage', 'Infrastructure Damage'];
const STATUSES = ['All statuses', 'New', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [issueType, setIssueType] = useState('All types');
  const [status, setStatus] = useState('All statuses');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/reports/public/map'); setReports(data.reports); }
    catch { setError('The map reports could not be loaded. Check your connection and try again.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);
  const visible = useMemo(() => reports.filter((report) =>
    (issueType === 'All types' || report.issueType === issueType) &&
    (status === 'All statuses' || report.status === status) &&
    (!search || `${report.title} ${report.locationText} ${report.issueType}`.toLowerCase().includes(search.toLowerCase()))
  ), [reports, issueType, status, search]);
  const activeCount = reports.filter((r) => ['New', 'Under Review', 'In Progress'].includes(r.status)).length;
  return (
    <main className="page-main">
      <section className="page-hero compact-page-hero"><div className="container"><div className="eyebrow"><span className="live-dot" /> COMMUNITY REPORTING NETWORK</div><h1>The water issue <em>map.</em></h1><p>One view of the concerns communities are reporting. Filter by issue or status to explore what is happening.</p><div className="map-page-mini-stats"><span><MapPin size={16} /><b>{reports.length}</b> mapped reports</span><span><Activity size={16} /><b>{activeCount}</b> need attention</span></div></div></section>
      <section className="container map-page-content">
        <div className="map-toolbar"><div className="map-toolbar-title"><span className="section-icon"><Filter size={18} /></span><div><strong>Explore reported issues</strong><small>Approximate location pins appear on the map.</small></div></div><button className="button button-quiet button-small" onClick={refresh} disabled={loading}><RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh map</button></div>
        <div className="map-filters"><label className="search-field"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search location or issue…" aria-label="Search locations or issues" /></label><select value={issueType} onChange={(e) => setIssueType(e.target.value)} aria-label="Filter by issue type">{TYPES.map((x) => <option key={x}>{x}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by report status">{STATUSES.map((x) => <option key={x}>{x}</option>)}</select></div>
        {error && <div className="notice notice-error">{error}</div>}
        <div className="map-countline"><span><span className="live-dot" /> Showing <b>{visible.length}</b> of {reports.length} reports</span><div className="map-legend"><span><i className="legend-dot legend-red" /> Contamination</span><span><i className="legend-dot legend-gold" /> Shortage</span><span><i className="legend-dot legend-purple" /> Infrastructure</span></div></div>
        <MapView reports={visible} height="550px" />
        {!loading && visible.length === 0 && <div className="empty-state empty-state-inline"><MapPin size={28} /><strong>No matching reports yet</strong><p>Try another filter or clear your search to see more reports.</p></div>}
        <p className="map-privacy-note">For community safety, don't use this public map to identify private individuals. When reporting, choose a useful public-area location instead of a home address.</p>
      </section>
    </main>
  );
}
