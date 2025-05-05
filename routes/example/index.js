/*
 * @Date: 2025-05-04 22:32:34
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-06 01:00:29
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

  fastify.get('/me', {
    schema: {
      response: { // 响应的数据过滤
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
          }
        }
      }
    }
  }, async (request, reply) => {
      const { id } = request.query;
      const connection = await fastify.mysql.getConnection()
      try {
          const [rows] = await connection.query(
              'SELECT id, username, email, created_at FROM users WHERE id = ?',
              [id]
          )
          if (rows.length === 0) {
              reply.code(404).send({ error: '用户不存在' })
              return
          }
          reply.send(rows[0])
      } finally {
          connection.release()
      }
  })
}
