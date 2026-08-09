import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

const Unauthorized = () => (
    <main className="status-page">
        <span className="status-code">403</span>
        <p className="content-kicker">Access restricted</p>
        <h1>You do not have access to this workspace.</h1>
        <p>Return to the learning area or sign in with an account that has the required permission.</p>
        <Link to="/" className="content-button">Return home <FaArrowRight aria-hidden="true" /></Link>
    </main>
);

export default Unauthorized;
