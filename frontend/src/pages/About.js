import { Link } from 'react-router-dom';
import { FaArrowRight, FaCode, FaEye, FaTrophy } from 'react-icons/fa';

const principles = [
    { icon: <FaEye />, title: 'Make the logic visible', copy: 'Follow the operations that usually stay hidden behind an answer.' },
    { icon: <FaCode />, title: 'Practice with intent', copy: 'Apply the idea in a focused coding workspace, not a disconnected exercise.' },
    { icon: <FaTrophy />, title: 'Pressure-test the habit', copy: 'Use contests and progress signals to turn knowledge into good judgment.' }
];

const About = () => (
    <main className="content-page about-page">
        <header className="content-page-intro">
            <p className="content-kicker">About Kramaa</p>
            <h1>Algorithms become useful when their decisions are clear.</h1>
            <p className="content-lede">Kramaa is a practical environment for seeing an idea work, writing it yourself, and building the confidence to use it under pressure.</p>
        </header>

        <section className="principles-grid" aria-label="How Kramaa supports learning">
            {principles.map((principle, index) => (
                <article className="principle-card" key={principle.title}>
                    <span className="principle-index">0{index + 1}</span>
                    <span className="principle-icon" aria-hidden="true">{principle.icon}</span>
                    <h2>{principle.title}</h2>
                    <p>{principle.copy}</p>
                </article>
            ))}
        </section>

        <section className="content-callout">
            <div>
                <p className="content-kicker">Start with one idea</p>
                <h2>See the mechanism. Then make it yours.</h2>
            </div>
            <Link to="/algorithms" className="content-button">Open the algorithm library <FaArrowRight aria-hidden="true" /></Link>
        </section>
    </main>
);

export default About;
