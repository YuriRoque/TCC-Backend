'use strict';

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const recogniseFromBuffer = async fileBufferAndId => {
  try {
    const bufferBase64String = Buffer.from(
      fileBufferAndId.fileBuffer.buffer,
    ).toString('base64');

    const CLOUD_VISION_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

    const axiosUrl = `https://vision.googleapis.com/v1/images:annotate?key=${CLOUD_VISION_API_KEY}`;

    const axiosData = {
      requests: [
        {
          image: { content: bufferBase64String },
          features: [{ type: 'LABEL_DETECTION' }],
        },
      ],
    };

    const response = await axios.post(axiosUrl, axiosData);
    const data = response.data;
    const pictureVisionDataAndId = { id: fileBufferAndId.id, data };

    return pictureVisionDataAndId;
  } catch (error) {
    console.log(error);

    return error;
  }
};
