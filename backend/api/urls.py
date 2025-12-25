from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, like_post, follow_user, current_user
from .views import comment_on_post  # add this

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')

urlpatterns = [
    path('', include(router.urls)),
    path('posts/<int:pk>/like/', like_post),
    path('posts/<int:pk>/unlike/', like_post),
    path('users/<int:pk>/follow/', follow_user),
    path('users/<int:pk>/unfollow/', follow_user),
    path('users/me/', current_user),
    path('posts/<int:pk>/comment/', comment_on_post, name='comment_on_post'),
]