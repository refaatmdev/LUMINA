import { useEffect } from 'react';
import { supabase } from '@lumina/shared/lib';
import { useUserRole } from './useUserRole';

export function useSystemCommands() {
    const { orgId } = useUserRole();

    useEffect(() => {
        const channel = supabase
            .channel('system_commands')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'system_commands',
                },
                (payload) => {
                    const command = payload.new;
                    console.log('Received system command:', command);

                    if (command.command === 'reload_all') {
                        // Add jitter to prevent thundering herd
                        const jitter = Math.random() * 5000; // 0-5 seconds
                        console.log(`Global reload triggered. Reloading in ${jitter}ms...`);

                        setTimeout(() => {
                            window.location.reload();
                        }, jitter);
                    } else if (command.command === 'reload_org' && command.target_id === orgId) {
                        console.log('Org reload triggered. Reloading...');
                        window.location.reload();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orgId]);
}
