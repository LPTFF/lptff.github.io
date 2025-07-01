declare module '*.vue' {
    import { defineComponent } from 'vue';
    const Component: ReturnType<typeof defineComponent>;
    export default Component;
}
declare module '*.jpg'
declare module '*.md'
declare module '*.js'
declare module 'file-saver'
