import NotificationSystem from '@/components/NotificationSystem.vue'

// Utility function to handle errors
export function handleError(error: any, defaultMessage: string, t: Function, notificationSystem: InstanceType<typeof NotificationSystem> | null) {
    if (!notificationSystem) return

    console.error(defaultMessage, error)
    console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
    })

    const errorMessage = error.response?.data?.error || error.message || t(defaultMessage)
    notificationSystem.showError(errorMessage)
}

// Utility function to handle asynchronous actions with loading state
interface ActionOptions {
    showSuccess?: boolean;
    successMessage?: string;
    errorKey: string;
    cleanup?: boolean;
    showSidebar?: boolean;
}

export async function withLoadingAction<T>(
    action: () => Promise<T>,
    options: ActionOptions,
    t: Function,
    notificationSystem: InstanceType<typeof NotificationSystem> | null,
    isLoading: { value: boolean },
    cleanup?: () => void,
    showSidebar?: () => void
): Promise<T | void> {
    if (!notificationSystem) return

    isLoading.value = true
    try {
        const result = await action()
        if (options.showSuccess) {
            notificationSystem.showSuccess(t(options.successMessage || 'poi.success.save'))
        }
        if (options.cleanup && cleanup) {
            cleanup()
        }
        if (options.showSidebar && showSidebar) {
            showSidebar()
        }
        return result
    } catch (error) {
        handleError(error, options.errorKey, t, notificationSystem)
    } finally {
        isLoading.value = false
    }
} 
