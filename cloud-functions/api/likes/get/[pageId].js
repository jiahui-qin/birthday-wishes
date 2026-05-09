/**
 * 获取页面点赞数 - EdgeOne Pages Workers 格式
 * GET /api/likes/get/[pageId]
 */
export default {
    async fetch(request, env) {
        // 只处理 GET 请求
        if (request.method !== 'GET') {
            return new Response(JSON.stringify({
                success: false,
                message: '只支持 GET 请求'
            }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            };
        }

        try {
            // 从 URL 路径中提取 pageId
            const url = new URL(request.url);
            const pathParts = url.pathname.split('/');
            const pageId = pathParts[pathParts.length - 1];

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
};
