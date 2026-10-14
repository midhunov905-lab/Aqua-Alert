import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, ClipboardCheck, Droplet, Droplets, MapPin, ShieldCheck, Waves, Users, BarChart3 } from 'lucide-react';
import api from '../api.js';

const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(value || 0);

export default function Home({ user }) {
  const [stats, setStats] = useState({ total: 0, resolved: 0, active: 0, scarcity: 0 });
  const [mapCount, setMapCount] = useState(0);
  useEffect(() => {
    api.get('/reports/public/stats').then(({ data }) => setStats(data.stats)).catch(() => {});
    api.get('/reports/public/map').then(({ data }) => setMapCount(data.reports.length)).catch(() => {});
  }, []);
  return (
    <main>
      <section className="hero-section">
        <div className="hero-grid-pattern" />
        <div className="container hero-layout">
          <div className="hero-copy">
            <div className="eyebrow eyebrow-light"><span className="live-dot" /> WATER ISSUES, MADE VISIBLE</div>
            <h1>Every drop<br />deserves <em>attention.</em></h1>
            <p className="hero-lede">A community-powered way to report water scarcity, contamination, and damaged infrastructure — so local action can start sooner.</p>
            <div className="hero-buttons">
              {user?.role === 'citizen' ? <Link className="button button-lime" to="/report">Report a water issue <ArrowRight size={18} /></Link> : user?.role === 'admin' ? <Link className="button button-lime" to="/admin">Open admin console <ArrowRight size={18} /></Link> : <Link className="button button-lime" to="/register">Join your community <ArrowRight size={18} /></Link>}
              <Link className="button button-outline-light" to="/map">Explore the live map <MapPin size={17} /></Link>
            </div>
            <div className="hero-proof"><div className="proof-avatars"><span>R</span><span>A</span><span>M</span><span>+</span></div><p><strong>Local voices. Shared visibility.</strong><br />One clearer picture of our water challenges.</p></div>
          </div>
          <div className="hero-art" aria-label="Illustration of water drops and community water monitoring">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="hero-sun" />
            <div className="hero-water-card card-one"><span className="mini-icon mini-icon-red"><Droplet size={17} /></span><span><b>Water quality</b><small>Community reported</small></span><span className="status-dot status-red" /></div>
            <div className="hero-water-card card-two"><span className="mini-icon mini-icon-gold"><Waves size={17} /></span><span><b>Supply shortage</b><small>Needs attention</small></span><span className="status-dot status-gold" /></div>
            <div className="hero-drop"><div className="drop-shine" /><Droplets className="drop-symbol" size={76} strokeWidth={1.3} /></div>
            <div className="hero-pin"><MapPin size={20} fill="currentColor" /><span /></div>
            <div className="art-caption"><span className="art-caption-line" /> A DROP OF CHANGE STARTS HERE</div>
          </div>
        </div>
        <div className="hero-bottom-line"><span>LOCAL REPORTING</span><span>REAL-WORLD CONTEXT</span><span>ACCOUNTABLE ACTION</span><ArrowDownRight size={17} /></div>
      </section>

      <section className="stats-band">
        <div className="container stats-grid">
          <div className="stats-intro"><span className="overline">THE COMMUNITY PULSE</span><p>Every report adds another piece to the picture.</p></div>
          <div className="stat-item"><span className="stat-label">Reports received</span><strong>{formatNumber(stats.total)}</strong><span className="stat-context"><ArrowUpRight size={14} /> Community submissions</span></div>
          <div className="stat-item"><span className="stat-label">Marked resolved</span><strong>{formatNumber(stats.resolved)}</strong><span className="stat-context stat-context-green"><CheckCircle2 size={14} /> Progress that counts</span></div>
          <div className="stat-item"><span className="stat-label">Need attention</span><strong>{formatNumber(stats.active)}</strong><span className="stat-context"><ArrowDownRight size={14} /> Open or in progress</span></div>
        </div>
      </section>

      <section className="section-padding container" id="how-it-works">
        <div className="section-heading split-heading"><div><span className="overline">FROM A REPORT TO A RESPONSE</span><h2>Make water issues<br /><span className="text-accent">hard to overlook.</span></h2></div><p className="section-description">AquaAlert brings citizen observations and local administrative workflows into one shared place. Less scattered information. More useful context.</p></div>
        <div className="feature-grid">
          <article className="feature-card feature-card-dark"><div className="feature-topline"><span>01 / REPORT</span><span className="feature-icon"><Droplets size={22} /></span></div><div className="feature-illustration report-illustration"><div className="mini-paper"><span /><span /><span /></div><span className="illustration-drop"><Droplet size={28} /></span><span className="illustration-cross">+</span></div><h3>See it. Share it.</h3><p>Log shortages, possible contamination, or broken water infrastructure with a location, clear description, and optional photo evidence.</p><Link to={user?.role === 'citizen' ? '/report' : '/register'} className="text-link">Submit a report <ArrowRight size={16} /></Link></article>
          <article className="feature-card"><div className="feature-topline"><span>02 / LOCATE</span><span className="feature-icon feature-icon-soft"><MapPin size={22} /></span></div><div className="feature-illustration map-illustration"><div className="map-grid-lines" /><span className="map-pin map-pin-one"><MapPin size={22} fill="currentColor" /></span><span className="map-pin map-pin-two"><MapPin size={19} fill="currentColor" /></span><span className="map-pin map-pin-three"><MapPin size={17} fill="currentColor" /></span><span className="map-road road-one" /><span className="map-road road-two" /></div><h3>See the bigger picture.</h3><p>Explore mapped reports and patterns by area. Location helps communities understand where issues are appearing.</p><Link to="/map" className="text-link">Explore the map <ArrowRight size={16} /></Link></article>
          <article className="feature-card"><div className="feature-topline"><span>03 / RESPOND</span><span className="feature-icon feature-icon-soft"><ClipboardCheck size={22} /></span></div><div className="feature-illustration response-illustration"><div className="response-row"><span className="response-check"><CheckCircle2 size={16} /></span><span className="response-lines"><i /><i /></span><b>Resolved</b></div><div className="response-row"><span className="response-check response-check-gold"><Waves size={15} /></span><span className="response-lines"><i /><i /></span><b>In review</b></div><div className="response-row"><span className="response-check response-check-red"><Droplet size={15} /></span><span className="response-lines"><i /><i /></span><b>New</b></div></div><h3>Turn reports into action.</h3><p>Administrative teams can prioritize incoming issues, update statuses, and keep a record of work toward resolution.</p><Link to={user?.role === 'admin' ? '/admin' : '/login'} className="text-link">View the workflow <ArrowRight size={16} /></Link></article>
        </div>
      </section>

      <section className="map-cta-section"><div className="container map-cta-layout"><div className="map-cta-copy"><span className="overline overline-light">A SHARED VIEW OF WATER</span><h2>Water problems don't<br />stop at <em>one doorstep.</em></h2><p>See the reports people are raising and understand the issue types, locations, and current status — all on one map.</p><Link className="button button-lime" to="/map">Open the community map <ArrowRight size={17} /></Link><div className="map-cta-foot"><span className="map-legend-dot dot-red" /> Contamination <span className="map-legend-dot dot-gold" /> Shortage <span className="map-legend-dot dot-purple" /> Infrastructure</div></div><div className="map-cta-visual"><div className="floating-map-card"><div className="floating-map-heading"><span><MapPin size={15} /> COMMUNITY MAP</span><b><span className="live-dot" /> LIVE</b></div><div className="floating-map-area"><div className="floating-land land-a" /><div className="floating-land land-b" /><div className="floating-road fr-a" /><div className="floating-road fr-b" /><div className="floating-road fr-c" /><span className="floating-pin fp-a"><MapPin size={19} fill="currentColor" /></span><span className="floating-pin fp-b"><MapPin size={18} fill="currentColor" /></span><span className="floating-pin fp-c"><MapPin size={16} fill="currentColor" /></span><span className="floating-pin fp-d"><MapPin size={17} fill="currentColor" /></span><span className="floating-pin fp-e"><MapPin size={17} fill="currentColor" /></span></div><div className="floating-map-footer"><span>{formatNumber(mapCount)} mapped reports</span><span>View all <ArrowUpRight size={14} /></span></div></div><div className="map-cta-stamp"><BarChart3 size={23} /><span>DATA WITH<br />LOCAL CONTEXT</span></div></div></div></section>

      <section className="closing-cta container"><div className="closing-cta-mark"><Droplets size={32} /></div><div><span className="overline">YOUR COMMUNITY IS PART OF THE SOLUTION</span><h2>A clearer picture starts with you.</h2><p>One thoughtful report can help turn a local concern into visible, trackable action.</p></div><Link className="button button-dark" to={user?.role === 'citizen' ? '/report' : '/register'}>{user?.role === 'citizen' ? 'Create a report' : 'Get involved'} <ArrowRight size={17} /></Link></section>
    </main>
  );
}
