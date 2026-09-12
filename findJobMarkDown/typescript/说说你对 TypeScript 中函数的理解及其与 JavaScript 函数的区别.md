在 TypeScript 中，函数（Function）是一种可以执行特定任务的代码块。函数允许你将一段代码封装起来，以便在需要时可以重复使用。TypeScript 中的函数与 JavaScript 函数在基本概念上是相似的，但 TypeScript 引入了类型系统，使得函数的参数和返回值可以被显式地指定类型，从而提供更好的类型检查和代码维护性。

以下是对 TypeScript 中函数的理解以及与 JavaScript 函数的区别的说明，同时附有代码示例：

**函数的语法：**
```typescript
function functionName(parameters: types): returnType {
    // 函数体
    return returnValue;
}
```

**函数的区别：**
1. **类型注解：** TypeScript 允许在函数声明中为参数和返回值添加类型注解，从而提供了更严格的类型检查。

2. **可选参数和默认参数：** TypeScript 支持在函数参数中使用可选参数和默认参数，而 JavaScript 中需要手动处理这些情况。

3. **函数重载：** TypeScript 支持函数重载，即在函数声明中可以定义多个函数签名，根据参数数量和类型自动选择正确的实现。

**示例代码：**

```typescript
// TypeScript 中的函数定义，带有类型注解
function add(a: number, b: number): number {
    return a + b;
}

// TypeScript 支持可选参数和默认参数
function greet(name: string, greeting?: string): string {
    if (greeting) {
        return `${greeting}, ${name}!`;
    } else {
        return `Hello, ${name}!`;
    }
}

console.log(greet("Alice")); // Output: Hello, Alice!
console.log(greet("Bob", "Hi")); // Output: Hi, Bob!

// TypeScript 中的函数重载
function combine(a: string, b: string): string;
function combine(a: number, b: number): number;
function combine(a: any, b: any): any {
    return a + b;
}

console.log(combine("Hello, ", "World")); // Output: Hello, World
console.log(combine(1, 2)); // Output: 3
```

在上面的示例中，`add` 函数使用类型注解明确指定参数和返回值的类型。`greet` 函数演示了可选参数和默认参数的使用。`combine` 函数展示了函数重载，通过不同的参数签名来实现不同的实现逻辑。这些功能使 TypeScript 中的函数更具可读性和类型安全性。