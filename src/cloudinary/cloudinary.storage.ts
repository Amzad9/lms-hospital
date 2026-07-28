import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './../config/cloudinary.config';

export const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'patients',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  }),
});