'use strict'

/**
 * 购物车管理模块
 *
 * 该模块提供购物车的管理功能，包括：
 * - 添加商品到购物车（需要认证）
 * - 获取购物车列表（需要认证）
 * - 更新购物车商品数量（需要认证）
 * - 从购物车删除商品（需要认证）
 *
 * @module routes/cart
 */

const path = require('path')
const Cart = require(path.join(__dirname, '../../models/Cart'))

module.exports = async function (fastify, opts) {
    /**
     * 添加商品到购物车
     *
     * @route POST /cart
     * @authentication 需要认证令牌
     * @param {object} request.body - 购物车商品信息
     * @param {integer} request.body.product_id - 商品ID
     * @param {integer} request.body.quantity - 商品数量（必须大于等于1）
     * @returns {object} 201 - 添加成功消息
     * @throws {400} - 商品不存在或库存不足
     * @throws {401} - 未认证
     */
    fastify.post('/', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['cart'],
            description: '将商品添加到购物车中',
            body: {
                type: 'object',
                required: ['product_id', 'quantity'],
                properties: {
                    product_id: { type: 'integer' },
                    quantity: { type: 'integer', minimum: 1 }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const cartModel = new Cart(fastify)
            await cartModel.addItem(request.user.id, request.body)
            reply.code(201).send({ message: '商品已添加到购物车' })
        } catch (err) {
            if (err.message === '商品不存在或库存不足') {
                reply.code(400).send({ error: err.message })
                return
            }
            throw err
        }
    })

    /**
     * 获取购物车列表
     *
     * @route GET /cart
     * @authentication 需要认证令牌
     * @returns {Array<object>} 200 - 购物车商品列表，包含商品详细信息
     * @throws {401} - 未认证
     */
    fastify.get('/', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['cart'],
            description: '获取购物车列表',
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            user_id: { type: 'integer' },
                            product_id: { type: 'integer' },
                            quantity: { type: 'integer' },
                            name: { type: 'string' },
                            price: { type: 'number' },
                            stock: { type: 'integer' }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const cartModel = new Cart(fastify)
        const items = await cartModel.findAll(request.user.id)
        reply.send(items)
    })

    /**
     * 更新购物车商品数量
     *
     * @route PUT /cart/{id}
     * @authentication 需要认证令牌
     * @param {integer} request.params.id - 购物车商品ID
     * @param {object} request.body - 更新信息
     * @param {integer} request.body.quantity - 新的商品数量（必须大于等于1）
     * @returns {object} 200 - 更新成功消息
     * @throws {400} - 商品库存不足
     * @throws {401} - 未认证
     * @throws {404} - 购物车商品不存在
     */
    fastify.put('/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['cart'],
            description: '更新购物车商品数量',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            body: {
                type: 'object',
                required: ['quantity'],
                properties: {
                    quantity: { type: 'integer', minimum: 1 }
                }
            },
        }
    }, async (request, reply) => {
        try {
            const cartModel = new Cart(fastify)
            await cartModel.updateQuantity(request.params.id, request.user.id, request.body)
            reply.send({ message: '购物车已更新' })
        } catch (err) {
            if (err.message === '购物车商品不存在') {
                reply.code(404).send({ error: err.message })
                return
            }
            if (err.message === '商品库存不足') {
                reply.code(400).send({ error: err.message })
                return
            }
            throw err
        }
    })

    /**
     * 从购物车删除商品
     *
     * @route DELETE /cart/{id}
     * @authentication 需要认证令牌
     * @param {integer} request.params.id - 购物车商品ID
     * @returns {object} 200 - 删除成功消息
     * @throws {401} - 未认证
     * @throws {404} - 购物车商品不存在
     */
    fastify.delete('/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['cart'],
            description: '从购物车删除商品',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            }
        }
    }, async (request, reply) => {
        const cartModel = new Cart(fastify)
        const success = await cartModel.removeItem(request.params.id, request.user.id)

        if (!success) {
            reply.code(404).send({ error: '购物车商品不存在' })
            return
        }

        reply.send({ message: '商品已从购物车中移除' })
    })
}
