const electron = require('electron');
const express = require('express');
const eapp = express();
const url = require('url');
const path = require('path');
var cors = require('cors')
const { app, BrowserWindow, Menu, ipcMain } = electron;

// imports for api routes
const api = require('./server/routes/api');

// express setup 
eapp.set('port', (process.env.PORT || 5000));
eapp.use(express.static(path.join(__dirname + '/public')));
eapp.use(express.json());
eapp.use(express.urlencoded({ extended: true }));
eapp.use(cors());
eapp.use('/api', api);
const server = eapp.listen(eapp.get('port'), () => {
    console.log('Server is running on port', eapp.get('port'));
});

// electron setup
// Listen for the electron app to be ready
app.on('ready', function() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        backgroundColor: '#ffffff'
    });
    // load html in window
mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'public/index.html'),
    protocol: 'file',
    slashes: true
}));
// mainWindow.loadURL('file://' + __dirname + '/public/index.html')

    mainWindow.maximize();
    // quit app when closed
    mainWindow.on('closed', function(){
        app.quit();
    });
});