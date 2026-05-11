/**
 * 创建生日祝福页面 API
 * POST /api/pages/create
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // 验证 token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new Response(JSON.stringify({
        success: false,
        message: '未授权'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Basic ', '');
    let username;
    
    try {
      const tokenData = JSON.parse(atob(token));
      if (tokenData.exp < Date.now()) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Token 已过期'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      username = tokenData.username;
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Token 无效'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { title, message, theme, musicUrl } = body;
    
    // 验证输入
    if (!title || !message) {
      return new Response(JSON.stringify({
        success: false,
        message: '标题和祝福语不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 生成页面 ID
    const pageId = 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // 创建页面数据
    const pageData = {
      id: pageId,
      username,
      title,
      message,
      theme: theme || 'classic',
      musicUrl: musicUrl || '',
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0
    };
    
    // 保存到 KV
    await env.birthday_kv.put(`page:${pageId}`, JSON.stringify(pageData));
    
    // 更新用户的页面列表
    const userData = await env.birthday_kv.get(`user:${username}`);
    const user = JSON.parse(userData);
    if (!user.cards) user.cards = [];
    user.cards.push(pageId);
    await env.birthday_kv.put(`user:${username}`, JSON.stringify(user));
    
    return new Response(JSON.stringify({
      success: true,
      message: '页面创建成功',
      pageId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误：' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
