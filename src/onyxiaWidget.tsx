import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
//import { requestAPI } from './handler';

export const OnyxiaComponent = (): JSX.Element => {
  return (
    <div>
      <h1>Onyxia</h1>
    </div>
  );
};

export class OnyxiaWidget extends ReactWidget {
  constructor() {
    super();
    this.addClass('onyxia-ReactWidget');
  }

  render(): JSX.Element {
    return <OnyxiaComponent />;
  }
}
