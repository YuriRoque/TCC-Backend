import PictureController from '../controller/PictureController.js';
import { downloadPictures } from '../google-cloud/driveAPI/DownloadPictures.js';
import { translateDescriptions } from '../google-cloud/translationAI/TranslateLabels.js';
import { recogniseFromBuffer } from '../google-cloud/visionAI/DetectLabels.js';

const MAX_PICTURES = 100;

const middleware = async (request, response, next) => {
  const url = request.url;

  try {
    if (url === '/api/aiAPI') {
      const visionResponse = await recogniseFromBuffer(request);

      if (!visionResponse) {
        throw new Error(`Image ${request.file.filename} not found`);
      }

      const labelAnnotations = visionResponse.responses[0].labelAnnotations;

      const labels = [];

      labelAnnotations.map(({ description, score }) => {
        labels.push({ descricao_IA: description, precisao_IA: score });
      });

      const labelsTranslated = await translateDescriptions(labels);

      request.data = labelsTranslated;

      next();
    } else {
      const pictureController = new PictureController();

      const pictures = await pictureController.getPicturesWithLinkIds();

      request.pictures = await downloadPictures(pictures);

      let visionResponseArray = [];

      for (let i = 0; i < request.pictures.length; i += MAX_PICTURES) {
        const picturesChunk = request.pictures.slice(i, i + MAX_PICTURES);
        const promiseStatuses = Promise.allSettled(
          picturesChunk.map(async picture => {
            const pictureFileBufferAndId = {
              fileBuffer: picture.file,
              id: picture.id,
            };

            const pictureVisionDataAndId = await recogniseFromBuffer(
              pictureFileBufferAndId,
            );

            return pictureVisionDataAndId;
          }),
        );

        const visionPromiseStatuses = await promiseStatuses;
        const visionResponseArrayChunk = visionPromiseStatuses
          .map(visionPromiseStatus =>
            visionPromiseStatus.status === 'fulfilled'
              ? visionPromiseStatus.value
              : console.error(
                  `Error to Recognise Image: ${visionPromiseStatus.reason}`,
                ),
          )
          .filter(visionPromiseStatus => visionPromiseStatus !== undefined);

        console.log({ visionResponseArrayChunk });

        visionResponseArray = [
          ...visionResponseArray,
          ...visionResponseArrayChunk,
        ];
      }

      let labelAnnotationsArray = [];

      for (let i = 0; i < visionResponseArray.length; i += MAX_PICTURES) {
        const visionResponseArrayChunk = visionResponseArray.slice(
          i,
          i + MAX_PICTURES,
        );
        const promiseStatuses = Promise.allSettled(
          visionResponseArrayChunk.map(async visionResponse => {
            const { labelAnnotations } = visionResponse.data.responses[0];
            const { id } = visionResponse;
            const labels = [];

            labelAnnotations.map(({ description, score }) => {
              labels.push({ descricao_IA: description, precisao_IA: score });
            });

            const labelsTranslated = await translateDescriptions(labels);
            const labelsTranslatedWithId = { id, labelsTranslated };

            return labelsTranslatedWithId;
          }),
        );

        const labelAnnotationsPromiseStatuses = await promiseStatuses;
        const labelAnnotationsArrayChunk = labelAnnotationsPromiseStatuses
          .map(labelAnnotationsPromiseStatus =>
            labelAnnotationsPromiseStatus.status === 'fulfilled'
              ? labelAnnotationsPromiseStatus.value
              : console.error(
                  `Error to Recognise Image: ${labelAnnotationsPromiseStatus.reason}`,
                ),
          )
          .filter(
            labelAnnotationsPromiseStatus =>
              labelAnnotationsPromiseStatus !== undefined,
          );

        console.log({ labelAnnotationsArrayChunk });

        labelAnnotationsArray = [
          ...labelAnnotationsArray,
          ...labelAnnotationsArrayChunk,
        ];
      }

      pictures.file = pictures
        .filter(picture =>
          labelAnnotationsArray.some(({ id }) => id === picture.id),
        )
        .map(
          (picture, index) =>
            (picture.file = { labels: labelAnnotationsArray[index] }),
        );

      console.log({ pictures });

      request.pictures = pictures;
      next();
    }
  } catch (error) {
    console.error(error);

    return response.status(500).json({ message: error.message });
  }
};

export default middleware;
