/*
 * @Date: 2025-05-04 23:02:29
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-06 00:42:11
 * @FilePath: /my-test-fastify/plugins/auth.js
 * @Description: 认证和授权插件，提供JWT身份验证和CORS跨域支持
 */
'use strict'

const fp = require('fastify-plugin')

/**
 * 认证插件 - 集成JWT身份验证和CORS跨域支持
 *
 * @module plugins/auth
 * @requires @fastify/jwt - 提供JWT（JSON Web Token）身份验证功能
 * @requires @fastify/cors - 提供跨域资源共享(CORS)支持
 *
 * @description
 * 该插件为Fastify应用提供了完整的身份验证和授权解决方案：
 * 1. JWT身份验证：用于生成和验证访问令牌
 * 2. CORS配置：启用和配置跨域资源访问
 * 3. 身份验证中间件：提供可重用的身份验证装饰器
 *
 * @example
 * // 在路由中使用身份验证装饰器
 * fastify.get('/protected', {
 *   onRequest: [fastify.authenticate]
 * }, async function (request, reply) {
 *   return { user: request.user }
 * })
 */
module.exports = fp(async function (fastify, opts) {
    /**
     * 配置并注册JWT插件
     * @description
     * 配置JWT插件用于处理令牌的生成和验证
     * 在生产环境中，secret应通过环境变量注入，避免硬编码
     */
    await fastify.register(require('@fastify/jwt'), {
        secret: 'huyirui', // 在生产环境中应该使用环境变量
        sign: {
            expiresIn: '1d' // Token有效期为1天
        }
    })

    /**
     * 配置并注册CORS插件
     * @description
     * 配置CORS以允许跨域请求
     * 在生产环境中应该明确指定允许的源域名，而不是使用通配符
     */
    await fastify.register(require('@fastify/cors'), {
        origin: true, // 在生产环境中应该限制具体域名
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    })

    /**
     * 身份验证装饰器
     * @description
     * 用于保护需要认证的路由
     * 验证请求中的JWT令牌，确保用户已经登录
     *
     * @function authenticate
     * @async
     * @param {Object} request - Fastify请求对象
     * @param {Object} reply - Fastify响应对象
     * @throws {Error} 401 - 当令牌无效或过期时
     */
    fastify.decorate('authenticate', async function(request, reply) {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.code(401).send({ error: '未授权访问' })
        }
    })
})
