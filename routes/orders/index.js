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
        const { cart_items } = request.body
        const user_id = request.user.id

        const connection = await fastify.mysql.getConnection()
        try {
            await connection.beginTransaction()

            try {
                // 获取购物车商品信息
                const [cartProducts] = await connection.query(
                    `SELECT ci.*, p.price, p.stock
                    FROM cart_items ci
                    JOIN products p ON ci.product_id = p.id
                    WHERE ci.id IN (?) AND ci.user_id = ?`,
                    [cart_items, user_id]
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
                    [cart_items]
                )

                await connection.commit()
                reply.code(201).send({ order_id, message: '订单创建成功' })
            } catch (err) {
                await connection.rollback()
                throw err
            }
        } finally {
            connection.release()
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
        const user_id = request.user.id

        const connection = await fastify.mysql.getConnection()
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

            reply.send(orders)
        } finally {
            connection.release()
        }
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
        const { id } = request.params
        const user_id = request.user.id

        const connection = await fastify.mysql.getConnection()
        try {
            const [orders] = await connection.query(
                'SELECT * FROM orders WHERE id = ? AND user_id = ?',
                [id, user_id]
            )

            if (orders.length === 0) {
                reply.code(404).send({ error: '订单不存在' })
                return
            }

            const order = orders[0]
            const [items] = await connection.query(
                `SELECT oi.*, p.name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?`,
                [id]
            )
            order.items = items

            reply.send(order)
        } finally {
            connection.release()
        }
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
        const { id } = request.params
        const { status } = request.body
        const user_id = request.user.id

        const connection = await fastify.mysql.getConnection()
        try {
            const [result] = await connection.query(
                'UPDATE orders SET status = ? WHERE id = ? AND user_id = ?',
                [status, id, user_id]
            )

            if (result.affectedRows === 0) {
                reply.code(404).send({ error: '订单不存在' })
                return
            }

            reply.send({ message: '订单状态已更新' })
        } finally {
            connection.release()
        }
    })
}
