const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
async function optimizeImage(file) {
  if (
    !file ||
    !['images', 'avatar'].includes(file.fieldname) ||
    !file.mimetype.startsWith('image/') ||
    file.mimetype === 'image/svg+xml'
  )
    return file;
  const filename = path.parse(file.filename).name + '.webp';
  const output = path.join(path.dirname(file.path), filename);
  const bytes = await sharp(file.path, { limitInputPixels: 40000000 })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  await fs.writeFile(output, bytes);
  if (output !== file.path) await fs.unlink(file.path);
  return { ...file, filename, path: output, mimetype: 'image/webp', size: bytes.length };
}
module.exports = { optimizeImage };
