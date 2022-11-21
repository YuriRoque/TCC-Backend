import express from 'express';
import multer from 'multer';

import PictureModel from '../model/PictureModel.js';

const TSVRouter = express.Router();
const multerConfig = multer();

TSVRouter.post(
  '/api/import/tsv',
  multerConfig.single('tsvfile'),
  async (request, response) => {
    try {
      const pictureFile = await request.file.buffer.toString('utf-8');

      const splitLinePictureFile = pictureFile.split(/\r\n|\n/);

      const [, ...pictureData] = splitLinePictureFile;

      const pictureModel = [];

      for await (const data of pictureData) {
        const verifyPictureData = sentence => {
          const verifiedSentence = [];

          for (const word of sentence) {
            if (word.includes('\t')) {
              word.split(/\t/, 1);
            }

            verifiedSentence.push(word);
          }

          return verifiedSentence;
        };

        const parseDate = unparsedDate => {
          if (unparsedDate) {
            if (unparsedDate.indexOf('-') >= 0) {
              const newDate = new Date(unparsedDate).toISOString();

              return newDate;
            } else {
              const date = unparsedDate.split('/');

              const newDate = new Date(date[2], date[1], date[0]).toISOString();

              return newDate;
            }
          }

          return new Date();
        };

        const changeLinkPrefixAndSufix = link => {
          let otherPrefixAndNoSufixLink = '';

          if (link.includes('https://drive.google.com/file/d/')) {
            otherPrefixAndNoSufixLink = link.replace(
              'https://drive.google.com/file/d/',
              'https://drive.google.com/uc?id=',
            );
          }

          if (otherPrefixAndNoSufixLink.includes('/view?usp=sharing'))
            otherPrefixAndNoSufixLink = otherPrefixAndNoSufixLink.replace(
              '/view?usp=sharing',
              '',
            );

          return otherPrefixAndNoSufixLink;
        };

        const splitPictureData = data.split(/\t/);

        const verifiedSplitedPictureData = verifyPictureData(splitPictureData);

        if (!verifiedSplitedPictureData[17]) continue;

        const newPictureModel = {
          fundo: verifiedSplitedPictureData[0],
          colecao: verifiedSplitedPictureData[1],
          titulo_assunto: verifiedSplitedPictureData[2],
          local: verifiedSplitedPictureData[3],
          ano: verifiedSplitedPictureData[4],
          descricao_fisica: verifiedSplitedPictureData[5],
          nota: verifiedSplitedPictureData[6],
          observacao: verifiedSplitedPictureData[7],
          descritor_1: verifiedSplitedPictureData[8],
          descritor_2: verifiedSplitedPictureData[9],
          descritor_3: verifiedSplitedPictureData[10],
          tipologia: verifiedSplitedPictureData[11],
          autoria: verifiedSplitedPictureData[12],
          copilador: verifiedSplitedPictureData[13],
          data_catalogacao: parseDate(verifiedSplitedPictureData[14]),
          nome_diretorio: verifiedSplitedPictureData[15],
          nome_arquivo_digital: verifiedSplitedPictureData[16],
          link: changeLinkPrefixAndSufix(verifiedSplitedPictureData[17]),
        };

        pictureModel.push(newPictureModel);
      }

      await PictureModel.insertMany(pictureModel);

      await PictureModel.aggregate(
        [
          {
            $group: {
              _id: '$link',
              dups: {
                $addToSet: {
                  _id: '$_id',
                  createdAt: '$createdAt',
                },
              },
              countDups: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              createdAt: 1,
            },
          },
          {
            $match: {
              countDups: {
                $gt: 1,
              },
            },
          },
        ],
        (error, pictures) => {
          if (error) console.error(error);

          pictures.forEach(async pictureLink => {
            pictureLink.dups.shift();

            await PictureModel.deleteMany({
              _id: { $in: pictureLink.dups },
            });
          });
        },
      );

      response.status(201).send({ message: 'Imported successfully' });
    } catch (error) {
      console.error(error);

      response.status(500).json({ message: 'File import failed' });
    }
  },
);

export { TSVRouter };
