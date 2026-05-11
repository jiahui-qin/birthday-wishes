/**
 * 获取点赞数 API
 * GET /api/likes/get/[pageId]
 */
export async function onRequestGet(context) {
  const { env } = context;
  const pageId = context.params.pageId;
  
  try {
    // 获取点赞数
    const likesData = await env.birthday_kv.get(`likes:${pageId}`);
    const likes = likesData ? parseInt(likesData) : 0;
    
    return new Response(JSON.stringify({
      success: true,
      likes
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
