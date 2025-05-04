/*
 * @Date: 2025-05-04 22:32:34
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-05 00:01:04
 * @FilePath: /my-test-fastify/routes/root.js
 * @Description: 文件描述
 */
'use strict'

/**
 * 根路由处理器
 * 这个模块负责处理应用程序的根路径('/')的请求
 * @param {Object} fastify - Fastify实例对象
 * @param {Object} opts - 路由配置选项
 */
module.exports = async function (fastify, opts) {
  // 注册GET方法处理根路径('/')的请求
  // 当访问根路径时，返回一个简单的JSON对象，通常用于API健康检查
  fastify.get('/', async function (request, reply) {
    return { root: true }
  })
}
