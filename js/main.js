/* ========================================
   生日祝福网站 - 主JavaScript文件（更新版）
   ======================================== */

// 全局变量
let currentTemplate = '';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeParticles();
    initializeForm();
    checkAuthStatus();
});

// ========================================
// 粒子效果
// ========================================
function initializeParticles() {
    const heroParticles = document.getElementById('heroParticles');
    if (!heroParticles) return;

    // 创建多个粒子
    for (let i = 0; i < 30; i++) {
        createParticle(heroParticles);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // 随机位置
    const x = Math.random() * 100;
    const delay = Math.random() * 6;
    const duration = 6 + Math.random() * 4;
    const size = 5 + Math.random() * 10;
    
    particle.style.cssText = `
        left: ${x}%;
        width: ${size}px;
        height: ${size}px;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
    `;
    
    container.appendChild(particle);
    
    // 动画结束后重新创建
    setTimeout(() => {
        particle.remove();
        createParticle(container);
    }, (delay + duration) * 1000);
}

// ========================================
// 模板选择
// ========================================
function selectTemplate(templateName) {
    currentTemplate = templateName;
    const templateNames = {
        'elegant': '✨ 优雅奢华',
        'playful': '🎈 活泼派对',
        'minimalist': '🎁 极简清新',
        'floral': '🌸 花卉浪漫',
        'cosmic': '🌌 宇宙星空',
        'vintage': '📻 复古温暖'
    };
    
    // 更新表单中的已选模板
    document.getElementById('selectedTemplate').value = templateNames[templateName] || templateName;
    
    // 滚动到自定义表单
    document.getElementById('customize').scrollIntoView({ behavior: 'smooth' });
    
    // 添加视觉反馈
    const cards = document.querySelectorAll('.template-card');
    cards.forEach(card => {
        card.style.border = 'none';
    });
    
    event.currentTarget.closest('.template-card').style.border = '3px solid #6366f1';
}

// ========================================
// 表单初始化
// ========================================
function initializeForm() {
    const form = document.getElementById('birthdayForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        generateBirthdayPage();
    });
}

// ========================================
// 生成生日祝福页面
// ========================================
async function generateBirthdayPage() {
    const recipientName = document.getElementById('recipientName').value.trim();
    const birthdayMessage = document.getElementById('birthdayMessage').value.trim();
    const senderName = document.getElementById('senderName').value.trim();
    const expirationDays = document.getElementById('expirationDays').value;
    
    // 验证
    if (!recipientName || !birthdayMessage || !senderName) {
        alert('⚠️ 请填写所有必填项！');
        return;
    }
    
    if (!currentTemplate) {
        alert('⚠️ 请先选择一个模板！');
        return;
    }
    
    // 检查是否登录
    const token = localStorage.getItem('auth_token');
    if (!token) {
        alert('⚠️ 请先登录后再创建贺卡！');
        showLoginModal();
        return;
    }
    
    // 调用 API 创建页面
    const result = await window.birthdayAPI.createPage({
        recipientName,
        message: birthdayMessage,
        senderName,
        template: currentTemplate,
        expirationDays: expirationDays ? parseInt(expirationDays) : 0
    });
    
    if (result.success) {
        alert('✅ 贺卡创建成功！');
        // 打开生成的页面
        window.open(result.url, '_blank');
    } else {
        alert('❌ 创建失败：' + result.message);
    }
}

// ========================================
// 预览页面
// ========================================
function previewPage() {
    const recipientName = document.getElementById('recipientName').value.trim() || '亲爱的朋友';
    const birthdayMessage = document.getElementById('birthdayMessage').value.trim() || '祝你生日快乐！';
    const senderName = document.getElementById('senderName').value.trim() || '你的朋友';
    
    if (!currentTemplate) {
        alert('⚠️ 请先选择一个模板！');
        return;
    }
    
    // 创建预览数据
    const previewData = {
        template: currentTemplate,
        recipientName: recipientName,
        message: birthdayMessage,
        senderName: senderName,
        isPreview: true,
        date: new Date().toLocaleDateString('zh-CN')
    };
    
    // 保存到 localStorage
    localStorage.setItem('birthdayData', JSON.stringify(previewData));
    
    // 打开预览
    const templateFile = `templates/${currentTemplate}.html`;
    window.open(templateFile, '_blank');
}

// ========================================
// 模态框控制
// ========================================
function openModal(url) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    
    iframe.src = url;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    
    iframe.src = '';
    modal.classList.remove('active');
}

// ========================================
// 认证相关函数（供 auth.js 调用）
// ========================================
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
                logout();
            }
        } catch (e) {
            logout();
        }
    }
}

function showLoggedInState(username) {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const dashboardLink = document.getElementById('dashboardLink');
    const usernameDisplay = document.getElementById('usernameDisplay');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    if (dashboardLink) dashboardLink.style.display = 'inline-block';
    if (usernameDisplay) usernameDisplay.textContent = username;
}

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userInfo) userInfo.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'none';
}

// 点击模态框背景关闭
document.addEventListener('click', function(e) {
    const modal = document.getElementById('previewModal');
    if (e.target === modal) {
        closeModal();
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ========================================
// 工具函数：获取URL参数
// ========================================
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 导出函数供HTML使用
window.selectTemplate = selectTemplate;
window.previewPage = previewPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.checkAuthStatus = checkAuthStatus;
window.showLoggedInState = showLoggedInState;
window.logout = logout;
