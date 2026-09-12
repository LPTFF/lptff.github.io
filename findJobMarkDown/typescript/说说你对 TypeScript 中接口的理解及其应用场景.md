在 TypeScript 中，接口（Interface）是一种用于定义对象的结构和属性的规范。它们用于强制对象具有特定的属性、方法或方法签名，从而增加了代码的可读性、可维护性和类型安全性。接口提供了一种定义约定，让你能够在代码中明确地指定对象应该具有哪些属性和方法。

以下是对 TypeScript 中接口的理解以及其应用场景的说明，同时附有代码示例：

**接口的语法：**
```typescript
interface InterfaceName {
    property1: type;
    property2: type;
    // ...
    method1(): returnType;
    method2(param: paramType): returnType;
    // ...
}
```

**接口的应用场景：**
接口适用于以下情况：

1. **定义对象的结构：** 使用接口可以明确地定义对象应该有哪些属性，以及属性的类型。

2. **约束函数签名：** 接口可以定义函数的参数和返回值的类型，从而约束函数的实现。

3. **实现多态性：** 在面向对象编程中，接口可以用于实现多态性，使不同的类能够实现同一个接口，并具有相同的方法。

**示例代码：**

```typescript
// 声明一个用户接口
interface User {
    id: number;
    name: string;
    email: string;
}

// 使用接口作为函数参数和返回值的类型
function getUserInfo(user: User): string {
    return `ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`;
}

const currentUser: User = {
    id: 1,
    name: "Alice",
    email: "alice@example.com"
};

const userInfo: string = getUserInfo(currentUser);
console.log(userInfo);

// 声明一个动物接口，用于实现多态性
interface Animal {
    name: string;
    makeSound(): void;
}

class Dog implements Animal {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    makeSound() {
        console.log(`${this.name} barks.`);
    }
}

class Cat implements Animal {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    makeSound() {
        console.log(`${this.name} meows.`);
    }
}

const dog: Animal = new Dog("Buddy");
const cat: Animal = new Cat("Whiskers");

dog.makeSound(); // Output: Buddy barks.
cat.makeSound(); // Output: Whiskers meows.
```

在上面的示例中，`User` 接口定义了用户对象的结构，`Animal` 接口定义了动物对象的结构和方法。这些接口约定了对象应该有哪些属性和方法，使代码更加清晰，同时提供了类型检查和多态性的好处。