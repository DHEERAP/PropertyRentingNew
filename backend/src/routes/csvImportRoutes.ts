import express from 'express';
import multer from 'multer';
import { 
  importProperties,
  getImportTemplate
} from '../controllers/propertyController';
import { authMiddleware } from '../middlewares/authMiddleware';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.get('/template', getImportTemplate);
router.post('/', authMiddleware, upload.single('file'), importProperties);

export default router;

    