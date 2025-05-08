/*
 * @Date: 2025-05-04 22:32:34
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-08 00:32:45
 * @FilePath: /my-test-fastify/app.js
 * @Description: Fastify应用程序入口文件
 */
'use strict'

const path = require('node:path')
const AutoLoad = require('@fastify/autoload')

// 通过命令行参数传递选项来启用这些配置
const options = {}

module.exports = async function (fastify, opts) {
  // 在这里放置你的自定义代码！
  fastify.addHook('onRequest', async (request, reply) => {
    // Some code
    request.log.info('±onRequest±')
  })

  // 请勿修改以下代码行

  // 加载plugins目录中定义的所有插件
  // 这些插件应该是可以在整个应用程序中重复使用的支持插件
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts)
  })

  // 加载routes目录中定义的所有路由
  // 在这些文件中定义你的路由
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({ prefix:'/api/v1' }, opts)
  })
}

module.exports.options = options
