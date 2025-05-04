'use strict'

const bcrypt = require('bcryptjs')

module.exports = async function (fastify, opts) {
    // 用户注册
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

    // 用户登录
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

    // 获取用户信息
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
