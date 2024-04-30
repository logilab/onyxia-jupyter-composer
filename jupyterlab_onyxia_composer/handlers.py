import git
import json
from pathlib import Path
import os
import shutil

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

DEFAULT_VOILA_ICON_URL = "https://raw.githubusercontent.com/voila-dashboards/voila/main/docs/voila-logo.svg"
DOCKER_REPO = 'djangoliv'

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": "This is /jupyterlab-onyxia-composer/create endpoint!"
        }))

    @tornado.web.authenticated
    def post(self):
        # input_data is a dictionary with a key "name"
        input_data = self.get_json_body()
        create_service(input_data)
        data = {"message": "Service {} is created".format(input_data["name"])}
        self.finish(json.dumps(data))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    # Prepend the base_url so that it works in a JupyterHub setting
    route_pattern = url_path_join(base_url, "jupyterlab-onyxia-composer", "create")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)


def create_service(data):
    github_repo_dir = Path.home() / "work"/ "helm-charts-logilab-services"
    voila_template_dir = github_repo_dir / "charts-template" / "voila"
    images_dir =  github_repo_dir / "images"
    service_name = data["name"].strip().replace(' ', '_')
    new_service_dir = github_repo_dir / "charts" / service_name
    image = data['dockerImg']
    service_version = "0.0.1"

    repo = git.Repo(github_repo_dir)

    for tag in repo.tags:
        if service_name in tag.name:
            print(tag.name)
            tag_version = tag.name.split("-")[-1]
            new_minor_version = str(int(tag_version.split('.')[-1]) + 1)
            service_version = ".".join(tag_version.split('.')[:-1] + [new_minor_version])

    if data["newImage"]:
        # image generation
        new_image_dir = images_dir / service_name
        os.mkdir(new_image_dir)
        shutil.copyfile(images_dir / "Dockerfile-voila", new_image_dir / "Dockerfile")
        image = f"{DOCKER_REPO}/{service_name}:latest"
        for filename in os.listdir(data['dockerImg']):
            if os.path.isdir(Path(data['dockerImg']) / filename):
                shutil.copytree(Path(data['dockerImg']) / filename,  new_image_dir / filename)
            else:
                shutil.copy(Path(data['dockerImg']) / filename,  new_image_dir / filename)
    try:
        os.mkdir(new_service_dir)
    except:
        raise Exception("This service already exist")
    for finput in os.listdir(voila_template_dir):
        if os.path.isdir(voila_template_dir / finput):
            shutil.copytree(voila_template_dir / finput, new_service_dir / finput)
        else:
            with open(voila_template_dir / finput, 'r') as inf:
                with open(new_service_dir / finput, 'w') as outf:
                    for line in inf:
                        outf.write(
                            line
                            .replace("${NAME}", data["name"])
                            .replace("${DESCRIPTION}", data.get('desc', ''))
                            .replace("${IMAGE}", image)
                            .replace("${ICONURL}", data.get('iconURL', DEFAULT_VOILA_ICON_URL))
                            .replace("${VERSION}", service_version)
                        )
    # git
    repo.index.add(new_service_dir)
    if data["newImage"]:
        repo.index.add(new_image_dir)
    repo.index.commit(f"[auto] add {data['name']} service")
    origin = repo.remote(name='origin')
    #origin.push()
