'use strict'

/**
 * 商品管理模块
 *
 * 该模块提供商品的增删改查功能，包括：
 * - 创建新商品（需要认证）
 * - 获取商品列表
 * - 获取单个商品详情
 * - 更新商品信息（需要认证）
 * - 删除商品（需要认证）
 *
 * @module routes/products
 */

module.exports = async function (fastify, opts) {
    /**
     * 创建新商品
     *
     * @route POST /products
     * @authentication 需要认证令牌
     * @param {object} request.body - 商品信息
     * @param {string} request.body.name - 商品名称（不能为空）
     * @param {string} [request.body.description] - 商品描述（可选）
     * @param {number} request.body.price - 商品价格（必须大于等于0）
     * @param {integer} request.body.stock - 商品库存（必须大于等于0）
     * @returns {object} 201 - 创建成功，返回商品ID和成功消息
     * @throws {400} - 请求参数验证失败
     */
    fastify.post('/', {
        onRequest: [fastify.authenticate],
        schema: {
            body: {
                type: 'object',
                required: ['name', 'price', 'stock'],
                properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    price: { type: 'number', minimum: 0 },
                    stock: { type: 'integer', minimum: 0 }
                }
            }
        }
    }, async (request, reply) => {
        const { name, description, price, stock } = request.body

        const connection = await fastify.mysql.getConnection()
        try {
            const [result] = await connection.query(
                'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',
                [name, description, price, stock]
            )
            reply.code(201).send({ id: result.insertId, message: '商品创建成功' })
        } finally {
            connection.release()
        }
    })

    /**
     * 获取所有商品列表
     *
     * @route GET /products
     * @returns {Array<object>} 200 - 商品列表数组
     */
    fastify.get('/', async (request, reply) => {
        const connection = await fastify.mysql.getConnection()
        try {
            const [rows] = await connection.query('SELECT * FROM products')
            reply.send(rows)
        } finally {
            connection.release()
        }
    })

    /**
     * 获取单个商品详情
     *
     * @route GET /products/{id}
     * @param {integer} request.params.id - 商品ID
     * @returns {object} 200 - 商品详细信息
     * @throws {404} - 商品不存在
     */
    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params

        const connection = await fastify.mysql.getConnection()
        try {
            const [rows] = await connection.query(
                'SELECT * FROM products WHERE id = ?',
                [id]
            )
            if (rows.length === 0) {
                reply.code(404).send({ error: '商品不存在' })
                return
            }
            reply.send(rows[0])
        } finally {
            connection.release()
        }
    })

    /**
     * 更新商品信息
     *
     * @route PUT /products/{id}
     * @authentication 需要认证令牌
     * @param {integer} request.params.id - 商品ID
     * @param {object} request.body - 更新的商品信息
     * @param {string} [request.body.name] - 商品名称（可选，不能为空）
     * @param {string} [request.body.description] - 商品描述（可选）
     * @param {number} [request.body.price] - 商品价格（可选，必须大于等于0）
     * @param {integer} [request.body.stock] - 商品库存（可选，必须大于等于0）
     * @returns {object} 200 - 更新成功消息
     * @throws {404} - 商品不存在
     * @throws {400} - 请求参数验证失败
     */
    fastify.put('/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    price: { type: 'number', minimum: 0 },
                    stock: { type: 'integer', minimum: 0 }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params
        const updates = request.body

        const connection = await fastify.mysql.getConnection()
        try {
            const [result] = await connection.query(
                'UPDATE products SET ? WHERE id = ?',
                [updates, id]
            )
            if (result.affectedRows === 0) {
                reply.code(404).send({ error: '商品不存在' })
                return
            }
            reply.send({ message: '商品更新成功' })
        } finally {
            connection.release()
        }
    })

    /**
     * 删除商品
     *
     * @route DELETE /products/{id}
     * @authentication 需要认证令牌
     * @param {integer} request.params.id - 商品ID
     * @returns {object} 200 - 删除成功消息
     * @throws {404} - 商品不存在
     */
    fastify.delete('/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params

        const connection = await fastify.mysql.getConnection()
        try {
            const [result] = await connection.query(
                'DELETE FROM products WHERE id = ?',
                [id]
            )
            if (result.affectedRows === 0) {
                reply.code(404).send({ error: '商品不存在' })
                return
            }
            reply.send({ message: '商品删除成功' })
        } finally {
            connection.release()
        }
    })
}
