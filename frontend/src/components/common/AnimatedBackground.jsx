import React, { useEffect, useRef } from 'react';

/**
 * AnimatedBackground — Canvas-based floating particles + gradient mesh.
 * Renders behind all content with pointer-events:none.
 * Performance-optimized: requestAnimationFrame, reduced particles.
 */
const AnimatedBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create particles
        const PARTICLE_COUNT = 40;
        const colors = [
            'rgba(99, 102, 241, 0.4)',   // indigo
            'rgba(249, 115, 22, 0.35)',   // orange
            'rgba(139, 92, 246, 0.3)',    // purple
            'rgba(16, 185, 129, 0.3)',    // emerald
            'rgba(59, 130, 246, 0.3)',    // blue
        ];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 2.5 + 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.01 + Math.random() * 0.02
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connecting lines between close particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(99, 102, 241, ${0.06 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += p.pulseSpeed;

                // Wrap around edges
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.y < -10) p.y = canvas.height + 10;
                if (p.y > canvas.height + 10) p.y = -10;

                const scale = 1 + Math.sin(p.pulse) * 0.4;
                const r = p.radius * scale;

                // Glow
                ctx.beginPath();
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.fillStyle = p.color;
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.fill();
            });

            animId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.6
            }}
        />
    );
};

export default AnimatedBackground;
