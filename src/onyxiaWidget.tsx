import React from 'react';
import Form from 'react-bootstrap/Form';
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

const voilaDefaultURL =
  'https://raw.githubusercontent.com/voila-dashboards/voila/main/docs/voila-logo.svg';

const formStyle = {
  maxWidth: '600px',
  margin: '20px auto',
  padding: '20px',
  border: '1px solid #ddd',
  borderRadius: '10px',
  backgroundColor: '#f5f5f5'
};

const submitButtonStyle = {
  marginTop: '2em',
  backgroundColor: '#28a745', // React Bootstrap success color
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  width: '100px'
};

export const OnyxiaComponent = (): JSX.Element => {
  const [name, setName] = React.useState<string | undefined>(undefined);
  const [desc, setDesc] = React.useState<string>('');
  const [iconURL, setIconURL] = React.useState<string>(voilaDefaultURL);
  const [dockerImg, setDockerImg] = React.useState<string | undefined>(
    undefined
  );
  const [message, setMessage] = React.useState<string>('');
  const [newImage, setNewImage] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dataToSend = { name, desc, iconURL, newImage, dockerImg };
    requestAPI<any>('create', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    })
      .then(reply => {
        console.log(reply);
        setMessage(reply['message']);
      })
      .catch(reason => {
        console.error(
          `Error on POST /jupyterlab-onyxia-composer/create ${dataToSend}.\n${reason}`
        );
      });
  };

  return (
    <div>
      <Form onSubmit={handleSubmit} style={formStyle}>
        <h1>Onyxia service Composer</h1>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            required
            onChange={e => setName(e.currentTarget.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            type="text"
            onChange={e => setDesc(e.currentTarget.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Icon Url</Form.Label>
          <Form.Control
            type="text"
            onChange={e => setIconURL(e.currentTarget.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <h2>Docker image</h2>
          <Form.Check
            type="switch"
            onChange={() => setNewImage(!newImage)}
            label={'New app'}
          />
          {!newImage ? (
            <Form.Group className="mb-3">
              <Form.Label>Name of docker image</Form.Label>
              <Form.Control
                type="text"
                required
                onChange={e => setDockerImg(e.currentTarget.value)}
              />
            </Form.Group>
          ) : (
            <Form.Group className="mb-3">
              <Form.Label>Select your app directory</Form.Label>
              <Form.Control
                type="text"
                onChange={e => setDockerImg(e.currentTarget.value)}
              />
            </Form.Group>
          )}
        </Form.Group>
        <Form.Control style={submitButtonStyle} type="submit" value="Create" />
      </Form>
      <div dangerouslySetInnerHTML={{ __html: message }} />
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
