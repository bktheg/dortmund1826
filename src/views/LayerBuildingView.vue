<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAdressdatenStore, cleanStreet, cleanHnr, type Adressbuch, type Gebaeude } from '../stores/adressdatenStore'
import { decodeAddressParam } from '@/utils/buildingAddresses'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const route = useRoute()
const layername = computed(() => route.params.layername as string)

const isSupportedLayer = computed(() => layername.value === 'vector-do1914')

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
}

const resolvedAddresses = computed<ResolvedAddress[]>(() =>
    addresses.value.map((a, i) => {
        const cleaned = cleanStreet(a.strasse)
        const adressbuch = cleaned ? getAdressbuch.value(cleaned) : undefined
        const cleanedHnr = cleanHnr(a.hnr)
        const building = adressbuch && cleanedHnr != null
            ? adressbuch.gebaeude.find(g => g.cleanedHnr === cleanedHnr)
            : undefined
        return {
            key: `${i}-${a.strasse}-${a.hnr}`,
            adressbuch,
            building,
            label: `${a.strasse} ${a.hnr}`.trim(),
        }
    }))

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

                            <ul v-if="entry.building.gewerbe.length > 0" class="adresseintraege">
                                <li v-for="(g, i) in entry.building.gewerbe" :key="'g'+i">
                                    <span class="eintrag-icon">i</span>
                                    <span class="eintrag-name">{{ g.name }}</span>
                                    <span v-if="g.namenszusatz" class="eintrag-zusatz"> {{ g.namenszusatz }}</span>
                                    <span v-if="g.adresszusatz" class="eintrag-zusatz"> {{ g.adresszusatz }}</span>
                                    <span v-if="g.branchen.length > 0" class="eintrag-branchen"> ({{ g.branchen.join(', ') }})</span>
                                    <span v-if="g.fernsprecher" class="eintrag-zusatz"> {{ g.fernsprecher }}</span>
                                </li>
                            </ul>

                            <template v-if="entry.building.behoerden.length > 0">
                                <h3>Behörden</h3>
                                <ul class="adresseintraege">
                                    <li v-for="(b, i) in entry.building.behoerden" :key="'b'+i">
                                        <span class="eintrag-icon">i</span>
                                        <span class="eintrag-name">{{ b.name }}</span>
                                        <span v-if="b.namenszusatz" class="eintrag-zusatz"> {{ b.namenszusatz }}</span>
                                        <span v-if="b.unterkategorie" class="eintrag-kategorie"> ({{ b.unterkategorie }})</span>
                                        <span v-if="b.fernsprecher" class="eintrag-zusatz"> {{ b.fernsprecher }}</span>
                                    </li>
                                </ul>
                            </template>
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
    margin-bottom: 0.5em;
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

.eintrag-zusatz {
    color: #999;
}
</style>
