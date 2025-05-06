'use strict'

/**
 * 订单管理模块
 *
 * 该模块提供订单的管理功能，包括：
 * - 创建订单（从购物车商品创建，需要认证）
 * - 获取订单列表（需要认证）
 * - 获取订单详情（需要认证）
 * - 更新订单状态（需要认证）
 *
 * @module routes/orders
 */

module.exports = async function (fastify, opts) {
    /**
     * 创建订单
     *
     * @route POST /orders
     * @authentication 需要认证令牌
     * @param {object} request.body - 订单信息
     * @param {array<integer>} request.body.cart_items - 购物车商品ID数组（至少包含一个商品）
     * @returns {object} 201 - 创建成功，返回订单ID和成功消息
     * @throws {400} - 购物车商品不存在或库存不足
     * @throws {401} - 未认证
     */
    fastify.post('/', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['orders'],
            description: '创建订单',
            body: {
                type: 'object',
                required: ['cart_items'],
                properties: {
                    cart_items: {
                        type: 'array',
                        items: {
                            type: 'integer'
                        },
                        minItems: 1
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const orderModel = new Order(fastify)
            const { order_id } = await orderModel.create(request.body, request.user.id)
            reply.code(201).send({ order_id, message: '订单创建成功' })
        } catch (err) {
            if (err.message.includes('购物车商品不存在') || err.message.includes('商品库存不足')) {
                reply.code(400).send({ error: err.message })
                return
            }
            throw err
        }
    })

    /**
     * 获取当前用户的订单列表
     *
     * @route GET /orders
     * @authentication 需要认证令牌
     * @returns {Array<object>} 200 - 订单列表数组，包含每个订单的详细商品信息
     * @throws {401} - 未认证
     */
    fastify.get('/', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['orders'],
            description: '获取当前用户的订单列表',
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            user_id: { type: 'integer' },
                            total_amount: { type: 'number' },
                            status: { type: 'string' },
                            created_at: { type: 'string' },
                            updated_at: { type: 'string' },
                            items: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'integer' },
                                        order_id: { type: 'integer' },
                                        product_id: { type: 'integer' },
                                        quantity: { type: 'integer' },
                                        price: { type: 'number' },
                                        name: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const orderModel = new Order(fastify)
        const orders = await orderModel.findAll(request.user.id)
        reply.send(orders)
    })

    /**
     * 获取订单详情
     *
     * @route GET /orders/{id}
     * @authentication 需要认证令牌
     * @param {integer} request.params.id - 订单ID
     * @returns {object} 200 - 订单详细信息，包含订单商品列表
     * @throws {401} - 未认证
     * @throws {404} - 订单不存在
     */
    fastify.get('/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['orders'],
            description: '获取订单详情',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        user_id: { type: 'integer' },
                        total_amount: { type: 'number' },
                        status: { type:'string' },
                        created_at: { type:'string' },
                        updated_at: { type:'string' },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'integer' },
                                    order_id: { type: 'integer' },
                                    product_id: { type: 'integer' },
                                    quantity: { type: 'integer' },
                                    price: { type: 'number' },
                                    name: { type:'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const orderModel = new Order(fastify)
        const order = await orderModel.findById(request.params.id, request.user.id)

        if (!order) {
            reply.code(404).send({ error: '订单不存在' })
            return
        }
        reply.send(order)
    })

    /**
     * 更新订单状态
     *
     * @route PUT /orders/{id}/status
     * @authentication 需要认证令牌
     * @param {integer} request.params.id - 订单ID
     * @param {object} request.body - 更新信息
     * @param {string} request.body.status - 新的订单状态（paid-已支付, shipped-已发货, delivered-已送达, cancelled-已取消）
     * @returns {object} 200 - 更新成功消息
     * @throws {401} - 未认证
     * @throws {404} - 订单不存在
     */
    fastify.put('/:id/status', {
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['orders'],
            description: '更新订单状态',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer'
                    }
                }
            },
            body: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: {
                        type: 'string',
                        enum: ['paid', 'shipped', 'delivered', 'cancelled']
                    }
                }
            }
        }
    }, async (request, reply) => {
        const orderModel = new Order(fastify)
        const success = await orderModel.update(request.params.id, request.user.id, request.body)

        if (!success) {
            reply.code(404).send({ error: '订单不存在' })
            return
        }
        reply.send({ message: '订单状态已更新' })
    })
}
