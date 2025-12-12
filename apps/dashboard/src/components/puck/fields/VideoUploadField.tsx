import React from 'react';
import { MediaPicker } from './MediaPicker';

interface VideoUploadFieldProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    maxSizeMB?: number;
    readOnly?: boolean;
}

export const VideoUploadField: React.FC<VideoUploadFieldProps> = ({
    value,
    onChange,
    label,
    maxSizeMB = 20, // Default to 20MB if not specified
    readOnly
}) => {
    return (
        <MediaPicker
            value={value}
            onChange={onChange}
            label={label}
            type="video"
            maxSizeMB={maxSizeMB}
            readOnly={readOnly}
        />
    );
};
