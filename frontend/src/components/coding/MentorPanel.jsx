import React, { useMemo, useState } from 'react';
import api from '../../utils/api';

const MentorPanel = ({ problem, code = '', submissionError = '' }) => {
    const [open, setOpen] = useState(false);
    const [response, setResponse] = useState(null);
    const [busy, setBusy] = useState(false);
    const [hintLevel, setHintLevel] = useState(0);
    const concepts = useMemo(() => [...new Set([...(problem?.topics || []), ...(problem?.tags || [])])], [problem]);
    const ask = async (intent) => {
        setBusy(true);
        try {
            const res = await api.post('/mentor/respond', { problemId: problem?._id, intent, code, error: submissionError, hintLevel });
            setResponse(res.data?.response);
            if (intent === 'hint') setHintLevel((value) => value + 1);
        } catch (error) { setResponse({ text: error.response?.data?.message || 'Mentor is unavailable right now.' }); }
        finally { setBusy(false); }
    };
    if (!problem) return null;
    return <aside style={{ position: 'fixed', right: 18, bottom: 18, width: 320, maxWidth: 'calc(100vw - 36px)', zIndex: 90, background: 'var(--ws-panel)', border: '1px solid var(--ws-border)', borderRadius: 12, boxShadow: '0 12px 35px rgba(0,0,0,.35)', padding: 14 }}>
        <button onClick={() => setOpen(!open)} style={{ width: '100%', background: 'none', border: 0, color: 'var(--ws-text)', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}>🧭 Kramaa Mentor {open ? '−' : '+'}</button>
        {open && <div style={{ marginTop: 12, fontSize: 12 }}>
            <div style={{ color: 'var(--ws-text-secondary)', marginBottom: 8 }}>Concepts used</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>{(concepts.length ? concepts : ['Add problem topics']).map((c) => <span key={c} style={{ padding: '4px 7px', borderRadius: 8, background: 'var(--ws-card)' }}>{c}</span>)}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['understand', 'approach', 'hint'].map((intent) => <button key={intent} disabled={busy} onClick={() => ask(intent)} style={{ padding: '6px 8px', borderRadius: 7, border: '1px solid var(--ws-border)', background: 'var(--ws-card)', color: 'var(--ws-text)', cursor: 'pointer' }}>{intent === 'hint' ? `💡 Hint ${hintLevel + 1}` : intent[0].toUpperCase() + intent.slice(1)}</button>)}
            </div>
            {response && <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, marginTop: 12, color: 'var(--ws-text-secondary)' }}>{response.text}</div>}
        </div>}
    </aside>;
};

export default MentorPanel;
