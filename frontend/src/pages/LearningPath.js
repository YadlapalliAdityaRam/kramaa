import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import { algorithmList } from '../data/algorithmsData';

const paths = [
    { difficulty: 'Easy', title: 'Build the foundations', copy: 'Start with repeatable patterns and the language used to describe them.' },
    { difficulty: 'Medium', title: 'Connect the patterns', copy: 'Use familiar ideas in more demanding combinations and trade-offs.' },
    { difficulty: 'Hard', title: 'Handle the edge cases', copy: 'Work through advanced structures, strategy, and performance limits.' }
];

const LearningPath = () => (
    <main className="content-page learning-page">
        <header className="content-page-intro">
            <p className="content-kicker">Guided learning</p>
            <h1>Choose a difficulty. Keep moving with purpose.</h1>
            <p className="content-lede">Every algorithm in the library belongs to one of three practical stages: Easy, Medium, or Hard.</p>
        </header>

        <section className="learning-path-list" aria-label="Difficulty based learning paths">
            {paths.map((path, index) => {
                const lessons = algorithmList.filter((algorithm) => algorithm.difficulty === path.difficulty);
                return (
                    <article className={`learning-path-row learning-path-${path.difficulty.toLowerCase()}`} key={path.difficulty}>
                        <span className="learning-path-index">0{index + 1}</span>
                        <div><p>{path.difficulty}</p><h2>{path.title}</h2><span>{path.copy}</span></div>
                        <div className="learning-path-lessons"><strong>{lessons.length}</strong><span>lessons</span></div>
                        <div className="learning-path-links">
                            {lessons.slice(0, 3).map((lesson) => <Link to={lesson.path} key={lesson.id}>{lesson.name}</Link>)}
                        </div>
                        <Link to={`/algorithms?difficulty=${path.difficulty}`} className="learning-path-open" aria-label={`View all ${path.difficulty} algorithms`}><FaArrowRight aria-hidden="true" /></Link>
                    </article>
                );
            })}
        </section>
    </main>
);

export default LearningPath;
