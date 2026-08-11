import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCheck, FaCode, FaEye, FaLightbulb, FaPlay } from 'react-icons/fa';
import './Foundations.css';
import './FoundationsTheme.css';
import './FoundationsBeginner.css';

const stages = ['Understand', 'Visualize', 'Predict', 'Trace', 'Code', 'Analyze', 'Challenge'];
const levels = [
    ['Programming Foundations', ['Variables', 'Data Types', 'Operators', 'Conditions', 'Loops', 'Functions']],
    ['DSA Foundations', ['What is DSA?', 'Time Complexity', 'Space Complexity']],
    ['Arrays & Techniques', ['Arrays', 'Strings', 'Linear Search', 'Binary Search', 'Sorting', 'Two Pointers', 'Sliding Window', 'Prefix Sum']],
    ['Core Data Structures', ['Linked List', 'Stack', 'Queue', 'Hashing', 'Recursion', 'Trees', 'Graphs']],
    ['Intermediate Algorithms', ['Greedy', 'Divide & Conquer', 'Dynamic Programming', "Dijkstra's Algorithm", 'Minimum Spanning Tree']]
];

const examples = {
    Variables: ['A variable is a named box that stores a value.', 'x = 10\nx = 20\n\nWhat is x?', '20', 'The second assignment replaces the first value.', 'x  ->  [ 20 ]'],
    Arrays: ['An array stores values in order. Every value has a position called an index.', 'arr = [10, 20, 30, 40]\n\nWhat is arr[2]?', '30', 'Counting starts at zero, so index 2 is the third value.', '[10] [20] [30] [40]'],
    'Time Complexity': ['Time complexity tells us how the work grows when the input becomes bigger.', 'for i in range(n):\n    process(i)\n\nWhat is the complexity?', 'O(n)', 'The loop does one piece of work for every item.', 'n -> n -> n -> n']
};

const contentFor = (topic) => {
    if (examples[topic]) return examples[topic];
    const content = {
        'Data Types': ['A data type tells the computer what kind of value it is holding, such as a number, word, or true/false answer.', 'age = 20\nname = "Maya"\n\nWhat type is age?', 'Number', '20 is a number. The type helps the computer choose the right operations.', '20 -> NUMBER'],
        Operators: ['An operator is a symbol that tells the computer to calculate or compare values.', '5 + 2 * 3\n\nWhat is the result?', '11', 'Multiplication happens before addition, so 2 * 3 is done first.', '5 + 2 -> 7'],
        Conditions: ['A condition lets a program choose what to do. It asks a question with a yes or no answer.', 'age = 16\nage >= 18?\n\nWhich path?', 'Not eligible', 'Because 16 is not greater than or equal to 18, the else path runs.', 'QUESTION -> YES / NO'],
        Loops: ['A loop repeats a small instruction so you do not have to write the same line many times.', 'for i in range(3):\n    print(i)\n\nHow many prints?', '3', 'The loop uses i = 0, 1, and 2, so it prints three times.', '0 -> 1 -> 2'],
        Functions: ['A function is a named recipe. You give it inputs, it does a job, and it can return an answer.', 'add(4, 3)\n\nWhat comes back?', '7', 'The function adds its two inputs and returns 7.', 'INPUT -> RECIPE -> OUTPUT'],
        'What is DSA?': ['DSA means Data Structures and Algorithms. Structures store information; algorithms are the steps used to work with it.', 'Which one is a data structure?\nArray or “sort the list”?', 'Array', 'An array stores data. Sorting is an algorithm that works on data.', 'DATA -> STEPS -> ANSWER'],
        'Space Complexity': ['Space complexity tells us how much extra memory a solution needs while it runs.', 'Creating another array with n items\n\nExtra space?', 'O(n)', 'The new array grows with the input, so it needs space for n items.', 'INPUT [ ] + MEMORY [ ][ ][ ]'],
        Strings: ['A string is a sequence of characters, like a word or sentence. Each character has an index.', 'word = "CODE"\n\nWhat is word[1]?', 'O', 'The first character is at index 0, so index 1 is O.', 'C | O | D | E'],
        'Linear Search': ['Linear search checks items one after another until it finds the target or reaches the end.', '[12, 7, 25, 40]\nTarget = 40\n\nHow many checks?', '4', 'It checks 12, 7, 25, then 40.', '12 -> 7 -> 25 -> 40'],
        Sorting: ['Sorting puts values in an order, such as smallest to largest, so later work becomes easier.', '[5, 2, 8, 1]\n\nSmallest first?', '1', 'Ascending order starts with the smallest value.', '5,2,8,1 -> 1,2,5,8'],
        'Two Pointers': ['Two pointers are two positions that move through data. They can avoid checking every possible pair.', '[1, 2, 3, 4, 6]\nTarget = 10\n\nWhich pair?', '4 + 6', 'Move the left pointer when the sum is too small and the right pointer when it is too large.', 'L ->       <- R'],
        'Sliding Window': ['A sliding window is a moving section of an array. It helps us inspect nearby values without starting over.', '[2, 1, 5, 1, 3]\nWindow size = 3\n\nFirst window?', '[2, 1, 5]', 'The window contains the first three values, then moves one place at a time.', '[2,1,5] -> [1,5,1]'],
        'Prefix Sum': ['A prefix sum stores running totals. It lets us answer range-sum questions quickly.', '[2, 4, 1]\n\nPrefix sums?', '[2, 6, 7]', 'Each total includes the current value and all values before it.', '[2,4,1] -> [2,6,7]'],
        'Linked List': ['A linked list is a chain of nodes. Each node stores a value and a link to the next node.', '10 -> 20 -> 30\n\nWhat follows 20?', '30', 'The link inside node 20 points to node 30.', '[10] -> [20] -> [30]'],
        Stack: ['A stack works like a pile of plates. The last item added is the first item removed.', 'Push 10, then 20.\n\nWhat does pop remove?', '20', '20 is on top because it was added last.', '[20] TOP\n[10]'],
        Queue: ['A queue works like a line of people. The first item that arrives is the first item served.', '10 -> 20 -> 30\n\nWhat leaves first?', '10', '10 is at the front because it arrived first.', 'FRONT [10] -> [20] -> [30] REAR'],
        Hashing: ['Hashing turns a key into a bucket position, helping us find stored values quickly.', 'key = "Maya"\n\nWhat does hashing find?', 'A bucket', 'The hash function chooses where the key and its value are stored.', 'KEY -> HASH -> BUCKET'],
        Recursion: ['Recursion is when a function calls itself on a smaller version of the same problem.', 'factorial(3)\n\nWhat must stop it?', 'Base case', 'The base case stops the function from calling itself forever.', '3 -> 2 -> 1 -> STOP'],
        Trees: ['A tree stores data in a hierarchy. One root can have children, and children can have more children.', 'In a tree, what is the top node called?', 'Root', 'The root is the starting node of the hierarchy.', 'ROOT\n / \\nCHILD CHILD'],
        Graphs: ['A graph is a group of points and connections. It can model roads, friendships, or links between pages.', 'A point in a graph is called what?', 'Vertex', 'Vertices are the points; edges are the connections between them.', 'A -- B\n|    |\nC -- D'],
        Greedy: ['A greedy algorithm chooses what looks best right now, hoping those choices lead to a good final answer.', 'For coins 1, 5, 10, 25 and target 25, which coin first?', '25', 'The largest useful coin is the best immediate choice.', 'TAKE 25 -> 0 LEFT'],
        'Divide & Conquer': ['Divide and conquer splits a big problem into smaller pieces, solves them, and combines the answers.', '[8, 3, 5, 1]\n\nWhat happens first?', 'Split', 'Breaking the problem into smaller parts makes each part easier.', '[8,3] + [5,1]'],
        'Dynamic Programming': ['Dynamic programming saves answers to smaller problems so we do not calculate the same answer again.', 'F(3) appears many times.\n\nWhat should we do?', 'Save it', 'Store the result once, then reuse it when needed.', 'F(3) -> SAVE -> REUSE'],
        "Dijkstra's Algorithm": ['Dijkstra finds the shortest path from one starting point when edge costs are not negative.', 'Start A = 0, edge A-B = 4.\n\nDistance to B?', '4', 'The path from A to B costs 4.', 'A(0) -> B(4)'],
        'Minimum Spanning Tree': ['A minimum spanning tree connects every point with the lowest total edge cost and no cycles.', 'A tree with 4 vertices has how many edges?', '3', 'A connected tree always has one fewer edge than its number of vertices.', 'A -- B -- C -- D']
    };
    return content[topic] || [`${topic} is a beginner-friendly idea used in problem solving. First learn what it is for, then try one tiny example.`, `What should you learn first about ${topic}?`, 'Its purpose', `Knowing the purpose helps you decide when ${topic} is useful.`, `[ ${topic} ] -> [ example ]`];
};

export default function Foundations() {
    const [topic, setTopic] = useState('Arrays');
    const [stage, setStage] = useState(0);
    const [answer, setAnswer] = useState(false);
    const [visualPlaying, setVisualPlaying] = useState(false);
    const content = contentFor(topic);
    const progress = useMemo(() => Math.round((stage / 7) * 100), [stage]);
    const moveNext = () => { setStage((value) => Math.min(6, value + 1)); setAnswer(false); };

    return <main className="foundations-page">
        <header className="foundations-hero"><div><p className="foundations-kicker">Kramaa Foundations Lab · No experience needed</p><h1>Start from zero.<br />Build your confidence.</h1><p className="foundations-lede">Never written code before? That is exactly where this starts. Learn one small idea at a time with friendly explanations, pictures, and questions that help you think like a programmer.</p></div><div className="foundations-progress"><span>YOUR PROGRESS</span><strong>{stage}/7 stages</strong><div><i style={{ width: `${progress}%` }} /></div><small>There is no wrong place to begin.</small></div></header>
        <section className="foundations-layout"><aside className="foundations-topics"><p className="foundations-label">Pick a small idea</p><p className="topic-helper">You can start anywhere. We explain every word before asking you to use it.</p>{levels.map(([level, topics]) => <div className="foundation-level" key={level}><h2>{level}</h2>{topics.map((item) => <button className={topic === item ? 'active' : ''} key={item} onClick={() => { setTopic(item); setStage(0); setAnswer(false); }}><span>{topic === item ? '->' : '·'}</span>{item}</button>)}</div>)}</aside>
            <section className="foundation-workspace"><div className="foundation-workspace-head"><div><p className="foundations-label">Topic / {topic}</p><h2>{topic}</h2></div><span>{stage + 1} / 7</span></div><nav className="foundation-stages">{stages.map((item, index) => <button className={index === stage ? 'active' : index < stage ? 'done' : ''} key={item} onClick={() => { setStage(index); setAnswer(false); }}><span>{index < stage ? <FaCheck /> : `0${index + 1}`}</span>{item}</button>)}</nav>
                <article className="foundation-card" key={`${topic}-${stage}`}><p className="foundations-label">{stages[stage]} · Learn at your pace</p>
                    {stage === 0 && <><h3>What is {topic.toLowerCase()}?</h3><p>{content[0]}</p><div className="foundation-visual"><FaLightbulb /><strong>{content[4]}</strong></div></>}
                    {stage === 1 && <><h3>See {topic} in action</h3><p>{content[0]} The visual below shows the idea one step at a time, so you can understand it before memorising anything.</p><div className={`foundation-visual foundation-visual-large ${visualPlaying ? 'is-playing' : ''}`}><FaEye /><strong>{content[4]}</strong><small>{visualPlaying ? 'Playing: watch the values move and notice the change.' : 'Press Play visualization to see the movement.'}</small></div><button className="foundation-button visualize-button" onClick={() => setVisualPlaying((value) => !value)}><FaPlay /> {visualPlaying ? 'Pause visualization' : 'Play visualization'}</button></>}
                    {stage === 2 && <><h3>Answer this simple question</h3><p>Read the example and make your best guess. A mistake is a useful step.</p><pre>{content[1]}</pre><button className="foundation-button" onClick={() => setAnswer(true)}>Show simple answer <FaCheck /></button>{answer && <p className="foundation-feedback"><FaCheck /> <strong>{content[2]}</strong><br />{content[3]}</p>}</>}
                    {stage === 3 && <><h3>Trace it step by step</h3><p>Tracing means writing down each small action instead of jumping to the result.</p><div className="trace-steps"><span>01 Start</span><span>02 Look</span><span>03 Decide</span><span>04 Result</span></div></>}
                    {stage === 4 && <><h3>Try the code</h3><p>Code is simply an instruction list for the computer. Start with one small example.</p><pre>{`# practise ${topic}\nanswer = ...`}</pre><Link to="/coding-platform" className="foundation-button">Open coding workspace <FaCode /></Link></>}
                    {stage === 5 && <><h3>Check your understanding</h3><p>A good solution is correct, clear, and careful with unusual inputs.</p><div className="analysis-grid"><span>Simple check<strong>Does it work on an empty input?</strong></span><span>Remember<strong>{content[3]}</strong></span></div></>}
                    {stage === 6 && <><h3>Use {topic} in a problem</h3><p>Explain your idea in one sentence, then solve a small problem. You do not need a perfect solution on the first try.</p><Link to="/coding-platform" className="foundation-button">Take the challenge <FaArrowRight /></Link></>}
                </article><div className="foundation-controls"><button className="foundation-next" onClick={moveNext}><FaPlay /> {stage === 6 ? 'Lesson complete' : `Continue to ${stages[stage + 1]}`}</button><button className="foundation-skip" onClick={moveNext}>Skip stage <FaArrowRight /></button></div>
            </section>
        </section>
    </main>;
}
