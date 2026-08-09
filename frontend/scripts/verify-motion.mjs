import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const pageTransition = read('../src/components/common/PageTransition.jsx');
const pageStyles = read('../src/components/common/PageTransition.css');
const loadingScreen = read('../src/components/common/LoadingScreen.jsx');
const loadingStyles = read('../src/components/common/LoadingScreen.css');
const loaderOverlay = read('../src/components/common/LoaderOverlay.jsx');
const globalStyles = read('../src/index.css');

const checks = [
    ['route shell exists', pageTransition.includes('page-transition-shell')],
    ['route content exists', pageTransition.includes('page-transition-content')],
    ['route fade only changes opacity', /@keyframes page-fade-in[\s\S]*?opacity: 0[\s\S]*?opacity: 1/.test(pageStyles)],
    ['route settle owns transform', /@keyframes page-settle-in[\s\S]*?transform: translateY\(8px\)[\s\S]*?transform: translateY\(0\)/.test(pageStyles)],
    ['loading content exists', loadingScreen.includes('ls-content')],
    ['loading mark has its own layer', loadingScreen.includes('ls-mark-layer')],
    ['loading fade owns opacity', /@keyframes loading-content-fade[\s\S]*?opacity: 0[\s\S]*?opacity: 1/.test(loadingStyles)],
    ['loading settle owns transform', /@keyframes loading-mark-settle[\s\S]*?transform: translateY\(8px\)[\s\S]*?transform: translateY\(0\)/.test(loadingStyles)],
    ['overlay entry layer exists', loaderOverlay.includes('loader-overlay-entry')],
    ['overlay rings remain separate children', (loaderOverlay.match(/loader-ring-spin/g) || []).length === 3],
    ['overlay entry animation exists', globalStyles.includes('@keyframes loader-panel-enter')]
];

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
assert.equal(failures.length, 0, `Motion layer verification failed: ${failures.join(', ')}`);

console.log(`Motion layer verification passed: ${checks.length} independent animation contracts checked.`);
