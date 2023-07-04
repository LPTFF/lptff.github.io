import { createRouter, createWebHistory } from 'vue-router'
const NotFoundComponent = { template: '<p>Page not found</p>' }

// 创建一个Vue 应用
const routes = [
    { path: '/:catchAll(.*)', name: 'Home', component: () => import('../views/home/index.vue') },
    { path: '/foo', component: NotFoundComponent },
    { path: '/job', name: 'job', component: () => import('../views/job/index.vue') },
    { path: '/life', name: 'life', component: () => import('../views/life/index.vue') }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes
})

export default router
