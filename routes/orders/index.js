'use strict'

module.exports = async function (fastify, opts) {
    // 创建订单
    fastify.post('/', {
        onRequest: [fastify.authenticate],
        schema: {
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

    // 获取订单列表
    fastify.get('/', {
        onRequest: [fastify.authenticate]
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

    // 获取订单详情
    fastify.get('/:id', {
        onRequest: [fastify.authenticate]
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

    // 更新订单状态
    fastify.put('/:id/status', {
        onRequest: [fastify.authenticate],
        schema: {
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
