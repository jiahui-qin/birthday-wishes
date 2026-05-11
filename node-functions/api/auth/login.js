/**
 * 最简单的测试函数
 */
export function onRequestPost(context) {
    var body = JSON.stringify({success: true});
    var options = {
        headers: {'Content-Type': 'application/json'}
    };
    return new Response(body, options);
}
