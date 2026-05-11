/**
 * EdgeOne Cloud Functions 本地测试脚本
 * 使用内存 Map 模拟 KV 存储，模拟 EdgeOne 运行时环境
 * 测试 birthday-wishes 项目的所有 9 个 API 接口
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ========== 模拟 EdgeOne KV 存储 ==========
class MockKV {
  constructor() {
    this._store = new Map();
  }

  async get(key) {
    return this._store.get(key) || null;
  }

  async put(key, value) {
    this._store.set(key, value);
  }

  async delete(key) {
    this._store.delete(key);
  }

  async list(options = {}) {
    const { prefix = '', limit = 256, cursor } = options;
    const keys = [];
    let started = !cursor;

    for (const key of this._store.keys()) {
      if (prefix && !key.startsWith(prefix)) continue;
      if (!started) {
        if (key === cursor) started = true;
        continue;
      }
      keys.push(key);
      if (keys.length >= limit) break;
    }

    const allKeys = [...this._store.keys()].filter(k => !prefix || k.startsWith(prefix));
    return {
      complete: keys.length >= allKeys.length || keys.length < limit,
      cursor: keys.length < allKeys.length ? keys[keys.length - 1] : null,
      keys: keys.map(k => ({ key: k }))
    };
  }

  // 调试用：打印所有数据
  dump() {
    console.log('\n=== KV Store Contents ===');
    for (const [key, value] of this._store) {
      const display = value.length > 100 ? value.substring(0, 100) + '...' : value;
      console.log(`  ${key}: ${display}`);
    }
    console.log(`  Total: ${this._store.size} keys`);
    console.log('=========================\n');
  }
}

// ========== 模拟全局 birthday_kv ==========
globalThis.birthday_kv = new MockKV();

// ========== 测试工具函数 ==========
const __dirname = dirname(fileURLToPath(import.meta.url));
const FUNCTIONS_DIR = join(__dirname, 'cloud-functions', 'api');

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName, detail = '') {
  if (condition) {
    passed++;
    results.push({ name: testName, status: 'PASS', detail });
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    results.push({ name: testName, status: 'FAIL', detail });
    console.log(`  ✗ ${testName}${detail ? ' — ' + detail : ''}`);
  }
}

async function makeRequest(exportedFn, method, url, body = null, headers = {}, params = {}) {
  const init = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers }
  };
  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }
  const request = new Request(url, init);
  const context = { request, env: {}, params };
  const response = await exportedFn(context);
  const data = await response.json();
  return { status: response.status, data };
}

// ========== 加载所有函数模块 ==========
async function loadFunction(subPath) {
  const filePath = join(FUNCTIONS_DIR, subPath);
  const module = await import('file://' + filePath.replace(/\\/g, '/'));
  // 找到导出的 onRequest* 函数
  const handlerName = Object.keys(module).find(k => k.startsWith('onRequest'));
  return module[handlerName];
}

// ========== 主测试流程 ==========
async function runTests() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Birthday-Wishes Cloud Functions 本地测试            ║');
  console.log('║  模拟 EdgeOne KV 运行时环境                          ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  let token = '';
  let testPageId = '';

  // ===== 1. 注册接口测试 =====
  console.log('━━━ 1. POST /api/auth/register ━━━');
  const registerFn = await loadFunction('auth/register.js');

  // 1.1 正常注册
  {
    const { status, data } = await makeRequest(
      registerFn, 'POST', 'http://localhost/api/auth/register',
      { username: 'testuser', password: 'test123456' }
    );
    assert(status === 200, '正常注册返回 200');
    assert(data.success === true, '注册成功 success=true');
    assert(data.token, '返回 token');
    assert(data.username === 'testuser', '返回正确的 username');
    if (data.token) token = data.token;
  }

  // 1.2 重复注册
  {
    const { status, data } = await makeRequest(
      registerFn, 'POST', 'http://localhost/api/auth/register',
      { username: 'testuser', password: 'test123456' }
    );
    assert(status === 409, '重复注册返回 409');
    assert(data.success === false, '重复注册 success=false');
  }

  // 1.3 密码太短
  {
    const { status, data } = await makeRequest(
      registerFn, 'POST', 'http://localhost/api/auth/register',
      { username: 'shortpwd', password: '123' }
    );
    assert(status === 400, '密码太短返回 400');
    assert(data.message.includes('6'), '提示密码至少6位');
  }

  // 1.4 缺少参数
  {
    const { status, data } = await makeRequest(
      registerFn, 'POST', 'http://localhost/api/auth/register',
      { username: '' }
    );
    assert(status === 400, '缺少参数返回 400');
  }

  // ===== 2. 登录接口测试 =====
  console.log('\n━━━ 2. POST /api/auth/login ━━━');
  const loginFn = await loadFunction('auth/login.js');

  // 2.1 正常登录
  {
    const { status, data } = await makeRequest(
      loginFn, 'POST', 'http://localhost/api/auth/login',
      { username: 'testuser', password: 'test123456' }
    );
    assert(status === 200, '正常登录返回 200');
    assert(data.success === true, '登录成功 success=true');
    assert(data.token, '登录返回 token');
    if (data.token) token = data.token;
  }

  // 2.2 密码错误
  {
    const { status, data } = await makeRequest(
      loginFn, 'POST', 'http://localhost/api/auth/login',
      { username: 'testuser', password: 'wrongpassword' }
    );
    assert(status === 401, '密码错误返回 401');
  }

  // 2.3 用户不存在
  {
    const { status, data } = await makeRequest(
      loginFn, 'POST', 'http://localhost/api/auth/login',
      { username: 'nonexistent', password: 'test123456' }
    );
    assert(status === 401, '用户不存在返回 401');
  }

  // ===== 3. 创建页面接口测试 =====
  console.log('\n━━━ 3. POST /api/pages/create ━━━');
  const createFn = await loadFunction('pages/create.js');

  // 3.1 未授权
  {
    const { status, data } = await makeRequest(
      createFn, 'POST', 'http://localhost/api/pages/create',
      { title: 'Test Page', message: 'Hello!' }
    );
    assert(status === 401, '未授权创建返回 401');
  }

  // 3.2 正常创建
  {
    const { status, data } = await makeRequest(
      createFn, 'POST', 'http://localhost/api/pages/create',
      { title: '生日快乐', message: '祝你生日快乐！', theme: 'classic', senderName: '小明' },
      { Authorization: `Bearer ${token}` }
    );
    assert(status === 200, '创建页面返回 200');
    assert(data.success === true, '创建成功 success=true');
    assert(data.pageId, '返回 pageId');
    if (data.pageId) testPageId = data.pageId;
  }

  // 3.3 缺少必填字段
  {
    const { status, data } = await makeRequest(
      createFn, 'POST', 'http://localhost/api/pages/create',
      { title: '' },
      { Authorization: `Bearer ${token}` }
    );
    assert(status === 400, '缺少必填字段返回 400');
  }

  // ===== 4. 获取页面列表接口测试 =====
  console.log('\n━━━ 4. GET /api/pages/list ━━━');
  const listFn = await loadFunction('pages/list.js');

  // 4.1 正常获取列表
  {
    const { status, data } = await makeRequest(
      listFn, 'GET', 'http://localhost/api/pages/list?username=testuser'
    );
    assert(status === 200, '获取列表返回 200');
    assert(data.success === true, '获取列表 success=true');
    assert(Array.isArray(data.pages), '返回数组 pages');
    assert(data.pages.length >= 1, `列表包含 ${data.pages.length} 个页面`);
    if (data.pages.length > 0) {
      assert(data.pages[0].title === '生日快乐', '页面标题正确');
    }
  }

  // 4.2 用户不存在
  {
    const { status, data } = await makeRequest(
      listFn, 'GET', 'http://localhost/api/pages/list?username=nouser'
    );
    assert(status === 404, '用户不存在返回 404');
  }

  // 4.3 缺少参数
  {
    const { status, data } = await makeRequest(
      listFn, 'GET', 'http://localhost/api/pages/list'
    );
    assert(status === 400, '缺少用户名返回 400');
  }

  // ===== 5. 获取页面详情接口测试 =====
  console.log('\n━━━ 5. GET /api/pages/get/[id] ━━━');
  const getFn = await loadFunction('pages/get/[id].js');

  if (testPageId) {
    // 5.1 正常获取
    {
    const { status, data } = await makeRequest(
      getFn, 'GET', `http://localhost/api/pages/get/${testPageId}`,
      null, {}, { id: testPageId }
    );
    assert(status === 200, '获取页面详情返回 200');
    assert(data.success === true, '获取详情 success=true');
    assert(data.page, '返回 page 对象');
    if (data.page) {
      assert(data.page.title === '生日快乐', '详情标题正确');
      assert(data.page.message === '祝你生日快乐！', '详情内容正确');
      assert(data.page.views >= 1, `浏览次数 >= 1 (实际: ${data.page.views})`);
    }
  }

  // 5.2 页面不存在
  {
    const { status, data } = await makeRequest(
      getFn, 'GET', 'http://localhost/api/pages/get/nonexistent_page',
      null, {}, { id: 'nonexistent_page' }
    );
      assert(status === 404, '页面不存在返回 404');
    }
  } else {
    assert(false, '跳过详情测试 — 无可用 pageId');
  }

  // ===== 6. 更新页面接口测试 =====
  console.log('\n━━━ 6. PUT /api/pages/update/[id] ━━━');
  const updateFn = await loadFunction('pages/update/[id].js');

  if (testPageId) {
    // 6.1 正常更新
    {
      const { status, data } = await makeRequest(
        updateFn, 'PUT', `http://localhost/api/pages/update/${testPageId}`,
        { title: '生日快乐（更新）', theme: 'ocean' },
        { Authorization: `Bearer ${token}` },
        { id: testPageId }
      );
      assert(status === 200, '更新页面返回 200');
      assert(data.success === true, '更新成功 success=true');
    }

    // 6.2 验证更新结果
    {
      const { data } = await makeRequest(
        getFn, 'GET', `http://localhost/api/pages/get/${testPageId}`,
        null, {}, { id: testPageId }
      );
      assert(data.page.title === '生日快乐（更新）', '标题已更新');
      assert(data.page.theme === 'ocean', '主题已更新');
    }

    // 6.3 未授权更新
    {
      const { status } = await makeRequest(
        updateFn, 'PUT', `http://localhost/api/pages/update/${testPageId}`,
        { title: 'Hack' }, {}, { id: testPageId }
      );
      assert(status === 401, '未授权更新返回 401');
    }
  } else {
    assert(false, '跳过更新测试 — 无可用 pageId');
  }

  // ===== 7. 点赞接口测试 =====
  console.log('\n━━━ 7. POST /api/likes/add ━━━');
  const addLikeFn = await loadFunction('likes/add.js');

  if (testPageId) {
    // 7.1 正常点赞
    {
      const { status, data } = await makeRequest(
        addLikeFn, 'POST', 'http://localhost/api/likes/add',
        { pageId: testPageId, userIdentifier: 'visitor_1' }
      );
      assert(status === 200, '点赞返回 200');
      assert(data.success === true, '点赞成功 success=true');
      assert(data.likes === 1, `点赞数为 1 (实际: ${data.likes})`);
    }

    // 7.2 重复点赞
    {
      const { status, data } = await makeRequest(
        addLikeFn, 'POST', 'http://localhost/api/likes/add',
        { pageId: testPageId, userIdentifier: 'visitor_1' }
      );
      assert(status === 409, '重复点赞返回 409');
    }

    // 7.3 不同用户点赞
    {
      const { status, data } = await makeRequest(
        addLikeFn, 'POST', 'http://localhost/api/likes/add',
        { pageId: testPageId, userIdentifier: 'visitor_2' }
      );
      assert(status === 200, '不同用户点赞返回 200');
      assert(data.likes === 2, `点赞数为 2 (实际: ${data.likes})`);
    }

    // 7.4 页面不存在
    {
      const { status } = await makeRequest(
        addLikeFn, 'POST', 'http://localhost/api/likes/add',
        { pageId: 'nonexistent' }
      );
      assert(status === 404, '页面不存在返回 404');
    }
  } else {
    assert(false, '跳过点赞测试 — 无可用 pageId');
  }

  // ===== 8. 获取点赞数接口测试 =====
  console.log('\n━━━ 8. GET /api/likes/get/[pageId] ━━━');
  const getLikesFn = await loadFunction('likes/get/[pageId].js');

  if (testPageId) {
    {
      const { status, data } = await makeRequest(
        getLikesFn, 'GET', `http://localhost/api/likes/get/${testPageId}`,
        null, {}, { pageId: testPageId }
      );
      assert(status === 200, '获取点赞数返回 200');
      assert(data.success === true, '获取点赞数 success=true');
      assert(data.likes === 2, `点赞数正确为 2 (实际: ${data.likes})`);
    }

    // 不存在的页面
    {
      const { status, data } = await makeRequest(
        getLikesFn, 'GET', 'http://localhost/api/likes/get/nonexistent',
        null, {}, { pageId: 'nonexistent' }
      );
      assert(status === 200, '不存在页面点赞数返回 200');
      assert(data.likes === 0, '不存在页面点赞数为 0');
    }
  } else {
    assert(false, '跳过获取点赞测试 — 无可用 pageId');
  }

  // ===== 9. 删除页面接口测试 =====
  console.log('\n━━━ 9. DELETE /api/pages/delete/[id] ━━━');
  const deleteFn = await loadFunction('pages/delete/[id].js');

  if (testPageId) {
    // 9.1 未授权删除
    {
      const { status } = await makeRequest(
        deleteFn, 'DELETE', `http://localhost/api/pages/delete/${testPageId}`,
        null, {}, { id: testPageId }
      );
      assert(status === 401, '未授权删除返回 401');
    }

    // 9.2 正常删除
    {
      const { status, data } = await makeRequest(
        deleteFn, 'DELETE', `http://localhost/api/pages/delete/${testPageId}`,
        null, { Authorization: `Bearer ${token}` }, { id: testPageId }
      );
      assert(status === 200, '删除页面返回 200');
      assert(data.success === true, '删除成功 success=true');
    }

    // 9.3 验证已删除
    {
      const { status } = await makeRequest(
        getFn, 'GET', `http://localhost/api/pages/get/${testPageId}`,
        null, {}, { id: testPageId }
      );
      assert(status === 404, '删除后获取返回 404');
    }

    // 9.4 验证用户列表已更新
    {
      const { data } = await makeRequest(
        listFn, 'GET', 'http://localhost/api/pages/list?username=testuser'
      );
      assert(data.pages.length === 0, `用户页面列表已清空 (实际: ${data.pages.length})`);
    }
  } else {
    assert(false, '跳过删除测试 — 无可用 pageId');
  }

  // ========== 打印 KV 存储状态 ==========
  globalThis.birthday_kv.dump();

  // ========== 汇总结果 ==========
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  测试结果汇总                                        ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  总计: ${passed + failed}  通过: ${passed}  失败: ${failed}`);
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (failed > 0) {
    console.log('失败的测试:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ✗ ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('测试运行出错:', err);
  process.exit(2);
});
