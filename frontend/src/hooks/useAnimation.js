import { useState, useEffect, useRef, useCallback } from 'react';

const useAnimation = (generateSteps, initialArray) => {
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1); // 1x speed default (1000ms delay / speed)
    const timerRef = useRef(null);
    const generateStepsRef = useRef(generateSteps);

    // Keep ref in sync without triggering useEffect
    useEffect(() => {
        generateStepsRef.current = generateSteps;
    });

    // Initialize steps when array changes (use stringified array as stable dep)
    const arrayKey = JSON.stringify(initialArray);
    useEffect(() => {
        if (initialArray && initialArray.length > 0) {
            const generatedSteps = generateStepsRef.current(initialArray);
            setSteps(generatedSteps);
            setCurrentStepIndex(0);
            setIsPlaying(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [arrayKey]);

    // Animation Loop
    useEffect(() => {
        if (isPlaying) {
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

    // Controls
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

    const setStep = useCallback((index) => {
        pause();
        setCurrentStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
    }, [steps.length, pause]);

    // Derived State for UI
    const currentStep = steps[currentStepIndex] || {};
    const currentArray = currentStep.arraySnapshot || initialArray;

    // Helper to extract indices for coloring
    const getIndices = () => {
        if (!currentStep.type) return { compare: [], active: [], sorted: [] };

        // This logic would need to accumulate 'sorted' indices over time if we don't store them in snapshot
        // But for simplicity, let's just return what the current step highlights.
        // Getting accumulative sorted indices might require more complex state or inspecting past steps.
        // For now, let's just highlight current interaction.

        return {
            compare: currentStep.type === 'compare' ? currentStep.indices : [],
            active: currentStep.type === 'swap' ? currentStep.indices : [],
            sorted: currentStep.type === 'sorted' ? currentStep.indices : []
        };
    };

    return {
        currentArray,
        currentStep,
        currentStepIndex,
        steps,
        totalSteps: steps.length,
        isPlaying,
        speed,
        setSpeed,
        play,
        pause,
        stepForward,
        stepBackward,
        reset,
        setStep, // For scrubber
        getIndices
    };
};

export default useAnimation;
