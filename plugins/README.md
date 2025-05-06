# 插件文件夹

插件定义了应用程序中所有路由共有的行为。身份验证、缓存、模板，以及所有其他横切关注点都应该由放置在此文件夹中的插件来处理。

此文件夹中的文件通常通过 [`fastify-plugin`](https://github.com/fastify/fastify-plugin) 模块来定义，使它们成为非封装的。它们可以定义装饰器并设置钩子，这些装饰器和钩子随后将在应用程序的其余部分中使用。

## 当前插件列表

### auth.js
认证和授权插件，提供以下功能：
- JWT身份验证
- Cookie支持
- CORS跨域资源共享支持
- 用户认证和授权管理

### error-handler.js
全局错误处理插件，提供：
- 统一的错误处理机制
- 字段验证错误处理
- 用户友好的中文错误提示
- HTTP 400错误响应处理

### mysql.js
MySQL数据库插件，实现：
- 数据库连接管理
- 表结构初始化
- Promise API支持
- 数据库操作封装

### sensible.js
实用工具插件，提供：
- HTTP错误处理（4xx和5xx）
- 便捷响应方法（notFound, badRequest等）
- 响应头管理（Vary, Cache-Control）
- 其他实用工具函数

### support.js
示例支持插件，展示：
- 如何创建和导出装饰器
- fastify-plugin的使用方法
- 插件作用域管理

### swagger.js
API文档插件，配置：
- OpenAPI 3.0.0规范
- Swagger UI界面（/documentation）
- API信息和服务器配置
- 通用错误响应模型

## 参考文档

* [插件使用指南](https://fastify.dev/docs/latest/Guides/Plugins-Guide/)
* [Fastify 装饰器](https://fastify.dev/docs/latest/Reference/Decorators/)
* [Fastify 生命周期](https://fastify.dev/docs/latest/Reference/Lifecycle/)
