import { Link } from 'react-router-dom';
import { FaArrowRight, FaPlay } from 'react-icons/fa';
import { algorithmList } from '../data/algorithmsData';

const Visualize = () => {
    const categories = ['Sorting', 'Searching', 'Graphs', 'Dynamic Programming'];
    const startingLessons = categories.map((category) => algorithmList.find((algorithm) => algorithm.category === category)).filter(Boolean);

    return (
        <main className="content-page visualize-page">
            <header className="content-page-intro content-page-intro-split">
                <div>
                    <p className="content-kicker">Visualizer hub</p>
                    <h1>Watch the algorithm make its next decision.</h1>
                </div>
                <p className="content-lede">Each lesson keeps the input small on purpose, so you can follow the state change instead of just watching motion.</p>
            </header>

            <section className="visualizer-start-grid" aria-label="Choose an algorithm topic">
                {startingLessons.map((algorithm, index) => (
                    <Link to={algorithm.path} className="visualizer-start-card" key={algorithm.id}>
                        <span>0{index + 1} / {algorithm.category}</span>
                        <h2>{algorithm.name}</h2>
                        <p>{algorithm.description}</p>
                        <strong>Open visualizer <FaPlay aria-hidden="true" /></strong>
                    </Link>
                ))}
            </section>

            <section className="content-callout content-callout-compact">
                <div><h2>Prefer to browse first?</h2><p>Filter every lesson by topic and difficulty.</p></div>
                <Link to="/algorithms" className="content-button content-button-secondary">Browse all algorithms <FaArrowRight aria-hidden="true" /></Link>
            </section>
        </main>
    );
};

export default Visualize;
