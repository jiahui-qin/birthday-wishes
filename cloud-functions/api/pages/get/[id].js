/**
 * 获取页面详情 API
 * GET /api/pages/get/[id]
 */
export async function onRequestGet(context) {
  console.log('=== Get Page API Start ===');
  console.log('birthday_kv exists:', typeof birthday_kv !== 'undefined');
  
  try {
    const pageId = context.params.id;
    
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
    
    console.log('Getting page from KV:', `page_${pageId}`);
    
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
    
    // 增加浏览次数
    page.views = (page.views || 0) + 1;
    await birthday_kv.put(`page_${pageId}`, JSON.stringify(page));
    
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
