const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');

exports.resizeRoomImages = asyncHandler(async (req, res, next) => {
  // 0) If there is no data, next.
  if (!req.files.thumbnail && !req.files.photos) {
    return next();
  }

  // 1) Ensure image directories exist (✅ prevent Windows write error)
  const thumbnailDir = path.join(__dirname, '../public/images/thumbnails');
  const featuresDir = path.join(__dirname, '../public/images/room-features');

  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
  }

  if (!fs.existsSync(featuresDir)) {
    fs.mkdirSync(featuresDir, { recursive: true });
  }

  // 2) Process the thumbnail.
  if (req.files.thumbnail) {
    const imageCoverFilename = `room-${
      req.params.id || req.body.name
    }-${Date.now()}-thumbnail.png`;

    await sharp(req.files.thumbnail[0].buffer)
      .resize(106, 106)
      .toFormat('png')
      .toFile(path.join(thumbnailDir, imageCoverFilename)); // ✅ use absolute path

    req.body.thumbnail = imageCoverFilename;
  }

  // 3) Process the photos asynchronously.
  if (req.files.photos) {
    req.body.photos = [];

    await Promise.all(
      req.files.photos.map(async (image, index) => {
        const filename = `room-${
          req.params.id || req.body.name
        }-${Date.now()}-${index + 1}.jpeg`;

        await sharp(image.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .toFile(path.join(featuresDir, filename)); // ✅ absolute path again

        req.body.photos.push(filename);
      }),
    );
  }

  next();
});
