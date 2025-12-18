import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { Calendar, Clock, Trash2, Plus, Save, X } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Schedule {
    id: string;
    playlist_id: string;
    start_time: string;
    end_time: string;
    days_of_week: number[];
    priority: number;
    playlists: {
        name: string;
    };
}

interface Playlist {
    id: string;
    name: string;
}

interface ScheduleManagerProps {
    targetType: 'screen' | 'group';
    targetId: string;
}

const DAYS = [
    { id: 0, label: 'Sun' },
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
];

export default function ScheduleManager({ targetType, targetId }: ScheduleManagerProps) {
    const { orgId } = useUserRole();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form State
    const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('17:00');
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default

    useEffect(() => {
        if (orgId && targetId) {
            fetchData();
        }
    }, [orgId, targetId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Schedules
            const { data: scheduleData, error: scheduleError } = await supabase
                .from('schedules')
                .select(`
                    *,
                    playlists (
                        name
                    )
                `)
                .eq('target_type', targetType)
                .eq('target_id', targetId)
                .order('start_time');

            if (scheduleError) throw scheduleError;
            setSchedules(scheduleData || []);

            // Fetch Playlists
            const { data: playlistData, error: playlistError } = await supabase
                .from('playlists')
                .select('id, name')
                .eq('org_id', orgId)
                .order('name');

            if (playlistError) throw playlistError;
            setPlaylists(playlistData || []);

        } catch (error) {
            console.error('Error fetching schedule data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSchedule = async () => {
        if (!selectedPlaylistId || !orgId) return;

        try {
            const { error } = await supabase
                .from('schedules')
                .insert({
                    org_id: orgId,
                    target_type: targetType,
                    target_id: targetId,
                    playlist_id: selectedPlaylistId,
                    start_time: startTime,
                    end_time: endTime,
                    days_of_week: selectedDays,
                    priority: 1 // Default priority
                });

            if (error) throw error;

            setShowAddForm(false);
            fetchData();

            // Reset form
            setSelectedPlaylistId('');
            setStartTime('08:00');
            setEndTime('17:00');
            setSelectedDays([1, 2, 3, 4, 5]);

        } catch (error) {
            console.error('Error adding schedule:', error);
            alert('Failed to add schedule');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;
        try {
            const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting schedule:', error);
        }
    };

    const toggleDay = (dayId: number) => {
        setSelectedDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId].sort()
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Calendar size={20} className="text-primary" />
                    Weekly Schedule
                </h3>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Plus size={16} />
                    Add Rule
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-muted/30 border border-border rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-foreground">New Schedule Rule</h4>
                        <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Playlist</label>
                            <select
                                value={selectedPlaylistId}
                                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
                            >
                                <option value="">Select a playlist...</option>
                                {playlists.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Start Time</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">End Time</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2">Days Active</label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map(day => (
                                    <button
                                        key={day.id}
                                        onClick={() => toggleDay(day.id)}
                                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all border-2 ${selectedDays.includes(day.id)
                                            ? 'bg-primary text-primary-foreground border-primary-foreground shadow-md scale-105'
                                            : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                                            }`}
                                    >
                                        {day.label[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={handleAddSchedule}
                                disabled={!selectedPlaylistId || selectedDays.length === 0}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={16} />
                                Save Rule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule List */}
            <div className="space-y-3">
                {schedules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                        <Clock size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No schedule rules set.</p>
                        <p className="text-xs opacity-70 mt-1">Content will play from the default playlist.</p>
                    </div>
                ) : (
                    schedules.map(schedule => (
                        <div key={schedule.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between group">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-foreground">{schedule.playlists?.name}</span>
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                        {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    {DAYS.map(day => (
                                        <span
                                            key={day.id}
                                            className={`text-[10px] uppercase font-bold ${schedule.days_of_week.includes(day.id)
                                                ? 'text-primary'
                                                : 'text-muted-foreground/30'
                                                }`}
                                        >
                                            {day.label[0]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(schedule.id)}
                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-destructive/10 rounded-lg"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
