<script setup lang="ts">

</script>
<script lang="ts">
import type mapboxgl from 'mapbox-gl'

export default {
  data() {
    return {
        map: null as any | null,
        alwaysOff: null as Array<string> | null,
        show1826: true,
        show1826Grenzen: true,
        showHeute: true,
        marker: null as any as mapboxgl.Marker
    }
  },
  mounted() {
    console.log(window.mapboxgl)
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

    const nav = new window.mapboxgl.NavigationControl();
    this.map.addControl(nav, 'top-left');

    const scale = new window.mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
    });
    this.map.addControl(scale);

    this.alwaysOff = ['country-label','state-label','settlement-major-label','settlement-minor-label','settlement-subdivision-label','poi-label','admin-0-boundary-disputed','admin-0-boundary','admin-1-boundary','admin-0-boundary-bg','admin-1-boundary-bg'];

    this.emitter.on("map-highlight-location", (location:number[]) => {
        if( this.marker ) {
            this.marker.remove();
        }
        if( location.length > 2 ) {
            this.map.fitBounds(location);
        }
        else {
            this.marker = new window.mapboxgl.Marker()
                .setLngLat(location as [number, number])
                .addTo(this.map);
            this.map.flyTo({center: location});
        }
    });

    this.emitter.on("map-resize", () => {
      setTimeout(() => this.map.resize(), 50)
    });
  },

  methods: {
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
        this.toggleLayer((l) => !l.startsWith('kataster-'), this.showHeute);
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
    }
  }
}
</script>
<template>
    <div id='map'></div>
    <nav id='layer'>
        <div>
            <label><input type="checkbox" value="true" id="layer1826" v-model="show1826" @change="toggle1826()"/>1826</label>
            <div><label><input type="checkbox" value="true" id="layer1826grenzen" v-model="show1826Grenzen" @change="toggle1826Grenzen()"/>Grenzen</label></div>
        </div>
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
</style>