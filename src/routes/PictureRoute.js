import { Router } from 'express';

import multer from 'multer';
import PictureController from '../controller/PictureController.js';
import GoogleVisionMiddleware from '../middleware/GoogleMiddleware.js';

const PictureRouter = Router();
const pictureController = new PictureController();

PictureRouter.get('/api/picture', pictureController.index);
PictureRouter.get('/api/picture/:id', pictureController.getOne);
PictureRouter.post('/api/picture', pictureController.store);
PictureRouter.put('/api/picture/:id', pictureController.update);
PictureRouter.delete('/api/picture/:id', pictureController.remove);
PictureRouter.patch(
  '/api/aiAPI',
  multer().single('picture'),
  GoogleVisionMiddleware,
  pictureController.setLabels,
);
PictureRouter.patch(
  '/api/indexAPI',
  GoogleVisionMiddleware,
  pictureController.setManyLabels,
);

export default PictureRouter;
