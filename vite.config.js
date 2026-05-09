import { defineConfig } from 'vite';
import { resolve, relative } from 'path';
import { fileURLToPath, URL } from 'node:url';
import { readdirSync, statSync, cpSync, mkdirSync } from 'fs';

// 自定义插件：复制静态资源到构建目录
function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const srcCss = resolve(__dirname, 'css');
      const srcJs = resolve(__dirname, 'js');
      const destCss = resolve(__dirname, 'dist/css');
      const destJs = resolve(__dirname, 'dist/js');

      try {
        // 复制 css 文件夹
        cpSync(srcCss, destCss, { recursive: true });
        console.log('✓ 已复制 css/ 到 dist/');
      } catch (err) {
        console.warn('⚠ 复制 css/ 失败:', err.message);
      }

      try {
        // 复制 js 文件夹
        cpSync(srcJs, destJs, { recursive: true });
        console.log('✓ 已复制 js/ 到 dist/');
      } catch (err) {
        console.warn('⚠ 复制 js/ 失败:', err.message);
      }
    },
  };
}

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
      },
    },
  },
  plugins: [copyStaticAssets()],
});
