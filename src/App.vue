<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Map from '@/components/Map.vue'
import router from './router';
</script>

<template>
  <header>
    <nav id='menu'>
        <template v-if="showCloseLink">
	        <RouterLink to="/">Schließen</RouterLink>
        </template>
        <template v-else>
            <RouterLink to="/search">Suche</RouterLink>
            <RouterLink to="/quellen">Hinweise</RouterLink>
        </template>
    </nav>
  </header>
  <main>
    <div class="map">
        <Map />
    </div>
    <RouterView />
  </main>
</template>

<script lang="ts">
export default {
    computed: {
        showCloseLink() {
            return router.currentRoute.value.path != '/';
        }
    }
}
</script>

<style scoped>
    #menu {
        position:absolute; 
        right:0px; 
        top:0px;
        min-width:9em;
        background-color:hsla(0,0%,100%,.5);
    }
    #menu a {
        float:right;
        padding:.1em .4em .1em .4em;
        text-decoration:none;
        color: black;
        width:7.7em;
        color: #404040;
    }
    #menu a:hover {
        background-color:hsla(0,0%,90%,1);
    }
		
</style>
