const fs=require('fs');
const jwt=require('jsonwebtoken');
const jwtSecret=process.env.JWT_SECRET;
const createGoogleDriveClient=require('./authClient');
const appDrive=createGoogleDriveClient();
exports.authenticateJWT=async(req,res,next)=>{
    const authHeader= req.headers.authorization;
    if(authHeader){
        const token=authHeader.split(' ')[1];
        jwt.verify(token,jwtSecret,(err,user)=>{
            if(err){
               return res.status(400).json({message:'Token error'});
            }
            req.user=user;
            next();

        });
    } else{
        res.status(500).send('Not a valid token user');
    }
  }
exports.createFolder=async (req, res) => {
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
  }
  exports.folderContent=async (req, res) => {
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
  }
  exports.fileUpload=async (req, res) => {
   
    const { folder } = req.params;
    if (!req.file) {
      res.status(400).send('No file uploaded.');
      return;
    }
    const fileMetadata = {
      name: req.file.originalname,
      parents: [folder],
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
  }
  exports.downloadFile=async (req, res) => {
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
  }