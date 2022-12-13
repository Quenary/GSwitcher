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
    'gswitcher:get-app-version' = 'gswitcher:get-app-version'
}