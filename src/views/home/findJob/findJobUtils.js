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
