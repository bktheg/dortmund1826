<script setup lang="ts">

</script>
<script lang="ts">
import router from '@/router';
import type mapboxgl from 'mapbox-gl'

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

class WmsLayer {
    public enabled:boolean = false;
    public disabled:boolean = false;
    constructor(public id:string, public name:string, public url:string, public minZoom:number, public maxZoom:number, public attribution:string) {}
}

export default {
  data() {
    return {
        map: null as any | null,
        alwaysOff: null as Array<string> | null,
        show1826: true,
        show1826Grenzen: true,
        showHeute: true,
        disabledUraufnahme: false,
        marker: null as any as mapboxgl.Marker,
        clickEnabled: false,
        hoveredArea: null as mapboxgl.MapboxGeoJSONFeature | null,
        hoverLayer: 'kataster_areas_1826v2',
        wmsLayers: new Map<string,WmsLayer>()
    }
  },
  mounted() {
    this.wmsLayers.set('uraufnahme', new WmsLayer(
        'uraufnahme',
        'Uraufnahme (1836-1850)',
        'https://www.wms.nrw.de/geobasis/wms_nw_uraufnahme?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=false&width=256&height=256&layers=WMS_NW_URAUFNAHME',
        12.5,
        24,
        'Geobasis NRW'));
    this.wmsLayers.set('neuaufnahme', new WmsLayer(
        'neuaufnahme',
        'Neuaufnahme (1891-1912)',
        'https://www.wms.nrw.de/geobasis/wms_nw_neuaufnahme?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=false&width=256&height=256&layers=nw_neuaufnahme',
        12,
        24,
        'Geobasis NRW'));

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
        for( const layer of this.wmsLayers.values() ) {
            this.map?.addSource(`wms-${layer.id}-source`, {
                        'type': 'raster',
                        'tiles': [layer.url],
                        'tileSize': 256,
                        'attribution': layer.attribution,
                        'minzoom': layer.minZoom,
                        'maxzoom': layer.maxZoom
                        });
        }

        this.updateWmsDisabledStatus();

        document.getElementsByClassName('ctrl-parzellen-detail').item(0)?.addEventListener('click', () => {
            this.clickEnabled = !this.clickEnabled;
        });

        this.setupHover();
    });

    this.map.on('zoom', () => this.updateWmsDisabledStatus());

    const nav = new window.mapboxgl.NavigationControl();
    this.map.addControl(nav, 'top-left');

    const scale = new window.mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
    });
    this.map.addControl(scale);
    this.map.addControl(new ParzellenDetailControl(), 'top-left');

    this.alwaysOff = ['country-label','state-label','settlement-major-label','settlement-minor-label','settlement-subdivision-label','poi-label','admin-0-boundary-disputed','admin-0-boundary','admin-1-boundary','admin-0-boundary-bg','admin-1-boundary-bg'];

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

  methods: {
    setupHover() {
        this.map.addLayer({
            'id': 'areas-hovered',
            'type': 'line',
            'source': 'composite',
            'source-layer': this.hoverLayer,
            'layout': {},
            'paint': {
                'line-color': '#BB5555',
                'line-width': 4,
                'line-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    1,
                    0.0
                ]
            }
        });

        this.map.addLayer({
            'id': 'areas-hover',
            'type': 'fill',
            'source': 'composite',
            'source-layer': this.hoverLayer,
            'layout': {},
            'paint': {
                'fill-opacity': 0.0
            }
        });

        this.map.on('mousemove', 'areas-hover', (e:mapboxgl.MapLayerMouseEvent) => {
            if (this.clickEnabled && e.features && e.features.length > 0) {
                if (this.hoveredArea !== null) {
                    this.map.setFeatureState(
                        { source: 'composite', sourceLayer:this.hoverLayer, id: this.hoveredArea.id },
                        { hover: false }
                    );
                }
                this.hoveredArea = e.features.find(f => f.properties?.typ === 0) || e.features[0]
                this.map.setFeatureState(
                    { source: 'composite', sourceLayer:this.hoverLayer, id: this.hoveredArea.id },
                    { hover: true }
                );
            }
        });

        this.map.on('mouseleave', 'areas-hover', () => {
            if (this.hoveredArea !== null) {
                this.map.setFeatureState(
                    { source: 'composite', sourceLayer:this.hoverLayer, id: this.hoveredArea.id },
                    { hover: false }
                );
            }
            this.hoveredArea = null;
        });

        this.map.on('click', 'areas-hover', () => {
            this.hoverSelected();
        });
    },
    hoverSelected() {
        if( this.hoveredArea && this.hoveredArea.properties) {
                router.push({
                    name: 'parzelle',
                    params: {
                        gemeinde: this.hoveredArea.properties['gemeinde'] as string,
                        flur: this.hoveredArea.properties['flur'] as number,
                        nr: this.hoveredArea.properties['flurstueck'] as string
                    }
                })
            }
    },
    toggle1826() {
        this.toggleLayer((l) => l.startsWith('kataster-'), this.show1826);
	    this.toggleLayer((l) => l.startsWith('kataster-gemeindegrenzen'), this.show1826Grenzen);
	    this.toggleLayer((l) => l.startsWith('kataster-buergermeistereien'), this.show1826Grenzen);
    },

    toggle1826Grenzen() {
        this.toggleLayer((l) => l.startsWith('kataster-gemeindegrenzen'), this.show1826Grenzen);
        this.toggleLayer((l) => l.startsWith('kataster-buergermeistereien'), this.show1826Grenzen);
    },

    toggleHeute() {
        this.toggleLayer((l) => !l.startsWith('kataster-') && !l.startsWith('wms-'), this.showHeute);
    },


    toggleLayer(condition:(layer:string)=>boolean, visible:boolean) {
        for( let elem in this.map?.style._layers ) {
            if( !elem || this.alwaysOff?.includes(elem) ) {
                continue;
            }
            if( condition(elem.toLowerCase()) ) {
                this.map?.setLayoutProperty(elem, 'visibility', visible ? 'visible' : 'none');
            }
        }
    },

    toggleWmsLayer(id:string, show:boolean) {
        if( show ) {
            if( this.map?.getLayer(`wms-${id}-layer`) == null ) {
                this.map?.addLayer({
                    'id': `wms-${id}-layer`,
                    'type': 'raster',
                    'source': `wms-${id}-source`,
                    'paint': {},
                    'minzoom': this.map?.getSource(`wms-${id}-source`).minzoom,
                    'maxzoom': this.map?.getSource(`wms-${id}-source`).maxzoom,
                });
                this.map?.moveLayer(`wms-${id}-layer`, 'Kataster-Kulturarten')
            }
        }
        else {
            this.map?.removeLayer(`wms-${id}-layer`);
        }
    },

    updateWmsDisabledStatus() {
        for( const layer of this.wmsLayers.values() ) {
            layer.disabled = this.map?.getZoom() < layer.minZoom
        }
    },

    onHighlightAreas(target:HighlightEvent) {
        if( this.map?.getLayer('areas-highlight') == null ) {
            this.map?.addLayer({
                'id': 'areas-highlight-fill',
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
            this.map?.moveLayer('areas-highlight-fill', 'Kataster-Gebaeude')

            this.map?.addLayer({
                'id': 'areas-highlight',
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
            this.map?.moveLayer('areas-highlight', 'Kataster-Gebaeude')
        }

        if( target != null ) {
            this.map?.setFilter('areas-highlight',[
                        'all',['match',['get','artikel'],[target.artikel],true,false],['match',['get','gemeinde'],[target.gemeindeId],true,false]]
            );

            this.map?.setFilter('areas-highlight-fill',[
                        'all',['match',['get','artikel'],[target.artikel],true,false],['match',['get','gemeinde'],[target.gemeindeId],true,false]]
            );
        }
        else {
            this.map?.setFilter('areas-highlight', false);
            this.map?.setFilter('areas-highlight-fill', false);
        }
    }
  }
}
</script>
<template>
    <div id='map' :class="clickEnabled ? 'map-cursor-parzellen-info' : ''"></div>
    <nav id='layer'>
        <div>
            <label><input type="checkbox" value="true" id="layer1826" v-model="show1826" @change="toggle1826()"/>1826</label>
            <div><label><input type="checkbox" value="true" id="layer1826grenzen" v-model="show1826Grenzen" @change="toggle1826Grenzen()"/>Grenzen</label></div>
        </div>
        <div v-for="layer of wmsLayers.values()"><label :class="layer.disabled?'disabled' : ''"><input type="checkbox" value="true" v-model="layer.enabled" @change="toggleWmsLayer(layer.id, layer.enabled)"/>{{layer.name}}</label></div>
        <div><label><input type="checkbox" value="true" id="layerHeute" v-model="showHeute" @change="toggleHeute()"/>Heute</label></div>
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
</style>
<style>
    .map-cursor-parzellen-info .ctrl-parzellen-detail {
        background-color:lightgray;
    }
    .ctrl-parzellen-detail .mapboxgl-ctrl-icon {
        background-image:url('/infobutton.svg');
        background-size:26px 26px;
    }
    .map-cursor-parzellen-info .mapboxgl-canvas-container {
        cursor:url('/infobutton.svg') 5 5, help;
    }
</style>