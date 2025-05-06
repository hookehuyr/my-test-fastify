'use strict'

/**
 * 购物车模型类
 *
 * 该类负责处理购物车相关的数据库操作，包括：
 * - 添加商品到购物车
 * - 获取购物车列表
 * - 更新购物车商品数量
 * - 删除购物车商品
 *
 * @class Cart
 */
class Cart {
    /**
     * 创建购物车模型实例
     * @param {object} fastify - Fastify实例
     */
    constructor(fastify) {
        this.mysql = fastify.mysql
    }

    /**
     * 添加商品到购物车
     * @param {number} user_id - 用户ID
     * @param {object} cartData - 购物车数据
     * @param {number} cartData.product_id - 商品ID
     * @param {number} cartData.quantity - 商品数量
     * @returns {boolean} 添加是否成功
     * @throws {Error} 商品不存在或库存不足时抛出错误
     */
    async addItem(user_id, cartData) {
        const connection = await this.mysql.getConnection()
        try {
            // 检查商品是否存在且库存充足
            const [products] = await connection.query(
                'SELECT * FROM products WHERE id = ? AND stock >= ?',
                [cartData.product_id, cartData.quantity]
            )

            if (products.length === 0) {
                throw new Error('商品不存在或库存不足')
            }

            // 检查购物车是否已有该商品
            const [existingItems] = await connection.query(
                'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
                [user_id, cartData.product_id]
            )

            if (existingItems.length > 0) {
                // 更新数量
                await connection.query(
                    'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
                    [cartData.quantity, user_id, cartData.product_id]
                )
            } else {
                // 新增商品
                await connection.query(
                    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                    [user_id, cartData.product_id, cartData.quantity]
                )
            }

            return true
        } finally {
            connection.release()
        }
    }

    /**
     * 获取用户的购物车列表
     * @param {number} user_id - 用户ID
     * @returns {Array<object>} 购物车商品列表
     */
    async findAll(user_id) {
        const connection = await this.mysql.getConnection()
        try {
            const [rows] = await connection.query(
                `SELECT ci.*, p.name, p.price, p.stock
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.user_id = ?`,
                [user_id]
            )
            return rows
        } finally {
            connection.release()
        }
    }

    /**
     * 更新购物车商品数量
     * @param {number} cart_item_id - 购物车商品ID
     * @param {number} user_id - 用户ID
     * @param {object} updateData - 更新数据
     * @param {number} updateData.quantity - 新的商品数量
     * @returns {boolean} 更新是否成功
     * @throws {Error} 商品不存在或库存不足时抛出错误
     */
    async updateQuantity(cart_item_id, user_id, updateData) {
        const connection = await this.mysql.getConnection()
        try {
            // 检查商品库存
            const [cartItems] = await connection.query(
                `SELECT p.stock, ci.product_id
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.id = ? AND ci.user_id = ?`,
                [cart_item_id, user_id]
            )

            if (cartItems.length === 0) {
                throw new Error('购物车商品不存在')
            }

            if (cartItems[0].stock < updateData.quantity) {
                throw new Error('商品库存不足')
            }

            const [result] = await connection.query(
                'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
                [updateData.quantity, cart_item_id, user_id]
            )

            return result.affectedRows > 0
        } finally {
            connection.release()
        }
    }

    /**
     * 删除购物车商品
     * @param {number} cart_item_id - 购物车商品ID
     * @param {number} user_id - 用户ID
     * @returns {boolean} 删除是否成功
     */
    async removeItem(cart_item_id, user_id) {
        const connection = await this.mysql.getConnection()
        try {
            const [result] = await connection.query(
                'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
                [cart_item_id, user_id]
            )
            return result.affectedRows > 0
        } finally {
            connection.release()
        }
    }
}

module.exports = Cart
