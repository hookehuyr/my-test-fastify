'use strict';

const { EntitySchema } = require('typeorm');
/**
 * PhotoMetadata实体类
 * 映射photo_metadata表的结构和关系
 */
module.exports = new EntitySchema({
  name: 'PhotoMetadata',
  tableName: 'photo_metadata',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: 'increment'
    },
    height: {
      type: 'int'
    },
    width: {
      type: 'int'
    },
    orientation: {
      type: 'int'
    },
    compressed: {
      type: 'boolean'
    },
  },
  relations: {
    /**
     * 字段含义
     * photo 是PhotoMetadata实体中的关系字段，用于关联Photo实体
     * 这个字段不会在数据库中直接创建列，而是通过外键关联实现
     */
    photo: {  // 定义关系字段名为photo
      target: 'Photo',  // 目标实体是Photo
      type: 'one-to-one',  // 一对一关系
      joinColumn: true,  // 在PhotoMetadata表中创建外键列,表示在photo_metadata表中会创建一个外键列（通常命名为photoId）来存储关联的photo记录的ID
      inverseSide: 'metadata'  // Photo实体中对应的关系字段名,指定了在Photo实体中对应的关系属性名，这样就可以通过photo.metadata访问关联的元数据
    }
  }
})
