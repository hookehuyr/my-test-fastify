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
        const { product_id, quantity } = request.body
        const user_id = request.user.id

        const connection = await fastify.mysql.getConnection()
        try {
            // 检查商品是否存在且库存充足
            const [products] = await connection.query(
                'SELECT * FROM products WHERE id = ? AND stock >= ?',
                [product_id, quantity]
            )

            if (products.length === 0) {
                reply.code(400).send({ error: '商品不存在或库存不足' })
                return
            }

            // 检查购物车是否已有该商品
            const [existingItems] = await connection.query(
                'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
                [user_id, product_id]
            )

            if (existingItems.length > 0) {
                // 更新数量
                await connection.query(
                    'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
                    [quantity, user_id, product_id]
                )
            } else {
                // 新增商品
                await connection.query(
                    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                    [user_id, product_id, quantity]
                )
            }

            reply.code(201).send({ message: '商品已添加到购物车' })
        } finally {
            connection.release()
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
        const user_id = request.user.id

        const connection = await fastify.mysql.getConnection()
        try {
            const [rows] = await connection.query(
                `SELECT ci.*, p.name, p.price, p.stock
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.user_id = ?`,
                [user_id]
            )
            reply.send(rows)
        } finally {
            connection.release()
        }
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
        const { id } = request.params
        const { quantity } = request.body
        const user_id = request.user.id

        const connection = await fastify.mysql.getConnection()
        try {
            // 检查商品库存
            const [cartItems] = await connection.query(
                `SELECT p.stock, ci.product_id
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.id = ? AND ci.user_id = ?`,
                [id, user_id]
            )

            if (cartItems.length === 0) {
                reply.code(404).send({ error: '购物车商品不存在' })
                return
            }

            if (cartItems[0].stock < quantity) {
                reply.code(400).send({ error: '商品库存不足' })
                return
            }

            await connection.query(
                'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
                [quantity, id, user_id]
            )

            reply.send({ message: '购物车已更新' })
        } finally {
            connection.release()
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
        const { id } = request.params
        const user_id = request.user.id

        const connection = await fastify.mysql.getConnection()
        try {
            const [result] = await connection.query(
                'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
                [id, user_id]
            )

            if (result.affectedRows === 0) {
                reply.code(404).send({ error: '购物车商品不存在' })
                return
            }

            reply.send({ message: '商品已从购物车中移除' })
        } finally {
            connection.release()
        }
    })
}
