import dotenv from 'dotenv';
dotenv.config();
export const env = {
  PORT: process.env.PORT || 3020,
  JWT_SECRET: process.env.JWT_SECRET || 'naty-calma-secreta',
  DB_FILE: process.env.DB_FILE || './data/naty.db',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './data/uploads',
  DB_PROVIDER: process.env.DB_PROVIDER || 'sqlite',
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local'
};
