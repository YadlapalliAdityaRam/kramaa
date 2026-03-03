import React from 'react';
import './BitManipulationCanvas.css';

const clampByte = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(255, Math.round(numeric)));
};

const toBinary8 = (value) => clampByte(value).toString(2).padStart(8, '0');

const normalizeBinary = (binary, fallbackNumber) => {
    if (typeof binary === 'string' && /^[01]{8}$/.test(binary)) {
        return binary;
    }
    return toBinary8(fallbackNumber);
};

const normalizeBitIndex = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    const rounded = Math.round(numeric);
    if (rounded < 0 || rounded > 7) return null;
    return rounded;
};

const getChangedColumns = (previousBinary, currentBinary) => {
    if (!previousBinary || !currentBinary) return [];
    const changed = [];
    for (let i = 0; i < 8; i += 1) {
        if (previousBinary[i] !== currentBinary[i]) changed.push(i);
    }
    return changed;
};

const formatOperation = (operation) => {
    if (!operation) return 'Bit Operation';
    return operation
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const BitRow = ({ label, value, binary, activeBit, changedColumns = [], mode = 'number' }) => (
    <div className="bit-row">
        <div className="bit-row-label">
            <span>{label}</span>
            {Number.isFinite(Number(value)) && <strong>{Number(value)}</strong>}
        </div>
        <div className="bit-cells">
            {binary.split('').map((bit, index) => {
                const bitPosition = 7 - index;
                const isActive = activeBit === bitPosition;
                const isChanged = changedColumns.includes(index);
                const isOne = bit === '1';

                return (
                    <div
                        key={`${mode}-${index}`}
                        className={[
                            'bit-cell',
                            isOne ? 'on' : 'off',
                            isActive ? 'active' : '',
                            isChanged ? 'changed' : '',
                            mode === 'mask' ? 'mask' : ''
                        ].filter(Boolean).join(' ')}
                        title={`Bit ${bitPosition}`}
                    >
                        <span className="bit-position">{bitPosition}</span>
                        <span className="bit-value">{bit}</span>
                    </div>
                );
            })}
        </div>
    </div>
);

const BitManipulationCanvas = ({ step }) => {
    const activeBit = normalizeBitIndex(step?.bitIndex);
    const currentNumber = clampByte(step?.number ?? 0);
    const currentBinary = normalizeBinary(step?.binary, currentNumber);
    const previousNumber = step?.previousNumber;
    const previousBinary = previousNumber === null || previousNumber === undefined
        ? null
        : normalizeBinary(step?.previousBinary, previousNumber);
    const maskNumber = clampByte(step?.mask ?? 0);
    const maskBinary = normalizeBinary(step?.maskBinary, maskNumber);
    const changedColumns = getChangedColumns(previousBinary, currentBinary);
    const operationLabel = formatOperation(step?.operation);

    return (
        <div className="bit-canvas">
            <div className="bit-header">
                <div className="bit-operation">{operationLabel}</div>
                {step?.resultText && <div className="bit-result">{step.resultText}</div>}
            </div>

            <div className="bit-grid-wrapper">
                <BitRow
                    label="Number"
                    value={currentNumber}
                    binary={currentBinary}
                    activeBit={activeBit}
                    changedColumns={changedColumns}
                    mode="number"
                />

                {previousBinary && (
                    <BitRow
                        label="Previous"
                        value={previousNumber}
                        binary={previousBinary}
                        activeBit={activeBit}
                        mode="previous"
                    />
                )}

                <BitRow
                    label="Mask"
                    value={maskNumber}
                    binary={maskBinary}
                    activeBit={activeBit}
                    mode="mask"
                />
            </div>
        </div>
    );
};

export default BitManipulationCanvas;
