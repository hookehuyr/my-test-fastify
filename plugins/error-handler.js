/*
 * @Date: 2025-05-05 21:02:12
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-11 01:05:06
 * @FilePath: /my-test-fastify/plugins/error-handler.js
 * @Description: 全局错误处理插件，提供统一的错误处理和友好的错误提示
 */
'use strict'

/**
 * 错误处理器插件
 *
 * 该插件提供全局错误处理功能，主要用于：
 * - 统一处理验证错误，包括字段类型、长度、格式等验证
 * - 转换错误消息为用户友好的中文提示
 * - 支持自定义字段错误消息和默认错误消息
 * - 处理常见的HTTP 400错误响应
 *
 * @module plugins/error-handler
 * @requires fastify-plugin
 */

const fp = require('fastify-plugin')

/**
 * 验证错误消息映射表
 *
 * @type {Object.<string, Object.<string, string>>}
 * @description 定义了各个字段的验证错误消息模板，包括：
 * - username: 用户名相关的验证错误消息
 * - password: 密码相关的验证错误消息
 * - email: 邮箱相关的验证错误消息
 * - _default: 默认的验证错误消息，用于未特别定义的字段
 */
/**
 * Fastify标准错误码映射表
 *
 * @type {Object.<string, string>}
 * @description 定义了Fastify标准错误码对应的中文提示信息
 */
const fastifyErrorMessages = {
    FST_ERR_CTP_ALREADY_PRESENT: '该Content-Type的解析器已经被注册',
    FST_ERR_CTP_INVALID_TYPE: 'Content-Type必须为字符串类型',
    FST_ERR_CTP_EMPTY_TYPE: 'Content-Type不能为空字符串',
    FST_ERR_CTP_INVALID_HANDLER: '该Content-Type的处理函数无效',
    FST_ERR_CTP_INVALID_PARSE_TYPE: '不支持的解析类型，仅支持string和buffer',
    FST_ERR_CTP_BODY_TOO_LARGE: '请求体大小超过限制',
    FST_ERR_CTP_INVALID_MEDIA_TYPE: '不支持的媒体类型',
    FST_ERR_CTP_INVALID_CONTENT_LENGTH: '请求体大小与Content-Length不一致',
    FST_ERR_DEC_ALREADY_PRESENT: '已存在同名的装饰器',
    FST_ERR_DEC_MISSING_DEPENDENCY: '缺失依赖导致装饰器无法注册',
    FST_ERR_HOOK_INVALID_TYPE: '钩子名称必须为字符串',
    FST_ERR_HOOK_INVALID_HANDLER: '钩子的回调必须为函数',
    FST_ERR_LOG_INVALID_DESTINATION: '日志工具目标地址无效，仅接受stream或file作为目标地址',
    FST_ERR_REP_ALREADY_SENT: '响应已发送',
    FST_ERR_SEND_INSIDE_ONERR: '不能在onError钩子中调用send',
    FST_ERR_REP_INVALID_PAYLOAD_TYPE: '响应payload类型无效，仅允许string或Buffer',
    FST_ERR_SCH_MISSING_ID: '提供的schema缺少$id属性',
    FST_ERR_SCH_ALREADY_PRESENT: '同$id的schema已经存在',
    FST_ERR_SCH_NOT_PRESENT: '不存在$id为提供值的schema',
    FST_ERR_SCH_BUILD: '路由的JSON schema不合法',
    FST_ERR_PROMISE_NOT_FULLFILLED: '状态码不为204时，Promise的payload不能为undefined'
}

/**
 * 获取Fastify错误的中文提示信息
 * @param {Object} error - 错误对象
 * @returns {string} 格式化后的错误消息
 */
function getFastifyErrorMessage(error) {
    if (!error.code) return '未知错误'
    return fastifyErrorMessages[error.code] || `系统错误: ${error.code}`
}

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
    let fieldMessages = validationMessages[field]
    let message = fieldMessages && fieldMessages[keyword]

    // 如果字段特定消息中没有找到，尝试使用默认消息
    if (!message) {
        fieldMessages = validationMessages._default
        message = fieldMessages && fieldMessages[keyword]
    }

    // 如果在字段特定消息和默认消息中都没有找到，返回原始错误信息
    if (!message) {
        return validation.message || `${field}验证失败`
    }

    // 替换消息中的参数
    if (params.limit !== undefined) {
        message = message.replace('{limit}', params.limit)
    }

    return `${field}: ${message}`
}

/**
 * Fastify错误处理器插件函数
 *
 * @async
 * @param {FastifyInstance} fastify - Fastify实例
 * @param {Object} options - 插件配置选项
 * @returns {Promise<void>} 无返回值
 * @throws {Error} 可能在设置错误处理器时抛出错误
 *
 * @description
 * 该函数设置了一个全局错误处理器，用于：
 * 1. 处理请求参数验证错误
 * 2. 生成用户友好的错误消息
 * 3. 返回标准的错误响应格式
 */
async function errorHandler(fastify, options) {
    fastify.setErrorHandler(function (error, request, reply) {
        // 处理验证错误
        if (error.validation) {
            reply.status(400).send({
                code: 400,
                msg: `${getValidationErrorMessage(error)}`
            })
            return
        }

        // 处理Fastify标准错误
        if (error.code && error.code.startsWith('FST_ERR_')) {
            const statusCode = error.statusCode || 500
            reply.status(statusCode).send({
                code: statusCode,
                msg: getFastifyErrorMessage(error)
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
