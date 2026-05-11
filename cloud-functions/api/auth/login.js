/**
 * 用户登录 API
 * POST /api/auth/login
 */
export async function onRequestPost(context) {
  console.log('=== Login API Start ===');
  console.log('birthday_kv exists:', typeof birthday_kv !== 'undefined');
  
  try {
    const request = context.request;
    
    // 检查 birthday_kv 是否绑定
    if (typeof birthday_kv === 'undefined') {
      console.error('ERROR: birthday_kv is undefined');
      return new Response(JSON.stringify({
        success: false,
        message: '服务器配置错误：KV 存储未绑定'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    console.log('Login attempt:', body.username);
    
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
    
    // 获取用户
    console.log('Getting user from KV:', `user:${username}`);
    const userData = await birthday_kv.get(`user:${username}`);
    console.log('User data:', userData);
    
    if (!userData) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户名或密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userData);
    
    // 验证密码
    const passwordHash = await hashPassword(password);
    console.log('Password check:', passwordHash, user.password);
    
    if (passwordHash !== user.password) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户名或密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 生成 token
    const token = btoa(JSON.stringify({
      username,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    }));
    
    console.log('=== Login API Success ===');
    
    return new Response(JSON.stringify({
      success: true,
      message: '登录成功',
      token,
      username
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== Login API Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误：' + error.message
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
