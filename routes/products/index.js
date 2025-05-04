'use strict'

module.exports = async function (fastify, opts) {
    // 创建商品
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

    // 获取商品列表
    fastify.get('/', async (request, reply) => {
        const connection = await fastify.mysql.getConnection()
        try {
            const [rows] = await connection.query('SELECT * FROM products')
            reply.send(rows)
        } finally {
            connection.release()
        }
    })

    // 获取单个商品详情
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

    // 更新商品信息
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

    // 删除商品
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
