import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Form Builder',
  description: 'Documentation for the Form Builder platform',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Renderer API', link: '/renderer/overview' },
      { text: 'Kitchensink', link: '/kitchensink' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/guide/getting-started' },
            { text: 'Docker Setup', link: '/guide/docker' },
            { text: 'Makefile Commands', link: '/guide/makefile' },
            { text: 'Environment Variables', link: '/guide/env' }
          ]
        }
      ],
      '/renderer/': [
        {
          text: 'Renderer',
          items: [
            { text: 'Overview', link: '/renderer/overview' },
            { text: 'Embedding Guide', link: '/renderer/embedding' },
            { text: 'Events Reference', link: '/renderer/events' },
            { text: 'State API', link: '/renderer/state-api' },
            { text: 'Node Types', link: '/renderer/node-types' },
            { text: 'Validation', link: '/renderer/validation' },
            { text: 'Theming', link: '/renderer/theming' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ehmoratallar8990/formbuilder' }
    ]
  }
})
