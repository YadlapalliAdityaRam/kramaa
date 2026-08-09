import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowRight, FaBuilding, FaCheckCircle, FaLayerGroup } from 'react-icons/fa';
import api from '../utils/api';

const CompanyDashboard = () => {
    const { companyName } = useParams();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadStats = async () => {
            try {
                const response = await api.get(`/problems/company/${companyName}/stats`);
                if (!cancelled) setStats(response.data || null);
            } catch {
                if (!cancelled) setStats(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadStats();
        return () => {
            cancelled = true;
        };
    }, [companyName]);

    if (loading) return <main className="content-page page-loading"><span /><p>Building your preparation guide</p></main>;
    if (!stats) return <main className="content-page catalog-empty"><FaBuilding aria-hidden="true" /><h1>Preparation data is not available yet.</h1><Link to="/companies" className="content-button">Return to companies <FaArrowRight aria-hidden="true" /></Link></main>;

    const company = decodeURIComponent(companyName || 'Company');
    const difficulty = stats.stats || {};
    const totalProblems = Number(stats.totalProblems || 0);
    const levels = [
        { level: 'Easy', count: Number(difficulty.Easy || 0) },
        { level: 'Medium', count: Number(difficulty.Medium || 0) },
        { level: 'Hard', count: Number(difficulty.Hard || 0) }
    ];

    return (
        <main className="content-page company-dashboard-page">
            <header className="company-dashboard-header">
                <div className="company-card-mark"><FaBuilding aria-hidden="true" /></div>
                <div><p className="content-kicker">Company preparation guide</p><h1>{company}</h1><p>Use this roadmap to sequence the patterns and practice areas that matter most.</p></div>
                <div className="company-dashboard-summary"><strong>{totalProblems}</strong><span>curated problems</span></div>
                <Link to="/coding-platform" className="content-button">Start a session <FaArrowRight aria-hidden="true" /></Link>
            </header>

            <section className="company-difficulty-grid" aria-label="Problems by difficulty">
                {levels.map((item) => {
                    const progress = totalProblems ? Math.round((item.count / totalProblems) * 100) : 0;
                    return (
                        <article className={`company-difficulty-card company-difficulty-${item.level.toLowerCase()}`} key={item.level}>
                            <p>{item.level}</p><strong>{item.count}</strong><span>{progress}% of guide</span><i><b style={{ width: `${progress}%` }} /></i>
                        </article>
                    );
                })}
            </section>

            <section className="company-roadmap">
                <div className="company-roadmap-heading"><div><p className="content-kicker">Recommended order</p><h2>Preparation roadmap</h2></div><FaLayerGroup aria-hidden="true" /></div>
                <ol>
                    {(stats.topics || []).map((topic, index) => (
                        <li key={topic.name}>
                            <span className="company-roadmap-index">0{index + 1}</span>
                            <div className="company-roadmap-topic"><div><p>{topic.count} problems</p><h3>{topic.name}</h3></div><div className="company-problem-list">{(topic.problems || []).map((problem) => <Link to={`/coding-platform/${problem.slug}`} key={problem.slug}><FaCheckCircle aria-hidden="true" /><span>{problem.title}</span><em className={`company-problem-${String(problem.difficulty || '').toLowerCase()}`}>{problem.difficulty}</em></Link>)}</div></div>
                        </li>
                    ))}
                </ol>
            </section>
        </main>
    );
};

export default CompanyDashboard;
