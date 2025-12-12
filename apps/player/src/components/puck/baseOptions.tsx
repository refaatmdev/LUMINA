import React from 'react';
import type { Field } from "@measured/puck";
import { ColorPickerField } from "./fields/ColorPickerField";
import { SpacingControl } from "./fields/SpacingControl";

export const ANIMATION_OPTIONS = [
    { label: "None", value: "none" },
    { label: "Fade In", value: "fade-in" },
    { label: "Slide Up", value: "slide-up" },
    { label: "Slide Down", value: "slide-down" },
    { label: "Slide Left", value: "slide-left" },
    { label: "Slide Right", value: "slide-right" },
    { label: "Zoom In", value: "zoom-in" },
    { label: "Bounce", value: "bounce" },
];

export const baseOptions = {
    id: {
        type: "text",
        label: "ID (Optional)",
    } as Field<string>,

    animation: {
        type: "select",
        label: "Animation",
        options: ANIMATION_OPTIONS,
    } as Field<string>,

    animationDelay: {
        type: "number",
        label: "Animation Delay (ms)",
    } as Field<number>,

    backgroundColor: {
        type: "custom",
        label: "Background Color",
        render: ({ value, onChange, field }: { value: string, onChange: (val: string) => void, field: Field<string> }) => (
            <ColorPickerField value={value} onChange={onChange} label={field.label} />
        ),
    } as Field<string>,

    padding: {
        type: "custom",
        label: "Padding",
        render: ({ value, onChange, field }: { value: any, onChange: (val: any) => void, field: Field<any> }) => (
            <SpacingControl value={value} onChange={onChange} label={field.label} />
        ),
    } as Field<string>,

    width: {
        type: "text",
        label: "Width (e.g. 100%, 500px)",
    } as Field<string>,

    height: {
        type: "text",
        label: "Height (e.g. auto, 300px)",
    } as Field<string>,

    visibility: {
        type: "array",
        label: "Visibility",
        arrayFields: {
            device: {
                type: "select",
                options: [
                    { label: "Mobile", value: "mobile" },
                    { label: "Tablet", value: "tablet" },
                    { label: "Desktop", value: "desktop" },
                    { label: "TV", value: "tv" },
                ]
            },
            hidden: {
                type: "radio",
                label: "Hidden",
                options: [
                    { label: "Yes", value: true },
                    { label: "No", value: false },
                ],
            }
        }
    } as Field<any[]>, // Simplified for now, or we can use a custom "VisibilityControl" later
};

// Helper to get style props from base options
export const getBaseStyleProps = (props: any) => ({
    backgroundColor: props.backgroundColor,
    padding: props.padding,
    width: props.width,
    height: props.height,
    animationDelay: props.animationDelay ? `${props.animationDelay}ms` : undefined,
    // Visibility logic would be handled by classNames or media queries
});

export const BaseWrapper = ({ children, className = "", style, ...props }: any): React.ReactElement => {
    const animationClass = props.animation && props.animation !== 'none' ? `animate-${props.animation}` : '';

    return (
        <div
            id={props.id}
            className={`${className} ${animationClass}`}
            style={{
                ...getBaseStyleProps(props),
                ...style, // Allow overriding or adding styles from parent
            }}
        >
            {children}
        </div>
    );
};
