try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip.
    import warnings

    warnings.warn(
        "Importing 'jupyterlab_onyxia_composer' outside a proper installation."
    )
    __version__ = "dev"
from .handlers import setup_handlers


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "jupyterlab-onyxia-composer"}]


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_onyxia_composer"}]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    setup_handlers(server_app.web_app)
    name = "jupyterlab_onyxia_composer"
    server_app.log.info(f"Registered {name} server extension")
