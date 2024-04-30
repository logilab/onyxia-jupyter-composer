import React from 'react';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
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
  maxWidth: '500px',
  margin: '20px auto',
  padding: '20px',
  border: '1px solid #ddd',
  borderRadius: '10px',
  backgroundColor: '#f5f5f5'
};

const submitButtonStyle = {
  marginTop: '20px',
  backgroundColor: '#28a745', // React Bootstrap success color
  border: 'none',
  borderRadius: '5px',
  padding: '10px 20px',
  fontSize: '16px',
  cursor: 'pointer'
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
    const dataToSend = { name, desc, iconURL, dockerImg };
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
      <Form onSubmit={handleSubmit} style={formStyle}>
        <h1>Onyxia service Composer</h1>
        <Row className="show-grid">
          <Form.Group className="mb-3">
            <Col md={10}>
              <Form.Label>Name</Form.Label>
            </Col>
            <Col md={10}>
              <Form.Control
                type="text"
                required
                onChange={e => setName(e.currentTarget.value)}
              />
            </Col>
          </Form.Group>
        </Row>
        <Row className="show-grid">
          <Form.Group className="mb-3">
            <Col md={10}>
              <Form.Label>Description</Form.Label>
            </Col>
            <Col md={10}>
              <Form.Control
                type="text"
                onChange={e => setDesc(e.currentTarget.value)}
              />
            </Col>
          </Form.Group>
        </Row>
        <Row className="show-grid">
          <Form.Group className="mb-3">
            <Col md={10}>
              <Form.Label>Icon Url</Form.Label>
            </Col>
            <Col md={10}>
              <Form.Control
                type="text"
                onChange={e => setIconURL(e.currentTarget.value)}
              />
            </Col>
          </Form.Group>
        </Row>
        <Row className="show-grid">
          <Form.Group>
            <Col md={10}>
              <h2>Docker image</h2>
            </Col>
            <Col md={10}>
              <Form.Check
                type="switch"
                onChange={() => setNewImage(!newImage)}
              />
            </Col>
            {!newImage ? (
              <Form.Group className="mb-3">
                <Col md={10}>
                  <Form.Label>Name of docker image</Form.Label>
                </Col>
                <Col md={10}>
                  <Form.Control
                    type="text"
                    required
                    onChange={e => setDockerImg(e.currentTarget.value)}
                  />
                </Col>
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Col md={10}>
                  <Form.Label>Select your app directoty</Form.Label>
                </Col>
                <Col md={10}>
                  <Form.Control type="text" />
                </Col>
              </Form.Group>
            )}
          </Form.Group>
        </Row>
        <Row className="show-grid">
          <Form.Control
            style={submitButtonStyle}
            type="submit"
            value="Create"
          />
        </Row>
      </Form>
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
