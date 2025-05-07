'use strict'

/**
 * Cart 模型类
 *
 * 该类封装了购物车相关的数据库操作和业务逻辑，包括：
 * - 添加商品到购物车
 * - 获取购物车列表
 * - 更新购物车商品数量
 * - 删除购物车商品
 *
 * @class Cart
 */
class Cart {
    /**
     * 创建Cart实例
     * @param {Object} fastify - Fastify实例
     */
    constructor(fastify) {
        this.fastify = fastify
        this.cartItemRepository = fastify.orm.getRepository('CartItem')
        this.productRepository = fastify.orm.getRepository('Product')
    }

    /**
     * 添加商品到购物车
     * @param {number} user_id - 用户ID
     * @param {object} cartData - 购物车数据
     * @param {number} cartData.product_id - 商品ID
     * @param {number} cartData.quantity - 商品数量
     * @returns {Promise<boolean>} 添加是否成功
     * @throws {Error} 商品不存在或库存不足时抛出错误
     */
    async addItem(user_id, cartData) {
        // 检查商品是否存在且库存充足
        const product = await this.productRepository.findOne({
            where: { id: cartData.product_id }
        })

        if (!product || product.stock < cartData.quantity) {
            throw new Error('商品不存在或库存不足')
        }

        // 检查购物车是否已有该商品
        const existingItem = await this.cartItemRepository.findOne({
            where: {
                user_id: user_id,
                product_id: cartData.product_id
            }
        })

        if (existingItem) {
            // 更新数量
            const result = await this.cartItemRepository.update(
                { id: existingItem.id },
                { quantity: existingItem.quantity + cartData.quantity }
            )
            return result.affected > 0
        } else {
            // 新增商品
            const cartItem = this.cartItemRepository.create({
                user_id,
                product_id: cartData.product_id,
                quantity: cartData.quantity
            })
            await this.cartItemRepository.save(cartItem)
            return true
        }
    }

    /**
     * 获取用户的购物车列表
     * @param {number} user_id - 用户ID
     * @returns {Promise<Array<object>>} 购物车商品列表
     */
    async findAll(user_id) {
        return await this.cartItemRepository.find({
            where: { user_id },
            relations: ['product']
        })
    }

    /**
     * 更新购物车商品数量
     * @param {number} cart_item_id - 购物车商品ID
     * @param {number} user_id - 用户ID
     * @param {object} updateData - 更新数据
     * @param {number} updateData.quantity - 新的商品数量
     * @returns {Promise<boolean>} 更新是否成功
     * @throws {Error} 商品不存在或库存不足时抛出错误
     */
    async updateQuantity(cart_item_id, user_id, updateData) {
        const cartItem = await this.cartItemRepository.findOne({
            where: { id: cart_item_id, user_id },
            relations: ['product']
        })

        if (!cartItem) {
            throw new Error('购物车商品不存在')
        }

        if (cartItem.product.stock < updateData.quantity) {
            throw new Error('商品库存不足')
        }

        const result = await this.cartItemRepository.update(
            { id: cart_item_id, user_id },
            { quantity: updateData.quantity }
        )

        return result.affected > 0
    }

    /**
     * 删除购物车商品
     * @param {number} cart_item_id - 购物车商品ID
     * @param {number} user_id - 用户ID
     * @returns {Promise<boolean>} 删除是否成功
     */
    async removeItem(cart_item_id, user_id) {
        const result = await this.cartItemRepository.delete({
            id: cart_item_id,
            user_id
        })
        return result.affected > 0
    }
}

module.exports = Cart
