<template>
  <t-table
    :data="tableChatgptDetailsData"
    :columns="columnsChatgptDetails"
    row-key="chatgpt_username"
    :loading="tableLoading"
    bordered
    hover
  >
    <template #auth_status="{ row }">
      <t-tag v-if="row.auth_status === false" theme="danger" variant="light"> Expired </t-tag>
      <t-tag v-if="row.auth_status === true" theme="success" variant="light"> Running </t-tag>
    </template>

    <template #op="slotProps">
      <t-link theme="primary" @click="handleCopyUrl(slotProps.row.mirror_token)"> copy</t-link>
    </template>
  </t-table>
</template>

<script setup lang="ts">
import { MessagePlugin, TableProps } from 'tdesign-vue-next';
import { ref } from 'vue';

import RequestApi from '@/api/request';

interface TableChatgptDetailsData {
  mirror_token: string;
  chatgpt_username: string;
  plan_type: string;
}

const tableLoading = ref(false);
const tableChatgptDetailsData = ref<TableChatgptDetailsData[]>([]);

const columnsChatgptDetails: TableProps['columns'] = [
  { colKey: 'chatgpt_username', title: 'ChatGPT', width: 80 },
  { colKey: 'plan_type', title: 'plan_type', width: 30 },
  { colKey: 'auth_status', title: 'auth_status', width: 30 },
  { colKey: 'mirror_token', title: 'Mirror Token (Used for API, The token will not change)', width: 100 },
  { colKey: 'op', title: 'No Login Link', width: 30 },
];

const getChatGPTDetails = async (user: any) => {
  tableLoading.value = true;
  const GptDetailsUri = `/0x/user/get-mirror-token?user_id=${user.id}`;
  const response = await RequestApi(GptDetailsUri);
  const data = await response.json();
  tableChatgptDetailsData.value = data;
  tableLoading.value = false;
  console.log(data);
};

const handleCopyUrl = (mirrorToken: string) => {
  const notLoginUrl = `${window.location.origin}/api/not-login?user_gateway_token=${mirrorToken}`;
  navigator.clipboard.writeText(notLoginUrl);
  MessagePlugin.success('Copy Success');
};

defineExpose({
  getChatGPTDetails,
});
</script>
