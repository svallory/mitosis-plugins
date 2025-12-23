import type { StarlightPlugin } from '@astrojs/starlight/types'

import { overrideComponents } from './libs/starlight'

export default function starlightThemeOpenDocsPlugin(): StarlightPlugin {
  return {
    name: 'starlight-theme-opendocs',
    hooks: {
      'config:setup'({ config, logger, updateConfig }) {
        // Add Google Fonts preconnect and stylesheet links
        const head = config.head || []
        head.push(
          // Preconnect to Google Fonts for better performance
          {
            tag: 'link',
            attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          },
          {
            tag: 'link',
            attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
          },
          // Load Google Fonts: Bricolage Grotesque, Inter, Martian Mono
          {
            tag: 'link',
            attrs: {
              rel: 'stylesheet',
              href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&family=Martian+Mono:wght@400;500;600;700&display=swap',
            },
          },
        )
        const userExpressiveCodeConfig =
          !config.expressiveCode || config.expressiveCode === true ? {} : config.expressiveCode

        updateConfig({
          head,
          components: overrideComponents(config, ['LanguageSelect', 'Pagination', 'ThemeSelect', 'Sidebar'], logger),
          customCss: [
            ...(config.customCss ?? []),
            'mitosis-plugins-theme/styles/layers',
            'mitosis-plugins-theme/styles/tokens',
            'mitosis-plugins-theme/styles/theme',
            'mitosis-plugins-theme/styles/base',
            ...(config.markdown?.headingLinks === false ? [] : ['mitosis-plugins-theme/styles/anchors']),
          ],
          expressiveCode:
            config.expressiveCode === false
              ? false
              : {
                themes: ['vitesse-dark', 'vitesse-light'],
                ...userExpressiveCodeConfig,
                styleOverrides: {
                  borderColor: 'var(--sl-rapide-ui-border-color)',
                  borderRadius: 'var(--od-radius-lg)',
                  ...userExpressiveCodeConfig.styleOverrides,
                  frames: {
                    editorActiveTabIndicatorTopColor: 'unset',
                    editorActiveTabIndicatorBottomColor: 'var(--sl-color-gray-3)',
                    editorTabBarBorderBottomColor: 'var(--sl-rapide-ui-border-color)',
                    frameBoxShadowCssValue: 'unset',
                    ...userExpressiveCodeConfig.styleOverrides?.frames,
                  },
                  textMarkers: {
                    backgroundOpacity: '40%',
                    markBackground: 'var(--sl-rapide-ec-marker-bg-color)',
                    markBorderColor: 'var(--sl-rapide-ec-marker-border-color)',
                    ...userExpressiveCodeConfig.styleOverrides?.textMarkers,
                  },
                },
              },
        })
      },
    },
  }
}
