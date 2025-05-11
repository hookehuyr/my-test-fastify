/*
 * @Date: 2025-05-11 22:14:41
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-11 22:21:31
 * @FilePath: /my-test-fastify/models/Photo.js
 * @Description: 文件描述
 */
'use strict'

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
}

module.exports = Photo
