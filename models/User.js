/*
 * @Date: 2025-05-06 23:11:20
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-10 01:10:45
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
        this.userRepository = fastify.orm.getRepository('User')
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

        const user = this.userRepository.create({
            username,
            password: hashedPassword,
            email
        })

        await this.userRepository.save(user)
        const { password: _, ...userWithoutPassword } = user
        return userWithoutPassword
    }

    /**
     * 验证用户登录
     *
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<Object|null>} 验证成功返回用户信息，失败返回null
     */
    async verify(username, password) {
        const user = await this.userRepository.findOne({
            where: { username }
        })

        if (!user) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        const { password: _, ...userWithoutPassword } = user
        return userWithoutPassword
    }

    /**
     * 根据ID获取用户信息
     *
     * @param {number} userId - 用户ID
     * @returns {Promise<Object|null>} 用户信息（不包含密码）
     */
    async findById(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'username', 'email', 'created_at', 'role']
        })

        return user || null
    }
}

module.exports = User
