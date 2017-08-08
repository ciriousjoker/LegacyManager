### How this tool works
The user can choose an installation folder and his SuperSmashBrosBrawl.iso. 
Clicking "Install" then does the following:
- Download the database from the url stored in ```/.server```
- Parse the database and extract the download url for the latest version
- Download the game file from that url (Google's "File too big to be scanned" warning is taken care of)
- Decrypt the game file using the password stored in ```/.passwd```
- Extract the .iso file
- Copy the downloaded mod files into the extracted .iso
- Remove unnecessary files from the extracted .iso
- Patch the extracted .iso from version 1.02 to 1.00
- Patch the main.dol file
- Build the patched .wbfs file

### Getting started
#### Step 1:
Clone the repository
> git clone https://github.com/CiriousJoker/LegacyManager.git

#### Step 2:
Install the modules (using [yarn](https://yarnpkg.com/en/docs/install) is preferred)

> npm install

> yarn install

#### Step 3:
Rebuild the native dependencies. Electron-rebuild is located in ```node_modules/.bin/```, use ```--module-dir ../..``` if necessary.
> electron-rebuild

#### Step 4:
Run the software in dev mode. This transpiles all the .js files in ```/src``` into ```/app``` and starts the program.
> npm start

### How to build
This command only transpiles the files from ```/src``` into ```/app```.
> npm build

### How to release
This command uses electron-builder to create an NSIS installer in the ```/dist```
> npm run release

### Important notes
- Relative pathes aren't consistent. This (afaik) can't be fixed. If you change anything, just look at the imports to figure out where ```./``` points to
- The ```.passwd``` & ```.server``` files are neccessary and the information in them is stored in plain text
- The pathing for the .csx files might seem weird at first, but is fixed during build
- Run ```npm install edge-asar-cs``` and replace ```/node_modules/edge-cs``` with it to fix an asar issue while building
- Clearing the ```/app``` folder might be helpful if you experience errors during build. Check the [.gitignore](.gitignore) for information on which files and folders have to be created before this thing can run

This repository uses a boilerplate. You can check it out [here](https://github.com/szwacz/electron-boilerplate). Big thanks to him, he made a lot of things easier!