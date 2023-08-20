import { defineAsyncComponent } from "vue";
async function getComponents(markdownPath) {
  let dynamicComponentDefinition = null;
  try {
    if (markdownPath == "/javaScript/New 运算符做了哪些事情.md") {
      dynamicComponentDefinition = defineAsyncComponent(() =>
        import(
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
