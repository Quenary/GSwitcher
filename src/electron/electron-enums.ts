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
     * Set application dedicated config of b/c/g
     */
    'gswitcher:set-application-config' = 'gswitcher:set-application-config',
    /**
     * Set list of displays to apply settings
     */
    'gswitcher:set-displays' = 'gswitcher:set-displays',
    /**
     * Get current configuration
     */
    'gswitcher:get-config' = 'gswitcher:get-config',
    /**
     * Set configuration
     */
    'gswitcher:set-config' = 'gswitcher:set-config'
}