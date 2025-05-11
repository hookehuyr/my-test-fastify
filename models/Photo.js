/*
 * @Date: 2025-05-11 22:14:41
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-12 00:10:16
 * @FilePath: /my-test-fastify/models/Photo.js
 * @Description: 文件描述
 */
'use strict'

const { Like } = require("typeorm")

class Photo {
  constructor(fastify) {
    this.fastify = fastify
    this.photoRepository = fastify.orm.getRepository('Photo')
  }

  async create(photoData) {
    const { name, description, filename, views, isPublished } = photoData

    const photo = this.photoRepository.create({
      name,
      description,
      filename,
      views,
      isPublished
    })

    await this.photoRepository.save(photo)
    return photo
  }

  async findAll() {
    return await this.photoRepository.find()
  }

  async findOneBy(query) {
    // 如果是通过name查询，使用Like进行模糊匹配
    if (query.name) {
      return await this.photoRepository.findOne({
        where: {
          name: Like(`%${query.name}%`)
        }
      })
    }
    // 其他查询条件保持原样
    return await this.photoRepository.findOneBy(query)
  }

  async findBy(query) {
    return await this.photoRepository.findBy(query)
  }

  async findAndCount() {
    return await this.photoRepository.findAndCount()
  }
}

module.exports = Photo
