/*
 * @Date: 2025-05-05 21:02:12
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-05 22:31:50
 * @FilePath: /my-test-fastify/plugins/error-handler.js
 * @Description: 文件描述
 */
'use strict'

/**
 * 错误处理器插件
 *
 * 该插件提供全局错误处理功能，主要用于：
 * - 统一处理验证错误
 * - 转换错误消息为用户友好的中文提示
 *
 * @module plugins/error-handler
 */

const fp = require('fastify-plugin')

/**
 * 验证错误消息映射表
 */
const validationMessages = {
    username: {
        minLength: '测试-用户名长度不能少于3个字符',
        type: '用户名必须是字符串类型',
        required: '请输入用户名'
    },
    password: {
        minLength: '密码长度不能少于6个字符',
        type: '密码必须是字符串类型',
        required: '请输入密码'
    },
    email: {
        format: '请输入有效的电子邮件地址',
        type: '邮箱必须是字符串类型',
        required: '请输入邮箱地址'
    },
    _default: {
        type: '字段类型不正确',
        minLength: '字段长度不能少于{limit}个字符',
        maxLength: '字段长度不能超过{limit}个字符',
        required: '该字段不能为空',
        format: '字段格式不正确',
        pattern: '字段格式不符合要求',
        minimum: '字段值不能小于{limit}',
        maximum: '字段值不能大于{limit}',
        minItems: '至少需要{limit}个项目',
        maxItems: '不能超过{limit}个项目',
        enum: '字段值不在允许的范围内'
    }
}

/**
 * 从验证错误对象中提取字段名
 * @param {Object} validation - 验证错误对象
 * @returns {string} 字段名
 */
function getFieldFromValidation(validation) {
    if (validation.instancePath && typeof validation.instancePath === 'string') {
        // 从instancePath中提取字段名，去除开头的斜杠
        return validation.instancePath.slice(1)
    } else if (validation.params) {
        // 尝试从params中获取字段名
        return validation.params.property || validation.params.missingProperty || '未知字段'
    }
    return '未知字段'
}

/**
 * 获取验证错误的中文提示信息
 * @param {Object} error - 验证错误对象
 * @returns {string} 格式化后的错误消息
 */
function getValidationErrorMessage(error) {
    if (!error.validation || !error.validation[0]) {
        return '输入数据验证失败'
    }

    const validation = error.validation[0]
    const field = getFieldFromValidation(validation)
    const keyword = validation.keyword
    const params = validation.params || {}

    // 获取对应字段的错误消息配置
    let fieldMessages = validationMessages[field] || validationMessages._default
    let message = fieldMessages && fieldMessages[keyword]

    // 如果没有找到对应的错误消息，使用默认消息
    if (!message) {
        message = validationMessages._default[keyword] || `${field}验证失败`
    }

    // 替换消息中的参数
    if (params.limit !== undefined) {
        message = message.replace('{limit}', params.limit)
    }

    return message
}

async function errorHandler(fastify, options) {
    fastify.setErrorHandler(function (error, request, reply) {
        // 处理验证错误
        if (error.validation) {
            const validation = error.validation[0]
            const field = getFieldFromValidation(validation)

            reply.status(400).send({
                error: `字段 ${field} ${getValidationErrorMessage(error)}`
            })
            return
        }

        // 其他错误使用默认处理
        reply.send(error)
    })
}

module.exports = fp(errorHandler, {
    name: 'error-handler'
})
