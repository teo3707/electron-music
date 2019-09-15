const { app, BrowserWindow } = require('electron')
const App = require('./src/App.js');

let $app = new App();
app.on('ready', () => {
  $app.createWindow();
});
