/**
 * 更新生日祝福页面
 * PUT /api/pages/update/[id]
 */
export function onRequestPut(context) {
    const { params, request, env } = context;
    const pageId = params.id;
    
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
    return env.birthday_kv.get(`page:${pageId}`).then(pageData => {
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
                message: '没有权限修改此页面'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        // 获取更新数据
        return request.json().then(body => {
            const { recipientName, message, senderName, template, expirationDays } = body;
            
            // 更新页面数据
            if (recipientName) page.recipientName = recipientName;
            if (message) page.message = message;
            if (senderName) page.senderName = senderName;
            if (template) page.template = template;
            
            // 更新过期时间
            if (expirationDays !== undefined) {
                if (expirationDays && expirationDays > 0) {
                    const expirationDate = new Date();
                    expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays));
                    page.expirationDate = expirationDate.toISOString();
                } else {
                    page.expirationDate = null;
                }
            }
            
            page.updatedAt = new Date().toISOString();
            
            // 保存到 KV
            return env.birthday_kv.put(`page:${pageId}`, JSON.stringify(page)).then(() => {
                return new Response(JSON.stringify({
                    success: true,
                    message: '更新成功',
                    page
                }), {
                    headers: { 'Content-Type': 'application/json' }
                };
            });
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
