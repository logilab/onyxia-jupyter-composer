import git
import json
from pathlib import Path
import os
import shutil
import yaml

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

DEFAULT_VOILA_ICON_URL = (
    "https://raw.githubusercontent.com/voila-dashboards/voila/main/docs/voila-logo.svg"
)
DOCKER_REPO = "registry.logilab.fr/open-source/dockerfiles/onyxia"
APP_DIR = Path.home() / "work" / "app"


class CreateServiceHandler(APIHandler):

    @tornado.web.authenticated
    def post(self):
        # input_data is a dictionary with a key "name"
        input_data = self.get_json_body()
        try:
            service = Service()
            service.create_service(input_data)
            message = service.message
        except Exception as e:
            message = str(e)
            pass
        data = {"message": message}
        self.finish(json.dumps(data))


class CheckServiceExist(APIHandler):

    @tornado.web.authenticated
    def post(self):
        # input_data is a dictionary with a key "name"
        github_repo_dir = Path.home() / "work" / "helm-charts-logilab-services"
        repo = git.Repo(github_repo_dir)
        service = self.get_json_body()
        version = "0.0.1"
        message = ""
        if (github_repo_dir / "charts" / service).exists():
            message = f"WARNING: {service} already exists, It will be updated"
        elif service.lower() != service:
            message = f"WARNING: We do not support capital letters in the service name"
        for serv in os.listdir(github_repo_dir / "charts"):
            for tag in repo.tags:
                if service == "-".join(tag.name.split("-")[:-1]):
                    current_version = tag.name.split("-")[-1]
                    last_number = int(current_version.split(".")[-1])
                    version = ".".join(
                        current_version.split(".")[:-1] + [str(last_number + 1)]
                    )
        data = {"message": message, "version": version}
        self.finish(json.dumps(data))


class CheckServiceVersion(APIHandler):
    @tornado.web.authenticated
    def post(self):
        github_repo_dir = Path.home() / "work" / "helm-charts-logilab-services"
        repo = git.Repo(github_repo_dir)
        input_data = self.get_json_body()
        version = input_data["version"]
        service_name = input_data["name"]
        message = ""
        if (github_repo_dir / "charts" / service_name).exists():
            for tag in repo.tags:
                if service_name == "-".join(tag.name.split("-")[:-1]):
                    if tag.name.split("-")[-1] == version:
                        message = "This version already exist, choose another one"
                        break
        self.finish(json.dumps({"message": message}))


class CloneAppHandler(APIHandler):

    @tornado.web.authenticated
    def post(self):
        # input_data is a dictionary with a key "name"
        input_data = self.get_json_body()
        repo = git.Repo.clone_from(input_data, APP_DIR)
        data = {"message": repo.working_dir}
        self.finish(json.dumps(data))


class ListServiceHandler(APIHandler):

    @tornado.web.authenticated
    def post(self):
        github_repo_dir = Path.home() / "work" / "helm-charts-logilab-services"
        repo = git.Repo(github_repo_dir)
        origin = repo.remote(name="origin")
        repo.git.checkout("main")
        origin.pull()
        services = {}
        for serv in os.listdir(github_repo_dir / "charts"):
            for tag in repo.tags:
                if serv == "-".join(tag.name.split("-")[:-1]).lower():
                    services[serv] = tag.name

        data = {"services": services}
        self.finish(json.dumps(data))


def delete_service(service_name):
    github_repo_dir = Path.home() / "work" / "helm-charts-logilab-services"
    repo = git.Repo(github_repo_dir)
    origin = repo.remote(name="origin")
    origin.pull()
    repo.git.rm(github_repo_dir / "charts" / service_name, r=True)
    if (github_repo_dir / "images" / service_name).exists():
        repo.git.rm(github_repo_dir / "images" / service_name, r=True)
    repo.git.commit("-m", f"[auto] remove service {service_name}")
    origin.push()
    repo.git.checkout("gh-pages")
    origin.pull()
    with open(github_repo_dir / "index.yaml") as f:
        index_file = yaml.safe_load(f)
    if service_name in index_file["entries"]:
        index_file["entries"].pop(service_name)
        with open(github_repo_dir / "index.yaml", "w") as f:
            yaml.safe_dump(index_file, f)
        repo.git.add(github_repo_dir / "index.yaml")
        repo.git.commit("-m", f"[auto] remove service {service_name}")
        origin.push()
    repo.git.checkout("main")


class DeleteServiceHandler(APIHandler):

    @tornado.web.authenticated
    def post(self):
        input_data = self.get_json_body()
        service_name = input_data["service"]
        message = f"service {service_name} deleted"
        try:
            delete_service(service_name)
        except Exception as e:
            message = str(e)
        data = {"message": message}
        self.finish(json.dumps(data))


def setup_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]
    # Prepend the base_url so that it works in a JupyterHub setting
    create_service_pattern = url_path_join(
        base_url, "jupyterlab-onyxia-composer", "create"
    )
    clone_app_pattern = url_path_join(base_url, "jupyterlab-onyxia-composer", "clone")
    list_services_pattern = url_path_join(
        base_url, "jupyterlab-onyxia-composer", "services"
    )
    delete_service_pattern = url_path_join(
        base_url, "jupyterlab-onyxia-composer", "delete"
    )
    check_srv_name_pattern = url_path_join(
        base_url, "jupyterlab-onyxia-composer", "checkSrvName"
    )
    check_srv_version_pattern = url_path_join(
        base_url, "jupyterlab-onyxia-composer", "checkSrvVersion"
    )
    handlers = [
        (create_service_pattern, CreateServiceHandler),
        (clone_app_pattern, CloneAppHandler),
        (list_services_pattern, ListServiceHandler),
        (delete_service_pattern, DeleteServiceHandler),
        (check_srv_name_pattern, CheckServiceExist),
        (check_srv_version_pattern, CheckServiceVersion),
    ]
    web_app.add_handlers(host_pattern, handlers)


class Service:

    def __init__(self):
        github_repo_dir = Path.home() / "work" / "helm-charts-logilab-services"
        self.voila_template_dir = github_repo_dir / "charts-template" / "voila"
        self.repo_charts_dir = github_repo_dir / "charts"
        self.images_dir = github_repo_dir / "images"
        self.service_version = "0.0.1"
        self.repo = git.Repo(github_repo_dir)
        self.message = ""

    def create_app_from_scratch(self, service_name, app_path, notebook_name):
        """
        Create App from local directory
        """
        new_image_dir = self.images_dir / service_name
        try:
            os.mkdir(new_image_dir)
        except Exception as e:
            self.message = f"Directory {new_image_dir} already exist"
            raise e
        with open(self.images_dir / "Dockerfile-voila", "r") as inf:
            with open(new_image_dir / "Dockerfile", "w") as outf:
                for line in inf:
                    outf.write(line.replace("${NOTEBOOK_NAME}", notebook_name))
        image = f"{DOCKER_REPO}/{service_name}:latest"
        for filename in os.listdir(app_path):
            if os.path.isdir(Path(app_path) / filename):
                if not filename.startswith("."):
                    shutil.copytree(Path(app_path) / filename, new_image_dir / filename)
            else:
                shutil.copy(Path(app_path) / filename, new_image_dir / filename)
        return image

    def git_commit_and_push(self, service_name, service_dir, appType):
        self.repo.index.add(service_dir)
        if appType != "fromDockerImage":
            self.repo.index.add(self.images_dir / service_name)
        self.repo.index.commit(f"[auto] add {service_name} service")
        origin = self.repo.remote(name="origin")
        origin.push()

    def create_service(self, data):
        service_name = data["name"].strip().replace(" ", "_").lower()
        if (self.repo_charts_dir / service_name).exists():
            delete_service(service_name)
        service_repo_dir = self.repo_charts_dir / service_name
        self.service_version = data["version"]
        if data["appType"] == "fromRepo":
            if not APP_DIR.exists():
                self.repo.clone_from(data["appRepoURL"], APP_DIR)
            image = self.create_app_from_scratch(
                service_name, APP_DIR, data["notebookName"]
            )
        elif data["appType"] == "fromDockerImage":
            # service from existed docker image
            image = data["appImage"]
        elif data["appType"] == "fromLocalDirectory":
            # image creation from path
            image = self.create_app_from_scratch(
                service_name,
                data["appDir"],
                data["notebookName"],
            )
        else:
            raise "Not supported app type"
        try:
            os.mkdir(service_repo_dir)
        except Exception:
            self.message = "This service already exist"
            raise Exception("This service already exist")
        for finput in os.listdir(self.voila_template_dir):
            if os.path.isdir(self.voila_template_dir / finput):
                shutil.copytree(
                    self.voila_template_dir / finput, service_repo_dir / finput
                )
                with open(
                    self.voila_template_dir / finput / "statefulset.yaml", "r"
                ) as inf:
                    with open(
                        service_repo_dir / finput / "statefulset.yaml", "w"
                    ) as outf:
                        for line in inf:
                            outf.write(
                                line.replace("${NOTEBOOK_NAME}", data["notebookName"])
                            )
            else:
                with open(self.voila_template_dir / finput, "r") as inf:
                    with open(service_repo_dir / finput, "w") as outf:
                        for line in inf:
                            outf.write(
                                line.replace("${NAME}", service_name)
                                .replace("${DESCRIPTION}", data.get("desc", ""))
                                .replace("${IMAGE}", image)
                                .replace(
                                    "${ICONURL}",
                                    data.get("iconURL", DEFAULT_VOILA_ICON_URL),
                                )
                                .replace("${VERSION}", self.service_version)
                            )
        # git
        self.git_commit_and_push(service_name, service_repo_dir, data["appType"])
        repo_url = self.repo.remotes.origin.url
        if "@" in repo_url:
            repo_url = f"https://{repo_url.split('@')[-1]}"
        self.message = f"""
        service {service_name} submitted
        To folow: go to <a target='_blank' href='{repo_url}/actions'>{repo_url}/actions</a>
        """
