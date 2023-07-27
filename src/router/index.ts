import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/quellen',
      name: 'quellen',
      component: () => import('../views/QuellenView.vue')
    },
    {
      path: '/search/:type?/:term?/:filter?',
      name: 'search',
      component: () => import('../views/SearchView.vue')
    },
    {
      path: '/mutterrolle/:gemeinde/:artikelNr',
      name: 'mutterrolle',
      component: () => import('../views/MutterrolleView.vue')
    },
    {
      path: '/parzelle/:gemeinde/:flur/:nr',
      name: 'parzelle',
      component: () => import('../views/ParzelleView.vue')
    },
    {
      path: '/haeuserbuch/:gemeinde/:id',
      name: 'haeuserbuch',
      component: () => import('../views/HaeuserbuchView.vue')
    }
  ]
})

export default router
