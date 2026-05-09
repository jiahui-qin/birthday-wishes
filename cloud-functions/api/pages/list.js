/**
 * 获取用户创建的所有生日祝福页面 - EdgeOne Pages Workers 格式
 * GET /api/pages/list
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
            const userData = await env.birthday_kv.get(`user:${username}`);
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
            const pages = [];
            for (const pageId of pageIds) {
                const pageData = await env.birthday_kv.get(`page:${pageId}`);
                if (pageData) {
                    const page = JSON.parse(pageData);

                    // 获取点赞数
                    const likesData = await env.birthday_kv.get(`likes:${pageId}`);
                    const likes = likesData ? JSON.parse(likesData) : { count: 0 };

                    pages.push({
                        id: page.id,
                        recipientName: page.recipientName,
                        template: page.template,
                        createdAt: page.createdAt,
                        expirationDate: page.expirationDate,
                        views: page.views || 0,
                        likes: likes.count || 0
                    });
                }
            }

            // 按创建时间倒序排序
            pages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return new Response(JSON.stringify({
                success: true,
                pages
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
