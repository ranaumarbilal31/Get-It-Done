import { it, expect } from 'vitest';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { optimizeImage } from '../src/services/imageService.js';
it('converts a raster upload to bounded WebP without modifying identity samples', async () => {
  const root = path.resolve('.test-data');
  await fs.mkdir(root, { recursive: true });
  const directory = await fs.mkdtemp(path.join(root, 'images-'));
  try {
    const filename = 'photo.png',
      filePath = path.join(directory, filename);
    await sharp({ create: { width: 2000, height: 1000, channels: 3, background: '#ba4214' } })
      .png()
      .toFile(filePath);
    const identity = { fieldname: 'idDocument', mimetype: 'image/png', filename, path: filePath };
    expect(await optimizeImage(identity)).toBe(identity);
    const result = await optimizeImage({ ...identity, fieldname: 'images' });
    const meta = await sharp(await fs.readFile(result.path)).metadata();
    expect(result.mimetype).toBe('image/webp');
    expect(meta.width).toBe(1600);
    expect(meta.height).toBe(800);
    await expect(fs.stat(filePath)).rejects.toThrow();
  } finally {
    if (!directory.startsWith(root + path.sep)) throw new Error('Invalid test path');
    await fs.rm(directory, { recursive: true, force: true });
  }
});
