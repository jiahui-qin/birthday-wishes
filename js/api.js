/**
 * API 工具类 - 用于与 Edge Functions 通信
 */

const API_BASE = '/api';

class BirthdayAPI {
    /**
     * 用户注册
     */
    async register(username, password) {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        return response.json();
    }

    /**
     * 用户登录
     */
    async login(username, password) {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        return response.json();
    }

    /**
     * 创建生日祝福页面
     */
    async createPage(pageData) {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return { success: false, message: '请先登录' };
        }

        const response = await fetch(`${API_BASE}/pages/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(pageData)
        });
        return response.json();
    }

    /**
     * 获取用户的所有页面
     */
    async listPages() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return { success: false, message: '请先登录' };
        }

        const response = await fetch(`${API_BASE}/pages/list`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    }

    /**
     * 获取页面详情
     */
    async getPage(pageId) {
        const response = await fetch(`${API_BASE}/pages/get/${pageId}`);
        return response.json();
    }

    /**
     * 更新页面
     */
    async updatePage(pageId, updateData) {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return { success: false, message: '请先登录' };
        }

        const response = await fetch(`${API_BASE}/pages/update/${pageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        return response.json();
    }

    /**
     * 删除页面
     */
    async deletePage(pageId) {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return { success: false, message: '请先登录' };
        }

        const response = await fetch(`${API_BASE}/pages/delete/${pageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    }

    /**
     * 点赞/+1
     */
    async addLike(pageId, userIdentifier) {
        const response = await fetch(`${API_BASE}/likes/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pageId, userIdentifier })
        });
        return response.json();
    }

    /**
     * 获取点赞数
     */
    async getLikes(pageId) {
        const response = await fetch(`${API_BASE}/likes/get/${pageId}`);
        return response.json();
    }
}

// 导出单例
window.birthdayAPI = new BirthdayAPI();
