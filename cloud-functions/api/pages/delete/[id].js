/**
 * 删除页面 API
 * DELETE /api/pages/delete/[id]
 */
export async function onRequestDelete(context) {
  console.log('=== Delete Page API Start ===');
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
    
    const pageId = context.params.id;
    console.log('Deleting page:', pageId);
    
    // 获取页面数据
    const pageData = await birthday_kv.get(`page_${pageId}`);
    if (!pageData) {
      return new Response(JSON.stringify({
        success: false,
        message: '页面不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const page = JSON.parse(pageData);
    
    // 验证权限
    if (page.username !== username) {
      return new Response(JSON.stringify({
        success: false,
        message: '无权限删除此页面'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 删除页面
    await birthday_kv.delete(`page_${pageId}`);
    
    // 删除相关点赞数据
    await birthday_kv.delete(`likes_${pageId}`);
    
    // 更新用户的页面列表
    const userData = await birthday_kv.get(`user_${username}`);
    if (userData) {
      const user = JSON.parse(userData);
      if (user.cards) {
        user.cards = user.cards.filter(id => id !== pageId);
        await birthday_kv.put(`user_${username}`, JSON.stringify(user));
      }
    }
    
    console.log('=== Delete Page API Success ===');
    
    return new Response(JSON.stringify({
      success: true,
      message: '页面删除成功'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== Delete Page API Error ===');
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
