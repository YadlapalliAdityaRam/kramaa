const Problem = require('../models/Problem');
const User = require('../models/User');
const { PROBLEM_STATUS, buildPublicationFields } = require('./problemPublication');

const actionExecutor = {
    // 1. ADD_PROBLEM: Publish the problem
    ADD_PROBLEM: async (ticket, session) => {
        const problem = await Problem.findByIdAndUpdate(
            ticket.targetId,
            {
                ...buildPublicationFields(PROBLEM_STATUS.PUBLISHED),
                approvalStatus: 'APPROVED',
                approvedBy: ticket.assignedTo
            },
            { new: true, session }
        );
        return `Problem "${problem.title}" has been published successfully.`;
    },

    // 2. BAN_USER: Deactivate user account
    BAN_USER: async (ticket, session) => {
        const user = await User.findByIdAndUpdate(
            ticket.targetId,
            { isActive: false },
            { new: true, session }
        );
        return `User "${user.username}" has been banned.`;
    },

    // 3. RESTORE_USER: Reactivate user account
    RESTORE_USER: async (ticket, session) => {
        const user = await User.findByIdAndUpdate(
            ticket.targetId,
            { isActive: true },
            { new: true, session }
        );
        return `User "${user.username}" has been restored.`;
    },

    // 4. ADD_CONTEST: Publish and approve contest
    ADD_CONTEST: async (ticket, session) => {
        const Contest = require('../models/Contest');
        const contest = await Contest.findByIdAndUpdate(
            ticket.targetId,
            {
                isPublished: true,
                approvalStatus: 'APPROVED',
                approvedBy: ticket.assignedTo,
                status: 'SCHEDULED' // Ensure it's scheduled
            },
            { new: true, session }
        );
        return `Contest "${contest.title}" has been published and scheduled.`;
    },

    // 5. EDIT_PROBLEM: For now, just mark approved. Actual edits might be applied if metadata contains payload.
    // Assuming 'EDIT_PROBLEM' means approving an edit request.
    EDIT_PROBLEM: async (ticket, session) => {
        // Logic could be: Apply changes from ticket.metadata to targetId
        if (ticket.metadata && ticket.metadata.updates) {
            const problem = await Problem.findByIdAndUpdate(
                ticket.targetId,
                ticket.metadata.updates,
                { new: true, session }
            );
            return `Updates applied to problem "${problem.title}".`;
        }
        return `Edit request approved.`;
    }
};

module.exports = actionExecutor;
