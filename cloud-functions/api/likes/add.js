/**
 * 点赞功能 API
 * POST /api/likes/add
 */
export async function onRequestPost(context) {
  console.log('=== Add Like API Start ===');
  
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
    
    console.log('Adding like for page:', pageId);
    
    // 检查页面是否存在
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
    
    // 检查是否已点赞（通过 userIdentifier 防止重复点赞）
    if (userIdentifier) {
      const likeKey = `like:${pageId}:${userIdentifier}`;
      const existingLike = await kv.get(likeKey);
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
      await kv.put(likeKey, 'true');
    }
    
    // 增加点赞数
    const likesData = await kv.get(`likes:${pageId}`);
    const likes = likesData ? parseInt(likesData) + 1 : 1;
    await kv.put(`likes:${pageId}`, likes.toString());
    
    // 更新页面数据
    const page = JSON.parse(pageData);
    page.likes = likes;
    await kv.put(`page:${pageId}`, JSON.stringify(page));
    
    console.log('=== Add Like API Success ===');
    
    return new Response(JSON.stringify({
      success: true,
      message: '点赞成功',
      likes
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== Add Like API Error ===');
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
