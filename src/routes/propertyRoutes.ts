  import express from 'express';
  import multer from 'multer';
  import {
    importProperties,
    createProperty,
    getProperties,
    getPropertyById,
    updateProperty,
    deleteProperty
  } from '../controllers/propertyController';
  import { authMiddleware } from '../middlewares/authMiddleware';

  const upload = multer({ storage: multer.memoryStorage() });
  const router = express.Router();

  // Route definitions
  router.post('/import', authMiddleware, upload.single('file'), importProperties);
  router.post('/', authMiddleware, createProperty);
  router.get('/', getProperties);
  router.get('/:id', getPropertyById);
  router.put('/:id', authMiddleware, updateProperty);
  router.delete('/:id', authMiddleware, deleteProperty);

  // Export the router
  export default router;