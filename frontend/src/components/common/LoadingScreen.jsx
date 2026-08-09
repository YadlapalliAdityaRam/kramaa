import './LoadingScreen.css';

const LoadingScreen = ({ message = 'Preparing your workspace' }) => (
    <div className="loading-screen" role="status" aria-live="polite">
        <div className="ls-content">
            {/* Opacity belongs to ls-content; the nested mark owns the bounce transform so the two animations do not conflict. */}
            <div className="ls-mark-layer" aria-hidden="true"><div className="ls-mark">K</div></div>
            <div className="ls-progress" aria-hidden="true"><span /></div>
            <p className="ls-message">{message}</p>
        </div>
    </div>
);

export default LoadingScreen;
