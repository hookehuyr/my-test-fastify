/*
 * @Date: 2025-05-04 22:32:34
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-10 13:59:59
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
    // 验证路由级别的访问限制
    request.log.info('request-user', request.user)
    request.log.info(reply.utility())
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

  // fastify.get('/', {
  //   schema: {
  //     tags: ['test'],
  //     description: 'notFound',
  //   }
  // }, (req, reply) => {
  //   reply.notFound()
  // })

  // fastify.get('/async', {
  //   schema: {
  //     tags: ['test'],
  //     description: 'httpErrors.notFound',
  //   }
  // }, async (req, reply) => {
  //   throw fastify.httpErrors.notFound()
  // })

  // fastify.get('/async-return', {
  //   schema: {
  //     tags: ['test'],
  //     description: 'async-return',
  //   }
  // }, async (req, reply) => {
  //   return reply.notFound()
  // })

  // fastify.get('/async', {
  //   schema: {
  //     response: {
  //       404: { $ref: 'HttpError' }
  //     }
  //   },
  //   handler: async (req, reply) => {
  //     return reply.notFound()
  //   }
  // })

  // 测试自定义 schema, 共享 schema 模式
  fastify.post('/custom-schema', {
    // onRequest: function (request, reply, done) {
    //   // 处理请求之前的逻辑
    //   const mySchema = fastify.getSchema('userWithPassword')
    //   console.warn(mySchema);
    //   done()
    // },
    schema: {
      body: { $ref: 'userWithPassword#' },
      response: {
        // 200: { $ref: 'CustomResponse' }
        200: { $ref: 'user#' }
      }
    }
  }, async (req, reply) => {
    // 动态生成响应对象
    // const response = {
    //   message: 'This is a custom response',
    //   status: 200
    // };
    const response = {
      username: 'This is a custom response',
      email: '1@1.com',
      status: 200
    };

    return reply.code(200).send(response)
  });

  fastify.get('/custom-error', {
    // schema: {
    //   response: {
    //     400: { $ref: 'HttpError' },
    //     500: { $ref: 'HttpError' }
    //   }
    // }
  }, async (req, reply) => {
    // 抛出自定义错误
    const err = fastify.httpErrors.createError(404, '这个视频不存在！')
    throw err
  });

  // 测试传递一个配置对象,还有鉴权操作相关问题, 权限问题处理
  fastify.get('/admin', {
    onRequest: [fastify.authenticate], // 先验证身份
    config: {
      role: 'admin'
    },
    preHandler: async function (request, reply) {
      // 检查用户角色
      if (request.user.role !== reply.routeOptions.config.role) {
        reply.code(403).send({ error: '需要管理员权限' })
        return
      }
      request.log.info('用户是管理员')
    }
  }, async (request, reply) => {
    return '这是管理员页面'
  })
}
