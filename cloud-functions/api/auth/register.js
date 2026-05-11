/**
 * 用户注册 API
 * POST /api/auth/register
 */
export async function onRequestPost(context) {
  // 调试日志
  console.log('=== Register API Start ===');
  console.log('birthday_kv exists:', typeof birthday_kv !== 'undefined');
  
  try {
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
    
    const request = context.request;
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body));
    
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
    
    console.log('Checking if user exists:', username);
    
    // 检查用户是否已存在
    let existingUser;
    try {
      existingUser = await birthday_kv.get(`user:${username}`);
      console.log('Existing user:', existingUser);
    } catch (kvError) {
      console.error('KV get error:', kvError);
      return new Response(JSON.stringify({
        success: false,
        message: '数据库查询错误：' + kvError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (existingUser) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户名已存在'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Hashing password...');
    
    // 简单密码哈希
    const passwordHash = await hashPassword(password);
    
    console.log('Creating user...');
    
    // 创建用户
    const user = {
      username,
      password: passwordHash,
      createdAt: new Date().toISOString(),
      cards: []
    };
    
    console.log('Saving user to KV...');
    
    // 保存到 KV
    try {
      await birthday_kv.put(`user:${username}`, JSON.stringify(user));
      console.log('User saved successfully');
    } catch (kvError) {
      console.error('KV put error:', kvError);
      return new Response(JSON.stringify({
        success: false,
        message: '数据库保存错误：' + kvError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 生成 token
    const token = btoa(JSON.stringify({
      username,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    }));
    
    console.log('=== Register API Success ===');
    
    return new Response(JSON.stringify({
      success: true,
      message: '注册成功',
      token,
      username
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== Register API Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误：' + error.message,
      debug: {
        errorType: error.name,
        errorMessage: error.message
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
