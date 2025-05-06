/*
 * @Date: 2025-05-06 23:11:20
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-06 23:11:21
 * @FilePath: /my-test-fastify/models/Product.js
 * @Description: 文件描述
 */
'use strict'

/**
 * Product 模型类
 *
 * 该类封装了商品相关的数据库操作和业务逻辑，包括：
 * - 创建商品
 * - 获取商品列表
 * - 获取单个商品
 * - 更新商品
 * - 删除商品
 *
 * @class Product
 */
class Product {
    /**
     * 创建Product实例
     * @param {Object} fastify - Fastify实例
     */
    constructor(fastify) {
        this.fastify = fastify
    }

    /**
     * 创建新商品
     *
     * @param {Object} productData - 商品数据
     * @param {string} productData.name - 商品名称
     * @param {string} [productData.description] - 商品描述（可选）
     * @param {number} productData.price - 商品价格
     * @param {number} productData.stock - 商品库存
     * @returns {Promise<Object>} 创建成功的商品信息
     */
    async create(productData) {
        const { name, description, price, stock } = productData
        const connection = await this.fastify.mysql.getConnection()
        try {
            const [result] = await connection.query(
                'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',
                [name, description, price, stock]
            )
            return { id: result.insertId, ...productData }
        } finally {
            connection.release()
        }
    }

    /**
     * 获取所有商品
     *
     * @returns {Promise<Array>} 商品列表
     */
    async findAll() {
        const connection = await this.fastify.mysql.getConnection()
        try {
            const [rows] = await connection.query('SELECT * FROM products')
            return rows
        } finally {
            connection.release()
        }
    }

    /**
     * 根据ID获取商品信息
     *
     * @param {number} productId - 商品ID
     * @returns {Promise<Object|null>} 商品信息
     */
    async findById(productId) {
        const connection = await this.fastify.mysql.getConnection()
        try {
            const [rows] = await connection.query(
                'SELECT * FROM products WHERE id = ?',
                [productId]
            )
            return rows.length > 0 ? rows[0] : null
        } finally {
            connection.release()
        }
    }

    /**
     * 更新商品信息
     *
     * @param {number} productId - 商品ID
     * @param {Object} updates - 更新的商品数据
     * @returns {Promise<boolean>} 更新是否成功
     */
    async update(productId, updates) {
        const connection = await this.fastify.mysql.getConnection()
        try {
            const [result] = await connection.query(
                'UPDATE products SET ? WHERE id = ?',
                [updates, productId]
            )
            return result.affectedRows > 0
        } finally {
            connection.release()
        }
    }

    /**
     * 删除商品
     *
     * @param {number} productId - 商品ID
     * @returns {Promise<boolean>} 删除是否成功
     */
    async delete(productId) {
        const connection = await this.fastify.mysql.getConnection()
        try {
            const [result] = await connection.query(
                'DELETE FROM products WHERE id = ?',
                [productId]
            )
            return result.affectedRows > 0
        } finally {
            connection.release()
        }
    }
}

module.exports = Product
