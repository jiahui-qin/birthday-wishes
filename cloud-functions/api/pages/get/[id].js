/**
 * 获取页面详情 API
 * GET /api/pages/get/[id]
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const pageId = context.params.id;
  
  try {
    // 获取页面数据
    const pageData = await env.birthday_kv.get(`page:${pageId}`);
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
    
    // 增加浏览次数
    page.views = (page.views || 0) + 1;
    await env.birthday_kv.put(`page:${pageId}`, JSON.stringify(page));
    
    return new Response(JSON.stringify({
      success: true,
      page
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
