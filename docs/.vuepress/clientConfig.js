import { defineClientConfig } from '@vuepress/client'
import MyComponent from './components/index.vue'
export default defineClientConfig({
    enhance({ app, router, siteData }) {
        app.component('MyComponent', MyComponent)
    },
    setup() {
        // let flag = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        // console.log('flag', flag);
    },
    layouts: {},
    rootComponents: [],
})