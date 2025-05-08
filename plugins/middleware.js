'use strict'

const fp = require('fastify-plugin')

/**
 * 中间件引入,还不知道怎么用,到时候遇到再说
 * 文档 https://github.com/fastify/fastify-express
 *
 */

module.exports = fp(async function (fastify, opts) {
  fastify.register(require('@fastify/express'))
})
