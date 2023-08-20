"""chesssim URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic.base import RedirectView
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf import settings

from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy
from django.views import generic

class SignUpView(generic.CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy("chess")
    template_name = "registration/signup.html"

# urlpatterns = static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# urlpatterns = static(settings.STATIC_URL, document_root=settings.STATIC_ROOT, show_indexes=True)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    re_path(r"^public/(?P<path>.*)$", serve, {"document_root": settings.STATIC_ROOT}), 
    re_path(r"^chess$", TemplateView.as_view(template_name="base.html"), name='chess'),
    path("accounts/signup/", SignUpView.as_view(), name='signup'),  # new
    path("accounts/", include("django.contrib.auth.urls")),  # new
    path('', RedirectView.as_view(url='/accounts/login')),
]
