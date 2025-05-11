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
}
