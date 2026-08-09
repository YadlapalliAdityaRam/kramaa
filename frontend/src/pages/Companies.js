import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBuilding } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const Companies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadCompanies = async () => {
            try {
                const response = await api.get('/companies');
                if (!cancelled) setCompanies(Array.isArray(response.data?.companies) ? response.data.companies : []);
            } catch {
                if (!cancelled) toast.error('Unable to load companies right now.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadCompanies();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return <main className="content-page page-loading"><span /><p>Loading company guides</p></main>;
    }

    return (
        <main className="content-page company-catalog-page">
            <header className="content-page-intro content-page-intro-split">
                <div>
                    <p className="content-kicker">Company preparation</p>
                    <h1>Prepare for the work a company actually asks of you.</h1>
                </div>
                <p className="content-lede">Explore company-specific focus areas, hiring patterns, and a practical route through the problems that matter.</p>
            </header>

            {companies.length === 0 ? (
                <section className="catalog-empty">
                    <FaBuilding aria-hidden="true" />
                    <h2>Company guides are on their way.</h2>
                    <p>New preparation guides will appear here as they are added.</p>
                </section>
            ) : (
                <section className="company-card-grid" aria-label="Company preparation guides">
                    {companies.map((company) => (
                        <Link to={`/company/${encodeURIComponent(company.name)}`} className="company-card" key={company._id || company.name}>
                            <div className="company-card-heading">
                                <span className="company-card-mark"><FaBuilding aria-hidden="true" /></span>
                                <span className="company-type">{company.type || 'Company guide'}</span>
                            </div>
                            <h2>{company.name}</h2>
                            <div className="company-card-section">
                                <p>Skills to bring</p>
                                <div>{(company.skills || []).slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div>
                            </div>
                            <div className="company-card-section company-card-process">
                                <p>Recruitment route</p>
                                <ol>{(company.process || []).slice(0, 3).map((step) => <li key={step}>{step}</li>)}</ol>
                            </div>
                            <span className="company-card-link">View preparation guide <FaArrowRight aria-hidden="true" /></span>
                        </Link>
                    ))}
                </section>
            )}
        </main>
    );
};

export default Companies;
