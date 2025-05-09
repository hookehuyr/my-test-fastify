/*
 * @Date: 2025-05-04 23:02:29
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-09 14:43:55
 * @FilePath: /my-test-fastify/plugins/auth.js
 * @Description: 认证和授权插件，提供JWT身份验证和CORS跨域支持
 */
'use strict'

const fp = require('fastify-plugin')

/**
 * 认证插件 - 集成JWT身份验证、Cookie支持和CORS跨域支持
 *
 * @module plugins/auth
 * @requires @fastify/jwt - 提供JWT（JSON Web Token）身份验证功能
 * @requires @fastify/cors - 提供跨域资源共享(CORS)支持
 * @requires @fastify/cookie - 提供Cookie支持
 *
 * @description
 * 该插件为Fastify应用提供了完整的身份验证和授权解决方案：
 * 1. JWT身份验证：用于生成和验证访问令牌
 * 2. Cookie支持：用于管理客户端Cookie
 * 3. CORS配置：启用和配置跨域资源访问
 * 4. 身份验证中间件：提供可重用的身份验证装饰器
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
    // 注册cookie插件, 用于处理jwt的token
    await fastify.register(require('@fastify/cookie'), {
        secret: 'huyirui', // 在生产环境中应该使用环境变量
        hook: 'onRequest', // 在每个请求上执行cookie解析
    })

    // 添加全局onRequest钩子，用于自动注入token到请求头
    fastify.addHook('onRequest', async (request, reply) => {
        // 跳过登录和注册路由
        if (request.routerPath === '/login' || request.routerPath === '/register') return

        // 如果请求头中已经有Authorization，则不需要注入
        if (request.headers.authorization) return

        // 从cookie中获取token
        const cookieToken = request.cookies.token
        if (cookieToken) {
            // 将token注入到请求头中
            request.headers.authorization = `Bearer ${cookieToken}`
        }

    })

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
        },
        cookie: {
            cookieName: 'token',
            signed: false
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
     * 身份验证装饰器 - 用于验证用户的身份认证状态
     *
     * @description
     * 该装饰器实现了双重身份验证机制：
     * 1. 首先尝试从请求头中验证JWT令牌
     * 2. 如果请求头验证失败，则尝试从cookie中获取并验证token
     *
     * 验证成功后，用户信息将被添加到request.user中，以便后续路由处理程序使用
     *
     * @function authenticate
     * @async
     * @param {Object} request - Fastify请求对象
     * @param {Object} request.headers - 请求头对象，可能包含Authorization头
     * @param {Object} request.cookies - 请求cookie对象
     * @param {string} request.cookies.token - JWT令牌cookie
     * @param {Object} reply - Fastify响应对象
     * @returns {Promise<void>} 验证成功时无返回值
     * @throws {Error} 401 - 在以下情况会抛出未授权错误：
     *   - 请求头中的JWT令牌无效或过期
     *   - Cookie中的token无效或过期
     *   - 未提供任何有效的认证信息
     *
     * @example
     * // 在路由中使用装饰器
     * fastify.get('/protected-route', {
     *   onRequest: [fastify.authenticate]
     * }, async (request, reply) => {
     *   // 此时request.user已包含解码后的用户信息
     *   return { user: request.user }
     * })
     */
    fastify.decorate('authenticate', async function(request, reply) {
        try {
            // 首先尝试验证请求头中的JWT令牌
            await request.jwtVerify()
        } catch (err) {
            // 如果请求头验证失败，检查Authorization头
            request.log.warn(authHeader)
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7) // 去掉'Bearer '前缀
                try {
                    // 验证Authorization头中的token
                    const decoded = await fastify.jwt.verify(token)
                    request.user = decoded
                    return // 验证成功，直接返回
                } catch (authErr) {
                    // Authorization头中的token无效
                    reply.code(401).send({ error: '未授权访问' })
                }
            }

            // 如果Authorization头验证失败，尝试从cookie中获取token
            const cookieToken = request.cookies.token
            if (cookieToken) {
                try {
                    // 验证cookie中的token并解码用户信息
                    const decoded = await fastify.jwt.verify(cookieToken)
                    request.user = decoded
                } catch (cookieErr) {
                    // cookie中的token无效或过期
                    reply.code(401).send({ error: '未授权访问' })
                }
            } else {
                // 未提供任何有效的认证信息
                reply.code(401).send({ error: '未授权访问' })
            }
        }
    })
})
