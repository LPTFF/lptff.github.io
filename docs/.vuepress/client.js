import { defineClientConfig } from '@vuepress/client'
import CustomLayout from './components/developLayout.vue'

export default defineClientConfig({
    layouts: {
        CustomLayout
    },
})