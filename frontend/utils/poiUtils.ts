import type { POIData, POIInput } from '@/types/poi'
import { poiService } from '@/services/poiService'

// Utility function to prepare POI data
interface POICoordinates {
    lng: number;
    lat: number;
}

interface POIPreparationOptions {
    formData: any;
    coordinates: POICoordinates;
    id?: string;
    mapId: string;
}

export function preparePOIData(options: POIPreparationOptions): POIInput {
    const { formData, coordinates, id, mapId } = options
    return {
        ...formData,
        x: coordinates.lng,
        y: coordinates.lat,
        ...(id && { id }),
        mapId
    }
}

export function validatePOIData(data: any, t: Function): boolean {
    if (!data.name || data.name.length < 1 || data.name.length > 40) {
        throw new Error(t('poi.error.validation.name'))
    }
    if (!data.categoryId) {
        throw new Error(t('poi.error.validation.category'))
    }
    return true
}

// Utility function to get form data
export function getFormData(formElement: Element): Pick<POIData, 'name' | 'categoryId' | 'description' | 'imageFile'> & { shouldDeleteImage?: boolean } {
    const form = formElement as HTMLFormElement
    const shouldDeleteImage = (form.querySelector('#should-delete-image') as HTMLInputElement)?.value === 'true'

    return {
        name: (form.querySelector('#poi-name') as HTMLInputElement)?.value || '',
        categoryId: (form.querySelector('#poi-category') as HTMLSelectElement)?.value || '',
        description: (form.querySelector('#poi-description') as HTMLTextAreaElement)?.value,
        imageFile: (form.querySelector('#poi-image') as HTMLInputElement)?.files?.[0],
        shouldDeleteImage
    }
}

// Utility function to handle POI saving
export async function handlePoiSave(poiData: POIInput & { shouldDeleteImage?: boolean }, t: Function): Promise<POIData> {
    try {
        // Validate the data only for new POIs
        if (!poiData.id) {
            validatePOIData(poiData, t)
        }

        const savingData: Partial<POIData & { shouldDeleteImage?: boolean }> = {
            ...poiData
        }

        // If shouldDeleteImage is true, set imageUrl and thumbnailUrl to null
        if (poiData.shouldDeleteImage) {
            savingData.imageUrl = undefined
            savingData.thumbnailUrl = undefined
            delete savingData.imageFile
        }
        // If an image is selected, upload it first
        else if (poiData.imageFile) {
            const imageData = await poiService.uploadImage(poiData.mapId, poiData.imageFile)
            savingData.imageUrl = imageData.url
            savingData.thumbnailUrl = imageData.thumbnailUrl
            delete (savingData as any).imageFile
        }

        delete savingData.shouldDeleteImage

        // Create or update the POI
        const poi = poiData.id
            ? await poiService.updatePoi(poiData.id, savingData)
            : await poiService.createPoi(poiData.mapId, savingData as POIData)

        return poi
    } catch (error) {
        throw error
    }
} 
