import React from 'react';
import { Monitor, Wifi, WifiOff, Layers, Layout, AlertTriangle, Calendar, Trash2, FolderInput } from 'lucide-react';
import type { Screen } from '../api/dashboard';
import { useDeleteScreen, useUpdateScreen } from '../api/dashboard';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface ScreenCardProps {
    screen: Screen;
    onOpenMoveModal: (screenId: string, groupId: string | null) => void;
    onOpenScheduleModal: (screenId: string, screenName: string) => void;
}

export const ScreenCard: React.FC<ScreenCardProps> = ({ screen, onOpenMoveModal, onOpenScheduleModal }) => {
    const deleteMutation = useDeleteScreen();
    const updateMutation = useUpdateScreen();

    const isOnline = screen.last_ping && (new Date().getTime() - new Date(screen.last_ping).getTime() < 120000);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this screen? This action cannot be undone.')) {
            deleteMutation.mutate(screen.id);
        }
    };

    const handleStopUrgent = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateMutation.mutate({
            id: screen.id,
            updates: { urgent_slide_id: null, urgent_starts_at: null, urgent_expires_at: null }
        });
    };

    const handleStopOverride = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateMutation.mutate({
            id: screen.id,
            updates: { active_slide_id: null }
        });
    };

    return (
        <div className="relative glass-panel rounded-xl padding-6 group hover:border-primary/30 transition-all duration-300 p-2">
            <button
                onClick={handleDelete}
                className="absolute -right-3 -top-3 glass-panel text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-full shadow-lg z-10 transition-all duration-200"
                title="Delete Screen"
            >
                <Trash2 size={16} />
            </button>

            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/20 rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                    <Monitor className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                    {screen.urgent_slide_id && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                            <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />
                            <span className="text-xs font-bold text-red-500 text-glow">URGENT AD</span>
                        </div>
                    )}
                    {screen.active_slide_id && !screen.urgent_slide_id && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_currentColor]" />
                            <span className="text-xs font-medium text-primary">Manual Override</span>
                        </div>
                    )}
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full",
                        isOnline
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-400'
                    )}>
                        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        <span className="text-xs font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight">{screen.name}</h3>
            <div className="flex items-center gap-2 mb-4">
                {screen.screen_groups ? (
                    <span className="text-sm text-primary bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1 border border-primary/20">
                        <Layers className="w-3 h-3" />
                        {screen.screen_groups.name}
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground"></span>
                )}
                {screen.active_slide_id && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Layout className="w-3 h-3" />
                        <span className="text-sm text-muted-foreground">active slide : </span>

                        {screen.slides?.name || 'Unknown Slide'}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    ID: <span className="text-foreground">{screen.pairing_code}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {screen.urgent_slide_id && (
                        <button
                            onClick={handleStopUrgent}
                            className="flex-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors px-3 py-2 rounded-lg shadow-[0_0_10px_rgba(220,38,38,0.4)] flex items-center justify-center gap-1.5"
                        >
                            <AlertTriangle size={12} />
                            STOP URGENT
                        </button>
                    )}
                    {screen.active_slide_id && (
                        <button
                            onClick={handleStopOverride}
                            className="flex-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors px-3 py-2 rounded-lg flex items-center justify-center gap-1.5"
                        >
                            Stop Override
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenScheduleModal(screen.id, screen.name);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-colors px-3 py-2 rounded-lg"
                    >
                        <Calendar size={14} />
                        Schedule
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenMoveModal(screen.id, screen.group_id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition-colors px-3 py-2 rounded-lg"
                    >
                        <FolderInput className="w-3 h-3" />
                        Move
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/player/${screen.id}`, '_blank');
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted hover:bg-muted/80 border border-border transition-colors px-3 py-2 rounded-lg"
                    >
                        Manage
                    </button>
                </div>
            </div>
        </div>
    );
};
