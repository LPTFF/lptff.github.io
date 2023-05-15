import { defineClientConfig } from '@vuepress/client'
import CustomLayout from './components/developLayout.vue'
import NotFound from './layouts/NotFound.vue'
export default defineClientConfig({
    layouts: {
        CustomLayout,
        NotFound
    },
})