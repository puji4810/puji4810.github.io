---
layout:     post
title:      "Singleton"
subtitle:   "一些关于单例的点"
date:       2025-12-26 00:00:00
author:     "Puji"
header-img: "img/hero.svg"
catalog: true
tags:
    - CPP
    - Design Pattern
summary: "Some notes about Singleton pattern in C++."
---

我们现在常常见到的单例模式的实现，也是来自 [CppCoreGuidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#i3-avoid-singletons)：

```cpp
X& myX()
{
    static X my_x {3};
    return my_x;
}
```

应该是最简单的一种实现了，简单且线程安全，在第一次执行时才会初始化对象。
<!-- more -->
然而，`static` 的析构顺序是未保证的，当多个单例相互具有依赖的时候，这种方式就无能为例了。

`CppCoreGuidelines` 里面也提到了

> Note that the initialization of a local `static` does not imply a race condition. However, if the destruction of `X` involves an operation that needs to be synchronized we must use a less simple solution.

可以使用:

```cpp
X& myX()
{
    static auto p = new X {3};
    return *p;  // potential leak
}
```

如果不调用 `delete`，那么对象在程序的整个生命周期内，一直有效，就不会收到析构顺序的影响了。
Goole的代码中似乎常有这样的用法，例如 [LevelDB](https://github.com/google/leveldb/blob/ac691084fdc5546421a55b25e7653d450e5a25fb/util/no_destructor.h#L12-L48) 中的 `NoDestructor` :

```cpp
namespace leveldb {

// Wraps an instance whose destructor is never called.
//
// This is intended for use with function-level static variables.
template <typename InstanceType>
class NoDestructor {
 public:
  template <typename... ConstructorArgTypes>
  explicit NoDestructor(ConstructorArgTypes&&... constructor_args) {
    static_assert(sizeof(instance_storage_) >= sizeof(InstanceType),
                  "instance_storage_ is not large enough to hold the instance");
    static_assert(std::is_standard_layout_v<NoDestructor<InstanceType>>);
    static_assert(
        offsetof(NoDestructor, instance_storage_) % alignof(InstanceType) == 0,
        "instance_storage_ does not meet the instance's alignment requirement");
    static_assert(
        alignof(NoDestructor<InstanceType>) % alignof(InstanceType) == 0,
        "instance_storage_ does not meet the instance's alignment requirement");
    new (instance_storage_)
        InstanceType(std::forward<ConstructorArgTypes>(constructor_args)...);
  }

  ~NoDestructor() = default;

  NoDestructor(const NoDestructor&) = delete;
  NoDestructor& operator=(const NoDestructor&) = delete;

  InstanceType* get() {
    return reinterpret_cast<InstanceType*>(&instance_storage_);
  }

 private:
  alignas(InstanceType) char instance_storage_[sizeof(InstanceType)];
};

}  // namespace leveldb
```

就是不调用析构函数，希望对象在程序的整个生命周期都有效。

前几天在微信公众号上看见一篇有关 [union](https://mp.weixin.qq.com/s/DHpPOpcUOQ-ebYLlxkhIrQ?poc_token=HCgbTmmjhKJYuYT2idiMgPceuvp7zxE-kDVcvpjN) 的用法的帖子，原来 `union` 也能有类似的作用。

> Absent default member initializers, if any non-static data member of a union has a non-trivial default constructor, copy constructor, move constructor, copy assignment operator, move assignment operator, or destructor, the corresponding member function of the union will be implicitly deleted unless it is user-provided.
> 在没有默认成员初始化器的情况下，如果 union 的任一非静态数据成员具有非平凡的默认构造函数、拷贝构造函数、移动构造函数、拷贝赋值运行符、移动赋值运算符或析构函数，则其相应的成员函数将被隐式删除（除非用户显式定义）。

使用的例子是：

```cpp
namespace {

template<typename T>
struct constant_init {
    union {
        T obj;
    };
    constexpr constant_init() : obj() {}

    ~constant_init() { /* do nothing, union object is not destroyed */}
};

struct some_class {};

constant_init<some_class> some_class_instantance {};

} // anonymous namespace
```

`union` 里面根本不会调用 `T` 的析构函数。

又有方法，其实就类似上面 CppCoreGuidelines 里面说的第二种方法了:

```cpp
struct T { /*...*/ };

T& instance() {
  static std::once_flag flag;
  alignas(T) static unsigned char buf[sizeof(T)];
  static T* p = nullptr;

  std::call_once(flag, []{
    p = new (buf) T();
  });

  return *p;
}
```

使用 `placement new` 在一个局部的 `buf` 里面构造了一个对象，然后返回这个对象。只要我们不去调用析构函数就不会进行析构。
