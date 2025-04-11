import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/account',
    component: Layout,
    redirect: '/account/chatgpt',
    name: 'Account',
    meta: {
      title: {
        zh_CN: 'Account Management',
        en_US: 'Account Management',
      },
      icon: 'user-circle',
      orderNo: 0,
    },
    children: [
      {
        path: '/invite',
        name: 'Invite',
        component: () => import('@/pages/account/invite.vue'),
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/pages/account/user.vue'),
        meta: {
          title: {
            zh_CN: 'User',
            en_US: 'User',
          },
        },
      },
      {
        path: 'chatgpt',
        name: 'ChatGPT',
        component: () => import('@/pages/account/chatgpt.vue'),
        meta: {
          title: {
            zh_CN: 'ChatGPT',
            en_US: 'ChatGPT',
          },
        },
      },

      {
        path: 'gptcar',
        name: 'GPTCar',
        component: () => import('@/pages/account/gptcar.vue'),
        meta: {
          title: {
            zh_CN: 'gpt pool',
            en_US: 'gpt pool',
          },
        },
      },
    ],
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/login-log',
    name: 'System',
    meta: {
      title: {
        zh_CN: 'System Management',
        en_US: 'System Management',
      },
      icon: 'brightness',
      orderNo: 1,
    },
    children: [
      {
        path: 'login-log',
        name: 'LoginLog',
        component: () => import('@/pages/system/loginlog.vue'),
        meta: {
          title: {
            zh_CN: 'Login Log',
            en_US: 'Login Log',
          },
        },
      },
    ],
  },
];
