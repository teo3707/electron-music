const electron = require('electron');

class App {

    constructor() {
        this.win = null;
    }

    createWindow() {
        this.win = new electron.BrowserWindow({
            width: 1000,
            height: 670,
            minWidth: 1000,
            minHeight: 670,
            webPreferences: {
                nodeIntegration: true,
            },
            titleBarStyle: 'hiddenInset',
        });
        // this.win.setProgressBar(0.5);
        this.win.loadFile('index.html');
    }
}


module.exports = App;
