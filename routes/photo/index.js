'use strict'

const path = require('path')
const Photo = require(path.join(__dirname, '../../models/Photo'))
const S = require('fluent-json-schema')

// 定义分页查询的Schema
const paginationSchema = S.object()
  .prop('page', S.number().minimum(1).default(1).description('页码'))
  .prop('limit', S.number().minimum(1).maximum(100).default(10).description('每页数量'))
  .prop('order', S.string().enum(['ASC', 'DESC']).default('DESC').description('排序方式'))
  .valueOf()

/**
 * 统一错误处理函数
 * @param {Error} error - 错误对象
 * @param {Object} reply - Fastify reply对象
 * @returns {Object} 错误响应
 */
const handleError = (error, reply) => {
  if (error.name === 'ValidationError') {
    return reply.status(400).send({
      status: 'error',
      message: '参数验证失败',
      errors: error.message
    })
  }

  if (error.name === 'EntityNotFound') {
    return reply.status(404).send({
      status: 'error',
      message: '资源未找到',
      error: error.message
    })
  }

  return reply.status(500).send({
    status: 'error',
    message: '服务器内部错误',
    error: error.message
  })
}

module.exports = async function (fastify, opts) {
  const bodyJsonSchema = S.object()
    .prop('name', S.string().minLength(1).maxLength(100))
    .prop('filename', S.string().minLength(1).maxLength(255))
    .prop('description', S.anyOf([S.string(), S.null()])) // 允许description为null
    .prop('views', S.number())
    .prop('isPublished', S.boolean())
    .required(['name', 'filename'])
    .valueOf()

  fastify.post('/create', {
    schema: {
      tags: ['photo'],
      summary: '创建照片',
      description: '创建新的照片记录',
      body: bodyJsonSchema,
      response: {
        201: S.object()
          .prop('status', S.string())
          .prop('message', S.string())
          .prop('data', S.object()
            .prop('id', S.number())
            .prop('name', S.string())
            .prop('filename', S.string())
            .prop('description', S.anyOf([S.string(), S.null()]))
            .prop('views', S.number())
            .prop('isPublished', S.boolean())
          )
      }
    }
  }, async function (request, reply) {
    try {
      const photoData = request.body

      // 数据预处理
      if (photoData.views === undefined) photoData.views = 0
      if (photoData.isPublished === undefined) photoData.isPublished = false

      const photoModel = new Photo(fastify)
      const photo = await photoModel.create(photoData)

      return reply.status(201).send({
        status: 'success',
        message: '照片创建成功',
        data: photo
      })
    } catch (error) {
      return handleError(error, reply)
    }
  })

  fastify.get('/list', {
    schema: {
      tags: ['photo'],
      summary: '获取照片列表',
      description: '获取照片列表（支持分页）',
      querystring: paginationSchema
    }
  }, async function (request, reply) {
    try {
      const { page = 1, limit = 10, order = 'DESC' } = request.query
      const skip = (page - 1) * limit

      const photoModel = new Photo(fastify)
      const [photos, total] = await photoModel.findAndCount({
        skip,
        take: limit,
        order
      })

      return reply.send({
        status: 'success',
        message: '获取成功',
        data: {
          items: photos,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error) {
      return handleError(error, reply)
    }
  })

  fastify.get('/getPhotoBy', {
    schema: {
      tags: ['photo'],
      summary: '获取单个照片',
      description: '通过ID或名称获取单个照片信息',
      querystring: S.object()
        .prop('id', S.number().minimum(1))
        .prop('name', S.string().minLength(1).maxLength(100).pattern('^[\\w\\s-]+$'))
        .oneOf([
          S.object().required(['id']),
          S.object().required(['name'])
        ])
        .valueOf()
    }
  }, async function (request, reply) {
    try {
      const { id, name } = request.query
      const photoModel = new Photo(fastify)

      const photo = await photoModel.findOneBy(id ? { id } : { name })

      if (!photo) {
        return reply.status(404).send({
          status: 'error',
          message: '照片不存在'
        })
      }

      return reply.send({
        status: 'success',
        message: '获取成功',
        data: photo
      })
    } catch (error) {
      return handleError(error, reply)
    }
  })

  fastify.get('/getPhotosBy', {
    schema: {
      tags: ['photo'],
      summary: '获取照片列表',
      description: '获取照片列表',
      querystring: {
        type: 'object',
        properties: {
          views: { type: 'number' },
          isPublished: { type: 'boolean' }
        },
        oneOf: [
          { required: ['views'] },
          { required: ['isPublished'] }
        ]
      }
    }
  }, async function (request, reply) {
    try {
      const query = request.query
      const photoModel = new Photo(fastify)
      let photos = null
      if (query) {
        photos = await photoModel.findBy(query)
      }
      return reply.send({
        message: '获取成功',
        data: photos
      })
    } catch (error) {
      return reply.status(500).send({
        message: '获取失败',
        error: error.message
      })
    }
  })

  fastify.get('/getPhotoAndCount', {
    schema: {
      tags: ['photo'],
      summary: '获取照片列表和数量',
      description: '获取照片列表和数量',
    }
  }, async function (request, reply) {
    try {
      const photoModel = new Photo(fastify)
      const [photos, count] = await photoModel.findAndCount()
      return reply.send({
        message: '获取成功',
        data: {
          photos,
          count
        }
      })
    } catch (error) {
      return reply.status(500).send({
        message: '获取失败',
        error: error.message
      })
    }
  })
}
