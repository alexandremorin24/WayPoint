import type { Popup } from 'leaflet'

export interface CleanupOptions {
    popup?: boolean;
    marker?: boolean;
    resetClickMessage?: boolean;
}

export interface CleanupElements {
    popupRef: Popup | null;
    tempMarker: any | null;
    showClickMessage: { value: boolean };
}

export function cleanupMapElements(
    elements: CleanupElements,
    options: CleanupOptions = { popup: true, marker: true, resetClickMessage: true }
) {
    const { popup = true, marker = true, resetClickMessage = true } = options

    if (popup && elements.popupRef) {
        elements.popupRef.remove()
        elements.popupRef = null
    }
    if (marker && elements.tempMarker) {
        elements.tempMarker.remove()
        elements.tempMarker = null
    }
    if (resetClickMessage) {
        elements.showClickMessage.value = false
    }
} 
