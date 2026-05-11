/**
 * 创建生日祝福页面 API
 * POST /api/pages/create
 */
export async function onRequestPost(context) {
  console.log('=== Create Page API Start ===');
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
    
    // 验证 token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        message: '未授权'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
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
    const { title, message, theme, musicUrl, senderName, expirationDays } = body;

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

    // 计算过期时间
    let expirationDate = null;
    if (expirationDays && parseInt(expirationDays) > 0) {
      expirationDate = new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000).toISOString();
    }

    // 创建页面数据
    const pageData = {
      id: pageId,
      username,
      title,
      message,
      senderName: senderName || '',
      theme: theme || 'classic',
      musicUrl: musicUrl || '',
      expirationDate,
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0
    };
    
    console.log('Saving page to KV:', pageId);
    
    // 保存到 KV
    await birthday_kv.put(`page_${pageId}`, JSON.stringify(pageData));
    
    // 更新用户的页面列表
    const userData = await birthday_kv.get(`user_${username}`);
    const user = JSON.parse(userData);
    if (!user.cards) user.cards = [];
    user.cards.push(pageId);
    await birthday_kv.put(`user_${username}`, JSON.stringify(user));
    
    console.log('=== Create Page API Success ===');
    
    return new Response(JSON.stringify({
      success: true,
      message: '页面创建成功',
      pageId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== Create Page API Error ===');
    console.error('Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误：' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
