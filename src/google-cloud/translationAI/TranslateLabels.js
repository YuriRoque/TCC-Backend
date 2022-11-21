'use-strict';

import { Translate } from '@google-cloud/translate/build/src/v2/index.js';
import dotenv from 'dotenv';

dotenv.config();

export const translateDescriptions = async labels => {
  const CREDENTIALS = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);

  const translate = new Translate({
    credentials: CREDENTIALS,
    projectId: CREDENTIALS.project_id,
  });

  const target = 'pt';

  try {
    const descriptions = labels.map(label => label.descricao_IA);

    const [response] = await translate.translate(descriptions, target);

    labels.map((label, index) => (label.descricao_IA = response[index]));

    return labels;
  } catch (error) {
    console.error(error);

    return error;
  }
};
