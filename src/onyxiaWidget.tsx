import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
//import { requestAPI } from './handler';

export const OnyxiaComponent = (): JSX.Element => {
  return (
    <div>
      <h1>Onyxia Composer</h1>

      <h2>Docker image</h2>
      <input type="text" required size={30} />
      <section>
        <button
          className="btn btn-sm btn-danger float-right-button"
          onClick={(): void => {
            console.log('valid');
          }}
        >
          OK
        </button>
      </section>
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
