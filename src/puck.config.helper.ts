import type { Field } from "@measured/puck";

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

export const COMMON_STYLE_FIELDS: Record<string, Field<any>> = {
    backgroundColor: { type: "text", label: "Background Color (Hex/Name)" }, // type: "color" is not natively supported in all Puck versions, using text for flexibility
    textColor: { type: "text", label: "Text Color" },
    padding: { type: "text", label: "Padding (e.g. 20px or 2rem)" },
    borderRadius: { type: "number", label: "Border Radius (px)" },
    border: { type: "text", label: "Border (e.g. 1px solid black)" },
    boxShadow: {
        type: "select",
        label: "Shadow",
        options: [
            { label: "None", value: "none" },
            { label: "Small", value: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
            { label: "Medium", value: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
            { label: "Large", value: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
            { label: "X-Large", value: "0 20px 25px -5px rgb(0 0 0 / 0.1)" },
        ]
    },
    animation: {
        type: "select",
        options: ANIMATION_OPTIONS,
        label: "Animation"
    },
    animationDelay: { type: "number", label: "Animation Delay (ms)" },
};

export function restrictedField(field: Field<any>, plan: string): Field<any> | undefined {
    // If plan is free, we hide this field.
    // We assume this helper is ONLY called for restricted fields.
    // Base fields (content) should be added directly.
    if (plan === 'free') {
        return undefined;
    }
    return field;
}

export function getStyleFields(plan: string) {
    if (plan === 'free') return {};

    return COMMON_STYLE_FIELDS;
}
