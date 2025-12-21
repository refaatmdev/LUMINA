import { useState } from 'react';
import { useAuthStore } from '../../../store/auth-store';

import { useScreens, useAnnouncements, useUpdateScreen, useScreenGroups } from '../api/dashboard';
import { ScreenCard } from './ScreenCard';
import { AddScreenModal } from './AddScreenModal';
import { MainLayout } from '../../layout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Button } from '../../../components/ui/Button';
import { Megaphone, Plus, AlertTriangle, Monitor, X } from 'lucide-react';
import { usePlanLimits } from '../../../hooks/usePlanLimits';

import ScreenGroupsTab from '../../../components/admin/ScreenGroupsTab';
import UrgentAdModal from '../../../components/admin/UrgentAdModal';
import ScheduleManager from '../../../components/admin/ScheduleManager';

export const DashboardPage = () => {
    const { orgId } = useAuthStore();
    const { planTier, currentScreenCount, maxScreens } = usePlanLimits();

    const [activeTab, setActiveTab] = useState<'screens' | 'groups'>('screens');
    const [showPairModal, setShowPairModal] = useState(false);
    const [showUrgentAdModal, setShowUrgentAdModal] = useState(false);
    const [dismissedAnnouncement, setDismissedAnnouncement] = useState(false);

    // Move Modal
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');

    // Schedule Modal
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleTarget, setScheduleTarget] = useState<{ id: string, name: string, type: 'screen' | 'group' } | null>(null);

    // Queries
    const { data: screens, isLoading: screensLoading, refetch: refetchScreens } = useScreens(orgId);
    const { data: announcement } = useAnnouncements(planTier);

    // Mutations
    const updateScreenMutation = useUpdateScreen();

    const handleMoveScreen = async () => {
        if (!selectedScreenId) return;
        try {
            await updateScreenMutation.mutateAsync({
                id: selectedScreenId,
                updates: { group_id: selectedGroupId === '' ? null : selectedGroupId }
            });
            setShowMoveModal(false);
            refetchScreens();
        } catch (error) {
            console.error(error);
            alert('Failed to move screen');
        }
    };

    const handleOpenMoveModal = (screenId: string, groupId: string | null) => {
        setSelectedScreenId(screenId);
        setSelectedGroupId(groupId || '');
        setShowMoveModal(true);
    };

    const handleOpenScheduleModal = (screenId: string, screenName: string) => {
        setScheduleTarget({ id: screenId, name: screenName, type: 'screen' });
        setShowScheduleModal(true);
    };

    return (
        <MainLayout
            title="Screens"
            actions={
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border">
                        <Monitor size={14} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                            {currentScreenCount} / {maxScreens} Screens
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setShowUrgentAdModal(true)}
                            variant="danger"
                            className="flex items-center gap-1.5"
                        >
                            <AlertTriangle size={16} />
                            <span className="text-sm font-medium">Urgent Ad</span>
                        </Button>
                        <Button
                            onClick={() => setShowPairModal(true)}
                            disabled={currentScreenCount >= maxScreens}
                            variant="primary"
                            className="flex items-center gap-1.5"
                            title={currentScreenCount >= maxScreens ? "Screen limit reached" : "Add a new screen"}
                        >
                            <Plus size={16} />
                            <span className="text-sm font-medium">Add Screen</span>
                        </Button>
                    </div>
                </div>
            }
        >
            {/* Announcement Banner */}
            {announcement && !dismissedAnnouncement && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 bg-${announcement.bg_color}-500/10 border border-${announcement.bg_color}-500/20`}>
                    <div className={`p-2 rounded-lg bg-${announcement.bg_color}-500/20 text-${announcement.bg_color}-500`}>
                        <Megaphone size={20} />
                    </div>
                    <div className="flex-1">
                        <h3 className={`font-bold text-${announcement.bg_color}-500`}>Announcement</h3>
                        <p className="text-muted-foreground text-sm mt-0.5">{announcement.message}</p>
                    </div>
                    <button
                        onClick={() => setDismissedAnnouncement(true)}
                        className={`text-${announcement.bg_color}-500/60 hover:text-${announcement.bg_color}-500`}
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border mb-6">
                <button
                    className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'screens' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('screens')}
                >
                    All Screens
                    {activeTab === 'screens' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                </button>
                <button
                    className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'groups' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('groups')}
                >
                    Screen Groups
                    {activeTab === 'groups' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'groups' ? (
                <ScreenGroupsTab />
            ) : (
                <>
                    {screensLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : screens?.length === 0 ? (
                        <div className="text-center py-16 bg-card rounded-xl border border-border shadow-sm">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Monitor size={32} className="text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No screens found</h3>
                            <p className="text-muted-foreground mt-1 mb-6">Get started by pairing your first screen.</p>
                            <Button
                                onClick={() => setShowPairModal(true)}
                                variant="ghost"
                                className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
                            >
                                <Plus size={18} className="mr-1" />
                                Add Screen
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {screens?.map((screen) => (
                                <ScreenCard
                                    key={screen.id}
                                    screen={screen}
                                    onOpenMoveModal={handleOpenMoveModal}
                                    onOpenScheduleModal={handleOpenScheduleModal}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {showPairModal && (
                <AddScreenModal onClose={() => setShowPairModal(false)} />
            )}

            {/* Urgent Ad Modal */}
            {showUrgentAdModal && (
                <UrgentAdModal
                    onClose={() => setShowUrgentAdModal(false)}
                    onSuccess={() => refetchScreens()}
                />
            )}

            {showScheduleModal && scheduleTarget && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
                    <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-2xl transform transition-all scale-100 border border-border max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Manage Schedule</h3>
                                <p className="text-sm text-muted-foreground mt-1">Set time-based rules for {scheduleTarget.name}</p>
                            </div>
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg transition-colors"
                            >
                                <Plus size={20} className="transform rotate-45" />
                            </button>
                        </div>
                        <ScheduleManager targetType={scheduleTarget.type} targetId={scheduleTarget.id} />
                    </div>
                </div>
            )}

            <MoveScreenModal
                show={showMoveModal}
                onClose={() => setShowMoveModal(false)}
                onMove={handleMoveScreen}
                selectedGroupId={selectedGroupId}
                setSelectedGroupId={setSelectedGroupId}
                orgId={orgId}
            />
        </MainLayout>
    );
};

const MoveScreenModal = ({ show, onClose, onMove, selectedGroupId, setSelectedGroupId, orgId }: any) => {
    const { data: groups } = useScreenGroups(orgId);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100 border border-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-foreground">Move Screen</h3>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg transition-colors"
                    >
                        <Plus size={20} className="transform rotate-45" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Select Group</label>
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
                        >
                            <option value="">No Group (Ungrouped)</option>
                            {groups?.map((group: any) => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 text-muted-foreground hover:bg-muted rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onMove}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium shadow-sm hover:shadow transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
