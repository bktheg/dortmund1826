<script setup lang="ts">
</script>

<template>
    <div id="contentview">
        <div class="content not-found">
            <h2>404 – Seite nicht gefunden</h2>
            <p><router-link to="/">Zurück zur Startseite</router-link></p>
        </div>
    </div>
</template>

<style scoped>
    .not-found {
        text-align: center;
        padding: 40pt;
    }
</style>
