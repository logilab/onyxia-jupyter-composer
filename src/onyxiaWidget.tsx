import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

export async function requestAPI<T>(
  endPoint = '',
  init: RequestInit = {}
): Promise<T> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(
    settings.baseUrl,
    'jupyterlab-onyxia-composer', // API Namespace
    endPoint
  );

  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error as any);
  }

  let data: any = await response.text();

  if (data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }

  return data;
}

export const OnyxiaComponent = (): JSX.Element => {
  const [name, setName] = React.useState<string | undefined>(undefined);
  const [desc, setDesc] = React.useState<string | undefined>(undefined);
  const [iconURL, setIconURL] = React.useState<string | undefined>(undefined);
  const [dockerImg, setDockerImg] = React.useState<string | undefined>(
    undefined
  );
  const [message, setMessage] = React.useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dataToSend = { name, desc, iconURL, dockerImg };
    console.log(dataToSend);
    requestAPI<any>('create', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    })
      .then(reply => {
        console.log(reply);
        setMessage('Service submitted');
      })
      .catch(reason => {
        console.error(
          `Error on POST /jupyterlab-onyxia-composer/create ${dataToSend}.\n${reason}`
        );
      });
  };

  return (
    <div>
      <h1>Onyxia service Composer</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            required
            size={30}
            onChange={e => setName(e.currentTarget.value)}
          />
        </label>
        <br />
        <label>
          Description
          <input
            type="text"
            required
            size={30}
            onChange={e => setDesc(e.currentTarget.value)}
          />
        </label>
        <br />
        <label>
          Icon Url
          <input
            type="text"
            required
            size={30}
            onChange={e => setIconURL(e.currentTarget.value)}
          />
        </label>
        <br />
        <label>
          Docker image
          <input
            type="text"
            required
            size={30}
            onChange={e => setDockerImg(e.currentTarget.value)}
          />
        </label>
        <br />
        <input type="submit" value="Create" />
      </form>
      <section>{message}</section>
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
