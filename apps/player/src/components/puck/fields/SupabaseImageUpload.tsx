import React from 'react';
import { MediaPicker } from './MediaPicker';

interface SupabaseImageUploadProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    readOnly?: boolean;
}

export const SupabaseImageUpload: React.FC<SupabaseImageUploadProps> = ({ value, onChange, label, readOnly }) => {
    return (
        <MediaPicker
            value={value}
            onChange={onChange}
            label={label}
            type="image"
            maxSizeMB={5} // Default for images
            readOnly={readOnly}
        />
    );
};
