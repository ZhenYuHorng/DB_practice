require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');

const app = express();

// Middleware
app.use(cors()); // 解決跨域問題
app.use(express.json()); // 解析 JSON 請求
app.use(express.static(path.join(__dirname, '../'))); // 提供靜態文件服務 (index.html)

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/myappdb')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// MongoDB Schema 
const FileSchema = new mongoose.Schema({
    name: String,
    s3Path: String,
    uploadedAt: { type: Date, default: Date.now },
});
const File = mongoose.model('File', FileSchema);

// AWS S3 Configuration
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Multer-S3 Configuration
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
        key: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`), // 生成唯一文件名
    }),
});

// API Routes
// Upload API
app.post('/upload', upload.single('file'), async (req, res) => {
    console.log('Request Body:', req.body);
    console.log('Uploaded File Info:', req.file);

    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    try {
        const newFile = new File({
            name: req.file.originalname,
            s3Path: req.file.location,
        });
        await newFile.save();

        res.status(200).json({
            message: 'File uploaded successfully',
            file: {
                name: req.file.originalname,
                s3Path: req.file.location,
            },
        });
    } catch (error) {
        console.error('Error saving file to MongoDB:', error);
        res.status(500).send('Error saving file info');
    }
});

// List Files API
app.get('/files', async (req, res) => {
    try {
        const files = await File.find();
        res.status(200).json(files);
    } catch (error) {
        console.error('Error fetching files from MongoDB:', error);
        res.status(500).send('Error fetching files');
    }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
