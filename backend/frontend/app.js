const API_URL = 'http://localhost:8000/api';
let token = localStorage.getItem('token');
let currentUser = null;
let authMode = 'login';

const avatars = ['😀', '😎', '🥳', '🤓', '😇', '🥰', '😜', '🤩', '😺', '🦁'];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('authBtn').onclick = handleAuth;
    document.getElementById('toggleBtn').onclick = toggleAuthMode;
    document.getElementById('logoutBtn').onclick = logout;
    document.getElementById('postBtn').onclick = createPost;

    if (token) {
        fetchCurrentUser();
    } else {
        showAuthView();
    }
});

function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    document.getElementById('email').classList.toggle('hidden');
    document.getElementById('authBtn').textContent = authMode === 'login' ? 'Login' : 'Register';
    document.getElementById('toggleBtn').textContent = authMode === 'login' ? 'Switch to Register' : 'Switch to Login';
}

async function handleAuth() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value.trim();

    clearMessage();

    if (!username || !password) {
        showMessage('Username and password required', 'error');
        return;
    }

    if (authMode === 'register' && !email) {
        showMessage('Email required for registration', 'error');
        return;
    }

    const endpoint = authMode === 'login' ? 'auth/token/' : 'auth/register/';
    const body = authMode === 'login' ? { username, password } : { username, email, password };

    try {
        const res = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (res.ok) {
            if (authMode === 'login') {
                localStorage.setItem('token', data.access);
                token = data.access;
                fetchCurrentUser();
            } else {
                showMessage('Registration successful! Please log in.', 'success');
                toggleAuthMode();
            }
        } else {
            showMessage(data.detail || JSON.stringify(data), 'error');
        }
    } catch (err) {
        showMessage('Network error - is backend running?', 'error');
    }
}

async function fetchCurrentUser() {
    try {
        const res = await fetch(`${API_URL}/users/me/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            currentUser = await res.json();
            document.getElementById('currentUsername').textContent = currentUser.username;
            showMainView();
            loadPosts();
        } else {
            logout();
        }
    } catch (err) {
        logout();
    }
}

function logout() {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    showAuthView();
}

async function loadPosts() {
    try {
        const res = await fetch(`${API_URL}/posts/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const posts = data.results || data;

        const container = document.getElementById('postsList');
        container.innerHTML = posts.length === 0 ? '<p class="empty">No posts yet. Be the first!</p>' : '';

        posts.forEach(post => {
            const avatar = avatars[post.author.id % avatars.length];

            const postEl = document.createElement('div');
            postEl.className = 'post';
            postEl.innerHTML = `
                <div class="post-header">
                    <div class="avatar">${avatar}</div>
                    <div>
                        <strong>@${post.author.username}</strong>
                        <small>${new Date(post.created_at).toLocaleString()}</small>
                    </div>
                </div>
                <div class="post-content">${post.content.replace(/\n/g, '<br>')}</div>
                <div class="post-actions">
                    <button class="action-btn" onclick="likePost(${post.id}, ${post.is_liked})">
                        ${post.is_liked ? '❤️ Unlike' : '🤍 Like'} (${post.like_count || 0})
                    </button>
                    <button class="action-btn" onclick="toggleComments(${post.id})">
                        💬 Comments (${post.comment_count || 0})
                    </button>
                </div>
                <div class="comments-section hidden" id="comments-${post.id}">
                    ${post.comments.map(c => `
                        <div class="comment">
                            <strong>@${c.author.username}</strong>
                            <p>${c.content}</p>
                            <small>${new Date(c.created_at).toLocaleString()}</small>
                        </div>
                    `).join('')}
                    <div class="add-comment">
                        <input type="text" placeholder="Write a comment..." id="comment-input-${post.id}">
                        <button onclick="addComment(${post.id})">Send</button>
                    </div>
                </div>
            `;
            container.appendChild(postEl);
        });
    } catch (err) {
        showMessage('Failed to load posts', 'error');
    }
}

function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    section.classList.toggle('hidden');
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    if (!content) return;

    try {
        const res = await fetch(`${API_URL}/posts/${postId}/comment/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        if (res.ok) {
            input.value = '';
            loadPosts();
        }
    } catch (err) {
        showMessage('Comment failed', 'error');
    }
}

async function createPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content) return;

    try {
        const res = await fetch(`${API_URL}/posts/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        if (res.ok) {
            document.getElementById('postContent').value = '';
            loadPosts();
        }
    } catch (err) {
        showMessage('Post failed', 'error');
    }
}

async function likePost(postId, isLiked) {
    const method = isLiked ? 'DELETE' : 'POST';
    await fetch(`${API_URL}/posts/${postId}/${isLiked ? 'unlike' : 'like'}/`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
    });
    loadPosts();
}

function showAuthView() {
    document.getElementById('authView').classList.remove('hidden');
    document.getElementById('mainView').classList.add('hidden');
}

function showMainView() {
    document.getElementById('authView').classList.add('hidden');
    document.getElementById('mainView').classList.remove('hidden');
}

function showMessage(text, type = 'error') {
    const msg = document.getElementById('authMessage');
    msg.textContent = text;
    msg.className = `message ${type}`;
    msg.classList.remove('hidden');
}

function clearMessage() {
    document.getElementById('authMessage').classList.add('hidden');
}