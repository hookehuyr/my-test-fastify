/*
 * @Date: 2025-05-04 22:32:34
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-05 22:55:05
 * @FilePath: /my-test-fastify/routes/example/index.js
 * @Description: 文件描述
 */
'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/test', {
    schema: {
      query: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
        }
      }
    }
  }, async function (request, reply) {
    return 'this is an example'
  })
}
