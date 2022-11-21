import mongoose from 'mongoose';

const PictureSchema = new mongoose.Schema(
  {
    fundo: { type: [String] },
    colecao: { type: [String] },
    titulo_assunto: { type: [String], required: true },
    local: { type: [String] },
    ano: { type: [Number], required: true },
    descricao_fisica: { type: [String] },
    nota: { type: [String], required: true },
    observacao: { type: [String] },
    descritor_1: { type: [String], required: true },
    descritor_2: { type: [String], required: true },
    descritor_3: { type: [String], required: true },
    tipologia: { type: [String] },
    autoria: { type: [String] },
    copilador: { type: [String] },
    data_catalogacao: { type: Date, required: true },
    nome_diretorio: { type: [String], required: true },
    nome_arquivo_digital: { type: [String], required: true },
    link: { type: String, required: true },
    labels: [
      {
        _id: false,
        descricao_IA: String,
        precisao_IA: Number,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const PictureModel = mongoose.model('picture', PictureSchema);

export default PictureModel;
