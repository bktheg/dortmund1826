import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import mitt from 'mitt';
import { createPinia } from 'pinia'
import easySpinner from 'vue-easy-spinner';

import './assets/main.css'

const app = createApp(App)

const emitter = mitt();

router.afterEach((from, to, failure) => emitter.emit("map-resize"))

app.use(router)
app.use(createPinia())
app.use(VueAxios, axios)
app.use(easySpinner, {
    /*options*/
    prefix: 'easy',
  })

app.config.globalProperties.emitter = emitter;
app.provide('emitter', emitter)

app.mount('#app')
