'use strict'

/**
 * 用户管理模块
 *
 * 该模块提供用户相关的API接口，包括：
 * - 用户注册：创建新用户账户
 * - 用户登录：验证用户身份并生成JWT令牌
 * - 获取用户信息：获取当前登录用户的详细信息
 *
 * @module routes/users
 * @requires bcryptjs - 用于密码加密和验证
 */

const bcrypt = require('bcryptjs')

module.exports = async function (fastify, opts) {
    /**
     * 用户注册接口
     *
     * @route POST /register
     * @param {string} username - 用户名，至少3个字符
     * @param {string} password - 密码，至少6个字符
     * @param {string} email - 有效的电子邮件地址
     * @returns {object} 包含注册结果的消息
     * @throws {400} 当用户名或邮箱已存在时
     */
    fastify.post('/register', {
        schema: {
            body: {
                type: 'object',
                required: ['username', 'password', 'email'],
                properties: {
                    username: { type: 'string', minLength: 3 },
                    password: { type: 'string', minLength: 6 },
                    email: { type: 'string', format: 'email' }
                }
            }
        }
    }, async (request, reply) => {
        const { username, password, email } = request.body
        const hashedPassword = await bcrypt.hash(password, 10)

        try {
            const connection = await fastify.mysql.getConnection()
            try {
                await connection.query(
                    'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                    [username, hashedPassword, email]
                )
                reply.code(201).send({ message: '注册成功' })
            } finally {
                connection.release()
            }
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
     * @route POST /login
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {object} 包含JWT令牌的对象
     * @throws {401} 当用户名或密码错误时
     */
    fastify.post('/login', {
        schema: {
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

        const connection = await fastify.mysql.getConnection()
        try {
            const [rows] = await connection.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            )

            if (rows.length === 0) {
                reply.code(401).send({ error: '用户名或密码错误' })
                return
            }

            const user = rows[0]
            const valid = await bcrypt.compare(password, user.password)

            if (!valid) {
                reply.code(401).send({ error: '用户名或密码错误' })
                return
            }

            // 生成JWT令牌
            const token = fastify.jwt.sign({ id: user.id, username: user.username })
            reply.send({ token })
        } finally {
            connection.release()
        }
    })

    /**
     * 获取当前登录用户信息接口
     *
     * @route GET /me
     * @authentication 需要JWT令牌验证
     * @returns {object} 用户详细信息（不包含密码）
     * @throws {404} 当用户不存在时
     */
    fastify.get('/me', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const connection = await fastify.mysql.getConnection()
        try {
            const [rows] = await connection.query(
                'SELECT id, username, email, created_at FROM users WHERE id = ?',
                [request.user.id]
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
