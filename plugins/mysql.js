/**
 * MySQL数据库插件模块
 *
 * @module plugins/mysql
 * @description 提供MySQL数据库连接和表结构初始化功能
 *
 * @requires fastify-plugin
 * @requires @fastify/mysql
 *
 * @property {Object} connectionConfig - MySQL连接配置
 * @property {boolean} connectionConfig.promise - 启用Promise API支持
 * @property {string} connectionConfig.connectionString - 数据库连接字符串
 */

'use strict'

const fp = require('fastify-plugin')
const mysql = require('@fastify/mysql')

module.exports = fp(async function (fastify, opts) {
    fastify.register(mysql, {
        promise: true,
        connectionString: 'mysql://root:huyirui520@localhost:3306/ecommerce'
    })

    /**
     * 初始化数据库表结构
     * 在应用启动时创建必要的数据表（如果不存在）
     *
     * @event onReady
     * @async
     */
    fastify.addHook('onReady', async () => {
        const connection = await fastify.mysql.getConnection()
        try {
            /**
             * 用户表 - 存储用户基本信息
             * @property {int} id - 用户ID，自增主键
             * @property {string} username - 用户名，唯一
             * @property {string} password - 加密后的密码
             * @property {string} email - 电子邮件，唯一
             * @property {timestamp} created_at - 创建时间
             */
            await connection.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `)

            /**
             * 商品表 - 存储商品信息
             * @property {int} id - 商品ID，自增主键
             * @property {string} name - 商品名称
             * @property {text} description - 商品描述
             * @property {decimal} price - 商品价格，精确到2位小数
             * @property {int} stock - 库存数量
             * @property {timestamp} created_at - 创建时间
             */
            await connection.query(`
                CREATE TABLE IF NOT EXISTS products (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    stock INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `)

            /**
             * 购物车表 - 存储用户购物车商品
             * @property {int} id - 购物车项ID，自增主键
             * @property {int} user_id - 用户ID，关联users表
             * @property {int} product_id - 商品ID，关联products表
             * @property {int} quantity - 商品数量，默认1
             * @property {timestamp} created_at - 创建时间
             */
            await connection.query(`
                CREATE TABLE IF NOT EXISTS cart_items (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    product_id INT NOT NULL,
                    quantity INT NOT NULL DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            `)

            /**
             * 订单表 - 存储用户订单信息
             * @property {int} id - 订单ID，自增主键
             * @property {int} user_id - 用户ID，关联users表
             * @property {decimal} total_amount - 订单总金额，精确到2位小数
             * @property {enum} status - 订单状态：pending(待付款),paid(已支付),shipped(已发货),delivered(已送达),cancelled(已取消)
             * @property {timestamp} created_at - 创建时间
             */
            await connection.query(`
                CREATE TABLE IF NOT EXISTS orders (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    total_amount DECIMAL(10,2) NOT NULL,
                    status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `)

            /**
             * 订单详情表 - 存储订单商品明细
             * @property {int} id - 订单项ID，自增主键
             * @property {int} order_id - 订单ID，关联orders表
             * @property {int} product_id - 商品ID，关联products表
             * @property {int} quantity - 商品数量
             * @property {decimal} price - 商品单价，精确到2位小数
             */
            await connection.query(`
                CREATE TABLE IF NOT EXISTS order_items (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    order_id INT NOT NULL,
                    product_id INT NOT NULL,
                    quantity INT NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    FOREIGN KEY (order_id) REFERENCES orders(id),
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            `)
        } finally {
            connection.release()
        }
    })
})
