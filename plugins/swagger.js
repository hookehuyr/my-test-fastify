/*
 * @Date: 2025-05-05 17:00:00
 * @Description: Swagger插件配置文件
 */
'use strict'

const fp = require('fastify-plugin')

/**
 * 在 `swagger.js` 中配置了以下功能：
 * - 使用OpenAPI 3.0.0规范
 * - 配置了基本的API信息，包括标题、描述和版本
 * - 设置了开发服务器地址，匹配你的API前缀 /api/v1
 * - 添加了API标签分类，方便接口管理
 * - 定义了通用的错误响应模型
 * - 集成了Swagger UI，可以通过 /documentation 路径访问API文档 3
 * 你现在可以通过以下步骤使用Swagger文档：

 * 1. 访问 http://localhost:3000/documentation 查看API文档界面
 * 2. 通过 http://localhost:3000/documentation/json 获取OpenAPI规范的JSON格式
 * 3. 通过 http://localhost:3000/documentation/yaml 获取OpenAPI规范的YAML格式
 * 在编写路由时，只需要按照OpenAPI规范在路由配置中添加schema即可自动生成API文档。
*/

/**
 * 配置Swagger文档生成器插件
 * @param {Object} fastify - Fastify实例
 * @param {Object} opts - 配置选项
 */
module.exports = fp(async function (fastify, opts) {
  await fastify.register(require('@fastify/swagger'), {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Fastify API',
        description: 'API 文档',
        version: '1.0.0'
      },
      // 开发服务器地址
      servers: [
        {
          url: 'http://localhost:3000/api/v1',
          description: 'Development server'
        }
      ],
      // 标签分类
      tags: [
        { name: 'root', description: '根路由相关接口' },
        { name: 'users', description: '用户相关接口' },
        { name: 'products', description: '产品相关接口' },
        { name: 'orders', description: '订单相关接口' },
      ],
      // 通用的错误响应模型
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    }
  })

  // 注册Swagger UI插件
  await fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/doc', // 访问路径
    uiConfig: {
      // 文档展开方式
      docExpansion: 'list',
      // 支持深度链接
      deepLinking: true
    },
    // 启用静态CSP
    staticCSP: true
  })
})
