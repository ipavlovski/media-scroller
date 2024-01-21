import { DateTime } from 'luxon'
import { mkdir, stat } from 'node:fs/promises'
import sharp from 'sharp'

// eventually move to .env
// const SHAREX_PATH = '/mnt/c/Users/IP/Pictures/ShareX'
export const shareFullDir = '/mnt/c/Users/IP/Pictures/ShareX'
export const shareThumbsDir = '/mnt/c/Users/IP/Pictures/ShareThumbs'

// await getMetadata('/mnt/c/Users/IP/Pictures/ShareX/2024-01/chrome_5nAFHRH09a.gif')
export async function getMetadata(path: string) {
  // mtime is modified time
  const { mtime: createdAt, size: sizeInBytes } = await stat(path)
  const { width, height, format } = await sharp(path).metadata()

  // 1024**2 is bytes per megabyte, then round to 2
  const size = Math.round(sizeInBytes / (1024 ** 2) * 100) / 100
  const isoDate = DateTime.fromJSDate(createdAt).toISO()

  return { width, height, format, size, createdAt, isoDate }
}

type ResizeParams = { input: string; output: string; width: number; height: number }
export async function resizeImage({ input, output, width, height }: ResizeParams) {
  const fit = sharp.fit.cover
  return input.endsWith('gif')
    ? await sharp(input, { animated: true })
      .resize({ width, height, fit })
      .gif()
      .toFile(output)
    : await sharp(input)
      .resize({ width, height, fit })
      .toFile(output)
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

async function prepareThumbsDir(subdir: string) {
  await mkdir(`${shareThumbsDir}/${subdir}`, { recursive: true })
}

// /mnt/c/Users/IP/Pictures/ShareX/2024-01/explorer_ZTouUgwqZd.png:
// shareFullDir: /mnt/c/Users/IP/Pictures/ShareX
// dateDir: 2024-01
// filename: explorer_ZTouUgwqZd.png
export async function processImage(filename: string) {
  // prepare inputs
  const dateDir = new Date().toISOString().substring(0, 7)
  const inputPath = `${shareFullDir}/${dateDir}/${filename}`
  const exists = await stat(inputPath)
  if (!exists.isFile()) throw new Error(`No input file present`)

  // prepare outputs
  await prepareThumbsDir(dateDir)
  const outputPath = `${shareThumbsDir}/${dateDir}/${filename}`

  // prepare for image processing
  const { width, height, format, size, createdAt, isoDate } = await getMetadata(inputPath)
  if (!width || !height) throw new Error(`Failed to get width/height from ${inputPath}`)
  const { aspect, width: rWidth, height: rHeight } = chooseResolution(width, height)

  // resize image
  await resizeImage({
    input: inputPath,
    output: outputPath,
    width: rWidth,
    height: rHeight,
  })

  // return params for database insertion
  return {
    directory: dateDir,
    filename: filename,
    aspect,
    format: format?.toString() || '',
    size,
    createdAt,
    isoDate: isoDate || '',
  }
}
