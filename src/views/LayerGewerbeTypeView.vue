<script setup lang="ts">
import { computed, inject, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Emitter } from 'mitt'
import { useGewerbeTypeStore } from '@/stores/gewerbeTypeStore'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const emitter = inject('emitter') as Emitter<any>

const lastPage = router.options.history.state.back?.toString()
const back = () => {
    if (lastPage) {
        router.push({ path: lastPage })
    }
}

const layername = computed(() => route.params.layername as string)
const slug = computed(() => route.params.gewerbetype as string)
const isSupportedLayer = computed(() => layername.value === 'vector-do1914')

const store = useGewerbeTypeStore()

watch(slug, (value) => {
    if (isSupportedLayer.value && value) {
        store.fetchGewerbeType(value)
    }
}, { immediate: true })

watch(isSupportedLayer, (supported) => {
    if (supported) {
        emitter.emit('map-enable-layer', layername.value)
    }
}, { immediate: true })

const loading = computed(() => store.loading.has(slug.value))
const liste = computed(() => (isSupportedLayer.value ? store.getListe(slug.value) : undefined))
const headline = computed(() => liste.value?.bezeichnungen.join(', ') ?? '')

const highlightBuildingIds = computed<number[]>(() => {
    const ids = new Set<number>()
    for (const e of liste.value?.eintraege ?? []) {
        for (const id of e.buildingIds) {
            ids.add(id)
        }
    }
    return Array.from(ids)
})

watch(highlightBuildingIds, (ids) => {
    emitter.emit('map-highlight-buildings', ids.length > 0 ? ids : null)
}, { immediate: true })

onBeforeUnmount(() => emitter.emit('map-highlight-buildings', null))
</script>

<template>
    <div id="contentview">
        <div class="content">
            <a v-if="lastPage" class="backToSearch" href="#" @click="back">Zurück</a>
            <template v-if="!isSupportedLayer">
                <h2>Nicht gefunden</h2>
            </template>
            <template v-else>
                <LoadingSpinner v-if="loading" />
                <template v-else-if="liste && liste.eintraege.length > 0">
                    <h1>{{ headline }}</h1>
                    <p v-if="liste.quelle" class="quelle">Quelle: {{ liste.quelle }}</p>
                    <table class="gewerbe-tabelle">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Namenszusatz</th>
                                <th>Adresse</th>
                                <th>Adresszusatz</th>
                                <th>Fernsprecher</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(e, i) in liste.eintraege" :key="i">
                                <td>{{ e.name }}</td>
                                <td>{{ e.namenszusatz }}</td>
                                <td>{{ `${e.adresse.strasse} ${e.adresse.hnr}`.trim() }}</td>
                                <td>{{ e.adresszusatz }}</td>
                                <td>{{ e.fernsprecher }}</td>
                            </tr>
                        </tbody>
                    </table>
                </template>
                <template v-else>
                    <h2>Nicht gefunden</h2>
                </template>
            </template>
        </div>
    </div>
</template>

<style scoped>
.quelle {
    color: #999;
    margin-bottom: 1.5em;
}

.gewerbe-tabelle {
    border-collapse: collapse;
    width: 100%;
}

.gewerbe-tabelle th,
.gewerbe-tabelle td {
    text-align: left;
    padding: 0.4em 0.8em 0.4em 0;
    border-bottom: 1px solid #ddd;
    vertical-align: top;
}

.gewerbe-tabelle th {
    font-weight: bold;
}
</style>
