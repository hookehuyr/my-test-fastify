/*
 * @Date: 2025-05-04 22:32:34
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-10 13:33:42
 * @FilePath: /my-test-fastify/plugins/support.js
 * @Description: 文件描述
 */
'use strict'

const fp = require('fastify-plugin')

/**
 * 这是一个示例支持插件，展示了如何使用 fastify-plugin 来创建和导出装饰器
 *
 * @description
 * 该插件演示了如何使用 fastify-plugin 将装饰器导出到外部作用域。
 * 通过 fastify-plugin 包装，插件中定义的装饰器可以在应用的其他部分被访问和使用。
 *
 * @example
 * // 在其他路由或插件中使用该装饰器
 * fastify.someSupport() // 返回 'hugs'
 *
 * @see https://github.com/fastify/fastify-plugin
 */

module.exports = fp(async function (fastify, opts) {
  /**
   * 一个简单的装饰器函数示例
   *
   * @returns {string} 返回固定字符串 'hugs'
   */
  fastify.decorate('someSupport', function () {
    return 'hugs'
  })

  // 装饰 fastify.reply 对象
  fastify.decorateReply('utility', function () {
    // 新功能的代码
    return 'reply-utility'
  })

  // 装饰 fastify.request 对象
  fastify.decorateRequest('utility', function () {
    // 新功能的代码
    return 'request-utility'
  })

  // 注册基础 schema
  fastify.addSchema({
    $id: 'user',
    type: 'object',
    properties: {
      username: { type: 'string' },
      email: { type: 'string', format: 'email' }
    }
  });

  // 注册扩展 schema（复用 user 并添加 password）
  fastify.addSchema({
    $id: 'userWithPassword',
    allOf: [
      { $ref: 'user#' },
      {
        type: 'object',
        properties: {
          password: { type: 'string', minLength: 8 }
        }
      }
    ]
  });
})
