import type { Map as LeafletMap, ImageOverlay, LatLng } from 'leaflet'
import type { MapData } from '@/types/map'

export interface MapBounds {
    normal: [[number, number], [number, number]];
    extended: [[number, number], [number, number]];
}

export interface MapConfig {
    crs: any;
    minZoom: number;
    maxZoom: number;
    maxBounds: [[number, number], [number, number]];
    maxBoundsViscosity: number;
    zoomControl: boolean;
    zoomSnap: number;
    zoomDelta: number;
    wheelDebounceTime: number;
    wheelPxPerZoomLevel: number;
    doubleClickZoom: boolean;
    touchZoom: boolean;
    scrollWheelZoom: boolean;
    keyboard: boolean;
    keyboardPanDelta: number;
}

export function calculateMapBounds(map: MapData, isMobile: boolean): MapBounds {
    const normal: [[number, number], [number, number]] = [
        [0, 0],
        [map.imageHeight, map.imageWidth]
    ]

    const extendFactor = isMobile ? 0.5 : 0.3
    const extended: [[number, number], [number, number]] = [
        [-map.imageHeight * extendFactor, -map.imageWidth * extendFactor],
        [map.imageHeight * (1 + extendFactor), map.imageWidth * (1 + extendFactor)]
    ]

    return { normal, extended }
}

export function getDefaultMapConfig(L: typeof import('leaflet'), bounds: [[number, number], [number, number]]): MapConfig {
    return {
        crs: L.CRS.Simple,
        minZoom: -5,
        maxZoom: 5,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        zoomControl: true,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelDebounceTime: 40,
        wheelPxPerZoomLevel: 60,
        doubleClickZoom: true,
        touchZoom: true,
        scrollWheelZoom: true,
        keyboard: true,
        keyboardPanDelta: 80
    }
}

export async function initializeMap(
    L: typeof import('leaflet'),
    container: HTMLElement,
    mapData: MapData,
    isMobile: boolean
): Promise<{ map: LeafletMap; imageOverlay: ImageOverlay }> {
    const bounds = calculateMapBounds(mapData, isMobile)
    const config = getDefaultMapConfig(L, bounds.extended)

    const map = L.map(container, config)
    map.zoomControl.setPosition('topright')
    map.attributionControl.remove()

    if (!mapData.imageUrl) {
        throw new Error('Missing imageUrl')
    }

    // Build the complete image URL
    const imageUrl = mapData.imageUrl.startsWith('http')
        ? mapData.imageUrl
        : `${window.location.origin}${mapData.imageUrl}`

    const imageOverlay = L.imageOverlay(imageUrl, bounds.normal).addTo(map)
    map.fitBounds(bounds.normal)

    return { map, imageOverlay }
}

// Variable to store the current event handler
let currentClickHandler: ((e: { latlng: LatLng }) => void) | null = null

export function setupMapClickHandler(
    map: LeafletMap,
    addPoiMode: boolean,
    onMapClick: (e: { latlng: LatLng }) => void
) {
    // Remove the old handler if it exists
    if (currentClickHandler) {
        map.off('click', currentClickHandler)
        currentClickHandler = null
    }

    // Create the new handler
    currentClickHandler = (e: { latlng: LatLng }) => {
        if (!addPoiMode) {
            return
        }
        onMapClick(e)
    }

    // Add the new handler
    map.on('click', currentClickHandler)
}

export function updateMapCursor(container: HTMLElement, addPoiMode: boolean) {
    container.classList.toggle('add-poi-cursor', addPoiMode)
} 
