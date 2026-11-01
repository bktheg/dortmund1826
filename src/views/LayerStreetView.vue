<script setup lang="ts">
import { computed, inject, watch, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import type { Emitter } from 'mitt'
import { useAdressdatenStore, cleanStreet, type Gebaeude } from '@/stores/adressdatenStore'
import { useGewerbeTypeStore } from '@/stores/gewerbeTypeStore'
import { useAdressbuchNameStore } from '@/stores/adressbuchNameStore'
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
const streetname = computed(() => route.params.streetname as string)
const isSupportedLayer = computed(() => layername.value === 'vector-do1914')

const gewerbeTypeStore = useGewerbeTypeStore()
const { index } = storeToRefs(gewerbeTypeStore)

const brancheSlugMap = computed(() => {
    const map = new Map<string, string>()
    for (const t of index.value) {
        for (const b of t.bezeichnungen) {
            if (!map.has(b)) {
                map.set(b, t.slug)
            }
        }
    }
    return map
})

const slugForBranche = (branche: string) => brancheSlugMap.value.get(branche)

const store = useAdressdatenStore()
const nameStore = useAdressbuchNameStore()
const cleaned = computed(() => cleanStreet(streetname.value) ?? '')

watch([cleaned, isSupportedLayer], ([street, supported]) => {
    if (supported && street) {
        store.fetchAdressbuch(street)
        // The street file carries no coordinates; the by-name lists do, per address.
        nameStore.fetchBesitzer()
        nameStore.fetchGewerbe()
        nameStore.fetchBehoerden()
    }
}, { immediate: true })

watch(isSupportedLayer, (supported) => {
    if (supported) {
        gewerbeTypeStore.fetchIndex()
        emitter.emit('map-enable-layer', layername.value)
    }
}, { immediate: true })

const loading = computed(() => store.loading.has(cleaned.value))
const adressbuch = computed(() => (isSupportedLayer.value ? store.getAdressbuch(cleaned.value) : undefined))
const title = computed(() => adressbuch.value?.strasse || streetname.value)

// Splits "15b" into [15, "b"]; entries without a leading number sort last.
function hnrKey(g: Gebaeude): [number, string] {
    const m = /^#?(\d+)(.*)$/.exec((g.cleanedHnr || g.hnr || '').trim())
    return m ? [parseInt(m[1], 10), m[2]] : [Number.MAX_SAFE_INTEGER, g.hnr ?? '']
}

const rows = computed(() => {
    const list = [...(adressbuch.value?.gebaeude ?? [])]
    return list.sort((a, b) => {
        const [na, sa] = hnrKey(a)
        const [nb, sb] = hnrKey(b)
        return na - nb || sa.localeCompare(sb, 'de')
    })
})

type Position = { center?: [number, number], buildingIds: Set<number> }

// Address (cleaned house number) -> map position, collected from every by-name entry
// on this street. An address no entry has a building for stays without a position.
const positions = computed(() => {
    const map = new Map<string, Position>()
    const entries = [...nameStore.besitzer, ...nameStore.gewerbe, ...nameStore.behoerden]
    for (const e of entries) {
        if (e.adresse.cleanStrasse !== cleaned.value) continue
        let pos = map.get(e.adresse.cleanHnr)
        if (!pos) {
            pos = { buildingIds: new Set() }
            map.set(e.adresse.cleanHnr, pos)
        }
        pos.center ??= e.center
        e.buildingIds.forEach(id => pos!.buildingIds.add(id))
    }
    return map
})

const positionOf = (g: Gebaeude) => {
    const pos = positions.value.get(g.cleanedHnr)
    return pos?.center ? pos : undefined
}

const moveToAdresse = (g: Gebaeude) => {
    const pos = positionOf(g)
    if (!pos?.center) return
    emitter.emit('map-highlight-buildings', pos.buildingIds.size > 0 ? Array.from(pos.buildingIds) : null)
    emitter.emit('map-highlight-location', { location: pos.center, zoom: 16 })
}

onBeforeUnmount(() => emitter.emit('map-highlight-buildings', null))

const adresseText = (g: Gebaeude) => `${title.value} ${g.hnr}`.trim()

function eigentuemerLine(b: Gebaeude): string {
    let line = b.besitzer ?? ''
    if (b.beruf) {
        line += ` (${b.beruf})`
    }
    if (b.typ) {
        line += ` ${b.typ}`
    }
    return line.trim()
}
</script>

<template>
    <div id="contentview">
        <div class="content">
            <a v-if="lastPage" class="backToSearch" href="#" @click.prevent="back">Zurück</a>
            <template v-if="!isSupportedLayer">
                <h2>Nicht gefunden</h2>
            </template>
            <template v-else>
                <LoadingSpinner v-if="loading" />
                <template v-else-if="adressbuch && rows.length > 0">
                    <h1>{{ title }}</h1>
                    <p v-if="adressbuch.quelle" class="quelle">Quelle: {{ adressbuch.quelle }}</p>
                    <table class="strassen-tabelle">
                        <thead>
                            <tr>
                                <th>Adresse</th>
                                <th>Eigentümer</th>
                                <th>Gewerbe und Behörden</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(g, i) in rows" :key="i">
                                <td>
                                    <a v-if="positionOf(g)" href="#" @click.prevent="moveToAdresse(g)">{{ adresseText(g) }}</a>
                                    <template v-else>{{ adresseText(g) }}</template>
                                </td>
                                <td>{{ eigentuemerLine(g) }}</td>
                                <td>
                                    <ul v-if="g.gewerbe.length > 0 || g.behoerden.length > 0" class="adresseintraege">
                                        <li v-for="(e, j) in g.gewerbe" :key="'g'+j">
                                            <p class="eintrag-kopf">
                                                <span class="eintrag-icon">i</span>
                                                <span class="eintrag-name">{{ e.name }}</span>
                                                <span v-if="e.namenszusatz" class="eintrag-zusatz">{{ e.namenszusatz }}</span>
                                                <span v-if="e.adresszusatz" class="eintrag-zusatz">{{ e.adresszusatz }}</span>
                                                <span v-if="e.fernsprecher" class="eintrag-fernsprecher">{{ e.fernsprecher }}</span>
                                            </p>
                                            <p v-if="e.branchen.length > 0" class="eintrag-kategorie">
                                                <template v-for="(b, bi) in e.branchen" :key="'br'+bi"><template v-if="bi > 0">, </template><router-link v-if="slugForBranche(b)" :to="{ name: 'layer-gewerbetype', params: { layername, gewerbetype: slugForBranche(b) } }">{{ b }}</router-link><template v-else>{{ b }}</template></template>
                                            </p>
                                        </li>
                                        <li v-for="(e, j) in g.behoerden" :key="'b'+j">
                                            <p class="eintrag-kopf">
                                                <span class="eintrag-icon">i</span>
                                                <span class="eintrag-name">{{ e.name }}</span>
                                                <span v-if="e.namenszusatz" class="eintrag-zusatz">{{ e.namenszusatz }}</span>
                                                <span v-if="e.fernsprecher" class="eintrag-fernsprecher">{{ e.fernsprecher }}</span>
                                            </p>
                                            <p v-if="e.unterkategorie" class="eintrag-kategorie">{{ e.unterkategorie }}</p>
                                        </li>
                                    </ul>
                                </td>
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

.strassen-tabelle {
    border-collapse: collapse;
    width: 100%;
}

.strassen-tabelle th,
.strassen-tabelle td {
    text-align: left;
    padding: 0.4em 0.8em 0.4em 0;
    border-bottom: 1px solid #ddd;
    vertical-align: top;
}

.strassen-tabelle th {
    font-weight: bold;
}

.strassen-tabelle th:first-child,
.strassen-tabelle td:first-child {
    white-space: nowrap;
}

.strassen-tabelle th:nth-child(2) {
    width: 20%;
}

.adresseintraege {
    list-style: none;
    padding-left: 0;
}

.adresseintraege li {
    margin-bottom: 0.8em;
}

.eintrag-kopf {
    margin: 0;
}

.eintrag-name {
    font-weight: 600;
}

.eintrag-zusatz + .eintrag-zusatz::before,
.eintrag-name + .eintrag-zusatz::before {
    content: '\2013';
    color: #999;
    margin: 0 0.4em;
}

.eintrag-fernsprecher::before {
    content: '\2013';
    color: #999;
    margin: 0 0.4em;
}

.eintrag-kategorie {
    margin: 0.1em 0 0 1.6em;
    color: #666;
    font-size: 0.9em;
}

.eintrag-icon {
    display: inline-block;
    width: 1.1em;
    height: 1.1em;
    line-height: 1.1em;
    text-align: center;
    border: 1px solid currentColor;
    border-radius: 2px;
    font-size: 0.8em;
    font-style: italic;
    margin-right: 0.5em;
    vertical-align: middle;
}

.eintrag-zusatz,
.eintrag-fernsprecher {
    color: #666;
}

.eintrag-fernsprecher {
    white-space: nowrap;
}
.adresseintraege li:last-child {
    margin-bottom: 0;
}
</style>
