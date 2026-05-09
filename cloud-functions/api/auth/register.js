/**
 * 用户注册 API
 * POST /api/auth/register
 */
export function onRequestPost(context) {
    const { request, env } = context;
    
    return request.json().then(body => {
        const { username, password } = body;
        
        // 验证输入
        if (!username || !password) {
            return new Response(JSON.stringify({
                success: false,
                message: '用户名和密码不能为空'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        if (password.length < 6) {
            return new Response(JSON.stringify({
                success: false,
                message: '密码长度至少6位'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        // 检查用户是否已存在
        return env.birthday_kv.get(`user:${username}`).then(existingUser => {
            if (existingUser) {
                return new Response(JSON.stringify({
                    success: false,
                    message: '用户名已存在'
                }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                };
            }
            
            // 简单密码哈希
            return hashPassword(password).then(passwordHash => {
                // 创建用户
                const user = {
                    username,
                    password: passwordHash,
                    createdAt: new Date().toISOString(),
                    cards: []
                };
                
                return env.birthday_kv.put(`user:${username}`, JSON.stringify(user)).then(() => {
                    // 生成 token
                    const token = btoa(JSON.stringify({
                        username,
                        exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天过期
                    }));
                    
                    return new Response(JSON.stringify({
                        success: true,
                        message: '注册成功',
                        token,
                        username
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    };
                });
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

// 密码哈希函数
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
