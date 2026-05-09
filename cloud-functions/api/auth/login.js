/**
 * 用户登录 API
 * POST /api/auth/login
 */
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const body = await request.json();
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
        
        // 获取用户
        const userData = await env.birthday_kv.get(`user:${username}`);
        if (!userData) {
            return new Response(JSON.stringify({
                success: false,
                message: '用户名或密码错误'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        const user = JSON.parse(userData);
        
        // 验证密码
        const passwordHash = await hashPassword(password);
        if (passwordHash !== user.password) {
            return new Response(JSON.stringify({
                success: false,
                message: '用户名或密码错误'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        // 生成 token
        const token = btoa(JSON.stringify({
            username,
            exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天过期
        }));
        
        return new Response(JSON.stringify({
            success: true,
            message: '登录成功',
            token,
            username
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

// 密码哈希函数
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
