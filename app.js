/*
 * @Date: 2025-05-04 22:32:34
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-11 00:45:18
 * @FilePath: /my-test-fastify/app.js
 * @Description: Fastify应用程序入口文件
 */
'use strict'

require('dotenv').config(); // 加载 .env 文件
require('module-alias/register'); // 注册路径别名
const path = require('node:path')
const fs = require('node:fs')
const AutoLoad = require('@fastify/autoload')
const pino = require('pino') // 导入pino日志库

// 确保日志目录存在并检查写入权限
const logDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// 检查日志目录的写入权限
try {
  const testFile = path.join(logDir, '.write-test')
  fs.writeFileSync(testFile, '')
  fs.unlinkSync(testFile)
} catch (error) {
  console.error('错误：无法写入日志目录，请检查目录权限：', error.message)
  process.exit(1)
}

// TODO: 不知道原因始终写不进去日志
// 配置日志实例
const logger = pino.multistream([
  // 控制台输出（带美化）
  {
    level: 'info',
    stream: pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    })
  },
  // 文件输出，按日期轮转
  {
    level: 'info',
    stream: pino.destination({
      dest: path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`),
      sync: false,
      mkdir: true
    })
  }
])

// 应用配置选项
const options = {
  // ignoreTrailingSlash: true,
  logger: logger
}

module.exports = async function (fastify, opts) {
  // 在这里放置你的自定义代码！
  // 在Fastify应用程序中，钩子（hooks）需要在注册插件和路由之前定义，这样它们才能对所有后续的请求生效
  // fastify.addHook('onRequest', async (request, reply) => {
  //   // Some code
  //   request.log.info('onRequest')
  //   // reply.code(400)
  //   // throw new Error('Some error')
  //   request.log.info(fastify.someSupport())
  // })

  // fastify.addHook('preParsing', async (request, reply, payload) => {
  //   // 其他代码
  //   request.log.info('preParsing');
  //   return payload
  // })
  // // 校验前处理
  // fastify.addHook('preValidation', async (request, reply) => {
  //   request.log.info('preValidation');
  //   // const importantKey = await generateRandomString()
  //   request.body = { ...request.body, importantKey: '123456' }
  // })
  // // 校验后处理, user的Handler之前
  // fastify.addHook('preHandler', async (request, reply) => {
  //   // 其他代码
  //   request.log.info('preHandler');
  // })
  // // 序列化前处理, 也就是发送到客户端之前
  // fastify.addHook('preSerialization', async (request, reply, payload) => {
  //   request.log.info('preSerialization');
  //   // payload { message: '登录成功' }
  //   // 无论成功失败, 都会触发
  //   // 在这里是全局修改了, 所有的输出都带上了 ret: 'OK', msg: '请求成功'
  //   return payload
  // })
  // // onError 钩子可用于自定义错误日志，或当发生错误时添加特定的 header
  // fastify.addHook('onError', async (request, reply, error) => {
  //   // 当自定义错误日志时有用处
  //   // 你不应该使用这个钩子去更新错误
  // })
  // // 使用 onSend 钩子可以改变 payload
  // fastify.addHook('onSend', async (request, reply, payload) => {
  //   return payload
  // })
  // //
  // fastify.addHook('onResponse', async (request, reply) => {
  //   // 其他代码
  // })
  // // 监测请求超时
  // fastify.addHook('onTimeout', async (request, reply) => {
  //   // 其他代码
  // })


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

  // 加载目录中的静态文件
  fastify.register(require('@fastify/static'), {
    // root: path.join(__dirname, 'public'),
    root: path.join(__dirname, 'dist'), // dist 目录是 vite 打包后的文件
    prefix: '/', // optional: default '/'
    // constraints: { host: 'example.com' } // optional: default {}
  })
}

module.exports.options = options
