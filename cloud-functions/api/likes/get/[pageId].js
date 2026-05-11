/**
 * 获取点赞数 API
 * GET /api/likes/get/[pageId]
 */
export async function onRequestGet(context) {
  console.log('=== Get Likes API Start ===');
  
  try {
    const kv = context.env.birthday_kv;
    const pageId = context.params.pageId;
    
    if (!kv) {
      return new Response(JSON.stringify({
        success: false,
        message: '服务器配置错误：KV 存储未绑定'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Getting likes for page:', pageId);
    
    // 获取点赞数
    const likesData = await kv.get(`likes:${pageId}`);
    const likes = likesData ? parseInt(likesData) : 0;
    
    console.log('=== Get Likes API Success ===');
    
    return new Response(JSON.stringify({
      success: true,
      likes
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== Get Likes API Error ===');
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
