import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const MAX_FILE_IDS = 200;

export const downloadPictures = async pictures => {
  const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
  const scope = ['https://www.googleapis.com/auth/drive.readonly'];
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    scope,
  );

  const drive = google.drive({ version: 'v3', auth });
  const fileIds = pictures.map(picture => picture.fileId);

  let fileIdsAndBuffers = [];

  try {
    for (let index = 0; index < fileIds.length; index += MAX_FILE_IDS) {
      const fileIdsChunk = fileIds.slice(index, index + MAX_FILE_IDS);
      const promiseStatuses = Promise.allSettled(
        fileIdsChunk.map(async fileId => {
          const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' },
          );

          const fileArrayBuffer = response.data;
          const fileIdAndArrayBuffer = { fileArrayBuffer, fileId };

          return fileIdAndArrayBuffer;
        }),
      );

      const filePromiseStatuses = await promiseStatuses;
      const fileIdsAndArrayBuffers = filePromiseStatuses
        .map(filePromiseStatus =>
          filePromiseStatus.status === 'fulfilled'
            ? filePromiseStatus.value
            : console.log(
                `Error to download file: ${filePromiseStatus.reason}`,
              ),
        )
        .filter(filePromiseStatus => filePromiseStatus !== undefined);

      console.log({ fileIdsAndArrayBuffers });

      const fileIdsAndBuffersChunk = fileIdsAndArrayBuffers.map(
        ({ fileArrayBuffer, fileId }) => {
          return { fileBuffer: Buffer.from(fileArrayBuffer), fileId };
        },
      );

      fileIdsAndBuffers = [...fileIdsAndBuffers, ...fileIdsAndBuffersChunk];
    }

    const filteredFileIds = fileIdsAndBuffers.map(
      fileIdAndBuffer => fileIdAndBuffer.fileId,
    );

    pictures
      .filter(picture => filteredFileIds.includes(picture.fileId))
      .map((filteredPicture, index) => {
        return (filteredPicture.file = {
          buffer: fileIdsAndBuffers[index].fileBuffer,
        });
      });

    console.log({ pictures });

    return pictures;
  } catch (error) {
    console.error(error);

    throw new Error('Error to download pictures');
  }
};
