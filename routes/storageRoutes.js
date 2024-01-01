const express= require('express');
const { google } = require('googleapis');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const credentials = require('../secret1.json');
const dotenv = require("dotenv")
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

const router=express.Router();
const storageController=require('../controllers/storageController');
  // started server on port 3000
  //made a connection to database
  
  // Create an upload storage using Multer
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Set the destination folder where files will be stored temporarily
      cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
      // Set the file name to be the original name of the uploaded file
      cb(null, file.originalname);
    },
  });
  const upload = multer({ storage: storage });
  const uploadFolder = '../uploads';
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
  }
  const uploadFolderPath = path.resolve(__dirname, uploadFolder);
   // Replace with your actual upload folder path
   const files = fs.readdirSync(uploadFolderPath);
   
   for (const file of files) {
     const filePath = path.join(uploadFolderPath, file);
     fs.unlinkSync(filePath);
   }
   
   console.log('Uploads folder emptied successfully!');
  // Create the "uploads" folder if it doesn't exist
  
  router.get('/create-folder/:parentFolderId',storageController.authenticateJWT, (req, res) => {
    const {parentFolderId}=req.params;
    res.render('create',{parentFolderId});
  });
router.get('/download/:fileId',storageController.authenticateJWT,storageController.downloadFile );
router.post('/create-folder/:parentFolderId',storageController.authenticateJWT, storageController.createFolder);
router.get('/folder/:folderId',storageController.authenticateJWT,storageController.folderContent);
router.post('/folder/:folder/upload',upload.single('file'),storageController.authenticateJWT,storageController.fileUpload);
module.exports=router;