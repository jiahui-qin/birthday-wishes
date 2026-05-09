/**
 * 获取用户创建的所有生日祝福页面
 * GET /api/pages/list
 */
export function onRequestGet(context) {
    const { request, env } = context;
    
    // 验证 token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({
            success: false,
            message: '请先登录'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        };
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
        };
    }
    
    const username = tokenData.username;
    
    // 获取用户数据
    return env.birthday_kv.get(`user:${username}`).then(userData => {
        if (!userData) {
            return new Response(JSON.stringify({
                success: false,
                message: '用户不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        const user = JSON.parse(userData);
        const pageIds = user.cards || [];
        
        // 获取所有页面数据
        const pagePromises = pageIds.map(pageId => {
            return env.birthday_kv.get(`page:${pageId}`).then(pageData => {
                if (pageData) {
                    const page = JSON.parse(pageData);
                    
                    // 获取点赞数
                    return env.birthday_kv.get(`likes:${pageId}`).then(likesData => {
                        const likes = likesData ? JSON.parse(likesData) : { count: 0 };
                        
                        return {
                            id: page.id,
                            recipientName: page.recipientName,
                            template: page.template,
                            createdAt: page.createdAt,
                            expirationDate: page.expirationDate,
                            views: page.views || 0,
                            likes: likes.count || 0
                        };
                    });
                }
                return null;
            });
        });
        
        return Promise.all(pagePromises).then(pages => {
            // 过滤掉 null 并按创建时间倒序排序
            const validPages = pages.filter(p => p!== null);
            validPages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            return new Response(JSON.stringify({
                success: true,
                pages: validPages
            }), {
                headers: { 'Content-Type': 'application/json' }
            };
        });
    }).catch(error => {
        return new Response(JSON.stringify({
            success: false,
            message: '服务器错误：' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        };
    });
}