import { defineStore } from 'pinia'
import { WmsLayer, VectorLayer, StaticLayer } from '@/models/mapLayer'
import type { Layer } from '@/models/mapLayer'
import { getDo1914LayerDefinitions } from '@/stores/do1914LayerStyles'
import { buildGebaeudefHighlightFilter } from '@/utils/hoverUtils'
import { addrPropertyToParam, encodeAddressParam } from '@/utils/buildingAddresses'

type SortableStaticLayer = StaticLayer & { getCeilingAnchor(map: any): string | undefined }

export const useMapLayerStore = defineStore('mapLayer', {
    state: () => ({
        layers: [] as Layer[],
    }),
    actions: {
        initLayers(preview: boolean, serverUrl: string): void {
            const result: Layer[] = []

            const layer1826 = new StaticLayer(
                '1826',
                '1826',
                0, 24,
                (id) => id.startsWith('kataster-') && !id.startsWith('kataster-areas-'),
                undefined,
                true,
            )
            layer1826.hoverDescriptor = {
                hitLayerId: 'kataster-areas-hover',
                highlightLayerId: 'kataster-areas-hovered',
                source: 'composite',
                sourceLayer: 'kataster_areas_1826v2',
                highlight: {
                    mechanism: 'feature-state',
                    layerType: 'line',
                    paint: {
                        'line-color': '#BB5555',
                        'line-width': 4,
                        'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.0],
                    },
                },
                selectFeature: (features) => features.find((f: any) => f.properties?.typ === 0) || features[0],
                buildClickRoute: (feature) => feature?.properties
                    ? {
                        name: 'parzelle',
                        params: {
                            gemeinde: feature.properties['gemeinde'],
                            flur: feature.properties['flur'],
                            nr: feature.properties['flurstueck'],
                        },
                    }
                    : null,
            }
            result.push(layer1826)

            result.push(new StaticLayer(
                '1826-grenzen',
                'Grenzen',
                0, 24,
                (id) => id.startsWith('kataster-gemeindegrenzen')
                    || id.startsWith('kataster-buergermeistereien')
                    || id.startsWith('kataster-kreise'),
                '1826',
            ))

            result.push(new WmsLayer(
                'uraufnahme',
                'Uraufnahme (1836-1850)',
                'https://www.wms.nrw.de/geobasis/wms_nw_uraufnahme?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=false&width=256&height=256&layers=WMS_NW_URAUFNAHME&styles=',
                12.5, 24,
                'Geobasis NRW',
            ))

            result.push(new WmsLayer(
                'neuaufnahme',
                'Neuaufnahme (1891-1912)',
                'https://www.wms.nrw.de/geobasis/wms_nw_neuaufnahme?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=false&width=256&height=256&layers=nw_neuaufnahme&styles=',
                12, 24,
                'Geobasis NRW',
            ))

            if (preview) {
                const do1914 = new VectorLayer(
                    'vector-do1914',
                    'Dortmund Zentrum (1914)',
                    serverUrl + '/tilesets/flaechenf,gebaeudef,strassenf,hausnummernf/tilejson.json',
                    3, 19,
                    '',
                    getDo1914LayerDefinitions(),
                )
                do1914.hoverDescriptor = {
                    hitLayerId: 'vector-do1914-gebaeudef-hover',
                    highlightLayerId: 'vector-do1914-gebaeudef-hovered',
                    source: 'vector-do1914',
                    sourceLayer: 'gebaeudef',
                    highlight: {
                        mechanism: 'filter',
                        layerType: 'line',
                        paint: {
                            'line-color': '#BB5555',
                            'line-width': 4,
                        },
                        buildFilter: (feature) => buildGebaeudefHighlightFilter(
                            feature.properties?.street ?? '',
                            feature.properties?.hnr ?? '',
                        ),
                    },
                    buildClickRoute: (feature) => {
                        const addr = feature.properties?.addr
                        const param = addr
                            ? addrPropertyToParam(addr)
                            : encodeAddressParam([{
                                strasse: feature.properties?.street ?? '',
                                hnr: feature.properties?.hnr ?? '',
                            }])
                        return {
                            name: 'layer-building',
                            params: {
                                layername: 'vector-do1914',
                                addr: param,
                            },
                        }
                    },
                }
                result.push(do1914)
            }

            result.push(new StaticLayer(
                'heute',
                'Heute',
                0, 24,
                (id) => !id.startsWith('kataster-') && !id.startsWith('wms-') && !id.startsWith('vector-'),
            ))

            this.layers = result
        },

        addAllToMap(map: any): void {
            for (const layer of this.layers) {
                layer.addToMap(map)
            }
        },

        toggleLayer(id: string, map: any): void {
            const index = this.layers.findIndex(l => l.id === id)
            if (index === -1) return
            const layer = this.layers[index]
            if (layer.visible) {
                layer.show(map, this._computeBelowLayerId(index, map))
            } else {
                layer.hide(map)
            }
            // Toggling '1826' must re-apply the grenzen layer state (mirrors toggle1826 coupling)
            if (id === '1826') {
                const grenzenIndex = this.layers.findIndex(l => l.id === '1826-grenzen')
                if (grenzenIndex !== -1) {
                    const grenzen = this.layers[grenzenIndex]
                    if (grenzen.visible) grenzen.show(map, this._computeBelowLayerId(grenzenIndex, map))
                    else grenzen.hide(map)
                }
            }
        },

        reorderLayer(layerId: string, targetLayerId: string, map: any): void {
            if (layerId === targetLayerId) return

            const fromStart = this.layers.findIndex(l => l.id === layerId)
            if (fromStart === -1 || this.layers[fromStart].parentId) return

            let fromEnd = fromStart + 1
            while (fromEnd < this.layers.length && this.layers[fromEnd].parentId === layerId) {
                fromEnd++
            }
            const group = this.layers.slice(fromStart, fromEnd)

            const remaining = [
                ...this.layers.slice(0, fromStart),
                ...this.layers.slice(fromEnd),
            ]

            const targetIdx = remaining.findIndex(l => l.id === targetLayerId)
            if (targetIdx === -1) return

            this.layers = [
                ...remaining.slice(0, targetIdx),
                ...group,
                ...remaining.slice(targetIdx),
            ]

            this._repositionVisibleLayers(map)
        },

        _findCeiling(map: any): string {
            const sl = this.layers.find(l => l instanceof StaticLayer && l.sortable) as SortableStaticLayer | undefined
            return sl?.getCeilingAnchor(map) ?? 'Kataster-Kulturarten'
        },

        _computeBelowLayerId(layerIndex: number, map: any): string {
            const ceiling = this._findCeiling(map)
            for (let j = layerIndex - 1; j >= 0; j--) {
                const above = this.layers[j]
                if (!above.visible || !above.sortable) continue
                const anchor = above.getAnchorId() ?? above.getFloorAnchor(map)
                return anchor ?? ceiling
            }
            return ceiling
        },

        _repositionVisibleLayers(map: any): void {
            let anchor: string | undefined = this._findCeiling(map)
            for (const layer of this.layers) {
                if (layer.parentId) continue
                if (!layer.visible || !layer.sortable) continue
                layer.reposition(map, anchor)
                anchor = layer.getAnchorId() ?? anchor
            }
        },

        updateDisabledStatus(zoom: number): void {
            for (const layer of this.layers) {
                layer.disabled = zoom < layer.minZoom
            }
        },
    },
})
