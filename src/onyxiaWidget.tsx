import React from 'react';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Image from 'react-bootstrap/Image';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import InputGroup from 'react-bootstrap/InputGroup';
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

const formStyle = {
  maxWidth: '700px',
  margin: '20px auto',
  padding: '20px',
  border: '1px solid #ddd',
  borderRadius: '10px',
  backgroundColor: '#f5f5f5'
};

const submitButtonStyle = {
  marginTop: '1.2em',
  backgroundColor: '#28a745',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  width: '100px'
};

const TitleStyle = {
  fontSize: '5em',
  color: '#ff562c'
};

export const OnyxiaComponent = (): JSX.Element => {
  const [tabKey, setTabKey] = React.useState('create');
  const [name, setName] = React.useState<string | undefined>(undefined);
  const [desc, setDesc] = React.useState<string>('');
  const [iconURL, setIconURL] = React.useState<string>('');
  const [notebookName, setNotebookName] = React.useState('index.ipynb');
  const [message, setMessage] = React.useState<string>('');
  const [showMessage, setShowMessage] = React.useState(false);
  const [appType, setAppType] = React.useState<
    'fromRepo' | 'fromDockerImage' | 'fromLocalDirectory'
  >('fromRepo');
  const [appRepoURL, setAppRepoURL] = React.useState<string | undefined>(
    undefined
  );
  const [revision, setRevision] = React.useState<string | undefined>(undefined);
  const [appImage, setAppImage] = React.useState<string | undefined>(undefined);
  const [appDir, setAppDir] = React.useState<string | undefined>(undefined);
  const AppTypeLabel = {
    fromRepo: 'Repo URL',
    fromDockerImage: 'Docker image name',
    fromLocalDirectory: 'App path'
  };
  const [version, setVersion] = React.useState<string>('0.0.1');
  const [existedApp, setExistedApp] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dataToSend = {
      name,
      version,
      desc,
      iconURL,
      notebookName,
      appType,
      appRepoURL,
      revision,
      appImage,
      appDir
    };
    requestAPI<any>('create', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    })
      .then(reply => {
        setMessage(reply['message']);
        setShowMessage(true);
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

  const handleServiceName = (name: string) => {
    setName(name);
    requestAPI<any>('checkSrvName', {
      body: JSON.stringify(name),
      method: 'POST'
    })
      .then(reply => {
        setVersion(reply.version);
        setDesc(reply.description);
        setIconURL(reply.icon);
        if (reply.exists) {
          setExistedApp(true);
          setMessage(`WARNING: ${name} already exists, It will be updated`);
          setShowMessage(true);
        } else {
          setExistedApp(false);
          setMessage('');
          setShowMessage(false);
        }
      })
      .catch(reason => {
        console.error(
          `Error on POST /jupyterlab-onyxia-composer/checkSrvName ${appRepoURL}.\n${reason}`
        );
      });
  };

  const handleServiceVersion = (inputVersion: string) => {
    setVersion(inputVersion);
    requestAPI<any>('checkSrvVersion', {
      body: JSON.stringify({ name, version: inputVersion }),
      method: 'POST'
    })
      .then(reply => {
        const msg = reply['message'];
        if (msg) {
          setMessage(msg);
          setShowMessage(true);
        } else {
          setShowMessage(false);
        }
      })
      .catch(reason => {
        console.error(
          `Error on POST /jupyterlab-onyxia-composer/checkSrvVersion ${appRepoURL}.\n${reason}`
        );
      });
  };

  return (
    <div className="container">
      <h1 className="mb-3 text-center fw-bold" style={TitleStyle}>
        <Image
          src="https://www.onyxia.sh/static/media/Dragoon.8d89504cc3a892bf56ee9e7412df7d43.svg"
          style={{ height: '1em' }}
        />
        nyxia Service Composer
      </h1>
      <Tabs
        id="tabs"
        activeKey={tabKey}
        onSelect={k => setTabKey(k || '')}
        className="mb-3"
      >
        <Tab
          eventKey="create"
          title="Create Service"
          style={{ overflow: 'auto', height: '750px' }}
        >
          <Form onSubmit={handleSubmit} style={formStyle}>
            <h2>Service</h2>
            <Form.Group className="mb-3">
              <Row>
                <Col xs={9}>
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    onChange={e => handleServiceName(e.currentTarget.value)}
                  />
                </Col>
                <Col>
                  <Form.Label>Version *</Form.Label>
                  <Form.Control
                    type="text"
                    value={version}
                    required
                    onChange={e => handleServiceVersion(e.currentTarget.value)}
                  />
                </Col>
              </Row>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                value={desc}
                onChange={e => setDesc(e.currentTarget.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Icon Url</Form.Label>
              <Form.Control
                type="text"
                value={iconURL}
                onChange={e => setIconURL(e.currentTarget.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <h4>Build App</h4>
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
                    <>
                      <Col>
                        <InputGroup className="mb-3">
                          <InputGroup.Text>Rev</InputGroup.Text>
                          <Form.Control
                            type="text"
                            disabled={appRepoURL === undefined}
                            onChange={e => setRevision(e.currentTarget.value)}
                          />
                        </InputGroup>
                      </Col>
                    </>
                  )}
                </Row>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Notebook name</Form.Label>
                <Form.Control
                  type="text"
                  value={notebookName}
                  onChange={e => setNotebookName(e.currentTarget.value)}
                />
              </Form.Group>
            </Form.Group>
            <Row>
              <Col xs={3}>
                <Form.Control
                  style={submitButtonStyle}
                  type="submit"
                  value={existedApp ? 'Update' : 'Create'}
                />
              </Col>
              <Col>
                {showMessage && (
                  <Alert
                    variant="info"
                    onClose={() => setShowMessage(false)}
                    dismissible
                  >
                    <div dangerouslySetInnerHTML={{ __html: message }} />
                  </Alert>
                )}
              </Col>
            </Row>
          </Form>
        </Tab>
        <Tab eventKey="handle" title="Handle services">
          <ListeServices reload={tabKey} />
        </Tab>
      </Tabs>
    </div>
  );
};

const ListeServices: React.FC<{ reload: string }> = ({ reload }) => {
  const [services, setServices] = React.useState([]);
  const [message, setMessage] = React.useState('');
  const [showMessage, setShowMessage] = React.useState(false);
  React.useEffect(() => {
    requestAPI<any>('services', {
      method: 'POST'
    })
      .then(reply => {
        console.log(reply);
        setServices(reply.services);
      })
      .catch(reason => {
        console.error(
          `Error on POST /jupyterlab-onyxia-composer/services.\n${reason}`
        );
      });
    setShowMessage(false);
    setMessage('');
  }, [reload]);

  const deleteService = (servName: string) => {
    requestAPI<any>('delete', {
      body: JSON.stringify({ service: servName }),
      method: 'POST'
    })
      .then(reply => {
        setMessage(reply.message);
        setShowMessage(true);
      })
      .catch(reason => {
        console.error(
          `Error on POST /jupyterlab-onyxia-composer/delete.\n${reason}`
        );
      });
  };

  return (
    <div className="container" style={{ margin: '1em' }}>
      <Table bordered size="sm">
        <thead>
          <tr>
            <th>Service Name</th>
            <th>Description</th>
            <th>Last Tag</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(services).map(([serviceName, service]) => (
            <tr>
              <td>{serviceName}</td>
              <td>{service['description']}</td>
              <td>{service['tag']}</td>
              <td>
                {serviceName !== 'jupyter-composer' && (
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => deleteService(serviceName)}
                  >
                    <i className="fa fa-trash"></i>
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {showMessage && (
        <Alert variant="info" onClose={() => setShowMessage(false)} dismissible>
          {message}
        </Alert>
      )}
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
