/**
 * 点赞功能 API
 * POST /api/likes/add
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { pageId, userIdentifier } = body;
    
    if (!pageId) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少页面ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 检查页面是否存在
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
    
    // 检查是否已点赞（通过 userIdentifier 防止重复点赞）
    if (userIdentifier) {
      const likeKey = `like:${pageId}:${userIdentifier}`;
      const existingLike = await env.birthday_kv.get(likeKey);
      if (existingLike) {
        return new Response(JSON.stringify({
          success: false,
          message: '您已经点赞过了'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      // 记录点赞
      await env.birthday_kv.put(likeKey, 'true');
    }
    
    // 增加点赞数
    const likesData = await env.birthday_kv.get(`likes:${pageId}`);
    const likes = likesData ? parseInt(likesData) + 1 : 1;
    await env.birthday_kv.put(`likes:${pageId}`, likes.toString());
    
    // 更新页面数据
    const page = JSON.parse(pageData);
    page.likes = likes;
    await env.birthday_kv.put(`page:${pageId}`, JSON.stringify(page));
    
    return new Response(JSON.stringify({
      success: true,
      message: '点赞成功',
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
