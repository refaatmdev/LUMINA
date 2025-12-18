import { Puck, type Config, type Data } from "@measured/puck";
import "@measured/puck/dist/index.css";

interface EditorCanvasProps {
    config: Config<any>;
    initialData: Data;
    onPublish: (data: Data) => void;
    onChange: (data: Data) => void;
    onPreview?: () => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ config, initialData, onPublish, onChange }) => {
    return (
        <div className="flex-1 relative z-10 w-full h-full">
            <Puck
                config={config}
                data={initialData}
                onPublish={async (data) => {
                    onPublish(data);
                }}
                onChange={onChange}
            />
        </div>
    );
};
