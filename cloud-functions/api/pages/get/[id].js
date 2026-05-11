/**
 * 获取页面详情 API
 * GET /api/pages/get/[id]
 */
export async function onRequestGet(context) {
  console.log('=== Get Page API Start ===');
  
  try {
    const kv = context.env.birthday_kv;
    const pageId = context.params.id;
    
    if (!kv) {
      return new Response(JSON.stringify({
        success: false,
        message: '服务器配置错误：KV 存储未绑定'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Getting page from KV:', `page:${pageId}`);
    
    // 获取页面数据
    const pageData = await kv.get(`page:${pageId}`);
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
    await kv.put(`page:${pageId}`, JSON.stringify(page));
    
    console.log('=== Get Page API Success ===');
    
    return new Response(JSON.stringify({
      success: true,
      page
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== Get Page API Error ===');
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
