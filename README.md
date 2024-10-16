# ActiveDocumentation Extension for VSCode

## Running the Extension Codebase

1. After cloning the repo, open a terminal in the project directory.
2. Run `npm install` to install the necessary dependencies.
3. To run the extension in a development environment, press `F5` in VSCode, or click on the "Run and Debug" icon (resembles a beetle under the play icon) on the left sidebar. Then, click on the green play icon to start.

## Running the tests

* To run all the tests, run `npm run test`.
* To run a specific test file, run `npm run test:file -- out/test/<path-to-the-test.js>`

## Building the extension

* Publish the extension by following the instructions in the [official website](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

## Installing the Packaged Extension

Install the published extension (`.vsix` file) by following the instructions in the [official website](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix).

Alternatively:

1. Open VS Code.
2. Go to the Extensions view by clicking on the square icon on the sidebar or pressing `Ctrl+Shift+X`.
3. Click on the "..." menu at the top of the Extensions view and select "Install from VSIX...".
4. Navigate to the `.vsix` file, select it, and click "Open".

