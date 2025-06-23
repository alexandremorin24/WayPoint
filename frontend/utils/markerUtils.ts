import type { Category } from '@/types/category'
import type { Map as LeafletMap, Marker as LeafletMarker, LatLng, DivIcon } from 'leaflet'
import type { POIData } from '@/types/poi'

// Constants for marker styles
export const MARKER_STYLES = {
    size: [40, 64] as [number, number],
    anchor: [20, 48] as [number, number],
    defaultColor: '#0099ff',
    defaultIcon: 'mdi-map-marker'
}

export function createMarkerIcon(L: typeof import('leaflet'), category: Category | null = null): DivIcon {
    const color = category?.color || MARKER_STYLES.defaultColor
    const icon = category?.icon || MARKER_STYLES.defaultIcon

    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div style="background-color: ${color}; --marker-color: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25); z-index:1;">
        <i class="mdi ${icon}" style="color: white; font-size: 25px; z-index:2;"></i>
      </div>
    `,
        iconSize: MARKER_STYLES.size,
        iconAnchor: MARKER_STYLES.anchor
    })
}

export function createTempMarker(L: typeof import('leaflet'), leafletMap: LeafletMap, latlng: LatLng, category: Category | null = null) {
    if (!leafletMap) return null

    const icon = createMarkerIcon(L, category)
    return L.marker(latlng, { icon }).addTo(leafletMap)
}

export function centerMobileMarker(leafletMap: LeafletMap, latlng: LatLng) {
    if (!leafletMap) return

    // Calculate the position to place the marker at 25% from the top
    const mapHeight = leafletMap.getSize().y
    const targetY = mapHeight * 0.25
    const currentY = leafletMap.latLngToContainerPoint(latlng).y
    const offsetY = targetY - currentY

    // Calculate the new center that will place the marker at 25% from the top
    const center = leafletMap.getCenter()
    const newCenter = leafletMap.containerPointToLatLng([
        leafletMap.latLngToContainerPoint(center).x,
        leafletMap.latLngToContainerPoint(center).y + offsetY
    ])

    // Move the view
    leafletMap.setView(newCenter, leafletMap.getZoom(), {
        animate: true,
        duration: 0.3
    })
}

export interface MarkerManager {
    createMarker: (poi: POIData, category: Category | null) => any;
    updateMarker: (marker: any, poi: POIData, category: Category | null) => void;
    removeMarker: (marker: any) => void;
    setupMarkerEvents: (marker: any, poi: POIData) => void;
}

export function createMarkerManager(
    L: typeof import('leaflet'),
    map: LeafletMap,
    createPoiPopupTemplate: (poi: POIData) => string,
    setupPoiEvents: (element: HTMLElement, poi: POIData) => void
): MarkerManager {
    return {
        createMarker(poi: POIData, category: Category | null) {
            if (!poi.id) {
                console.error('Cannot create marker for POI without ID')
                return null
            }

            const markerLatLng = L.latLng(poi.y, poi.x)
            const marker = L.marker(markerLatLng, { icon: createMarkerIcon(L, category) })

            marker.addTo(map)

            // Add the popup content
            const popupContent = createPoiPopupTemplate(poi)
            marker.bindPopup(popupContent, {
                offset: [0, 12] as [number, number],
                className: 'poi-info-popup',
                closeButton: false
            })

            this.setupMarkerEvents(marker, poi)

            return marker
        },

        updateMarker(marker: any, poi: POIData, category: Category | null) {
            marker.setIcon(createMarkerIcon(L, category))
            marker.setLatLng(L.latLng(poi.y, poi.x))

            const currentPopup = marker.getPopup()
            const isOpen = currentPopup && currentPopup.isOpen()
            if (isOpen) {
                marker.closePopup()
            }

            const popupContent = createPoiPopupTemplate(poi)
            marker.bindPopup(popupContent, {
                offset: [0, 12] as [number, number],
                className: 'poi-info-popup',
                closeButton: false
            })

            if (isOpen) {
                marker.openPopup()
            }
        },

        removeMarker(marker: any) {
            marker.remove()
        },

        setupMarkerEvents(marker: any, poi: POIData) {
            marker.on('popupopen', async () => {
                const popupElement = marker.getPopup()?.getElement()
                if (!popupElement) return

                setupPoiEvents(
                    popupElement,
                    poi
                )
            })
        }
    }
} 
