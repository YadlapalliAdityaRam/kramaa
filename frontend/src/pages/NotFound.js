import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

const NotFound = () => (
    <main className="status-page">
        <span className="status-code">404</span>
        <p className="content-kicker">Route not found</p>
        <h1>This path does not lead to a lesson.</h1>
        <p>Head back to the library and choose the next problem worth working through.</p>
        <Link to="/algorithms" className="content-button">Open the library <FaArrowRight aria-hidden="true" /></Link>
    </main>
);

export default NotFound;
