/*
 * @Date: 2025-05-04 23:02:29
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-04 23:02:30
 * @FilePath: /my-test-fastify/plugins/auth.js
 * @Description: 文件描述
 */
'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
    // 注册JWT插件
    await fastify.register(require('@fastify/jwt'), {
        secret: 'your-secret-key-here', // 在生产环境中应该使用环境变量
        sign: {
            expiresIn: '1d' // Token有效期为1天
        }
    })

    // 注册CORS插件
    await fastify.register(require('@fastify/cors'), {
        origin: true, // 在生产环境中应该限制具体域名
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    })

    // 添加身份验证装饰器
    fastify.decorate('authenticate', async function(request, reply) {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.code(401).send({ error: '未授权访问' })
        }
    })
})
