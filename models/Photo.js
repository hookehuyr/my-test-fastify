/*
 * @Date: 2025-05-11 22:14:41
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-12 23:10:51
 * @FilePath: /my-test-fastify/models/Photo.js
 * @Description: 文件描述
 */
'use strict'

const { Like } = require("typeorm")

/**
 * Photo模型类 - 处理照片相关的数据库操作
 * 该类提供了对Photo实体的CRUD操作，并支持与PhotoMetadata的一对一关联关系
 */
class Photo {
  /**
   * 创建Photo模型实例
   * @param {Object} fastify - Fastify实例，用于获取数据库连接
   */
  constructor(fastify) {
    this.fastify = fastify
    this.photoRepository = fastify.orm.getRepository('Photo')
  }

  /**
   * 创建并保存新的照片记录
   * @param {Object} photoData - 照片数据对象
   * @param {string} photoData.name - 照片名称
   * @param {string} photoData.description - 照片描述
   * @param {string} photoData.filename - 文件名
   * @param {number} [photoData.views=0] - 查看次数
   * @param {boolean} [photoData.isPublished=false] - 是否已发布
   * @returns {Promise<Object>} 创建的照片对象
   */
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

  /**
   * 获取所有照片记录
   * @returns {Promise<Array<Object>>} 照片对象数组
   */
  async findAll() {
    return await this.photoRepository.find()
  }

  /**
   * 根据查询条件查找单个照片
   * @param {Object} query - 查询条件
   * @param {string} [query.name] - 照片名称（支持模糊匹配）
   * @returns {Promise<Object|null>} 匹配的照片对象或null
   */
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

  /**
   * 根据查询条件查找多个照片
   * @param {Object} query - 查询条件
   * @returns {Promise<Array<Object>>} 匹配的照片对象数组
   */
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

  /**
   * 根据ID更新照片信息
   * @param {number} id - 照片ID
   * @param {Object} photoData - 更新的照片数据
   * @returns {Promise<boolean>} 更新是否成功
   */
  async updatePhotoById(id, photoData) {
    const result = await this.photoRepository.update(id, photoData)
    return result.affected > 0
  }

  /**
   * 根据ID删除照片
   * @param {number} id - 照片ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  async deletePhotoById(id) {
    const result = await this.photoRepository.delete(id)
    return result.affected > 0
  }

  /**
   * 根据照片ID查找照片及其关联的元数据
   * @param {number} photoId - 照片ID
   * @returns {Promise<Object|null>} 包含元数据的照片对象或null
   */
  async findOneMetadataByPhotoId(photoId) {
    return await this.photoRepository.findOne({
      where: {
        id: photoId
      },
      relations: ['metadata']
    })
  }
}

module.exports = Photo
