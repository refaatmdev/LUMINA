import { DropZone } from "@measured/puck";
import type { ComponentConfig } from "@measured/puck";
import { baseOptions, BaseWrapper } from "../baseOptions";

export interface FlexContainerProps {
    direction: 'row' | 'column';
    alignItems: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
    gap: number;
    [key: string]: any;
}

export const FlexContainer: ComponentConfig<FlexContainerProps> = {
    fields: {
        ...(baseOptions as any),
        direction: {
            type: "radio",
            label: "Direction",
            options: [
                { label: "Row", value: "row" },
                { label: "Column", value: "column" },
            ],
        },
        alignItems: {
            type: "select",
            label: "Align Items",
            options: [
                { label: "Start", value: "flex-start" },
                { label: "Center", value: "center" },
                { label: "End", value: "flex-end" },
                { label: "Stretch", value: "stretch" },
            ],
        },
        justifyContent: {
            type: "select",
            label: "Justify Content",
            options: [
                { label: "Start", value: "flex-start" },
                { label: "Center", value: "center" },
                { label: "End", value: "flex-end" },
                { label: "Space Between", value: "space-between" },
                { label: "Space Around", value: "space-around" },
            ],
        },
        gap: {
            type: "number",
            label: "Gap (px)",
            min: 0,
            max: 100,
        },
    },
    defaultProps: {
        direction: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 20,
        padding: '20px',
    },
    render: ({ direction, alignItems, justifyContent, gap, ...props }) => {
        return (
            <BaseWrapper
                {...props}
                className="w-full min-h-[100px] border border-dashed border-gray-300 rounded p-2 bg-gray-50/50"
            >
                <div
                    className="flex w-full h-full"
                    style={{
                        flexDirection: direction,
                        alignItems,
                        justifyContent,
                        gap: `${gap}px`,
                    }}
                >
                    <DropZone zone="content" />
                </div>
            </BaseWrapper>
        );
    },
};
