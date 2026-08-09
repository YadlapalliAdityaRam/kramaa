import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
    FaCheckCircle,
    FaCode,
    FaCube,
    FaLightbulb,
    FaMapSigns,
    FaRegClock,
    FaRoute
} from 'react-icons/fa';
import { algorithmList } from '../data/algorithmsData';
import { buildAlgorithmLesson, normalizeAlgorithmPath } from '../data/algorithmLessons';
import './AlgorithmStudyGuide.css';

const AlgorithmStudyGuide = () => {
    const { pathname } = useLocation();
    const algorithm = useMemo(() => {
        const normalizedPath = normalizeAlgorithmPath(pathname);
        return algorithmList.find((entry) => entry.path === normalizedPath) || null;
    }, [pathname]);
    const lesson = useMemo(() => algorithm ? buildAlgorithmLesson(algorithm) : null, [algorithm]);

    if (!algorithm || !lesson) return null;

    return (
        <section className="algorithm-study-guide" aria-labelledby="algorithm-study-title">
            <header className="algorithm-study-header">
                <div>
                    <p className="algorithm-study-kicker">Student guide</p>
                    <h2 id="algorithm-study-title">Understand {algorithm.name} before memorising it.</h2>
                </div>
                <div className="algorithm-study-tags" aria-label="Algorithm details">
                    <span>{algorithm.category}</span>
                    <span>{algorithm.difficulty}</span>
                </div>
            </header>

            <div className="algorithm-study-grid">
                <article className="algorithm-study-card algorithm-study-card--intro">
                    <FaLightbulb aria-hidden="true" />
                    <p className="algorithm-study-label">Plain language</p>
                    <h3>What it does</h3>
                    {lesson.overview.whatItDoes.map((line) => <p key={line}>{line}</p>)}
                    <p className="algorithm-study-core"><strong>Core idea:</strong> {lesson.overview.coreIdea}</p>
                    <p className="algorithm-study-requirement"><strong>Before you start:</strong> {lesson.requirements}</p>
                </article>

                <article className="algorithm-study-card">
                    <FaRoute aria-hidden="true" />
                    <p className="algorithm-study-label">Method</p>
                    <h3>How it works</h3>
                    <ol className="algorithm-study-steps">
                        {lesson.overview.howItWorks.map((step) => <li key={step}>{step}</li>)}
                    </ol>
                </article>

                <article className="algorithm-study-card algorithm-study-card--example">
                    <FaMapSigns aria-hidden="true" />
                    <p className="algorithm-study-label">Worked example</p>
                    <h3>Input → output</h3>
                    <dl className="algorithm-study-example-values">
                        <div><dt>Input</dt><dd>{lesson.example.input}</dd></div>
                        <div><dt>Output</dt><dd>{lesson.example.output}</dd></div>
                    </dl>
                    <ol className="algorithm-study-trace">
                        {lesson.example.trace.map((step) => <li key={step}>{step}</li>)}
                    </ol>
                </article>

                <article className="algorithm-study-card algorithm-study-card--complexity">
                    <FaRegClock aria-hidden="true" />
                    <p className="algorithm-study-label">Cost</p>
                    <h3>Complexity</h3>
                    <dl className="algorithm-study-complexity">
                        <div><dt>Time</dt><dd>{lesson.time}</dd></div>
                        <div><dt>Space</dt><dd>{lesson.space}</dd></div>
                    </dl>
                </article>

                <article className="algorithm-study-card algorithm-study-card--uses">
                    <FaCube aria-hidden="true" />
                    <p className="algorithm-study-label">Real-world use</p>
                    <h3>Where this idea helps</h3>
                    <ul className="algorithm-study-uses">
                        {lesson.realWorldUses.map((use) => (
                            <li key={use.label}>
                                <strong>{use.label}</strong>
                                <span>{use.detail}</span>
                            </li>
                        ))}
                    </ul>
                </article>

                <article className="algorithm-study-card algorithm-study-card--check">
                    <FaCheckCircle aria-hidden="true" />
                    <p className="algorithm-study-label">Check your understanding</p>
                    <h3>Try these edge cases</h3>
                    <ul className="algorithm-study-checklist">
                        {lesson.edgeCases.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                </article>
            </div>

            <details className="algorithm-study-code" open>
                <summary><FaCode aria-hidden="true" /> Clean JavaScript reference implementation</summary>
                <pre><code>{lesson.code}</code></pre>
            </details>
        </section>
    );
};

export default AlgorithmStudyGuide;
