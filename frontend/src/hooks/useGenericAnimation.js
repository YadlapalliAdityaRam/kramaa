import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Generic animation hook that works with any step format (arrays, graphs, trees, DP tables).
 * Unlike useAnimation, this accepts pre-generated steps directly or a flexible generator.
 */
const useGenericAnimation = (steps) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);

    // Reset when steps change
    useEffect(() => {
        setCurrentStepIndex(0);
        setIsPlaying(false);
    }, [steps]);

    // Animation Loop
    useEffect(() => {
        if (isPlaying && steps.length > 0) {
            timerRef.current = setInterval(() => {
                setCurrentStepIndex((prev) => {
                    if (prev < steps.length - 1) {
                        return prev + 1;
                    } else {
                        setIsPlaying(false);
                        clearInterval(timerRef.current);
                        return prev;
                    }
                });
            }, 1000 / speed);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [isPlaying, speed, steps.length]);

    const play = useCallback(() => setIsPlaying(true), []);
    const pause = useCallback(() => setIsPlaying(false), []);

    const stepForward = useCallback(() => {
        pause();
        setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }, [steps.length, pause]);

    const stepBackward = useCallback(() => {
        pause();
        setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
    }, [pause]);

    const reset = useCallback(() => {
        pause();
        setCurrentStepIndex(0);
    }, [pause]);

    const setIndex = useCallback((index) => {
        pause();
        setCurrentStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
    }, [steps.length, pause]);

    const currentStep = steps[currentStepIndex] || {};

    return {
        currentStep,
        currentStepIndex,
        totalSteps: steps.length,
        isPlaying,
        speed,
        setSpeed,
        play,
        pause,
        stepForward,
        stepBackward,
        reset,
        setIndex
    };
};

export default useGenericAnimation;
