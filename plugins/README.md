# 插件文件夹

插件定义了应用程序中所有路由共有的行为。身份验证、缓存、模板，以及所有其他横切关注点都应该由放置在此文件夹中的插件来处理。

此文件夹中的文件通常通过 [`fastify-plugin`](https://github.com/fastify/fastify-plugin) 模块来定义，使它们成为非封装的。它们可以定义装饰器并设置钩子，这些装饰器和钩子随后将在应用程序的其余部分中使用。

查看更多：

* [插件使用指南](https://fastify.dev/docs/latest/Guides/Plugins-Guide/)
* [Fastify 装饰器](https://fastify.dev/docs/latest/Reference/Decorators/)
* [Fastify 生命周期](https://fastify.dev/docs/latest/Reference/Lifecycle/)
