'use strict'

/**
 * 用户管理模块
 *
 * 该模块提供用户相关的API接口，包括：
 * - 用户注册：创建新用户账户
 * - 用户登录：验证用户身份并生成JWT令牌
 * - 获取用户信息：获取当前登录用户的详细信息
 *
 * 安全性考虑：
 * - 密码加密：使用bcrypt进行密码哈希
 * - JWT认证：使用安全的token机制
 * - Cookie安全：启用httpOnly和secure选项
 * - CSRF防护：使用strict SameSite策略
 *
 * 性能优化：
 * - 数据库连接：使用连接池管理
 * - 错误处理：统一的错误响应格式
 * - 输入验证：使用JSON Schema进行请求验证
 *
 * @module routes/users
 * @requires ../models/User - 用户模型类
 */

const path = require('path')
const User = require(path.join(__dirname, '../../models/User'))

module.exports = async function (fastify, opts) {
    /**
     * 用户注册接口
     *
     * 该接口处理新用户注册请求，执行以下操作：
     * 1. 验证用户输入数据的合法性
     * 2. 检查用户名和邮箱是否已存在
     * 3. 对密码进行加密处理
     * 4. 创建新用户记录
     *
     * @route POST /register
     * @param {string} username - 用户名，至少3个字符
     * @param {string} password - 密码，至少6个字符
     * @param {string} email - 有效的电子邮件地址
     * @returns {object} 201 - 包含注册结果的消息 {message: '注册成功'}
     * @throws {400} 当用户名或邮箱已存在时 {error: '用户名或邮箱已存在'}
     * @throws {500} 服务器内部错误
     *
     * Schema属性说明：
     * - type: 属性的数据类型
     * - minLength: 字符串最小长度限制
     * - format: 预定义的格式验证规则
     * - required: 必填字段列表
     */
    fastify.post('/register', {
        schema: {
            tags: ['users'],
            description: '用户注册接口',
            // 定义请求体的结构
            body: {
                type: 'object',
                required: ['username', 'password', 'email'],
                properties: {
                    username: { type: 'string', minLength: 3 },
                    password: { type: 'string', minLength: 6 },
                    email: { type: 'string', format: 'email' }
                },
            }
        },
    }, async (request, reply) => {
        try {
            const userModel = new User(fastify)
            await userModel.create(request.body)
            reply.code(201).send({ message: '注册成功' })
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                reply.code(400).send({ error: '用户名或邮箱已存在' })
            } else {
                throw err
            }
        }
    })

    /**
     * 用户登录接口
     *
     * 该接口处理用户登录请求，执行以下操作：
     * 1. 验证用户凭证
     * 2. 生成JWT访问令牌
     * 3. 设置安全的HTTP-only cookie
     *
     * @route POST /login
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {object} 200 - 登录成功响应 {message: '登录成功'}
     * @throws {401} 当用户名或密码错误时 {error: '用户名或密码错误'}
     * @throws {500} 服务器内部错误
     *
     * 安全特性：
     * - 使用bcrypt验证密码
     * - JWT令牌用于后续请求认证
     * - 安全的cookie配置防止XSS和CSRF攻击
     */
    fastify.post('/login', {
        schema: {
            tags: ['users'],
            description: '用户登录接口',
            body: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        const { username, password } = request.body
        const userModel = new User(fastify)
        const user = await userModel.verify(username, password)

        if (!user) {
            reply.code(401).send({ error: '用户名或密码错误' })
            return
        }

        // 生成JWT令牌, 包含用户ID和用户名
        const token = fastify.jwt.sign({ id: user.id, username: user.username, role: user.role })

        // 设置cookie并发送响应
        return reply
            .setCookie('token', token, {
                path: '/',
                httpOnly: true, // 防止客户端JavaScript访问
                secure: process.env.NODE_ENV === 'production', // 在生产环境中只通过HTTPS发送
                sameSite: 'strict' // 防止CSRF攻击
            })
            .send({
                message: '登录成功',
                token: token
            })
    })

    /**
     * 获取当前登录用户信息接口
     *
     * 该接口返回当前认证用户的详细信息，执行以下操作：
     * 1. 验证JWT令牌
     * 2. 获取用户详细信息
     * 3. 过滤敏感数据（如密码）
     *
     * @route GET /me
     * @authentication 需要JWT令牌验证
     * @returns {object} 200 - 用户详细信息 {id, username, email, created_at}
     * @throws {401} 未提供有效的认证令牌
     * @throws {404} 当用户不存在时 {error: '用户不存在'}
     * @throws {500} 服务器内部错误
     *
     * 安全考虑：
     * - 使用认证中间件保护路由
     * - 仅返回非敏感用户信息
     * - 验证用户ID的有效性
     */

    // 定义一个 preHandler 函数
    const myPreHandler = async function(request, reply) {
        // 使用fastify实例的logger来记录日志
        request.log.warn('Before handler is running');
    };

    fastify.get('/me', {
        // 全局钩子, 在请求进入服务器的早期阶段执行
        onRequest: [fastify.authenticate],
        // 路由特定的钩子，在路由匹配之后、路由处理函数执行之前执行.
        // preHandler: [firstPreHandler, secondPreHandler]
        preHandler: myPreHandler,
        schema: {
            tags: ['users'],
            description: '获取当前登录用户信息接口',
        },
        config: {
            output: 'hello world!'
        }
    }, async (request, reply) => {
        const userModel = new User(fastify)
        const user = await userModel.findById(request.user.id)

        request.log.warn(user)

        // 测试传递一个配置对象
        request.log.info(reply.routeOptions.config.output)

        if (!user) {
            return reply.code(404).send({ error: '用户不存在' })
        }
        return reply.send(user)
    })
}
