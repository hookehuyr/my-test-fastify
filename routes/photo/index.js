'use strict'

const path = require('path')
const Photo = require(path.join(__dirname, '../../models/Photo'))
const S = require('fluent-json-schema')

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
      description: '创建新的照片',
      body: bodyJsonSchema
    }
  }, async function (request, reply) {
    try {
      const { name, description, filename, views, isPublished } = request.body
      const photoModel = new Photo(fastify)
      const photo = await photoModel.create({
        name,
        description,
        filename,
        views,
        isPublished
      })

      return reply.send({
        message: '创建成功',
        data: photo
      })
    } catch (error) {
      return reply.status(500).send({
        message: '创建失败',
        error: error.message
      })
    }
  })

  fastify.get('/list', {
    schema: {
      tags: ['photo'],
      summary: '获取照片列表',
      description: '获取照片列表',
    }
  }, async function (request, reply) {
    try {
      const photoModel = new Photo(fastify)
      const photos = await photoModel.findAll()
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

  fastify.get('/getPhotoBy', {
    schema: {
      tags: ['photo'],
      summary: '获取照片',
      description: '获取照片',
      querystring: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string', description: '照片名称（支持模糊查询）' }
        },
        oneOf: [
          { required: ['id'] },
          { required: ['name'] }
        ]
      }
    }
  }, async function (request, reply) {
    try {
      const query = request.query
      const photoModel = new Photo(fastify)
      let photo = null
      if (query) {
        photo = await photoModel.findOneBy(query)
      }
      return reply.send({
        message: '获取成功',
        data: photo
      })
    } catch (error) {
      return reply.status(500).send({
        message: '获取失败',
        error: error.message
      })
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
