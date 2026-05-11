/**
 * 用户注册 API
 * POST /api/auth/register
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 调试日志
  console.log('=== Register API Debug ===');
  console.log('env keys:', Object.keys(env));
  console.log('birthday_kv exists:', !!env.birthday_kv);
  
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
      });
    }
    
    if (password.length < 6) {
      return new Response(JSON.stringify({
        success: false,
        message: '密码长度至少6位'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 检查用户是否已存在
    const existingUser = await env.birthday_kv.get(`user:${username}`);
    if (existingUser) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户名已存在'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 简单密码哈希
    const passwordHash = await hashPassword(password);
    
    // 创建用户
    const user = {
      username,
      password: passwordHash,
      createdAt: new Date().toISOString(),
      cards: []
    };
    
    await env.birthday_kv.put(`user:${username}`, JSON.stringify(user));
    
    // 生成 token
    const token = btoa(JSON.stringify({
      username,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    }));
    
    return new Response(JSON.stringify({
      success: true,
      message: '注册成功',
      token,
      username
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Register API Error:', error);
    console.error('env.birthday_kv:', env.birthday_kv);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误：' + error.message,
      debug: {
        envKeys: Object.keys(env),
        birthday_kv_exists: !!env.birthday_kv
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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
