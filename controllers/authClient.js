const { google } = require('googleapis');
const credentials = require('../secret1.json');

const createGoogleDriveClient = () => {
  const authClient = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const appDrive = google.drive({ version: 'v3', auth: authClient });

  return appDrive;
};

module.exports = createGoogleDriveClient;
