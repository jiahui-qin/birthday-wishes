/**
 * 获取生日祝福页面详情
 * GET /api/pages/get/[id]
 */
export async function onRequestGet(context) {
    const { params, env } = context;
    const pageId = params.id;
    
    try {
        // 从 KV 获取页面数据
        const pageData = await env.birthday_kv.get(`page:${pageId}`);
        
        if (!pageData) {
            return new Response(JSON.stringify({
                success: false,
                message: '页面不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        const page = JSON.parse(pageData);
        
        // 检查是否过期
        if (page.expirationDate) {
            const expirationDate = new Date(page.expirationDate);
            if (new Date() > expirationDate) {
                return new Response(JSON.stringify({
                    success: false,
                    message: '该祝福页面已过期',
                    expired: true
                }), {
                    status: 410,
                    headers: { 'Content-Type': 'application/json' }
                };
            }
        }
        
        // 增加浏览次数
        page.views = (page.views || 0) + 1;
        await env.birthday_kv.put(`page:${pageId}`, JSON.stringify(page));
        
        // 获取点赞数
        const likesData = await env.birthday_kv.get(`likes:${pageId}`);
        const likes = likesData ? JSON.parse(likesData) : { count: 0, users: [] };
        
        return new Response(JSON.stringify({
            success: true,
            page: {
                ...page,
                likes: likes.count || 0
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        };
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            message: '服务器错误：' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        };
    }
}