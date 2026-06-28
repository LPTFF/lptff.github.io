在 TypeScript 中，命名空间（Namespace）和模块（Module）都是用于组织和管理代码的机制，但它们有不同的用途和特点。

**命名空间：**
命名空间是一种将相关的代码组织在一起的方式，用于避免全局命名冲突。命名空间可以嵌套，从而形成层次结构。命名空间中的成员可以使用 `export` 关键字导出，以便在其他命名空间或文件中使用。

```typescript
namespace MyNamespace {
    export const value = 42;

    export function func() {
        console.log("Function in namespace");
    }
}

console.log(MyNamespace.value); // Output: 42
MyNamespace.func(); // Output: Function in namespace
```

**模块：**
模块是一种将代码封装在一个文件中，并通过 `export` 关键字导出，以供其他文件导入和使用。模块是一种更现代、更推荐的组织代码的方式，它可以跨文件进行组织，有助于代码的分割和模块化开发。

```typescript
// Math.ts
export function add(a: number, b: number): number {
    return a + b;
}

// Main.ts
import { add } from "./Math";

const result = add(10, 20);
console.log(result); // Output: 30
```

**区别：**
1. **作用范围：** 命名空间主要用于在全局范围内组织代码，而模块更适用于在文件和模块之间进行组织。

2. **导出方式：** 在命名空间中，可以使用 `export` 关键字导出成员；在模块中，通过 `export` 关键字将成员导出，然后使用 `import` 进行导入。

3. **全局命名冲突：** 命名空间用于解决全局命名冲突问题，模块使用更现代的方式来避免命名冲突，并提供了更好的封装性。

4. **编译方式：** 命名空间的代码在编译后会生成命名空间结构的 JavaScript 代码，而模块的代码在编译后会生成符合 CommonJS、AMD、ES6 等模块规范的代码。

总体而言，命名空间适用于简单的代码组织和全局命名冲突的问题，而模块更适用于复杂的应用场景和模块化开发。随着 TypeScript 的发展，推荐使用模块来组织代码。