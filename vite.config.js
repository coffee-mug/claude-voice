import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'@node-rs/argon2-wasm32-wasi': path.resolve('./src/lib/empty-module.js'),
			'@node-rs/argon2': path.resolve('./src/lib/empty-module.js'),
		}
	}
});
