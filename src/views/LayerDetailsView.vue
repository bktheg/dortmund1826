<script setup lang="ts">
import { computed, watch, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import type { Emitter } from 'mitt'
import { storeToRefs } from 'pinia'
import { useAdressdatenStore, cleanStreet, cleanHnr, type Adressbuch, type Gebaeude } from '../stores/adressdatenStore'
import { useGewerbeTypeStore } from '@/stores/gewerbeTypeStore'
import { useHaeuserbuchStore, type HaeuserbuchBuilding } from '@/stores/haeuserbuchStore'
import { findMatchingEntries } from '@/services/addressComparatorService'
import { decodeAddressParam } from '@/utils/buildingAddresses'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import HaeuserbuchInfoComponent from '@/components/haeuserbuchInfo.vue'

const HAEUSERBUCH_GEMEINDE = 'dortmund'

const route = useRoute()
const layername = computed(() => route.params.layername as string)

const gewerbeTypeStore = useGewerbeTypeStore()
const { index } = storeToRefs(gewerbeTypeStore)

const haeuserbuchStore = useHaeuserbuchStore()
const { getHaeuserbuch } = storeToRefs(haeuserbuchStore)

const emitter = inject('emitter') as Emitter<any>

onMounted(() => {
    if (isSupportedLayer.value) {
        gewerbeTypeStore.fetchIndex()
        haeuserbuchStore.fetchHaeuserbuch(HAEUSERBUCH_GEMEINDE)
    }
})

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

function slugForBranche(branche: string): string | undefined {
    return brancheSlugMap.value.get(branche)
}

const isSupportedLayer = computed(() => layername.value === 'vector-do1914')

watch(isSupportedLayer, (supported) => {
    if (supported) {
        emitter.emit('map-enable-layer', layername.value)
    }
}, { immediate: true })

const addresses = computed(() =>
    isSupportedLayer.value ? decodeAddressParam(route.params.addr as string) : [])

const adressdatenStore = useAdressdatenStore()
const { getAdressbuch } = storeToRefs(adressdatenStore)

// Unique cleaned streets that need to be fetched (a building can span several).
const cleanedStreets = computed(() => {
    const streets = new Set<string>()
    for (const a of addresses.value) {
        const cleaned = cleanStreet(a.strasse)
        if (cleaned) {
            streets.add(cleaned)
        }
    }
    return Array.from(streets)
})

watch(cleanedStreets, (streets) => {
    for (const street of streets) {
        adressdatenStore.fetchAdressbuch(street)
    }
}, { immediate: true })

const loading = computed(() => cleanedStreets.value.some(s => adressdatenStore.loading.has(s)))

interface ResolvedAddress {
    key: string
    adressbuch?: Adressbuch
    building?: Gebaeude
    label: string
    haeuserbuchBuildings: HaeuserbuchBuilding[]
}

// The Häuserbuch keys its buildings on the current house number, so a 1914 address
// resolves through the same comparator used for the address book itself.
function haeuserbuchBuildingsFor(cleanedStreet: string | null, cleanedHnr: string | null): HaeuserbuchBuilding[] {
    if (!cleanedStreet || !cleanedHnr) {
        return []
    }
    const haeuserbuch = getHaeuserbuch.value(HAEUSERBUCH_GEMEINDE)
    if (!haeuserbuch?.buildings) {
        return []
    }
    const onStreet = haeuserbuch.buildings.filter(b =>
        b.number && b.number != 'ohne' && cleanStreet(b.street) == cleanedStreet)
    return findMatchingEntries(cleanedHnr, onStreet, b => cleanHnr(b.number))
}

const resolvedAddresses = computed<ResolvedAddress[]>(() => {
    const result: ResolvedAddress[] = []
    const seen = new Set<string>()
    addresses.value.forEach((a, i) => {
        const cleaned = cleanStreet(a.strasse)
        const adressbuch = cleaned ? getAdressbuch.value(cleaned) : undefined
        const cleanedHnr = cleanHnr(a.hnr)
        const label = `${a.strasse} ${a.hnr}`.trim()
        const matches = adressbuch
            ? findMatchingEntries(cleanedHnr, adressbuch.gebaeude, g => g.cleanedHnr)
            : []
        if (matches.length > 0) {
            matches.forEach((building, j) => {
                const dedupeKey = `${cleaned}|${building.cleanedHnr}`
                if (seen.has(dedupeKey)) {
                    return
                }
                seen.add(dedupeKey)
                result.push({
                    key: `${i}-${j}-${building.cleanedHnr}`,
                    adressbuch,
                    building,
                    label,
                    haeuserbuchBuildings: haeuserbuchBuildingsFor(cleaned, building.cleanedHnr)
                })
            })
        } else {
            result.push({
                key: `${i}-${a.strasse}-${a.hnr}`,
                adressbuch,
                building: undefined,
                label,
                haeuserbuchBuildings: []
            })
        }
    })
    return result
})

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
            <template v-if="!isSupportedLayer">
                <h2>Nicht gefunden</h2>
            </template>
            <template v-else>
                <LoadingSpinner v-if="loading" />
                <template v-else-if="resolvedAddresses.length > 0">
                    <section v-for="entry in resolvedAddresses" :key="entry.key" class="address-block">
                        <template v-if="entry.building && entry.adressbuch">
                            <h1>{{ entry.adressbuch.strasse }} {{ entry.building.hnr }}</h1>
                            <p v-if="eigentuemerLine(entry.building)" class="eigentuemer">
                                Eigentümer: {{ eigentuemerLine(entry.building) }}
                            </p>

                            <template v-if="entry.building.gewerbe.length > 0">
                                <h3>Gewerbe</h3>
                                <ul class="adresseintraege">
                                    <li v-for="(g, i) in entry.building.gewerbe" :key="'g'+i">
                                        <p class="eintrag-kopf">
                                            <span class="eintrag-icon">i</span>
                                            <span class="eintrag-name">{{ g.name }}</span>
                                            <span v-if="g.namenszusatz" class="eintrag-zusatz">{{ g.namenszusatz }}</span>
                                            <span v-if="g.adresszusatz" class="eintrag-zusatz">{{ g.adresszusatz }}</span>
                                            <span v-if="g.fernsprecher" class="eintrag-fernsprecher">{{ g.fernsprecher }}</span>
                                        </p>
                                        <p v-if="g.branchen.length > 0" class="eintrag-kategorie">
                                            <template v-for="(b, bi) in g.branchen" :key="'br'+bi"><template v-if="bi > 0">, </template><router-link v-if="slugForBranche(b)" :to="{ name: 'layer-gewerbetype', params: { layername, gewerbetype: slugForBranche(b) } }">{{ b }}</router-link><template v-else>{{ b }}</template></template>
                                        </p>
                                    </li>
                                </ul>
                            </template>

                            <template v-if="entry.building.behoerden.length > 0">
                                <h3>Behörden</h3>
                                <ul class="adresseintraege">
                                    <li v-for="(b, i) in entry.building.behoerden" :key="'b'+i">
                                        <p class="eintrag-kopf">
                                            <span class="eintrag-icon">i</span>
                                            <span class="eintrag-name">{{ b.name }}</span>
                                            <span v-if="b.namenszusatz" class="eintrag-zusatz">{{ b.namenszusatz }}</span>
                                            <span v-if="b.fernsprecher" class="eintrag-fernsprecher">{{ b.fernsprecher }}</span>
                                        </p>
                                        <p v-if="b.unterkategorie" class="eintrag-kategorie">{{ b.unterkategorie }}</p>
                                    </li>
                                </ul>
                            </template>

                            <HaeuserbuchInfoComponent
                                v-for="hb in entry.haeuserbuchBuildings"
                                :key="'hb'+hb.id"
                                :id="hb.id"
                                :gemeinde="HAEUSERBUCH_GEMEINDE"
                                prefer-current-address/>
                        </template>
                        <template v-else>
                            <h1>{{ entry.label }}</h1>
                            <h2>Nicht gefunden</h2>
                        </template>
                    </section>
                </template>
                <template v-else>
                    <h2>Nicht gefunden</h2>
                </template>
            </template>
        </div>
    </div>
</template>

<style scoped>
.address-block + .address-block {
    margin-top: 2em;
    padding-top: 1.5em;
    border-top: 1px solid #ddd;
}

.eigentuemer {
    margin-bottom: 1.2em;
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
</style>
