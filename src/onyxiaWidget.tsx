import React from 'react';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
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
  backgroundColor: '#28a745',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  width: '100px'
};

export const OnyxiaComponent = (): JSX.Element => {
  const [name, setName] = React.useState<string | undefined>(undefined);
  const [desc, setDesc] = React.useState<string>('');
  const [iconURL, setIconURL] = React.useState<string>(voilaDefaultURL);
  const [message, setMessage] = React.useState<string>('');
  const [appType, setAppType] = React.useState<
    'fromRepo' | 'fromDockerImage' | 'fromLocalDirectory'
  >('fromRepo');
  const [appRepoURL, setAppRepoURL] = React.useState<string | undefined>(
    undefined
  );
  const [appImage, setAppImage] = React.useState<string | undefined>(undefined);
  const [appDir, setAppDir] = React.useState<string | undefined>(undefined);
  const AppTypeLabel = {
    fromRepo: 'Repo URL',
    fromDockerImage: 'Docker image name',
    fromLocalDirectory: 'App path'
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dataToSend = {
      name,
      desc,
      iconURL,
      appType,
      appRepoURL,
      appImage,
      appDir
    };
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

  const handleAppType = (value: string) => {
    switch (appType) {
      case 'fromRepo':
        setAppRepoURL(value);
        break;
      case 'fromDockerImage':
        setAppImage(value);
        break;
      case 'fromLocalDirectory':
        setAppDir(value);
        break;
      default:
        console.error('Not supported service type');
    }
  };

  const cloneApp = () => {
    console.log('clone');
    requestAPI<any>('clone', {
      body: JSON.stringify(appRepoURL),
      method: 'POST'
    })
      .then(reply => {
        console.log(reply);
        setMessage(reply['message']);
      })
      .catch(reason => {
        console.error(
          `Error on POST /jupyterlab-onyxia-composer/clone ${appRepoURL}.\n${reason}`
        );
      });
  };

  return (
    <div>
      <Form onSubmit={handleSubmit} style={formStyle}>
        <h1>Onyxia service Composer</h1>
        <Form.Group className="mb-3">
          <Form.Label>Name *</Form.Label>
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
          <Form.Label>Build App :</Form.Label>
          <Form.Group className="mb-3">
            <Form.Check
              inline
              type="radio"
              defaultChecked
              name="appType"
              label="from Repo"
              onChange={() => setAppType('fromRepo')}
            />
            <Form.Check
              inline
              type="radio"
              name="appType"
              label="from Docker Image"
              onChange={() => setAppType('fromDockerImage')}
            />
            <Form.Check
              inline
              type="radio"
              name="appType"
              label="from Directory"
              onChange={() => setAppType('fromLocalDirectory')}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{AppTypeLabel[appType]} *</Form.Label>
            <Row>
              <Col xs={9}>
                <Form.Control
                  type="text"
                  required
                  onChange={e => handleAppType(e.currentTarget.value)}
                />
              </Col>
              {appType === 'fromRepo' && (
                <Col>
                  <Button
                    variant="light"
                    disabled={appRepoURL === undefined}
                    onClick={cloneApp}
                  >
                    Clone
                  </Button>
                </Col>
              )}
            </Row>
          </Form.Group>
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
