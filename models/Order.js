'use strict'

/**
 * 订单模型类
 *
 * 该类负责处理订单相关的数据库操作，包括：
 * - 创建订单
 * - 获取订单列表
 * - 获取订单详情
 * - 更新订单状态
 *
 * @class Order
 */
class Order {
    /**
     * 创建订单模型实例
     * @param {object} fastify - Fastify实例
     */
    constructor(fastify) {
        this.mysql = fastify.mysql
    }

    /**
     * 创建新订单
     * @param {object} orderData - 订单数据
     * @param {number} user_id - 用户ID
     * @param {array<integer>} cart_items - 购物车商品ID数组
     * @returns {object} 创建的订单信息
     * @throws {Error} 购物车商品不存在或库存不足时抛出错误
     */
    async create(orderData, user_id) {
        const connection = await this.mysql.getConnection()
        try {
            // 开启事务
            await connection.beginTransaction()

            try {
                // 获取购物车商品信息
                const [cartProducts] = await connection.query(
                    `SELECT ci.*, p.price, p.stock
                    FROM cart_items ci
                    JOIN products p ON ci.product_id = p.id
                    WHERE ci.id IN (?) AND ci.user_id = ?`,
                    [orderData.cart_items, user_id]
                )

                if (cartProducts.length === 0) {
                    throw new Error('购物车商品不存在')
                }

                // 检查库存并计算总金额
                let total_amount = 0
                for (const item of cartProducts) {
                    if (item.stock < item.quantity) {
                        throw new Error(`商品库存不足: ${item.product_id}`)
                    }
                    total_amount += item.price * item.quantity
                }

                // 创建订单
                const [orderResult] = await connection.query(
                    'INSERT INTO orders (user_id, total_amount) VALUES (?, ?)',
                    [user_id, total_amount]
                )
                const order_id = orderResult.insertId

                // 创建订单详情
                for (const item of cartProducts) {
                    await connection.query(
                        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                        [order_id, item.product_id, item.quantity, item.price]
                    )

                    // 更新库存
                    await connection.query(
                        'UPDATE products SET stock = stock - ? WHERE id = ?',
                        [item.quantity, item.product_id]
                    )
                }

                // 清空已购买的购物车商品
                await connection.query(
                    'DELETE FROM cart_items WHERE id IN (?)',
                    [orderData.cart_items]
                )

                // 提交事务
                await connection.commit()
                return { order_id }
            } catch (err) {
                // 回滚事务
                await connection.rollback()
                throw err
            }
        } finally {
            connection.release()
        }
    }

    /**
     * 获取用户的所有订单
     * @param {number} user_id - 用户ID
     * @returns {Array<object>} 订单列表
     */
    async findAll(user_id) {
        const connection = await this.mysql.getConnection()
        try {
            const [orders] = await connection.query(
                'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
                [user_id]
            )

            // 获取每个订单的详细商品信息
            for (const order of orders) {
                const [items] = await connection.query(
                    `SELECT oi.*, p.name
                    FROM order_items oi
                    JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = ?`,
                    [order.id]
                )
                order.items = items
            }

            return orders
        } finally {
            connection.release()
        }
    }

    /**
     * 获取订单详情
     * @param {number} order_id - 订单ID
     * @param {number} user_id - 用户ID
     * @returns {object|null} 订单详情，如果订单不存在则返回null
     */
    async findById(order_id, user_id) {
        const connection = await this.mysql.getConnection()
        try {
            const [orders] = await connection.query(
                'SELECT * FROM orders WHERE id = ? AND user_id = ?',
                [order_id, user_id]
            )

            if (orders.length === 0) {
                return null
            }

            const order = orders[0]

            // 获取订单商品详情
            const [items] = await connection.query(
                `SELECT oi.*, p.name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?`,
                [order_id]
            )
            order.items = items

            return order
        } finally {
            connection.release()
        }
    }

    /**
     * 更新订单状态
     * @param {number} order_id - 订单ID
     * @param {number} user_id - 用户ID
     * @param {object} updateData - 更新数据
     * @param {string} updateData.status - 新的订单状态
     * @returns {boolean} 更新是否成功
     */
    async update(order_id, user_id, updateData) {
        const connection = await this.mysql.getConnection()
        try {
            const [result] = await connection.query(
                'UPDATE orders SET status = ? WHERE id = ? AND user_id = ?',
                [updateData.status, order_id, user_id]
            )
            return result.affectedRows > 0
        } finally {
            connection.release()
        }
    }
}

module.exports = Order
