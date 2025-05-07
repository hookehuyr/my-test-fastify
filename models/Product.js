/*
 * @Date: 2025-05-06 23:11:20
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-07 20:45:38
 * @FilePath: /my-test-fastify/models/Product.js
 * @Description: 文件描述
 */
'use strict'

const { MoreThanOrEqual, Like, skip, take } = require("typeorm")

/**
 * Product 模型类
 *
 * 该类封装了商品相关的数据库操作和业务逻辑，包括：
 * - 创建商品
 * - 获取商品列表
 * - 获取单个商品
 * - 更新商品
 * - 删除商品
 *
 * @class Product
 */
class Product {
    /**
     * 创建Product实例
     * @param {Object} fastify - Fastify实例
     */
    constructor(fastify) {
        this.fastify = fastify
        this.productRepository = fastify.orm.getRepository('Product')
    }

    /**
     * 创建新商品
     *
     * @param {Object} productData - 商品数据
     * @param {string} productData.name - 商品名称
     * @param {string} [productData.description] - 商品描述（可选）
     * @param {number} productData.price - 商品价格
     * @param {number} productData.stock - 商品库存
     * @returns {Promise<Object>} 创建成功的商品信息
     */
    async create(productData) {
        const product = this.productRepository.create(productData)
        return await this.productRepository.save(product)
    }

    /**
     * 获取所有商品
     *
     * @returns {Promise<Array>} 商品列表
     */
    async findAll(offset, limit) {
        // return await this.productRepository.find()
        // 高级查询测试
        // 价格大于等于50并且库存大于等于100
        // return await this.productRepository.find({
        //     where: {
        //         price: MoreThanOrEqual(50),
        //         stock: MoreThanOrEqual(100)
        //     }
        // })
        // 价格大于等于50, 库存大于等于100, 条件是并列
        // return await this.productRepository.find({
        //     where: [
        //         {price: MoreThanOrEqual(50)},
        //         {stock: MoreThanOrEqual(100)}
        //     ]
        // })
        // 模糊查询
        // return await this.productRepository.find({
        //     where: {
        //         name: Like('%3%')
        //     }
        // })
        // 分页查询
        // return await this.productRepository.find({
        //     skip: offset,
        //     take: limit
        // })
        // 高级查询
        const queryBuilder = this.productRepository.createQueryBuilder('product')
        queryBuilder
            .where('product.price > :minPrice', { minPrice: 10 })
            .andWhere('product.stock > :minStock', { minStock: 10 })
            .orderBy({
                'product.price': 'ASC',
                'product.stock': 'DESC'
            })
            .skip(offset)
            .take(limit);
        return await queryBuilder.getMany()
    }

    /**
     * 根据ID获取商品信息
     *
     * @param {number} productId - 商品ID
     * @returns {Promise<Object|null>} 商品信息
     */
    async findById(productId) {
        const product = await this.productRepository.findOne({
            where: { id: productId }
        })
        return product || null
    }

    /**
     * 更新商品信息
     *
     * @param {number} productId - 商品ID
     * @param {Object} updates - 更新的商品数据
     * @returns {Promise<boolean>} 更新是否成功
     */
    async update(productId, updates) {
        const result = await this.productRepository.update(productId, updates)
        return result.affected > 0
    }

    /**
     * 删除商品
     *
     * @param {number} productId - 商品ID
     * @returns {Promise<boolean>} 删除是否成功
     */
    async delete(productId) {
        const result = await this.productRepository.delete(productId)
        return result.affected > 0
    }
}

module.exports = Product
