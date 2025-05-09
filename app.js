/*
 * @Date: 2025-05-04 22:32:34
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-09 16:22:10
 * @FilePath: /my-test-fastify/app.js
 * @Description: Fastify应用程序入口文件
 */
'use strict'

require('dotenv').config(); // 加载 .env 文件
const path = require('node:path')
const AutoLoad = require('@fastify/autoload')

// 通过命令行参数传递选项来启用这些配置
const options = {
  // ignoreTrailingSlash: true
}

module.exports = async function (fastify, opts) {
  // 在这里放置你的自定义代码！
  fastify.addHook('onRequest', async (request, reply) => {
    // Some code
    request.log.info('onRequest')
    // reply.code(400)
    // throw new Error('Some error')
  })

  fastify.addHook('preParsing', async (request, reply, payload) => {
    // 其他代码
    request.log.info('preParsing');
    return payload
  })
  // 校验前处理
  fastify.addHook('preValidation', async (request, reply) => {
    request.log.info('preValidation');
    // const importantKey = await generateRandomString()
    request.body = { ...request.body, importantKey: '123456' }
  })
  // 校验后处理, user的Handler之前
  fastify.addHook('preHandler', async (request, reply) => {
    // 其他代码
    request.log.info('preHandler');
  })
  // 序列化前处理, 也就是发送到客户端之前
  fastify.addHook('preSerialization', async (request, reply, payload) => {
    request.log.info('preSerialization');
    // payload { message: '登录成功' }
    // 无论成功失败, 都会触发
    // 在这里是全局修改了, 所有的输出都带上了 ret: 'OK', msg: '请求成功'
    return payload
  })
  // onError 钩子可用于自定义错误日志，或当发生错误时添加特定的 header
  fastify.addHook('onError', async (request, reply, error) => {
    // 当自定义错误日志时有用处
    // 你不应该使用这个钩子去更新错误
  })
  // 使用 onSend 钩子可以改变 payload
  fastify.addHook('onSend', async (request, reply, payload) => {
    return payload
  })
  //
  fastify.addHook('onResponse', async (request, reply) => {
    // 其他代码
  })
  // 监测请求超时
  fastify.addHook('onTimeout', async (request, reply) => {
    // 其他代码
  })


  // 自定义一个可共享的JSON模式
  const customSchema = {
    $id: 'CustomResponse',
    type: 'object',
    properties: {
      message: { type: 'string' },
      status: { type: 'number' }
    }
  };

  // 注册自定义的模式
  fastify.addSchema(customSchema);

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
