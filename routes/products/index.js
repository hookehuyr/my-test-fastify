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
 * @requires ../models/Product - 商品模型类
 */

const path = require('path')
const Product = require(path.join(__dirname, '../../models/Product'))

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
            tags: ['products'],
            description: '创建新商品',
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
        const productModel = new Product(fastify)
        const product = await productModel.create(request.body)
        reply.code(201).send({ id: product.id, message: '商品创建成功' })
    })

    /**
     * 获取所有商品列表
     *
     * @route GET /products
     * @returns {Array<object>} 200 - 商品列表数组
     */
    fastify.get('/', {
        schema: {
            tags: ['products'],
            description: '获取所有商品列表',
            query: {
                type: 'object',
                properties: {
                    offset: { type: 'integer', minimum: 0, default: 0 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
                },
                required: ['offset', 'limit'],
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            price: { type: 'number' },
                            stock: { type: 'integer' }
                        }
                    }
                }
            },
        }
    }, async (request, reply) => {
        const { offset, limit } = request.query
        const productModel = new Product(fastify)
        const products = await productModel.findAll(offset, limit)
        reply.send(products)
    })

    /**
     * 获取单个商品详情
     *
     * @route GET /products/{id}
     * @param {integer} request.params.id - 商品ID
     * @returns {object} 200 - 商品详细信息
     * @throws {404} - 商品不存在
     */
    fastify.get('/:id', {
        schema: {
            tags: ['products'],
            description: '获取单个商品详情',
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'integer' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        ret: { type: 'string' },
                        item: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                name: { type: 'string' },
                                description: { type: 'string' },
                                price: { type: 'number' },
                                stock: { type: 'integer' }
                            }
                        },
                        msg: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const productModel = new Product(fastify)
        const product = await productModel.findById(request.params.id)

        if (!product) {
            reply.code(404).send({ error: '商品不存在' })
            return
        }
        reply.code(200).send({ ret: 'OK', item: product, msg: '查询成功' })
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
            tags: ['products'],
            description: '更新商品信息',
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'integer', minimum: 1 }
                }
            },
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
        const productModel = new Product(fastify)
        const success = await productModel.update(request.params.id, request.body)

        if (!success) {
            reply.code(404).send({ error: '商品不存在' })
            return
        }
        reply.send({ message: '商品更新成功' })
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
        onRequest: [fastify.authenticate],
        schema: {
            tags: ['products'],
            description: '删除商品',
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'integer', minimum: 1 }
                }
            }
        }
    }, async (request, reply) => {
        const productModel = new Product(fastify)
        const success = await productModel.delete(request.params.id)

        if (!success) {
            reply.code(404).send({ error: '商品不存在' })
            return
        }
        reply.send({ message: '商品删除成功' })
    })
}
