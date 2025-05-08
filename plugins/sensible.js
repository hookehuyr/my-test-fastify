/*
 * @Date: 2025-05-04 22:32:34
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-08 16:21:28
 * @FilePath: /my-test-fastify/plugins/sensible.js
 * @Description: 文件描述
 */
'use strict'

const fp = require('fastify-plugin')

/**
 * Fastify Sensible 插件为应用添加了一系列实用的工具函数和错误处理能力
 *
 * 主要功能：
 * 1. HTTP 错误处理：提供了标准的 4xx 和 5xx HTTP 错误构造器
 * 2. 响应工具：
 *    - reply.notFound(), reply.badRequest() 等便捷响应方法
 *    - reply.vary() 用于设置 Vary 响应头
 *    - reply.cacheControl() 用于配置缓存控制
 * 3. 请求断言：提供 fastify.assert() 方法用于请求参数验证
 *
 * @param {FastifyInstance} fastify - Fastify 实例
 * @param {Object} opts - 插件配置选项
 * @param {boolean} [opts.errorHandler=true] - 是否启用自定义错误处理器
 * @param {string} [opts.sharedSchemaId] - HTTP 错误的共享 JSON Schema ID
 *
 * @see https://github.com/fastify/fastify-sensible
 */
module.exports = fp(async function (fastify, opts) {
  fastify.register(require('@fastify/sensible'), {
    sharedSchemaId: 'HttpError',
    errorHandler: false
  })
})
