# This template tag is needed for production
# Add it to one of your django apps (/appdir/templatetags/render_vite_bundle.py, for example)
import os
import json

from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag
def render_vite_bundle():
    """
    Template tag to render a vite bundle.
    Supposed to only be used in production.
    For development, see other files.
    """
    try:
        fd = open(f"{settings.VITE_APP_DIR}/dist/manifest.json", "r")
        manifest = json.load(fd)
    except:
        raise Exception(
            f"Vite manifest file not found or invalid. Maybe your {settings.VITE_APP_DIR}/dist/manifest.json file is empty?"
        )
    try:
        imports_files = "".join(
            [
                f'<script type="module" src="/public/{manifest[file]["file"]}"></script>'
                for file in manifest["index.html"]["imports"]
            ]
        )
    except KeyError:
        imports_files = ""

    return mark_safe(
        f"""<script type="module" src="/public/{manifest['index.html']['file']}"></script>
        <link rel="stylesheet" type="text/css" href="/public/{manifest['index.html']['css'][0]}" />
        {imports_files}"""
    )
