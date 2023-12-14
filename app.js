const express = require('express');
const { google } = require('googleapis');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const credentials = require('./secret1.json');
const dotenv = require("dotenv")
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, './.env') });
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Google Drive API client with the service account credentials
const authClient = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const appDrive = google.drive({ version: 'v3', auth: authClient });

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
const uploadFolderPath = path.resolve(__dirname, 'uploads');
 // Replace with your actual upload folder path
 const files = fs.readdirSync(uploadFolderPath);
 
 for (const file of files) {
   const filePath = path.join(uploadFolderPath, file);
   fs.unlinkSync(filePath);
 }
 
 console.log('Uploads folder emptied successfully!');
// Create the "uploads" folder if it doesn't exist
const uploadFolder = './uploads';
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Route to render the login page (if needed)
app.get('/', (req, res) => {
  res.render('login');
});

// Route to render the file upload page
app.get('/upload', (req, res) => {
  res.render('upload');
});
// route to see the files and  folder
app.get('/list', async (req, res) => {
  try {
    const folderResponse = await appDrive.files.list({
      q: process.env.Q,
      fields: 'files(id, name, mimeType)',
    });

    const fileResponse = await appDrive.files.list({
      q: process.env.Q,
      fields: 'files(id, name, mimeType)',
    });

    const folders = folderResponse.data.files;
    const files = fileResponse.data.files;

    res.render('fileList', { folders, files });
  } catch (error) {
    console.error('Error fetching folders and files:', error.message);
    res.status(500).send('Error fetching folders and files.');
  }
});

// route to download the files 
app.get('/download/:fileId', async (req, res) => {
  const { fileId } = req.params;

  try {
    const response = await appDrive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

    const fileMetadata = await appDrive.files.get({ fileId, fields: 'name, mimeType' });

    const mimeType = fileMetadata.data.mimeType;
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileMetadata.data.name}"`);
    response.data.on('end', () => res.end());
    response.data.on('error', (err) => {
      console.error('Error downloading file:', err.message);
      res.status(500).send('Error downloading file.');
    });
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching file:', error.message);
    res.status(500).send('Error fetching file.');
  }
});

// Route to render the create folder form
app.get('/create-folder/:parentFolderId', (req, res) => {
  const {parentFolderId}=req.params;
  res.render('create',{parentFolderId});
});
// Route to handle folder creation
app.post('/create-folder/:parentFolderId', async (req, res) => {
  const {parentFolderId}=req.params;
  console.log(req.body);
  const { folderName } = req.body;

  if (!folderName) {
    res.status(400).send('Folder name is required.');
    return;
  }

  try {
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId], // Replace with the actual parent folder ID
    };

    const response = await appDrive.files.create({
      resource: folderMetadata,
      fields: 'id',
    });

    console.log('Folder created with ID:', response.data.id);
    res.send('Folder created successfully.');
  } catch (error) {
    console.error('Error creating folder:', error.message);
    res.status(500).send('Error creating folder.');
  }
});

// another route for creating folder insider another folder for user
//  app.get('/create-folder/:parentFolderId',async(req,res)=>{
//   const {parentFolderId}=req.params;
//   res.render('create',{parentFolderId});

//  })
//  app.post('/create-folder/:parentFolderId',async(req,res)=>{
//   const parentFolderId=process.env.GOOGLE_DRIVE_FOLDER_ID;
//   console.log(parentFolderId);
//   const {folderName}=req.body;
//   if(!folderName){
//   return  res.status(400).json({message:'Folder Name is required'});

//   }
//   try{
//     const folderMetadata={
//       name:folderName,
//       mimeType:'application/vnd.google-apps.folder',
//       parents:[parentFolderId],
//     }
//     const response=await appDrive.files.create({
//       resources:folderMetadata,
//       fields:'id',
//      })
//      console.log('API Response:', response.data);
//      console.log('Folder created with ID ',response.data.id);
//      res.send('Folder created successfully');
//   }
//   catch(err){
//     console.error('Error creating folder:',err.message);
//   }
  
//  })
// Route to render the folders list
app.get('/folders', async (req, res) => {
  try {
    const response = await appDrive.files.list({
      q: `'1HVpdB13RVlZJcMoyi6Cl1uqyLgxXNGKj' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name, mimeType)',
    });

    const folders = response.data.files;
    res.render('folderList', { folders });
  } catch (error) {
    console.error('Error fetching folders:', error.message);
    res.status(500).send('Error fetching folders.');
  }
});
// Route to render the files within a folder
app.get('/folder/:folderId', async (req, res) => {
  const { folderId } = req.params;

  try {
    const response = await appDrive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, mimeType)',
    });

    const files = response.data.files;
    res.render('folderFiles', { files,folderId });
  } catch (error) {
    console.error('Error fetching files from folder:', error.message);
    res.status(500).send('Error fetching files from folder.');
  }
});
// Route to handle file upload within a folder
app.post('/folder/:folderId/upload', upload.single('file'), async (req, res) => {
  const { folderId } = req.params;

  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  const fileMetadata = {
    name: req.file.originalname,
    parents: [folderId],
  };

  const media = {
    mimeType: req.file.mimetype,
    body: fs.createReadStream(req.file.path),
  };

  try {
    const response = await appDrive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    console.log('File uploaded with ID:', response.data.id);
    res.send('File uploaded successfully.');
  } catch (error) {
    console.error('Error uploading file:', error.message);
    res.status(500).send('Error uploading file.');
  }
});

// Route to handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  console.log(req.file);
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  const fileMetadata = {
    name: req.file.originalname,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // Replace with the actual parent folder ID
  };

  const media = {
    mimeType: req.file.mimetype,
    body: fs.createReadStream(req.file.path), // Read the file from disk
  };

  try {
    const response = await appDrive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
   
    console.log('File uploaded with ID:', response.data.id);
  await deleteFile(req.file.originalname)
    
    res.send('File uploaded successfully.');
  } catch (error) {
    console.error('Error uploading file:', error.message);
    res.status(500).send('Error uploading file.');
  }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
