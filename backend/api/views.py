from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import Post, Comment, Like, Follow
from .serializers import PostSerializer, UserSerializer, CommentSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        followed = Follow.objects.filter(follower=user).values_list('following', flat=True)
        return Post.objects.filter(author__in=followed) | Post.objects.filter(author=user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comment_on_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    content = request.data.get('content')
    if not content:
        return Response({"error": "Content required"}, status=400)
    comment = Comment.objects.create(post=post, author=request.user, content=content)
    serializer = CommentSerializer(comment, context={'request': request})
    return Response(serializer.data, status=201)

@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def like_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.method == 'POST':
        Like.objects.get_or_create(user=request.user, post=post)
    else:
        Like.objects.filter(user=request.user, post=post).delete()
    return Response({"detail": "success"})

@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def follow_user(request, pk):
    user_to_follow = get_object_or_404(User, pk=pk)
    if request.method == 'POST':
        Follow.objects.get_or_create(follower=request.user, following=user_to_follow)
    else:
        Follow.objects.filter(follower=request.user, following=user_to_follow).delete()
    return Response({"detail": "success"})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comment_on_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    content = request.data.get('content')
    if not content:
        return Response({"error": "Content required"}, status=400)
    comment = Comment.objects.create(post=post, author=request.user, content=content)
    serializer = CommentSerializer(comment, context={'request': request})
    return Response(serializer.data, status=201)