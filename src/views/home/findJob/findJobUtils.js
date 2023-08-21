import { defineAsyncComponent } from "vue";
async function getComponents(markdownPath) {
  let dynamicComponentDefinition = null;
  try {
    if (markdownPath == "/javaScript/New 运算符做了哪些事情.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          /* @vite-ignore */
          `../../../public/data/findJobMarkDown/javaScript/New 运算符做了哪些事情.md`
        )
      );
    } else if (markdownPath == "/javaScript/js事件委托.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(`../../../public/data/findJobMarkDown/javaScript/js事件委托.md`)
      );
    } else if (markdownPath == "/javaScript/js事件流.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(`../../../public/data/findJobMarkDown/javaScript/js事件流.md`)
      );
    } else if (markdownPath == "/javaScript/js常见的数据类型.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/js常见的数据类型.md`
        )
      );
    } else if (markdownPath == "/javaScript/undefined 和 null.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/undefined 和 null.md`
        )
      );
    } else if (
      markdownPath == "/javaScript/为什么 Symbol 和 bigInt 不支持 new.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/为什么 Symbol 和 bigInt 不支持 new.md`
        )
      );
    } else if (markdownPath == "/javaScript/事件循环、宏任务、微任务.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/事件循环、宏任务、微任务.md`
        )
      );
    } else if (markdownPath == "/javaScript/原型、原型链.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/原型、原型链.md`
        )
      );
    } else if (
      markdownPath == "/javaScript/变量提升、暂时性死区、var、let、const.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/变量提升、暂时性死区、var、let、const.md`
        )
      );
    } else if (markdownPath == "/javaScript/常用继承方案.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/常用继承方案.md`
        )
      );
    } else if (markdownPath == "/javaScript/js事件循环执行循序.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/js事件循环执行循序.md`
        )
      );
    } else if (markdownPath == "/javaScript/js宏任务包含哪些.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/js宏任务包含哪些.md`
        )
      );
    } else if (markdownPath == "/javaScript/js宏微任务包含哪些.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/js宏微任务包含哪些.md`
        )
      );
    } else if (
      markdownPath == "/javaScript/async 和 await 是如何处理异步任务.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/async 和 await 是如何处理异步任务.md`
        )
      );
    } else if (
      markdownPath ==
      "/javaScript/requestAnimationFrame 既不是宏任务也不是微任务.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/requestAnimationFrame 既不是宏任务也不是微任务.md`
        )
      );
    } else if (markdownPath == "/javaScript/this 指向问题.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/this 指向问题.md`
        )
      );
    } else if (markdownPath == "/javaScript/箭头函数和普通函数的区别.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/箭头函数和普通函数的区别.md`
        )
      );
    } else if (markdownPath == "/javaScript/call、apply、bind的区别.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/call、apply、bind的区别.md`
        )
      );
    } else if (
      markdownPath == "/vue/为什么data属性是一个函数而不是一个对象.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/为什么data属性是一个函数而不是一个对象.md`
        )
      );
    } else if (markdownPath == "/vue/说说你对vue的理解.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(`../../../public/data/findJobMarkDown/vue/说说你对vue的理解.md`)
      );
    } else if (markdownPath == "/vue/说说你对双向绑定的理解.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/说说你对双向绑定的理解.md`
        )
      );
    } else if (markdownPath == "/vue/说说你对SPA（单页应用）的理解.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/说说你对SPA（单页应用）的理解.md`
        )
      );
    } else if (markdownPath == "/vue/Vue中的v-show和v-if怎么理解.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue中的v-show和v-if怎么理解.md`
        )
      );
    } else if (markdownPath == "/vue/Vue实例挂载的过程中发生了什么.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue实例挂载的过程中发生了什么.md`
        )
      );
    } else if (markdownPath == "/vue/说说你对Vue生命周期的理解.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/说说你对Vue生命周期的理解.md`
        )
      );
    } else if (markdownPath == "/vue/为什么Vue中的v-if和v-for不建议一起用.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/为什么Vue中的v-if和v-for不建议一起用.md`
        )
      );
    } else if (
      markdownPath == "/vue/SPA（单页应用）首屏加载速度慢怎么解决.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/SPA（单页应用）首屏加载速度慢怎么解决.md`
        )
      );
    } else if (markdownPath == "/vue/Vue中给对象添加新属性界面不刷新.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue中给对象添加新属性界面不刷新.md`
        )
      );
    } else if (markdownPath == "/vue/Vue中组件和插件有什么区别.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue中组件和插件有什么区别.md`
        )
      );
    } else if (markdownPath == "/vue/Vue组件间通信方式都有哪些.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue组件间通信方式都有哪些.md`
        )
      );
    } else if (markdownPath == "/vue/说说你对nexttick的理解.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/说说你对nexttick的理解.md`
        )
      );
    } else if (
      markdownPath == "/vue/说说你对vue的mixin的理解，有什么应用场景.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/说说你对vue的mixin的理解，有什么应用场景.md`
        )
      );
    } else if (
      markdownPath == "/vue/说说你对slot的理解，slot使用场景有哪些.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/说说你对slot的理解，slot使用场景有哪些.md`
        )
      );
    } else if (markdownPath == "/vue/Vue.observable你有了解过吗，说说看.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue.observable你有了解过吗，说说看.md`
        )
      );
    } else if (
      markdownPath == "/vue/你知道vue中key的原理吗，说说你对它的理解.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/你知道vue中key的原理吗，说说你对它的理解.md`
        )
      );
    } else if (
      markdownPath ==
      "/vue/怎么缓存当前的组件，缓存后怎么更新，说说你对keep-alive的理解是什么.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/怎么缓存当前的组件，缓存后怎么更新，说说你对keep-alive的理解是什么.md`
        )
      );
    } else if (
      markdownPath == "/vue/Vue常用的修饰符有哪些，有什么应用场景.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue常用的修饰符有哪些，有什么应用场景.md`
        )
      );
    } else if (
      markdownPath == "/vue/你有写过自定义指令吗，自定义指令的应用场景有哪些.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/你有写过自定义指令吗，自定义指令的应用场景有哪些.md`
        )
      );
    } else if (
      markdownPath == "/vue/Vue中的过滤器了解吗，过滤器的应用场景有哪些.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue中的过滤器了解吗，过滤器的应用场景有哪些.md`
        )
      );
    } else if (
      markdownPath == "/vue/什么是虚拟DOM，如何实现一个虚拟DOM，说说你的思路.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/什么是虚拟DOM，如何实现一个虚拟DOM，说说你的思路.md`
        )
      );
    } else if (markdownPath == "/vue/了解过vue中的diff算法吗，说说看.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/了解过vue中的diff算法吗，说说看.md`
        )
      );
    } else if (markdownPath == "/vue/Vue项目中有封装过axios吗，怎么封装的.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue项目中有封装过axios吗，怎么封装的.md`
        )
      );
    } else if (
      markdownPath == "/vue/你了解Axios的原理吗，有看过它的源码吗.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/你了解Axios的原理吗，有看过它的源码吗.md`
        )
      );
    } else if (
      markdownPath == "/vue/SSR解决了什么问题，有做过SSR吗，你是怎么做的.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/SSR解决了什么问题，有做过SSR吗，你是怎么做的.md`
        )
      );
    } else if (
      markdownPath ==
      "/vue/说下你的Vue项目的目录结构，如果是大型项目你该怎么划分结构和划分组件呢.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/说下你的Vue项目的目录结构，如果是大型项目你该怎么划分结构和划分组件呢.md`
        )
      );
    } else if (
      markdownPath ==
      "/vue/Vue要做权限管理该怎么做，控制到按钮级别的权限怎么做.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue要做权限管理该怎么做，控制到按钮级别的权限怎么做.md`
        )
      );
    } else if (
      markdownPath == "/vue/跨域是什么，Vue项目中你是如何解决跨域的呢.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/跨域是什么，Vue项目中你是如何解决跨域的呢.md`
        )
      );
    } else if (
      markdownPath == "/vue/Vue项目如何部署，有遇到布署服务器后刷新404问题吗.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue项目如何部署，有遇到布署服务器后刷新404问题吗.md`
        )
      );
    } else if (markdownPath == "/vue/你是怎么处理vue项目中的错误的.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/你是怎么处理vue项目中的错误的.md`
        )
      );
    } else if (markdownPath == "/vue/Vue3有了解过吗，能说说跟Vue2的区别吗.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue/Vue3有了解过吗，能说说跟Vue2的区别吗.md`
        )
      );
    } else if (
      markdownPath == "/vue3/Vue3.0的设计目标是什么，做了哪些优化.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue3/Vue3.0的设计目标是什么，做了哪些优化.md`
        )
      );
    } else if (
      markdownPath == "/vue3/Vue3.0 性能提升主要是通过哪几方面体现的.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue3/Vue3.0 性能提升主要是通过哪几方面体现的.md`
        )
      );
    } else if (
      markdownPath ==
      "/vue3/Vue3.0里为什么要用 Proxy API 替代 defineProperty API.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue3/Vue3.0里为什么要用 Proxy API 替代 defineProperty API.md`
        )
      );
    } else if (
      markdownPath ==
      "/vue3/Vue3.0 所采用的 Composition Api 与 Vue2.x 使用的 Options Api 有什么不同.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue3/Vue3.0 所采用的 Composition Api 与 Vue2.x 使用的 Options Api 有什么不同.md`
        )
      );
    } else if (markdownPath == "/vue3/说说Vue 3.0中Treeshaking特性.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue3/说说Vue 3.0中Treeshaking特性.md`
        )
      );
    } else if (
      markdownPath ==
      "/vue3/用Vue3.0 写过组件吗，如果想实现一个 Modal你会怎么设计.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/vue3/用Vue3.0 写过组件吗，如果想实现一个 Modal你会怎么设计.md`
        )
      );
    } else if (markdownPath == "/ES6/说说var、let、const之间的区别.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/ES6/说说var、let、const之间的区别.md`
        )
      );
    } else if (markdownPath == "/ES6/ES6中数组新增了哪些扩展.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/ES6/ES6中数组新增了哪些扩展.md`
        )
      );
    } else if (markdownPath == "/ES6/ES6中对象新增了哪些扩展.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/ES6/ES6中对象新增了哪些扩展.md`
        )
      );
    } else if (markdownPath == "/ES6/ES6中函数新增了哪些扩展.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/ES6/ES6中函数新增了哪些扩展.md`
        )
      );
    } else if (
      markdownPath == "/ES6/ES6中新增的Set、Map两种数据结构怎么理解.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/ES6/ES6中新增的Set、Map两种数据结构怎么理解.md`
        )
      );
    } else if (
      markdownPath == "/ES6/你是怎么理解ES6中Promise以及它的使用场景.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/ES6/你是怎么理解ES6中Promise以及它的使用场景.md`
        )
      );
    } else if (
      markdownPath == "/ES6/你是怎么理解ES6中Generator以及它的使用场景.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/ES6/你是怎么理解ES6中Generator以及它的使用场景.md`
        )
      );
    } else if (
      markdownPath == "/ES6/你是怎么理解ES6中Proxy以及它的使用场景.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/ES6/你是怎么理解ES6中Proxy以及它的使用场景.md`
        )
      );
    } else if (
      markdownPath == "/ES6/你是怎么理解ES6中Module以及它的使用场景.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/ES6/你是怎么理解ES6中Module以及它的使用场景.md`
        )
      );
    } else if (
      markdownPath == "/ES6/你是怎么理解ES6中Decorator以及它的使用场景.md"
    ) {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/ES6/你是怎么理解ES6中Decorator以及它的使用场景.md`
        )
      );
    } else {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
          `../../../public/data/findJobMarkDown/javaScript/原型、原型链.md`
        )
      );
    }
  } catch (error) {
    console.log("getComponents error", error);
  }

  return dynamicComponentDefinition;
}
export { getComponents };
