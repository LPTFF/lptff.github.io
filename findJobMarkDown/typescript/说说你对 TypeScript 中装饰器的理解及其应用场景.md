在 TypeScript 中，装饰器（Decorators）是一种特殊类型的声明，可以用来修饰类、方法、属性和参数等。装饰器提供了一种在不修改被修饰代码的情况下，为其添加元数据、行为和功能的方式。装饰器在实际应用中常用于 AOP（面向切面编程）等场景，通过将横切关注点从业务逻辑中分离出来，提高了代码的可读性和可维护性。

以下是对 TypeScript 中装饰器的理解以及其应用场景的说明，同时附有代码示例：

**装饰器的语法：**
装饰器是通过 `@` 符号紧跟在被修饰的声明之前来使用的。

```typescript
@decorator
class MyClass {
    // class definition
}

@decorator
function myFunction() {
    // function definition
}
```

**装饰器的应用场景：**
装饰器适用于以下情况：

1. **添加元数据：** 装饰器可以为类、方法、属性等添加额外的元数据，这些元数据可以用于运行时的元编程。

2. **代码分离：** 装饰器可以将横切关注点（如日志、权限验证）从业务逻辑中分离出来，提高代码的可读性和可维护性。

3. **代码重用：** 装饰器可以用来包装通用的功能，从而在多个地方重用同一段逻辑。

**示例代码：**

```typescript
// 装饰器示例：在方法前后添加日志
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args: any[]) {
        console.log(`Calling method ${propertyKey} with arguments: ${JSON.stringify(args)}`);
        const result = originalMethod.apply(this, args);
        console.log(`Method ${propertyKey} returned: ${result}`);
        return result;
    };

    return descriptor;
}

class Calculator {
    @log
    add(a: number, b: number): number {
        return a + b;
    }
}

const calc = new Calculator();
const sum = calc.add(10, 20); // Output:
// Calling method add with arguments: [10,20]
// Method add returned: 30
```

在上面的示例中，`log` 装饰器在 `add` 方法前后添加了日志输出，从而实现了横切关注点的分离。当调用 `add` 方法时，装饰器会自动添加日志信息。这个示例展示了装饰器在代码分离和添加功能方面的应用。