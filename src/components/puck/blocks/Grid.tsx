import { DropZone } from "@measured/puck";
import type { ComponentConfig } from "@measured/puck";
import { baseOptions, BaseWrapper } from "../baseOptions";

export interface GridProps {
    columns: number;
    gap: number;
    [key: string]: any;
}

export const Grid: ComponentConfig<GridProps> = {
    fields: {
        ...(baseOptions as any),
        columns: {
            type: "radio",
            label: "Columns",
            options: [
                { label: "2", value: 2 },
                { label: "3", value: 3 },
                { label: "4", value: 4 },
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
        columns: 2,
        gap: 0,
        padding: '0px',
    },
    render: ({ columns, gap, ...props }) => {
        return (
            <BaseWrapper
                {...props}
                className="w-full"
            >
                <div
                    className="grid w-full"
                    style={{
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gap: `${gap}px`,
                        margin: '0px',
                    }}
                >
                    {Array.from({ length: columns }).map((_, index) => (
                        <div key={index} className="flex flex-col min-h-[100px] border border-dashed border-gray-300 rounded  bg-gray-50/50">
                            <DropZone zone={`column-${index}`} />
                        </div>
                    ))}
                </div>
            </BaseWrapper>
        );
    },
};
