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
    backgroundColor: { type: "text", label: "Background Color" }, // Could use a color picker custom field
    textColor: { type: "text", label: "Text Color" },
    padding: { type: "text", label: "Padding (e.g. 20px)" },
    borderRadius: { type: "text", label: "Border Radius (e.g. 8px)" },
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
