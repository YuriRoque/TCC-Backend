import PictureModel from '../model/PictureModel.js';

class PictureController {
  async index(request, response) {
    try {
      const page = parseInt(request.query.page);
      const limit = parseInt(request.query.limit);
      const { filter } = request.query;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const pictures = {};

      pictures.items = filter
        ? await PictureModel.find({
            'labels.descricao_IA': {
              $regex: '.*' + filter + '.*',
              $options: 'i',
            },
          })
            .limit(limit)
            .skip(startIndex)
            .exec()
        : await PictureModel.find().limit(limit).skip(startIndex).exec();

      const totalDocuments = filter
        ? await PictureModel.countDocuments({
            'labels.descricao_IA': {
              $regex: '.*' + filter + '.*',
              $options: 'i',
            },
          }).exec()
        : await PictureModel.countDocuments().exec();

      if (startIndex > 0) {
        pictures.previous = {
          page: page - 1,
          limit,
        };
      }

      if (endIndex < totalDocuments) {
        pictures.next = {
          page: page + 1,
          limit,
        };
      }

      pictures.totalPages = Math.ceil(totalDocuments / limit);

      response.json({ pictures });
    } catch (error) {
      console.error(error);

      response.status(404).json({ message: 'Pictures not found' });
    }
  }

  async getOne(request, response) {
    const { id } = request.params;

    try {
      const picture = await PictureModel.findById(id);

      if (!picture) {
        return response.status(404).json({ message: 'Picture not found' });
      }

      response.json(picture);
    } catch (error) {
      console.error(error);

      response.status(400).json({ message: 'Something bad happened' });
    }
  }

  async store(request, response) {
    const {
      fundo,
      colecao,
      titulo_assunto,
      local,
      ano,
      descricao_fisica,
      nota,
      observacao,
      descritor_1,
      descritor_2,
      descritor_3,
      tipologia,
      autoria,
      copilador,
      data_catalogacao,
      nome_diretorio,
      nome_arquivo_digital,
      link,
      descricao_IA,
      precisao_IA,
    } = request.body;

    try {
      const picture = await PictureModel.create({
        fundo,
        colecao,
        titulo_assunto,
        local,
        ano,
        descricao_fisica,
        nota,
        observacao,
        descritor_1,
        descritor_2,
        descritor_3,
        tipologia,
        autoria,
        copilador,
        data_catalogacao,
        nome_diretorio,
        nome_arquivo_digital,
        link,
        descricao_IA,
        precisao_IA,
      });

      response.status(201).json({ message: 'Picture Created', picture });
    } catch (error) {
      console.error(error);

      response.status(400).json({ message: 'Invalid Data' });
    }
  }

  async update(request, response) {
    const { id } = request.params;
    const {
      fundo,
      colecao,
      titulo_assunto,
      local,
      ano,
      descricao_fisica,
      nota,
      observacao,
      descritor_1,
      descritor_2,
      descritor_3,
      tipologia,
      autoria,
      copilador,
      data_catalogacao,
      nome_diretorio,
      nome_arquivo_digital,
      link,
      descricao_IA,
      precisao_IA,
    } = request.body;

    try {
      const picture = await PictureModel.findByIdAndUpdate(
        id,
        {
          fundo,
          colecao,
          titulo_assunto,
          local,
          ano,
          descricao_fisica,
          nota,
          observacao,
          descritor_1,
          descritor_2,
          descritor_3,
          tipologia,
          autoria,
          copilador,
          data_catalogacao,
          nome_diretorio,
          nome_arquivo_digital,
          link,
          descricao_IA,
          precisao_IA,
        },
        { new: true },
      );

      if (!picture) {
        return response.status(404).json({ message: 'Picture not found' });
      }

      response.json(picture);
    } catch (error) {
      console.error(error);

      response.status(400).json({ message: 'Something bad happened' });
    }
  }

  async remove(request, response) {
    const { id } = request.params;

    try {
      const picture = await PictureModel.findById(id);

      if (!picture) {
        return response.status(404).json({ message: 'Picture not found' });
      }

      await picture.remove();

      response.json({ message: 'Picture removed successfully' });
    } catch (error) {
      console.error(error);

      response.status(400).json({ message: 'Something bad happened' });
    }
  }

  async getPicturesWithLinkIds() {
    try {
      const pictures = await PictureModel.find({ labels: [] }, 'link');

      if (pictures.length === 0) {
        throw new Error('Links not found or labels are fully filled');
      }

      pictures.map((picture, index) => {
        const fileId = picture.link.replace(
          'https://drive.google.com/uc?id=',
          '',
        );

        pictures[index].fileId = fileId;
      });

      return pictures;
    } catch (error) {
      console.error(error);

      if (error.message) throw Error(error.message);

      throw new Error('Something bad happened...');
    }
  }

  async setManyLabels(request, response) {
    try {
      const promiseStatuses = await Promise.allSettled(
        request.pictures.map(
          async picture =>
            await PictureModel.findByIdAndUpdate(
              { _id: picture.id },
              {
                $addToSet: {
                  labels: picture.file.labels.labelsTranslated,
                },
              },
              { new: true },
            ),
        ),
      );

      const picturePromiseStatuses = await promiseStatuses;
      const pictureModels = picturePromiseStatuses
        .map(picturePromiseStatus =>
          picturePromiseStatus.status === 'fulfilled'
            ? picturePromiseStatus.value
            : console.log(
                `Error to download file: ${picturePromiseStatus.reason}`,
              ),
        )
        .filter(picturePromiseStatus => picturePromiseStatus !== undefined);

      console.log({ pictureModels });

      response.status(201).json({ pictureModels });
    } catch (error) {
      console.error(error);

      response.status(500).json({ message: 'Failed to receive data from API' });
    }
  }

  async setLabels(request, response) {
    const labels = request.data;

    const { id } = request.params;

    try {
      const picture = await PictureModel.findByIdAndUpdate(
        { _id: id },
        {
          $addToSet: {
            labels: labels,
          },
        },
      );

      if (!picture) {
        return response.status(404).json({ message: 'Picture not found' });
      }

      response.json({ labels });
    } catch (error) {
      console.error(error);

      response.status(500).json({ message: 'Failed to receive data from API' });
    }
  }
}

export default PictureController;
