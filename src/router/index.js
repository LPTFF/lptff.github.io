import { createRouter, createWebHistory } from 'vue-router'
const NotFoundComponent = { template: '<p>Page not found</p>' }

// 创建一个Vue 应用
const routes = [
    { path: '/foo', component: NotFoundComponent },
    { path: '/Job', name: 'Job', component: () => import('../views/job/index.vue') },
    { path: '/Life', name: 'Life', component: () => import('../views/life/index.vue') }
]

const router = createRouter({
    history: createWebHistory(),
    routes: routes
})

export default router
