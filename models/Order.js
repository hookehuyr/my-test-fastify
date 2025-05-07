'use strict'

/**
 * Order 模型类
 *
 * 该类封装了订单相关的数据库操作和业务逻辑，包括：
 * - 创建订单
 * - 获取订单列表
 * - 获取订单详情
 * - 更新订单状态
 *
 * @class Order
 */
class Order {
    /**
     * 创建Order实例
     * @param {Object} fastify - Fastify实例
     */
    constructor(fastify) {
        this.fastify = fastify
        this.orderRepository = fastify.orm.getRepository('Order')
        this.orderItemRepository = fastify.orm.getRepository('OrderItem')
        this.cartItemRepository = fastify.orm.getRepository('CartItem')
        this.productRepository = fastify.orm.getRepository('Product')
    }

    /**
     * 创建新订单
     * @param {object} orderData - 订单数据
     * @param {number} user_id - 用户ID
     * @param {array<integer>} cart_items - 购物车商品ID数组
     * @returns {Promise<object>} 创建的订单信息
     * @throws {Error} 购物车商品不存在或库存不足时抛出错误
     */
    async create(orderData, user_id) {
        // 使用TypeORM的事务管理
        return await this.fastify.orm.transaction(async transactionalEntityManager => {
            // 获取购物车商品信息
            const cartItems = await transactionalEntityManager.find('CartItem', {
                where: {
                    id: { $in: orderData.cart_items },
                    user_id: user_id
                },
                relations: ['product']
            })

            if (cartItems.length === 0) {
                throw new Error('购物车商品不存在')
            }

            // 检查库存并计算总金额
            let total_amount = 0
            for (const item of cartItems) {
                if (item.product.stock < item.quantity) {
                    throw new Error(`商品库存不足: ${item.product_id}`)
                }
                total_amount += item.product.price * item.quantity
            }

            // 创建订单
            const order = this.orderRepository.create({
                user_id,
                total_amount
            })
            await transactionalEntityManager.save(order)

            // 创建订单详情并更新库存
            for (const item of cartItems) {
                // 创建订单项
                const orderItem = this.orderItemRepository.create({
                    order_id: order.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.product.price
                })
                await transactionalEntityManager.save(orderItem)

                // 更新库存
                await transactionalEntityManager.update('Product',
                    { id: item.product_id },
                    { stock: () => `stock - ${item.quantity}` }
                )
            }

            // 清空已购买的购物车商品
            await transactionalEntityManager.delete('CartItem', {
                id: { $in: orderData.cart_items }
            })

            return { order_id: order.id }
        })
    }

    /**
     * 获取用户的所有订单
     * @param {number} user_id - 用户ID
     * @returns {Promise<Array<object>>} 订单列表
     */
    async findAll(user_id) {
        return await this.orderRepository.find({
            where: { user_id },
            relations: ['items', 'items.product'],
            order: { created_at: 'DESC' }
        })
    }

    /**
     * 获取订单详情
     * @param {number} order_id - 订单ID
     * @param {number} user_id - 用户ID
     * @returns {Promise<object|null>} 订单详情，如果订单不存在则返回null
     */
    async findById(order_id, user_id) {
        const order = await this.orderRepository.findOne({
            where: { id: order_id, user_id },
            relations: ['items', 'items.product']
        })

        return order || null
    }

    /**
     * 更新订单状态
     * @param {number} order_id - 订单ID
     * @param {number} user_id - 用户ID
     * @param {object} updateData - 更新数据
     * @param {string} updateData.status - 新的订单状态
     * @returns {Promise<boolean>} 更新是否成功
     */
    async update(order_id, user_id, updateData) {
        const result = await this.orderRepository.update(
            { id: order_id, user_id },
            { status: updateData.status }
        )
        return result.affected > 0
    }
}

module.exports = Order
