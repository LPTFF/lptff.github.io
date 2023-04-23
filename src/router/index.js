import { createRouter, createWebHistory } from 'vue-router'
import HelloWorld from '../components/HelloWorld.vue'
import Job from '../views/job/index.vue'
import Life from '../views/life/index.vue'
const NotFoundComponent = { template: '<p>Page not found</p>' }

// 创建一个Vue 应用
const routes = [
    { path: '/foo', component: NotFoundComponent },
    { path: '/helloWorld', component: HelloWorld },
    { path: '/Job', component: Job },
    { path: '/Life', component: Life }
]

const router = createRouter({
    history: createWebHistory(),
    routes: routes
})

export default router
