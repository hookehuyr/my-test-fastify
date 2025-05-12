/*
 * @Date: 2025-05-12
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-13 00:02:42
 * @FilePath: /my-test-fastify/models/PhotoMetadata.js
 * @Description: PhotoMetadata模型，封装元数据相关操作
 */
'use strict'

class PhotoMetadata {
    /**
     * 构造函数，初始化Repository
     * @param {Object} fastify fastify实例
     */
    constructor(fastify) {
        this.fastify = fastify
        this.metadataRepository = fastify.orm.getRepository('PhotoMetadata')
    }

    /**
     * 创建并保存照片元数据
     * @param {Object} metadataData 元数据对象, 如果关联了Photo，则需要包含photo字段
     * @returns {Promise<Object>} 创建后的元数据
     */
    async create(metadataData) {
        const metadata = this.metadataRepository.create(metadataData)
        await this.metadataRepository.save(metadata)
        return metadata
    }

    /**
     * 通过ID查找元数据
     * @param {number} id 元数据ID
     * @returns {Promise<Object|null>} 元数据对象或null
     */
    async findById(id) {
        return await this.metadataRepository.findOneBy({ id })
    }

    /**
     * 更新元数据
     * @param {number} id 元数据ID
     * @param {Object} metadataData 更新的数据
     * @returns {Promise<Object|null>} 更新后的元数据或null
     */
    // async updatePhotoMetadataById(id, metadataData) {

    // }
}

module.exports = PhotoMetadata
