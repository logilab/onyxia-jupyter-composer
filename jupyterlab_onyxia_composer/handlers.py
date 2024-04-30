import git
import json
from pathlib import Path
import os
import shutil

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

DEFAULT_VOILA_ICON_URL = "https://raw.githubusercontent.com/voila-dashboards/voila/main/docs/voila-logo.svg"

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
    github_repo_dir = Path.home() / "helm-charts-logilab-services"
    voila_template_dir = github_repo_dir / "charts-template" / "voila"
    service_name = data["name"].strip().replace(' ', '_')
    new_service_dir = github_repo_dir / "charts" / service_name
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
                            .replace("${IMAGE}",  data['dockerImg'])
                            .replace("${ICONURL}", data.get('iconURL', DEFAULT_VOILA_ICON_URL))
                        )
    # git
    repo = git.Repo(github_repo_dir)
    repo.index.add(new_service_dir)
    repo.index.commit(f"[auto] add {data['name']} service")
    origin = repo.remote(name='origin')
    origin.push()
