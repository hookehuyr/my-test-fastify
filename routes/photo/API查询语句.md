```javascript
  const photoRepository = AppDataSource.getRepository(Photo)
  // 查询语句
  const allPhotos = await photoRepository.find()
  const firstPhoto = await photoRepository.findOneBy({
    id: 1,
  })
  const allViewedPhotos = await photoRepository.findBy({ views: 1 })
  const [photos, photosCount] = await photoRepository.findAndCount()

  const result = await this.photoRepository.update(id, photoData)
  const result = await this.photoRepository.delete(id)
```
