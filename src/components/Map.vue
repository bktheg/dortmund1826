<script lang="ts">
import { ref } from 'vue'
import router from '@/router';
import type mapboxgl from 'mapbox-gl'
import { usePreviewStore } from '@/stores/previewStore'
import { useMapLayerStore } from '@/stores/mapLayerStore'
import { HoverController } from '@/utils/hoverController'

export type HighlightEvent = {
    gemeindeId:string;
    artikel:string;
}

class ParzellenDetailControl {
    private map:mapboxgl.Map | null = null;
    private container:HTMLElement | null = null;

    onAdd(map:mapboxgl.Map){
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group ctrl-parzellen-detail';

        const button = document.createElement('button');
        button.type = 'button';
        button.ariaLabel = 'Parzelle untersuchen';

        const span = document.createElement('span');
        span.className = 'mapboxgl-ctrl-icon';
        span.ariaHidden = 'true';
        span.title = 'Parzellen untersuchen';
        button.appendChild(span);

        this.container.appendChild(button);
        return this.container;
    }
    onRemove(){
        this.container?.parentNode?.removeChild(this.container);
        this.map = null;
    }
}

export default {
    setup() {
        const layerStore = useMapLayerStore()
        const previewStore = usePreviewStore()
        const dragFromId = ref<string | null>(null)
        const dragOverId = ref<string | null>(null)
        return { layerStore, previewStore, dragFromId, dragOverId }
    },
    data() {
        return {
            map: null as any | null,
            marker: null as any as mapboxgl.Marker,
            clickEnabled: false,
            hoverLayer: 'kataster_areas_1826v2',
            dynamicLayerPrefix: 'kataster-areas-',
            localDevMode: false,
            hoverController: null as HoverController | null,
        }
    },
    mounted() {
        this.localDevMode = import.meta.env.VITE_SERVER_URL != null && import.meta.env.VITE_SERVER_URL != ''
        const previewStore = usePreviewStore()
        previewStore.init()
        this.layerStore.initLayers(previewStore.preview, import.meta.env.VITE_SERVER_URL ?? '')

        window.mapboxgl.accessToken = 'pk.eyJ1IjoiYmt0aGVnIiwiYSI6ImNrZ3dnZnpkazA5d3AyeXBmNGhwdTZrbzYifQ.brEDeLH2Z1BPGZmQNcqwSQ';
        this.map = new window.mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/bktheg/ckgxnl0qt2jmb19pgsoo0xqdp',
            center: [7.464, 51.514],
            zoom: 13.75,
            hash: true,
            pitchWithRotate: false,
            dragRotate: false,
            dragPan: true,
            touchPitch: false,
            customAttribution:"Christopher Jung"
        });

        this.map.on('load', () => {
            if( this.localDevMode ) {
                // Dev mode, use alternative data source
                for( let elem in this.map?.style._layers ) {
                    if( !elem.startsWith('kataster') && !elem.startsWith('Kataster') ) {
                        this.map.removeLayer(elem)
                    }
                }
                this.map.getSource('composite').setUrl(import.meta.env.VITE_SERVER_URL+'/tilejson.json')
            }

            this.layerStore.addAllToMap(this.map)

            this.layerStore.updateDisabledStatus(this.map.getZoom())

            document.getElementsByClassName('ctrl-parzellen-detail').item(0)?.addEventListener('click', () => {
                this.clickEnabled = !this.clickEnabled;
            });

            this.setupHover();
        });

        this.map.on('zoom', () => this.layerStore.updateDisabledStatus(this.map?.getZoom() ?? 0));

        const nav = new window.mapboxgl.NavigationControl();
        this.map.addControl(nav, 'top-left');

        const scale = new window.mapboxgl.ScaleControl({
            maxWidth: 100,
            unit: 'metric'
        });
        this.map.addControl(scale);
        this.map.addControl(
            new window.mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
            }), 'top-left'
        );
        this.map.addControl(new ParzellenDetailControl(), 'top-left');

        this.emitter.on("map-highlight-location", (target:any) => {
            if( this.marker ) {
                this.marker.remove();
            }
            if( target.location.length > 2 ) {
                const loc = target.location as number[][];
                const latlng = [loc[0], loc[2]];
                this.map.fitBounds(latlng);
            }
            else if( Array.isArray(target.location[0]) ) {
                const loc = target.location as number[][];
                const latlng = [loc[0], loc[1]];
                this.map.fitBounds(latlng);
            }
            else {
                this.marker = new window.mapboxgl.Marker()
                    .setLngLat(target.location as [number, number])
                    .addTo(this.map);
                if( target.zoom ) {
                    this.map.flyTo({center: target.location, zoom: target.zoom});
                }
                else {
                    this.map.flyTo({center: target.location});
                }
            }
        });

        this.emitter.on('map-highlight-areas', (target:HighlightEvent) => {
            if( this.map.loaded() ) {
                this.onHighlightAreas(target);
            }
            else {
                this.map.on('load', () => this.onHighlightAreas(target));
            }
        })

        this.emitter.on("map-resize", () => {
          setTimeout(() => this.map.resize(), 50)
        });
    },

    beforeUnmount() {
        this.hoverController?.teardown()
    },

    watch: {
        clickEnabled(newVal: boolean) {
            if (!newVal) {
                this.hoverController?.clearAll()
            }
        },
    },

    methods: {
        onDragStart(id: string, e: DragEvent): void {
            if (!this.previewStore.preview || !e.dataTransfer) return
            this.dragFromId = id
            e.dataTransfer.effectAllowed = 'move'
        },

        onDragEnd(): void {
            this.dragFromId = null
            this.dragOverId = null
        },

        onDragEnter(id: string): void {
            if (!this.dragFromId) return
            this.dragOverId = id
        },

        onDragLeave(id: string, e: DragEvent): void {
            const target = e.currentTarget as Element | null
            if (target?.contains(e.relatedTarget as Node | null)) return
            if (this.dragOverId === id) this.dragOverId = null
        },

        onDrop(targetId: string): void {
            if (!this.dragFromId || this.dragFromId === targetId) return
            this.layerStore.reorderLayer(this.dragFromId!, targetId, this.map)
            this.dragFromId = null
            this.dragOverId = null
        },

        layerCheckboxId(id: string): string {
            if (id === 'heute') return 'layerHeute'
            return 'layer' + id.replace(/-/g, '')
        },

        setupHover() {
            this.hoverController = new HoverController({
                map: this.map,
                getLayers: () => this.layerStore.layers,
                isEnabled: () => this.clickEnabled,
                navigate: (route) => router.push(route),
            });
            this.hoverController.setup();
        },

        onHighlightAreas(target:HighlightEvent) {
            if( this.map?.getLayer(this.dynamicLayerPrefix+'highlight') == null ) {
                this.map?.addLayer({
                    'id': this.dynamicLayerPrefix+'highlight-fill',
                    'type': 'fill',
                    'source': 'composite',
                    'source-layer': this.hoverLayer,
                    'layout': {},
                    'paint': {
                        'fill-color': '#DD7744',
                        'fill-opacity':0.15
                    },
                    'filter': false
                });
                this.map?.moveLayer(this.dynamicLayerPrefix+'highlight-fill', 'Kataster-Gebaeude')

                this.map?.addLayer({
                    'id': this.dynamicLayerPrefix+'highlight',
                    'type': 'line',
                    'source': 'composite',
                    'source-layer': this.hoverLayer,
                    'layout': {},
                    'paint': {
                        'line-color': '#DD7744',
                        'line-width': 2,
                        'line-opacity':1
                    },
                    'filter': false
                });
                this.map?.moveLayer(this.dynamicLayerPrefix+'highlight', 'Kataster-Gebaeude')
            }

            if( target != null ) {
                this.map?.setFilter(this.dynamicLayerPrefix+'highlight',[
                            'all',['match',['get','artikel'],[target.artikel],true,false],['match',['get','gemeinde'],[target.gemeindeId],true,false]]
                );

                this.map?.setFilter(this.dynamicLayerPrefix+'highlight-fill',[
                            'all',['match',['get','artikel'],[target.artikel],true,false],['match',['get','gemeinde'],[target.gemeindeId],true,false]]
                );
            }
            else {
                this.map?.setFilter(this.dynamicLayerPrefix+'highlight', false);
                this.map?.setFilter(this.dynamicLayerPrefix+'highlight-fill', false);
            }
        }
    }
}
</script>
<template>
    <div id='map' :class="clickEnabled ? 'map-cursor-parzellen-info' : ''"></div>
    <nav id='layer' :class="{ dragging: !!dragFromId }">
        <template v-for="layer of layerStore.layers" :key="layer.id">
            <div v-if="!layer.parentId"
                 :draggable="previewStore.preview && layer.sortable"
                 :class="{ 'drop-target': dragOverId === layer.id && dragFromId !== layer.id, 'is-dragging': dragFromId === layer.id }"
                 @dragstart="onDragStart(layer.id, $event)"
                 @dragend="onDragEnd"
                 @dragenter="onDragEnter(layer.id)"
                 @dragleave="onDragLeave(layer.id, $event)"
                 @dragover.prevent
                 @drop.prevent="onDrop(layer.id)">
                <span v-if="previewStore.preview && layer.sortable" class="drag-handle">⠿</span>
                <label :class="layer.disabled ? 'disabled' : ''">
                    <input type="checkbox" value="true" :id="layerCheckboxId(layer.id)" v-model="layer.visible" @change="layerStore.toggleLayer(layer.id, map)"/>{{layer.name}}
                </label>
                <div v-for="child of layerStore.layers.filter(l => l.parentId === layer.id)" :key="child.id">
                    <label :class="child.disabled ? 'disabled' : ''">
                        <input type="checkbox" value="true" :id="layerCheckboxId(child.id)" v-model="child.visible" @change="layerStore.toggleLayer(child.id, map)"/>{{child.name}}
                    </label>
                </div>
            </div>
        </template>
    </nav>
</template>

<style scoped>
    #map {height:100%;position:absolute;top:0;bottom:0;left:0;right:0}

    #layer {
        background-color:hsla(0,0%,100%,.5);
        position: absolute;
        z-index: 1;
        top: 4em;
        right: 0px;
        min-width:9em
    }

    #layer div {
        color: #404040;
        display: block;
        margin: 0;
        padding: 0;
        padding: 0em 1em .0em;
        text-decoration: none;
        border-bottom: 1px solid rgba(0, 0, 0, 0.25);
        text-align: left;
    }

    #layer > div {
        padding: .5em .7em .4em;
    }

    #layer div:last-child {
        border: none;
    }

    label.disabled {
        color:darkgray
    }

    #layer > div[draggable="true"] {
        cursor: grab;
    }

    .drag-handle {
        color: #666;
        margin-right: 0.2em;
        user-select: none;
    }

    #layer > div > div {
        padding-left: 2em;
    }

    #layer > div.drop-target {
        box-shadow: inset 0 2px 0 0 #4a90d9;
    }

    #layer > div.is-dragging {
        opacity: 0.5;
    }

    #layer.dragging > div * {
        pointer-events: none;
    }
</style>
<style>
    .map-cursor-parzellen-info .ctrl-parzellen-detail {
        background-color:var(--color-light-text);
    }
    .ctrl-parzellen-detail .mapboxgl-ctrl-icon {
        background-image:url('/infobutton.svg');
        background-size:26px 26px;
    }
    .map-cursor-parzellen-info .mapboxgl-canvas-container {
        cursor:url('/infobutton.svg') 5 5, help;
    }
</style>
