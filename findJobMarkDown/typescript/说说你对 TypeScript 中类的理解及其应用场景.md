在 TypeScript 中，类（Class）是一种面向对象编程的核心概念，它允许你通过定义属性和方法来创建自定义的数据类型。类可以看作是一种模板，通过实例化类可以创建具体的对象。类提供了封装、继承和多态等面向对象编程的特性，使得代码的组织和复用更加方便和灵活。

以下是对 TypeScript 中类的理解以及其应用场景的说明，同时附有代码示例：

**类的语法：**
```typescript
class ClassName {
    constructor(parameters) {
        // 构造函数
    }

    method1() {
        // 方法1
    }

    method2() {
        // 方法2
    }

    // ...
}
```

**类的应用场景：**
类适用于以下情况：

1. **封装属性和方法：** 类可以封装数据和相关的操作方法，将它们组织成一个独立的单元，提高代码的可读性和维护性。

2. **创建对象实例：** 类可以被实例化，从而创建具体的对象，每个对象都具有类定义的属性和方法。

3. **继承和多态：** 类支持继承，子类可以继承父类的属性和方法，从而实现代码的重用和扩展。多态性则使不同的类可以实现相同的接口，并具有相同的方法。

**示例代码：**

```typescript
// 声明一个人类的类
class Person {
    name: string;
    age: number;

    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }

    sayHello() {
        console.log(`Hello, my name is ${this.name} and I am ${this.age} years old.`);
    }
}

// 创建人类的实例
const person1: Person = new Person("Alice", 25);
const person2: Person = new Person("Bob", 30);

person1.sayHello(); // Output: Hello, my name is Alice and I am 25 years old.
person2.sayHello(); // Output: Hello, my name is Bob and I am 30 years old.

// 继承示例：声明一个学生类继承自人类
class Student extends Person {
    studentId: number;

    constructor(name: string, age: number, studentId: number) {
        super(name, age);
        this.studentId = studentId;
    }

    sayHello() {
        console.log(`Hello, I am a student. My name is ${this.name}, I am ${this.age} years old, and my student ID is ${this.studentId}.`);
    }
}

const student: Student = new Student("Charlie", 20, 12345);
student.sayHello(); // Output: Hello, I am a student. My name is Charlie, I am 20 years old, and my student ID is 12345.
```

在上面的示例中，`Person` 类用于表示人的属性和方法，`Student` 类继承自 `Person` 类，同时扩展了一个学生ID属性和重写了 `sayHello` 方法。这个例子展示了类的封装、继承和多态性的特点。