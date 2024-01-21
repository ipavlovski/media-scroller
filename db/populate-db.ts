import Database from 'better-sqlite3'
import { desc, gt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdir, readdir } from 'fs/promises'
import { DateTime } from 'luxon'
import { chooseResolution, getMetadata, resizeImage, shareFullDir,
  shareThumbsDir } from './fs-handlers'
import * as schema from './schema'
// import data from './sqlite.json'

const { images, tags, categories, metadata, imagesToTags } = schema
const db = drizzle(new Database('./db/sqlite.db'), { schema })

async function populateImages(data: any) {
  for (const image of data) {
    console.log(image.id)
    const d = DateTime.fromMillis(image.created_at) as DateTime<true>
    await db.insert(images).values({
      id: image.id,
      directory: image.directory,
      filename: image.filename,
      dateCreated: new Date(data[0].created_at),
      dateIso: image.iso_date,
      dateAgg: d.hour < 5 ? d.minus({ day: 1 }).toSQLDate() : d.toSQLDate(),
      format: image.format,
      size: image.size,
      aspect: image.aspect,
      deleted: !!image.boolean,
    })
  }
}

type createImageRecordProps = {
  directory: string
  filename: string
  aspect: 1 | 2 | 3 | 4
  format: string
  size: number
  createdAt: Date
  isoDate: string
}

async function createImageRecord(props: createImageRecordProps) {
  const { lastInsertRowid } = await db.insert(images).values(props)

  return lastInsertRowid
}

async function queryPaginatedById(limit: number, cursor: number) {
  return await db.select()
    .from(images)
    .orderBy(desc(images.id))
    .limit(limit)
    .where(gt(images.id, cursor))
}

// const allFiles = await listAllMedia(shareFullDir)
export async function listAllMedia(dir: string) {
  const subdirs = await readdir(dir)

  const allFiles: { subdir: string; path: string; files: string[] }[] = []
  for (const subdir of subdirs) {
    allFiles.push({ subdir, path: `${dir}/${subdir}`,
      files: await readdir(`${dir}/${subdir}`) })
  }

  return allFiles
}

export async function prepareAllDirs() {
  const allFiles = await listAllMedia(shareFullDir)
  for (const dir of allFiles.map((v) => v.subdir)) {
    await mkdir(`${shareThumbsDir}/${dir}`)
  }
}

export async function processExistingImages() {
  const allFiles = await listAllMedia(shareFullDir)

  let ind = 0
  const total = allFiles.map((v) => v.files.length).reduce((a, b) => a + b, 0)
  for (const { files, path, subdir } of allFiles) {
    for (const file of files) {
      if (file.endsWith('mp4')) {
        console.log(`${ind++}/${total}: skipping mp4 file.`)
        continue
      }

      const inputPath = `${path}/${file}`
      const outputPath = `${shareThumbsDir}/${subdir}/${file}`

      try {
        const { width, height, format, size, createdAt, isoDate } = await getMetadata(
          inputPath,
        )
        if (!width || !height) {
          throw new Error(`Failed to get width and height from ${inputPath}`)
        }
        const { aspect, width: rWidth, height: rHeight } = chooseResolution(width, height)

        // resize image
        await resizeImage({
          input: inputPath,
          output: outputPath,
          width: rWidth,
          height: rHeight,
        })

        // insert into database
        await createImageRecord({
          directory: subdir,
          filename: file,
          aspect,
          format: format?.toString() || '',
          size,
          createdAt,
          isoDate: isoDate || '',
        })

        console.log(`${ind++}/${total}: Success`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown'
        console.log(`${ind++}/${total}: Error - ${msg}`)
      }
    }
  }
}
