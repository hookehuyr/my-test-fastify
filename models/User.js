/*
 * @Date: 2025-05-06 23:11:20
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-06 23:11:21
 * @FilePath: /my-test-fastify/models/User.js
 * @Description: 文件描述
 */
'use strict'

const bcrypt = require('bcryptjs')

/**
 * User 模型类
 *
 * 该类封装了用户相关的数据库操作和业务逻辑，包括：
 * - 用户注册
 * - 用户登录验证
 * - 获取用户信息
 *
 * @class User
 */
class User {
    /**
     * 创建User实例
     * @param {Object} fastify - Fastify实例
     */
    constructor(fastify) {
        this.fastify = fastify
    }

    /**
     * 创建新用户
     *
     * @param {Object} userData - 用户数据
     * @param {string} userData.username - 用户名
     * @param {string} userData.password - 密码
     * @param {string} userData.email - 电子邮件
     * @returns {Promise<Object>} 创建成功的用户信息
     * @throws {Error} 当用户名或邮箱已存在时
     */
    async create(userData) {
        const { username, password, email } = userData
        const hashedPassword = await bcrypt.hash(password, 10)

        const connection = await this.fastify.mysql.getConnection()
        try {
            const [result] = await connection.query(
                'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                [username, hashedPassword, email]
            )
            return { id: result.insertId, username, email }
        } finally {
            connection.release()
        }
    }

    /**
     * 验证用户登录
     *
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<Object|null>} 验证成功返回用户信息，失败返回null
     */
    async verify(username, password) {
        const connection = await this.fastify.mysql.getConnection()
        try {
            const [rows] = await connection.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            )

            if (rows.length === 0) return null

            const user = rows[0]
            const valid = await bcrypt.compare(password, user.password)

            return valid ? user : null
        } finally {
            connection.release()
        }
    }

    /**
     * 根据ID获取用户信息
     *
     * @param {number} userId - 用户ID
     * @returns {Promise<Object|null>} 用户信息（不包含密码）
     */
    async findById(userId) {
        const connection = await this.fastify.mysql.getConnection()
        try {
            const [rows] = await connection.query(
                'SELECT id, username, email, created_at FROM users WHERE id = ?',
                [userId]
            )
            return rows.length > 0 ? rows[0] : null
        } finally {
            connection.release()
        }
    }
}

module.exports = User
