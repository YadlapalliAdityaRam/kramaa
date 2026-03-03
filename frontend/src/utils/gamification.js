// Gamification Logic
// Levels: 0-100 (Novice), 100-300 (Apprentice), 300-600 (Coder), 600-1000 (Hacker), 1000+ (Grandmaster)

export const LEVELS = [
    { name: 'Novice', minXP: 0, color: '#94a3b8' },
    { name: 'Apprentice', minXP: 100, color: '#22c55e' },
    { name: 'Coder', minXP: 300, color: '#3b82f6' },
    { name: 'Hacker', minXP: 600, color: '#a855f7' },
    { name: 'Grandmaster', minXP: 1000, color: '#f59e0b' }
];

export const BADGES = [
    { id: 'first_solve', name: 'First Blood', icon: '🩸', desc: 'Solved your first problem', condition: (stats) => stats.solved >= 1 },
    { id: 'streak_3', name: 'On Fire', icon: '🔥', desc: '3 Day Streak', condition: (stats) => stats.streak >= 3 },
    { id: 'streak_7', name: 'Unstoppable', icon: '🚀', desc: '7 Day Streak', condition: (stats) => stats.streak >= 7 },
    { id: 'array_master', name: 'Array Master', icon: '📦', desc: 'Solved 5 Array problems', condition: (stats) => stats.topics['Arrays'] >= 5 },
    { id: 'algo_god', name: 'Algorithm God', icon: '⚡', desc: 'Reached 1000 XP', condition: (stats) => stats.xp >= 1000 }
];

export const getLevel = (xp) => {
    let level = LEVELS[0];
    for (const l of LEVELS) {
        if (xp >= l.minXP) level = l;
    }
    return level;
};

export const getNextLevel = (xp) => {
    for (const l of LEVELS) {
        if (l.minXP > xp) return l;
    }
    return null; // Max level
};

export const addXP = (amount) => {
    const currentXP = parseInt(localStorage.getItem('user_xp') || '0');
    const newXP = currentXP + amount;
    localStorage.setItem('user_xp', newXP.toString());
    return {
        oldXP: currentXP,
        newXP: newXP,
        leveledUp: getLevel(currentXP).name !== getLevel(newXP).name
    };
};

export const getGamificationProfile = () => {
    const xp = parseInt(localStorage.getItem('user_xp') || '0');
    const level = getLevel(xp);
    const nextLevel = getNextLevel(xp);
    const progress = nextLevel ? ((xp - level.minXP) / (nextLevel.minXP - level.minXP)) * 100 : 100;

    return { xp, level, nextLevel, progress };
};

export const checkNewBadges = () => {
    // Determine stats from local storage
    const solved = JSON.parse(localStorage.getItem('solved_problems') || '[]');
    const history = JSON.parse(localStorage.getItem('submission_history') || '[]');

    // Quick calc of streak (simplified)
    const dates = [...new Set(history.map(h => h.date.split('T')[0]))].sort();
    let streak = 0; // Requires more complex date logic for real streak, using solved count as proxy for now
    streak = dates.length; // Just using unique active days

    const topics = {}; // Need problems listing to calc this efficiently, passing mock for now

    const stats = {
        solved: solved.length,
        streak: streak,
        xp: parseInt(localStorage.getItem('user_xp') || '0'),
        topics: { 'Arrays': 0 } // Placeholder
    };

    const ownedBadges = JSON.parse(localStorage.getItem('user_badges') || '[]');
    const newBadges = [];

    BADGES.forEach(badge => {
        if (!ownedBadges.includes(badge.id) && badge.condition(stats)) {
            newBadges.push(badge);
            ownedBadges.push(badge.id);
        }
    });

    if (newBadges.length > 0) {
        localStorage.setItem('user_badges', JSON.stringify(ownedBadges));
    }

    return newBadges;
};
