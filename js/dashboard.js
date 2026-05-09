/**
 * 仪表盘功能模块
 */

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    checkDashboardAuth();
    loadUserCards();
});

/**
 * 检查仪表盘访问权限
 */
function checkDashboardAuth() {
    const token = localStorage.getItem('auth_token');
    const username = localStorage.getItem('auth_username');
    
    if (!token || !username) {
        alert('请先登录后再访问此页面');
        window.location.href = 'index.html';
        return;
    }
    
    // 显示用户名
    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay) {
        usernameDisplay.textContent = username;
    }
}

/**
 * 加载用户的贺卡列表
 */
async function loadUserCards() {
    const result = await window.birthdayAPI.listPages();
    
    if (!result.success) {
        alert('加载失败：' + result.message);
        return;
    }
    
    const cards = result.pages || [];
    
    // 更新统计信息
    updateStats(cards);
    
    // 渲染贺卡列表
    renderCards(cards);
}

/**
 * 更新统计信息
 */
function updateStats(cards) {
    let totalViews = 0;
    let totalLikes = 0;
    
    cards.forEach(card => {
        totalViews += card.views || 0;
        totalLikes += card.likes || 0;
    });
    
    document.getElementById('totalCards').textContent = cards.length;
    document.getElementById('totalViews').textContent = totalViews;
    document.getElementById('totalLikes').textContent = totalLikes;
}

/**
 * 渲染贺卡列表
 */
function renderCards(cards) {
    const cardsGrid = document.getElementById('cardsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (cards.length === 0) {
        cardsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    cardsGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    cardsGrid.innerHTML = '';
    
    cards.forEach(card => {
        const cardElement = createCardElement(card);
        cardsGrid.appendChild(cardElement);
    });
}

/**
 * 创建贺卡元素
 */
function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card-item';
    
    // 计算是否过期
    const isExpired = card.expirationDate && new Date(card.expirationDate) < new Date();
    const expirationText = card.expirationDate 
        ? `过期时间：${new Date(card.expirationDate).toLocaleDateString('zh-CN')}`
        : '永不过期';
    
    div.innerHTML = `
        <div class="card-header">
            <span class="card-template">${getTemplateName(card.template)}</span>
            <span class="card-status ${isExpired ? 'expired' : 'active'}">${isExpired ? '已过期' : '有效'}</span>
        </div>
        <div class="card-body">
            <h3 class="card-recipient">🎂 ${card.recipientName}</h3>
            <p class="card-meta">
                <span>👁️ ${card.views || 0} 次浏览</span>
                <span>👍 ${card.likes || 0} 个点赞</span>
            </p>
            <p class="card-expiration">${expirationText}</p>
            <p class="card-date">创建于：${new Date(card.createdAt).toLocaleDateString('zh-CN')}</p>
        </div>
        <div class="card-actions">
            <button class="btn-view" onclick="viewCard('${card.id}')">查看</button>
            <button class="btn-edit" onclick="editCard('${card.id}')">编辑</button>
            <button class="btn-delete" onclick="deleteCard('${card.id}')">删除</button>
        </div>
    `;
    
    return div;
}

/**
 * 获取模板名称
 */
function getTemplateName(templateId) {
    const names = {
        'elegant': '✨ 优雅奢华',
        'playful': '🎈 活泼派对',
        'minimalist': '🎁 极简清新',
        'floral': '🌸 花卉浪漫',
        'cosmic': '🌌 宇宙星空',
        'vintage': '📻 复古温暖'
    };
    return names[templateId] || templateId;
}

/**
 * 查看贺卡
 */
function viewCard(cardId) {
    // 这里需要根据 cardId 获取模板类型，然后打开对应的模板页面
    window.open(`templates/${getTemplateFile(cardId)}?id=${cardId}`, '_blank');
}

/**
 * 获取模板文件（简化版，实际应该从 API 获取）
 */
function getTemplateFile(cardId) {
    // 这里简化处理，实际应该先获取卡片详情
    return 'elegant.html';
}

/**
 * 编辑贺卡
 */
function editCard(cardId) {
    alert('编辑功能开发中...');
    // TODO: 实现编辑功能
}

/**
 * 删除贺卡
 */
async function deleteCard(cardId) {
    if (!confirm('确定要删除这张贺卡吗？此操作不可恢复！')) {
        return;
    }
    
    const result = await window.birthdayAPI.deletePage(cardId);
    
    if (result.success) {
        alert('删除成功！');
        loadUserCards(); // 重新加载列表
    } else {
        alert('删除失败：' + result.message);
    }
}

/**
 * 退出登录
 */
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    window.location.href = 'index.html';
}
