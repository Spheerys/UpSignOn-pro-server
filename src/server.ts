import express from 'express';
import { startServer } from './helpers/serverProcess';
import { requestAccess } from './routes/requestAccess';
import { checkDevice } from './routes/checkDevice';
import { getData } from './routes/getData';
import { updateData } from './routes/updateData';
import { getConfig } from './routes/getConfig';
import { getUrlList } from './routes/getUrlList';
import { removeAuthorization } from './routes/removeAuthorization';
import { getAuthorizedDevices } from './routes/getAuthorizedDevices';
import { renameDevice } from './routes/renameDevice';
import { backupPassword } from './routes/backupPassword';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '3Mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/check-device', checkDevice);

app.post('/config', getConfig);
app.post('/url-list', getUrlList);
app.post('/request-access', requestAccess);
app.post('/remove-authorization', removeAuthorization);
app.post('/get-authorized-devices', getAuthorizedDevices);
app.post('/get-data', getData);
app.post('/update-data', updateData);
app.post('/rename-device', renameDevice);
app.post('/backup-password', backupPassword);

if (module === require.main) {
  startServer(app);
}

module.exports = app;
