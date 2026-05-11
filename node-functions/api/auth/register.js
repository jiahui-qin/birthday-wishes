/**
 * 用户注册 API
 * POST /api/auth/register
 */
export function onRequestPost(context) {
    var request = context.request;
    var env = context.env;
    
    return request.json().then(function(body) {
        var username = body.username;
        var password = body.password;
        
        // 验证输入
        if (!username || !password) {
            return new Response(
                JSON.stringify({success: false, message: '用户名和密码不能为空'}),
                {status: 400, headers: {'Content-Type': 'application/json'}}
            );
        }
        
        if (password.length < 6) {
            return new Response(
                JSON.stringify({success: false, message: '密码长度至少6位'}),
                {status: 400, headers: {'Content-Type': 'application/json'}}
            );
        }
        
        // 检查用户是否已存在
        return env.birthday_kv.get('user:' + username).then(function(existingUser) {
            if (existingUser) {
                return new Response(
                    JSON.stringify({success: false, message: '用户名已存在'}),
                    {status: 409, headers: {'Content-Type': 'application/json'}}
                );
            }
            
            // 简单密码哈希
            return hashPassword(password).then(function(passwordHash) {
                // 创建用户
                var user = {
                    username: username,
                    password: passwordHash,
                    createdAt: new Date().toISOString(),
                    cards: []
                };
                
                return env.birthday_kv.put('user:' + username, JSON.stringify(user)).then(function() {
                    // 生成 token
                    var token = btoa(JSON.stringify({
                        username: username,
                        exp: Date.now() + 7 * 24 * 60 * 60 * 1000
                    }));
                    
                    return new Response(
                        JSON.stringify({success: true, message: '注册成功', token: token, username: username}),
                        {headers: {'Content-Type': 'application/json'}}
                    );
                });
            });
        });
    }).catch(function(error) {
        return new Response(
            JSON.stringify({success: false, message: '服务器错误：' + error.message}),
            {status: 500, headers: {'Content-Type': 'application/json'}}
        );
    });
}

// 密码哈希函数
function hashPassword(password) {
    var encoder = new TextEncoder();
    var data = encoder.encode(password);
    return crypto.subtle.digest('SHA-256', data).then(function(hash) {
        var hashArray = Array.from(new Uint8Array(hash));
        var hexArray = hashArray.map(function(b) {
            return b.toString(16).padStart(2, '0');
        });
        return hexArray.join('');
    });
}
