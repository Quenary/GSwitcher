export enum EInvokeEventName {
    /**
     * Get list of connected displays names
     */
    'gswitcher:get-displays-list' = 'gswitcher:get-displays-list',
    /**
     * Get list of active process file names
     */
    'gswitcher:get-process-list' = 'gswitcher:get-process-list',
    /**
     * Get current configuration
     */
    'gswitcher:get-config' = 'gswitcher:get-config',
    /**
     * Set configuration
     */
    'gswitcher:set-config' = 'gswitcher:set-config',
    /**
     * Get state of auto launch
     */
    'gswitcher:get-auto-launch' = 'gswitcher:get-auto-launch',
    /**
     * Set state of auto launch
     */
    'gswitcher:set-auto-launch' = 'gswitcher:set-auto-launch',
    /**
     * Get version of application
     */
    'gswitcher:get-app-version' = 'gswitcher:get-app-version',
    /**
     * Check version update
     */
    'gswitcher:check-version' = 'gswitcher:check-version',
    /**
     * Open external link in browser
     */
    'gswitcher:open-external-link' = 'gswitcher:open-external-link',
    /**
     * Quit app
     */
    'gswitcher:quit' = 'gswitcher:quit'
}

export enum EAppUrls {
    /**
     * Repository url
     */
    'repo' = 'https://github.com/Quenary/GSwitcher'
}