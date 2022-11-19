<script setup lang="ts">  
    import { ref,toRefs,reactive,computed,inject,watch } from 'vue'
    import axios from 'axios'
    
    // https://de.wikipedia.org/api/rest_v1/#/Page%20content/get_page_summary__title_

    type WikipediaSummaryResponse = {
        type:string,
        title:string,
        displaytitle:string,
        thumbnail: {
            source:string,
            width:number,
            height:number
        },
        content_urls: {
            desktop: {
                page:string
            },
            mobile: {
                page:string
            }
        },
        extract:string,
        extract_html:string
    };

    const props = defineProps({
        page: { type: String, required: true }
    })

    const wikipediaData = ref();

    watch(() => props.page, () => {
        axios.get('https://de.wikipedia.org/api/rest_v1/page/summary/'+props.page)
                .then(response => response.data)
                .then(response => wikipediaData.value = response as WikipediaSummaryResponse);
    }, {immediate:true});
    
</script>
<template>
    <h3>{{wikipediaData?.title}}</h3>
    <div class="wikipedia-text">
        <div class="cell-1">
            <p><span>{{wikipediaData?.extract}}</span> <a target="_blank" :href="wikipediaData?.content_urls.desktop.page">Wikipedia</a></p>
        </div>
        <div class="cell-2">
            <a target="_blank" :href="wikipediaData?.content_urls.desktop.page" title="Auf Wikipedia lesen"><img :src="wikipediaData?.thumbnail.source" /></a>
        </div>
    </div>
</template>

<style scoped>
    .wikipedia-text {
        display: flex;
    }
    .wikipedia-text .cell-1 {
        flex-basis: 75%;
        flex-shrink: 0;
    }
    .wikipedia-text .cell-2 img {
        max-width: 100%;
        margin-left:5pt;
        max-height:150pt;
    }
</style>