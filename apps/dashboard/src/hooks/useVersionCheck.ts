import { useState, useEffect } from 'react';

export function useVersionCheck() {
    const [, setCurrentVersion] = useState<number | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        // Fetch initial version
        fetch('/version.json?t=' + Date.now())
            .then(res => res.json())
            .then(data => {
                setCurrentVersion(data.version);
            })
            .catch(err => console.error('Failed to fetch initial version:', err));

        // Poll for updates
        const interval = setInterval(() => {
            fetch('/version.json?t=' + Date.now())
                .then(res => res.json())
                .then(data => {
                    setCurrentVersion(prevVersion => {
                        if (prevVersion && data.version > prevVersion) {
                            console.log(`New version detected: ${data.version} (Current: ${prevVersion})`);
                            setUpdateAvailable(true);
                        }
                        return prevVersion; // Keep the initial version as "current" until reload
                    });
                })
                .catch(err => console.error('Failed to check version:', err));
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    return updateAvailable;
}
