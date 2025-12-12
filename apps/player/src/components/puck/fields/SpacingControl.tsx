import React, { useEffect, useState } from 'react';
import { FieldLabel } from '@measured/puck';
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Maximize } from 'lucide-react';

interface SpacingControlProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    readOnly?: boolean;
}

export const SpacingControl: React.FC<SpacingControlProps> = ({ value, onChange, label, readOnly }) => {
    const [values, setValues] = useState({ top: '', right: '', bottom: '', left: '' });
    const [lock, setLock] = useState(false);

    useEffect(() => {
        if (!value) return;
        const parts = value.split(' ');
        if (parts.length === 1) {
            setValues({ top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] });
            setLock(true);
        } else if (parts.length === 2) {
            setValues({ top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] });
        } else if (parts.length === 4) {
            setValues({ top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] });
        }
    }, [value]);

    const handleChange = (side: keyof typeof values, val: string) => {
        const newValues = { ...values, [side]: val };

        if (lock) {
            newValues.top = val;
            newValues.right = val;
            newValues.bottom = val;
            newValues.left = val;
        }

        setValues(newValues);

        // Construct CSS string
        if (lock) {
            onChange(val);
        } else {
            onChange(`${newValues.top || '0px'} ${newValues.right || '0px'} ${newValues.bottom || '0px'} ${newValues.left || '0px'}`);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {label && <FieldLabel label={label} />}
            <div className="grid grid-cols-3 gap-2 items-center justify-items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                {/* Top */}
                <div className="col-start-2">
                    <div className="relative">
                        <ArrowUp size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={values.top}
                            onChange={(e) => handleChange('top', e.target.value)}
                            className="w-16 pl-6 pr-2 py-1 text-xs border border-gray-300 rounded text-center focus:border-indigo-500 outline-none"
                            placeholder="0px"
                            readOnly={readOnly}
                        />
                    </div>
                </div>

                {/* Left */}
                <div className="col-start-1 row-start-2">
                    <div className="relative">
                        <ArrowLeft size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={values.left}
                            onChange={(e) => handleChange('left', e.target.value)}
                            className="w-16 pl-6 pr-2 py-1 text-xs border border-gray-300 rounded text-center focus:border-indigo-500 outline-none"
                            placeholder="0px"
                            readOnly={readOnly}
                        />
                    </div>
                </div>

                {/* Center / Lock */}
                <div className="col-start-2 row-start-2 flex justify-center">
                    <button
                        onClick={() => setLock(!lock)}
                        className={`p-1.5 rounded transition-colors ${lock ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-200'}`}
                        title="Lock all sides"
                        disabled={readOnly}
                    >
                        <Maximize size={16} />
                    </button>
                </div>

                {/* Right */}
                <div className="col-start-3 row-start-2">
                    <div className="relative">
                        <ArrowRight size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={values.right}
                            onChange={(e) => handleChange('right', e.target.value)}
                            className="w-16 pl-6 pr-2 py-1 text-xs border border-gray-300 rounded text-center focus:border-indigo-500 outline-none"
                            placeholder="0px"
                            readOnly={readOnly}
                        />
                    </div>
                </div>

                {/* Bottom */}
                <div className="col-start-2 row-start-3">
                    <div className="relative">
                        <ArrowDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={values.bottom}
                            onChange={(e) => handleChange('bottom', e.target.value)}
                            className="w-16 pl-6 pr-2 py-1 text-xs border border-gray-300 rounded text-center focus:border-indigo-500 outline-none"
                            placeholder="0px"
                            readOnly={readOnly}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
