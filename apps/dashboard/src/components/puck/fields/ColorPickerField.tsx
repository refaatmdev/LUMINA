import React from 'react';
import { HexColorPicker } from 'react-colorful';
import * as Popover from '@radix-ui/react-popover';
import { FieldLabel } from '@measured/puck';

interface ColorPickerFieldProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    readOnly?: boolean;
}

export const ColorPickerField: React.FC<ColorPickerFieldProps> = ({ value, onChange, label, readOnly }) => {
    const color = value || '#ffffff';

    return (
        <div className="flex flex-col gap-2">
            {label && <FieldLabel label={label} />}
            <div className="flex items-center gap-2">
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <button
                            className="w-10 h-10 rounded-full border border-gray-300 shadow-sm cursor-pointer transition-transform hover:scale-105 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            style={{ backgroundColor: color }}
                            disabled={readOnly}
                            aria-label="Pick color"
                        />
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content className="z-[9999] bg-white p-3 rounded-xl shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200" sideOffset={5}>
                            <HexColorPicker color={color} onChange={onChange} />
                            <Popover.Arrow className="fill-white" />
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
};
