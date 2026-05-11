/**
 * 获取用户页面列表 API
 * GET /api/pages/list?username=xxx
 */
export async function onRequestGet(context) {
  console.log('=== Pages List API Start ===');
  
  try {
    const kv = context.env.birthday_kv;
    const request = context.request;
    
    if (!kv) {
      return new Response(JSON.stringify({
        success: false,
        message: '服务器配置错误：KV 存储未绑定'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    
    if (!username) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少用户名参数'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 获取用户数据
    console.log('Getting user from KV:', `user:${username}`);
    const userData = await kv.get(`user:${username}`);
    if (!userData) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userData);
    const pageIds = user.cards || [];
    
    // 获取所有页面数据
    console.log('Getting pages:', pageIds);
    const pages = [];
    for (const pageId of pageIds) {
      const pageData = await kv.get(`page:${pageId}`);
      if (pageData) {
        pages.push(JSON.parse(pageData));
      }
    }
    
    console.log('=== Pages List API Success ===');
    
    return new Response(JSON.stringify({
      success: true,
      pages
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== Pages List API Error ===');
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
