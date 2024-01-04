import { readdir, stat } from 'fs/promises'
import { DateTime } from 'luxon'
import sharp from 'sharp'

const sharexDir = '/mnt/c/Users/IP/Pictures/ShareX'


// const allFiles = await listAllMedia(sharexDir)
// allFiles.forEach(({ files, subdir }) => console.log(`${subdir}: ${files.length}`))
async function listAllMedia(dir: string) {
  const subdirs = await readdir(dir)

  const allFiles: { subdir: string; path: string; files: string[] }[] = []
  for (const subdir of subdirs) {
    allFiles.push({ subdir, path: `${dir}/${subdir}`, files: await readdir(`${dir}/${subdir}`) })
  }

  return allFiles
}

// await getMetadata('/mnt/c/Users/IP/Pictures/ShareX/2024-01/chrome_5nAFHRH09a.gif')
async function getMetadata(path: string) {
  // mtime is modified time
  const { mtime: unixDate, size: sizeInBytes } = await stat(path)
  const { width, height, format } = await sharp(path).metadata()

  // 1024**2 is bytes per megabyte, then round to 2
  const size = Math.round(sizeInBytes / (1024 ** 2) * 100) / 100
  const isoDate = DateTime.fromJSDate(unixDate).toISO()

  return { width, height, format, size, unixDate, isoDate }
}

type ResizeParams = { input: string; output: string; width: number; height: number }
async function resizeMedia({ input, output, width, height }: ResizeParams) {
  const fit = sharp.fit.cover
  return input.endsWith('gif')
    ? await sharp(input, { animated: true }).resize({ width, height, fit }).gif().toFile(output)
    : await sharp(input).resize({ width, height, fit }).toFile(output)
}

type ResizeOptions = { width: 200 | 400; height: 200 | 400 }
function chooseResolution(width: number, height: number): ResizeOptions {
  if (width >= 1600 && height >= 1600) {
    return { width: 400, height: 400 }
  }

  if (width >= height && width / height >= 1.3) {
    return { width: 400, height: 200 }
  }

  if (height >= width && height / width >= 1.3) {
    return { width: 200, height: 400 }
  }

  return { width: 200, height: 200 }
}








