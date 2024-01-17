import Database from 'better-sqlite3'
import { desc, gt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdir, readdir, stat } from 'fs/promises'
import { DateTime } from 'luxon'
import sharp from 'sharp'
import * as schema from '../db/schema'

const db = drizzle(new Database('./db/sqlite.db'), { schema })
const { images, tags, categories, metadata, imagesToTags } = schema



export const shareFullDir = '/mnt/c/Users/IP/Pictures/ShareX'
export const shareThumbsDir = '/mnt/c/Users/IP/Pictures/ShareThumbs'

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

// await getMetadata('/mnt/c/Users/IP/Pictures/ShareX/2024-01/chrome_5nAFHRH09a.gif')
export async function getMetadata(path: string) {
  // mtime is modified time
  const { mtime: dateCreated, size: sizeInBytes } = await stat(path)
  const { width, height, format } = await sharp(path).metadata()

  // 1024**2 is bytes per megabyte, then round to 2
  const size = Math.round(sizeInBytes / (1024 ** 2) * 100) / 100
  const isoDate = DateTime.fromJSDate(dateCreated).toISO()

  return { width, height, format, size, dateCreated, isoDate }
}

type ResizeParams = { input: string; output: string; width: number; height: number }
export async function resizeImage({ input, output, width, height }: ResizeParams) {
  const fit = sharp.fit.cover
  return input.endsWith('gif')
    ? await sharp(input, { animated: true }).resize({ width, height, fit }).gif().toFile(
      output,
    )
    : await sharp(input).resize({ width, height, fit }).toFile(output)
}

export function chooseResolution(width: number, height: number) {
  // big
  if (width >= 1600 && height >= 1600) {
    return { width: 400, height: 400, aspect: 1 } as const
  }

  // landscape
  if (width >= height && width / height >= 1.3) {
    return { width: 400, height: 200, aspect: 2 } as const
  }

  // portrait
  if (height >= width && height / width >= 1.3) {
    return { width: 200, height: 400, aspect: 3 } as const
  }

  // small
  return { width: 200, height: 200, aspect: 4 } as const
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
        const { width, height, format, size, dateCreated, isoDate } = await getMetadata(
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
          createdAt: dateCreated,
          isoDate: isoDate || '',
        })

        console.log(`${ind++}/${total}: Success`)
      } catch (err) {
        console.log(
          `${ind++}/${total}: Error - ${err instanceof Error ? err.message : 'unknown'}`,
        )
      }
    }
  }
}
