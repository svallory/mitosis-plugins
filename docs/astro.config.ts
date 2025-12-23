import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightLinksValidator from 'starlight-links-validator';
// import starlightPackageManagers from 'starlight-package-managers'; // Still has compatibility issues
import react from '@astrojs/react';
import { remarkBaseUrl } from './src/plugins/remark-base-url.ts';
import theme from 'mitosis-plugins-theme';

const base = '/mitosis-plugins';

// https://astro.build/config
export default defineConfig({
	site: 'https://svallory.github.io',
	base,
	prefetch: true,
	devToolbar: {
		enabled: true
	},
	markdown: {
		remarkPlugins: [[remarkBaseUrl, { base }]],
	},
	vite: {
		ssr: {
			noExternal: ['@astrojs/starlight', 'mitosis-plugins-theme', 'starlight-theme-opendocs'],
		},
	},
	integrations: [
		react(),
		starlight({
			credits: true,

			title: 'Mitosis Plugins',
			description: 'Documentation for mitosis-plugins - Enhance cross-framework component development with Mitosis',
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				replacesTitle: true,
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/svallory/mitosis-plugins' },
			],
			plugins: [
				starlightLlmsTxt(),
				starlightLinksValidator(),
				theme(),
				// starlightPackageManagers(), // Still has compatibility issues
			],
			sidebar: [
				{
					label: 'Guides',
					items: [
						{ label: 'Overview', slug: 'guides/overview' },
						{ label: 'Getting Started', slug: 'guides/getting-started' },
					],
				},
				{
					label: 'Plugins',
					autogenerate: { directory: 'plugins' },
				},
				{
					label: 'Community',
					items: [
						{ label: 'Contributing', slug: 'guides/contributing' },
						{ label: 'Code of Conduct', slug: 'community/code-of-conduct' },
						{ label: 'Support the Project', slug: 'community/sponsor' },
					],
				},
			],
		}),
	],
});
