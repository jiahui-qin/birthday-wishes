/**
 * 获取页面点赞数
 * GET /api/likes/get/[pageId]
 */
export async function onRequestGet(context) {
    const { params, env } = context;
    const pageId = params.pageId;
    
    try {
        // 检查页面是否存在
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
        
        // 获取点赞数据
        const likesData = await env.birthday_kv.get(`likes:${pageId}`);
        const likes = likesData ? JSON.parse(likesData) : { count: 0, users: [] };
        
        return new Response(JSON.stringify({
            success: true,
            likes: likes.count || 0
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