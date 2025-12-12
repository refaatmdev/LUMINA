

export default function LoadingSpinner({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center h-full ${className}`}>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}
