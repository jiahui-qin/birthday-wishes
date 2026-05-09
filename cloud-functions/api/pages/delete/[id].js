/**
 * 删除生日祝福页面 - EdgeOne Pages Workers 格式
 * DELETE /api/pages/delete/[id]
 */
export default {
    async fetch(request, env) {
        // 只处理 DELETE 请求
        if (request.method !== 'DELETE') {
            return new Response(JSON.stringify({
                success: false,
                message: '只支持 DELETE 请求'
            }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            };
        }

        try {
            // 从 URL 路径中提取 id
            const url = new URL(request.url);
            const pathParts = url.pathname.split('/');
            const pageId = pathParts[pathParts.length - 1];

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

            // 获取页面数据
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

            // 检查权限
            if (page.createdBy !== username) {
                return new Response(JSON.stringify({
                    success: false,
                    message: '没有权限删除此页面'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                };
            }

            // 删除页面
            await env.birthday_kv.delete(`page:${pageId}`);

            // 删除相关的点赞数据
            await env.birthday_kv.delete(`likes:${pageId}`);

            // 更新用户的页面列表
            const userData = await env.birthday_kv.get(`user:${username}`);
            if (userData) {
                const user = JSON.parse(userData);
                if (user.cards) {
                    user.cards = user.cards.filter(id => id !== pageId);
                    await env.birthday_kv.put(`user:${username}`, JSON.stringify(user));
                }
            }

            return new Response(JSON.stringify({
                success: true,
                message: '删除成功'
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
