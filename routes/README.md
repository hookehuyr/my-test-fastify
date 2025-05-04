# 路由文件夹

路由定义了应用程序中的访问路径。
Fastify的结构支持模块化单体架构方法，您的
应用程序被组织成独立的、自包含的模块。
这有助于更容易的扩展和未来向微服务架构的转型。
将来您可能希望独立部署其中的一些模块。

在这个文件夹中，您应该定义所有用于定义Web应用程序
端点的路由。
每个服务都是一个[Fastify
插件](https://fastify.dev/docs/latest/Reference/Plugins/)，它是
封装的（可以有自己的独立插件），并且
通常存储在一个文件中；请注意要逻辑地组织您的路由，
例如，所有 `/users` 路由都放在 `users.js` 文件中。我们已经为您添加了
一个带有 '/' 根路由的 `root.js` 文件。

如果单个文件变得太大，可以创建一个文件夹并在其中添加 `index.js` 文件：
这个文件必须是一个Fastify插件，它将被应用程序
自动加载。您现在可以在该文件夹中添加任意数量的文件。
通过这种方式，您可以在单个单体应用中创建复杂的路由，
并最终将它们提取出来。

如果您需要在路由之间共享功能，请将该
功能放入 `plugins` 文件夹中，并通过
[装饰器](https://fastify.dev/docs/latest/Reference/Decorators/)来共享。

如果您对使用 `async/await` 编写路由感到困惑，您最好
查看[Promise解析](https://fastify.dev/docs/latest/Reference/Routes/#promise-resolution)以了解更多详情。
