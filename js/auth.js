/**
 * 用户认证模块
 */

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeAuthForms();
});

/**
 * 检查登录状态
 */
function checkAuthStatus() {
    const token = localStorage.getItem('auth_token');
    const username = localStorage.getItem('auth_username');
    
    if (token && username) {
        // 验证 token 是否有效（简化验证）
        try {
            const tokenData = JSON.parse(atob(token));
            if (tokenData.exp && tokenData.exp > Date.now()) {
                showLoggedInState(username);
            } else {
                // Token 过期
                logout();
            }
        } catch (e) {
            logout();
        }
    }
}

/**
 * 显示登录状态
 */
function showLoggedInState(username) {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('usernameDisplay').textContent = username;
    document.getElementById('dashboardLink').style.display = 'inline-block';
}

/**
 * 显示未登录状态
 */
function showLoggedOutState() {
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('dashboardLink').style.display = 'none';
}

/**
 * 显示登录模态框
 */
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

/**
 * 关闭登录模态框
 */
function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('loginForm').reset();
}

/**
 * 显示注册模态框
 */
function showRegisterModal() {
    document.getElementById('registerModal').classList.add('active');
}

/**
 * 关闭注册模态框
 */
function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('active');
    document.getElementById('registerForm').reset();
}

/**
 * 切换到注册
 */
function switchToRegister() {
    closeLoginModal();
    setTimeout(() => showRegisterModal(), 300);
}

/**
 * 切换到登录
 */
function switchToLogin() {
    closeRegisterModal();
    setTimeout(() => showLoginModal(), 300);
}

/**
 * 退出登录
 */
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    showLoggedOutState();
    alert('已退出登录');
}

/**
 * 初始化认证表单
 */
function initializeAuthForms() {
    // 登录表单
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            const result = await window.birthdayAPI.login(username, password);
            
            if (result.success) {
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('auth_username', result.username);
                showLoggedInState(result.username);
                closeLoginModal();
                alert('登录成功！');
            } else {
                alert('登录失败：' + result.message);
            }
        });
    }
    
    // 注册表单
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('registerUsername').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('两次输入的密码不一致');
                return;
            }
            
            if (password.length < 6) {
                alert('密码长度至少6位');
                return;
            }
            
            const result = await window.birthdayAPI.register(username, password);
            
            if (result.success) {
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('auth_username', result.username);
                showLoggedInState(result.username);
                closeRegisterModal();
                alert('注册成功！');
            } else {
                alert('注册失败：' + result.message);
            }
        });
    }
}

// 点击模态框背景关闭
document.addEventListener('click', function(e) {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    if (e.target === loginModal) {
        closeLoginModal();
    }
    if (e.target === registerModal) {
        closeRegisterModal();
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLoginModal();
        closeRegisterModal();
    }
});
