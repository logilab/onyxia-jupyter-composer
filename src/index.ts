import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { MainAreaWidget, ICommandPalette } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';
import { OnyxiaWidget } from './onyxiaWidget';

import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Initialization data
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-onyxia-composer',
  description: 'Onyxia Composer',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu
  ) => {
    console.log('activate jupyterlab-onyxia-composer composer');
    const { commands } = app;

    // Add command
    const command = 'jupyterlab-onyxia-composer:generate';
    commands.addCommand(command, {
      label: 'Service composer',
      caption: 'Service composer',
      execute: () => {
        const content = new OnyxiaWidget();
        const widget = new MainAreaWidget<OnyxiaWidget>({ content });
        widget.title.label = 'Onyxia Composer';
        app.shell.add(widget, 'main');
      }
    });

    // Add the command to the command palette
    const category = 'Onyxia';
    palette.addItem({
      command,
      category
    });
    //  Add the command to the Menua
    const menu = new Menu({ commands });
    menu.title.label = 'Onyxia';
    menu.id = 'onyxia';
    mainMenu.addMenu(menu, false, { rank: 80 });
    menu.addItem({ command });
  }
};

export default extension;
