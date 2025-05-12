/*
 * @Date: 2025-05-11 22:14:41
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-12 20:33:55
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

  /**
   * 获取照片列表和总数（支持分页和排序）
   * @param {Object} options 查询选项
   * @param {number} options.skip 跳过的记录数
   * @param {number} options.take 获取的记录数
   * @param {Object} options.order 排序选项
   * @returns {Promise<[Photo[], number]>} 返回照片列表和总数
   */
  async findAndCount(options = {}) {
    const { skip, take, order = 'DESC' } = options
    return await this.photoRepository.findAndCount({
      skip,
      take,
      order: {
        id: order
      }
    })
  }

  async updatePhotoById(id, photoData) {
    const result = await this.photoRepository.update(id, photoData)
    return result.affected > 0
  }

  async deletePhotoById(id) {
    const result = await this.photoRepository.delete(id)
    return result.affected > 0
  }
}

module.exports = Photo
