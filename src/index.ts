import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './handler';

/**
 * Initialization data for the jupyterlab-onyxia-composer extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-onyxia-composer:plugin',
  description: 'A JupyterLab extension for generate onyxia app',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab-onyxia-composer is activated!');

    requestAPI<any>('get-example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The jupyterlab_onyxia_composer server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
