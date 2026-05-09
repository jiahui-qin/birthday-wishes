/**
 * 创建生日祝福页面 API
 * POST /api/pages/create
 */
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // 验证 token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({
                success: false,
                message: '请先登录'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        let tokenData;
        try {
            tokenData = JSON.parse(atob(token));
        } catch (e) {
            return new Response(JSON.stringify({
                success: false,
                message: '登录已过期，请重新登录'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 检查 token 是否过期
        if (tokenData.exp < Date.now()) {
            return new Response(JSON.stringify({
                success: false,
                message: '登录已过期，请重新登录'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const username = tokenData.username;
        
        // 获取请求数据
        const body = await request.json();
        const { recipientName, message, senderName, template, expirationDays } = body;
        
        // 验证输入
        if (!recipientName || !message || !senderName || !template) {
            return new Response(JSON.stringify({
                success: false,
                message: '请填写完整信息'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 生成唯一 ID
        const pageId = generateId();
        
        // 计算过期时间
        let expirationDate = null;
        if (expirationDays && expirationDays > 0) {
            expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays));
        }
        
        // 创建页面数据
        const pageData = {
            id: pageId,
            recipientName,
            message,
            senderName,
            template,
            createdBy: username,
            createdAt: new Date().toISOString(),
            expirationDate: expirationDate ? expirationDate.toISOString() : null,
            likes: 0,
            views: 0
        };
        
        // 保存到 KV
        await env.birthday_kv.put(`page:${pageId}`, JSON.stringify(pageData));
        
        // 更新用户的页面列表
        const userData = await env.birthday_kv.get(`user:${username}`);
        if (userData) {
            const user = JSON.parse(userData);
            if (!user.cards) user.cards = [];
            user.cards.push(pageId);
            await env.birthday_kv.put(`user:${username}`, JSON.stringify(user));
        }
        
        return new Response(JSON.stringify({
            success: true,
            message: '创建成功',
            pageId,
            url: `/templates/${template}.html?id=${pageId}`
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            message: '服务器错误：' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 生成唯一 ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
