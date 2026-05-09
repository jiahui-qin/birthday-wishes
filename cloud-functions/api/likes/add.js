/**
 * 点赞/+1 API - EdgeOne Pages Workers 格式
 * POST /api/likes/add
 */
export default {
    async fetch(request, env) {
        // 只处理 POST 请求
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({
                success: false,
                message: '只支持 POST 请求'
            }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            };
        }

        try {
            const body = await request.json();
            const { pageId, userIdentifier } = body;

            // 验证输入
            if (!pageId) {
                return new Response(JSON.stringify({
                    success: false,
                    message: '页面ID不能为空'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                };
            }

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

            // 获取当前点赞数据
            const likesData = await env.birthday_kv.get(`likes:${pageId}`);
            let likes = likesData ? JSON.parse(likesData) : { count: 0, users: [] };

            // 使用 userIdentifier 防止重复点赞
            const identifier = userIdentifier || 'anonymous_' + Date.now();

            if (!likes.users.includes(identifier)) {
                likes.count += 1;
                likes.users.push(identifier);

                // 保存回 KV
                await env.birthday_kv.put(`likes:${pageId}`, JSON.stringify(likes));
            }

            return new Response(JSON.stringify({
                success: true,
                likes: likes.count
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
