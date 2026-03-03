const User = require('../models/User');
const Contest = require('../models/Contest');
const badgeService = require('./badgeService');

class RatingService {

    /**
     * Calculate rating changes after a contest ends.
     * Uses an ELO-inspired system.
     * 
     * @param {string} contestId
     */
    async processContestResults(contestId) {
        try {
            const contest = await Contest.findById(contestId)
                .populate('participants.user', 'username rating contestStats');

            if (!contest || contest.status !== 'COMPLETED') return;

            const participants = contest.participants
                .filter(p => p.user)
                .sort((a, b) => b.score - a.score);

            const totalParticipants = participants.length;
            if (totalParticipants === 0) return;

            for (let i = 0; i < participants.length; i++) {
                const p = participants[i];
                const userId = p.user._id;
                const rank = i + 1;
                const currentRating = p.user.rating?.current || 1200;

                // ELO-style rating change
                const ratingChange = this.calculateChange(currentRating, rank, totalParticipants, p.score);
                const newRating = Math.max(0, currentRating + ratingChange);

                // Update user
                const updateData = {
                    'rating.current': newRating,
                    $push: {
                        'rating.history': {
                            date: new Date(),
                            rating: newRating,
                            contestId: contest._id,
                            change: ratingChange
                        }
                    },
                    $inc: {
                        'contestStats.participated': 1,
                        'contestStats.totalScore': p.score
                    }
                };

                // Update highest rating
                if (newRating > (p.user.rating?.highest || 1200)) {
                    updateData['rating.highest'] = newRating;
                }

                // Update best rank
                const currentBest = p.user.contestStats?.bestRank;
                if (!currentBest || rank < currentBest) {
                    updateData['contestStats.bestRank'] = rank;
                }

                await User.findByIdAndUpdate(userId, updateData);

                // Check contest badges
                await badgeService.checkContestBadges(userId, rank, totalParticipants);
            }

        } catch (error) {
            console.error('Rating Service Error:', error);
        }
    }

    /**
     * ELO-inspired rating change calculation.
     * 
     * @param {number} currentRating - Player's current rating
     * @param {number} rank          - Rank in contest (1-based)
     * @param {number} total         - Total participants
     * @param {number} score         - Points scored
     * @returns {number} rating change (positive or negative)
     */
    calculateChange(currentRating, rank, total, score) {
        // K-factor: higher for lower-rated players (they move faster)
        const K = currentRating < 1400 ? 40 : currentRating < 1800 ? 30 : 20;

        // Expected performance: based on current rating relative to average
        const expectedRank = total / 2; // Middle of the pack
        const actualPerformance = 1 - (rank / total); // 1.0 = first, 0.0 = last
        const expectedPerformance = 0.5; // Average

        // Rating change
        let change = Math.round(K * (actualPerformance - expectedPerformance));

        // Bonus for top 10%
        if (rank <= Math.max(1, Math.floor(total * 0.1))) {
            change += Math.round(K * 0.3);
        }

        // Penalty reduction for low scores even with good rank (anti-gaming)
        if (score === 0) {
            change = Math.min(change, 0) - 5;
        }

        return change;
    }

    /**
     * Get rating tier label based on rating value.
     */
    static getTier(rating) {
        if (rating >= 2400) return { name: 'Grandmaster', color: '#ff0000' };
        if (rating >= 2100) return { name: 'Master', color: '#ff8c00' };
        if (rating >= 1900) return { name: 'Candidate Master', color: '#aa00aa' };
        if (rating >= 1600) return { name: 'Expert', color: '#0000ff' };
        if (rating >= 1400) return { name: 'Specialist', color: '#03a89e' };
        if (rating >= 1200) return { name: 'Pupil', color: '#008000' };
        return { name: 'Newbie', color: '#808080' };
    }
}

module.exports = new RatingService();
