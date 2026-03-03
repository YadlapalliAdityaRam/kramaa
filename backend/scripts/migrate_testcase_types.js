const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { isDeepStrictEqual } = require('util');
const Problem = require('../models/Problem');
const { normalizeAndValidateTestCases } = require('../utils/problemTestCaseValidator');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const parseArgs = () => {
    const args = process.argv.slice(2);
    const options = {
        dryRun: false,
        limit: null,
        backup: null
    };

    args.forEach((arg) => {
        if (arg === '--dry-run') {
            options.dryRun = true;
            return;
        }

        if (arg.startsWith('--limit=')) {
            const raw = Number(arg.split('=')[1]);
            if (Number.isFinite(raw) && raw > 0) {
                options.limit = Math.trunc(raw);
            }
            return;
        }

        if (arg.startsWith('--backup=')) {
            options.backup = arg.split('=')[1];
        }
    });

    return options;
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const countDiffs = (before, after) => {
    if (!Array.isArray(before) || !Array.isArray(after)) return 0;
    const len = Math.max(before.length, after.length);
    let changed = 0;
    for (let i = 0; i < len; i++) {
        if (!isDeepStrictEqual(before[i], after[i])) changed++;
    }
    return changed;
};

const run = async () => {
    const options = parseArgs();
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('Missing MONGODB_URI or MONGO_URI');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const query = Problem.find({}).select('+hiddenTestCases');
    if (options.limit) query.limit(options.limit);
    const problems = await query.lean();
    console.log(`Loaded ${problems.length} problems for migration.`);

    const bulkOps = [];
    const backupRows = [];

    const stats = {
        scannedProblems: 0,
        changedProblems: 0,
        changedSampleCases: 0,
        changedHiddenCases: 0,
        invalidProblems: 0,
        invalidCases: 0
    };

    for (const problem of problems) {
        stats.scannedProblems += 1;

        const sampleBefore = clone(problem.sampleTestCases || []);
        const hiddenBefore = clone(problem.hiddenTestCases || []);

        const sampleResult = normalizeAndValidateTestCases(sampleBefore, {
            parameters: problem.parameters || [],
            returnType: problem.returnType,
            allowCoercion: true,
            allowPositionalInput: true,
            allowLegacySingleParameterWrap: true,
            fieldPrefix: 'sampleTestCases'
        });
        const hiddenResult = normalizeAndValidateTestCases(hiddenBefore, {
            parameters: problem.parameters || [],
            returnType: problem.returnType,
            allowCoercion: true,
            allowPositionalInput: true,
            allowLegacySingleParameterWrap: true,
            fieldPrefix: 'hiddenTestCases'
        });

        const issues = [...sampleResult.issues, ...hiddenResult.issues];
        if (issues.length > 0) {
            stats.invalidProblems += 1;
            stats.invalidCases += issues.length;
            console.warn(`Skipped invalid problem ${problem.slug || problem._id}: ${issues.length} issues`);
            continue;
        }

        const sampleAfter = sampleResult.normalizedTestCases;
        const hiddenAfter = hiddenResult.normalizedTestCases;

        const sampleChanges = countDiffs(sampleBefore, sampleAfter);
        const hiddenChanges = countDiffs(hiddenBefore, hiddenAfter);
        if (sampleChanges === 0 && hiddenChanges === 0) continue;

        stats.changedProblems += 1;
        stats.changedSampleCases += sampleChanges;
        stats.changedHiddenCases += hiddenChanges;

        backupRows.push({
            _id: problem._id,
            slug: problem.slug,
            before: {
                sampleTestCases: sampleBefore,
                hiddenTestCases: hiddenBefore
            },
            after: {
                sampleTestCases: sampleAfter,
                hiddenTestCases: hiddenAfter
            }
        });

        bulkOps.push({
            updateOne: {
                filter: { _id: problem._id },
                update: {
                    $set: {
                        sampleTestCases: sampleAfter,
                        hiddenTestCases: hiddenAfter
                    }
                }
            }
        });
    }

    if (options.backup && backupRows.length > 0) {
        const backupPath = path.resolve(process.cwd(), options.backup);
        fs.writeFileSync(backupPath, JSON.stringify(backupRows, null, 2), 'utf8');
        console.log(`Backup written: ${backupPath}`);
    }

    if (!options.dryRun && bulkOps.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < bulkOps.length; i += chunkSize) {
            const chunk = bulkOps.slice(i, i + chunkSize);
            // ordered:false ensures one bad doc doesn't stop remaining writes.
            await Problem.bulkWrite(chunk, { ordered: false });
        }
    }

    console.log('Migration summary:');
    console.log(JSON.stringify({
        ...stats,
        writesPlanned: bulkOps.length,
        dryRun: options.dryRun
    }, null, 2));

    await mongoose.disconnect();
    process.exit(0);
};

run().catch(async (error) => {
    console.error('Migration failed:', error);
    try {
        await mongoose.disconnect();
    } catch {
        // ignore
    }
    process.exit(1);
});
