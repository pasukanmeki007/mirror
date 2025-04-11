<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="showDialog = true">type</t-button>

          <p v-if="!!selectedRowKeys.length" class="selected-count">
            {{ $t('pages.listBase.select') }} {{ selectedRowKeys.length }} {{ $t('pages.listBase.items') }}
          </p>
        </div>
      </t-row>
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="chatgpt_username"
        :loading="tableLoading"
        :selected-row-keys="selectedRowKeys"
        bordered
        hover
        :pagination="pagination"
        @select-change="onSelectChange"
        @page-change="rehandlePageChange"
      >
        <template #auth_status="{ row }">
          <t-tag v-if="row.auth_status === false" theme="danger" variant="light"> expired </t-tag>
          <t-tag v-if="row.auth_status === true" theme="success" variant="light"> running </t-tag>
        </template>

        <!--
        <template #use_count="{ row }">
          <t-space>
            <div v-for="(v, k) in row.use_count" :key="k">
              <t-tag v-if="k.toString().includes('h')">
                <t-space>
                  <span style="color: #0052c1">{{ k.toString().substring(5, 7) }}:</span>
                  <span>{{ v }}</span>
                </t-space>
              </t-tag>
            </div>
          </t-space>
        </template>
        -->

        <template #expires_at="{ row }">
          {{ TimestampToDate(row.expires_at) }}
        </template>

        <template #updated_at="{ row }">
          {{ TimestampToDate(row.updated_at) }}
        </template>

        <template #access_token_exp="{ row }">
          {{ TimestampToDate(row.access_token_exp * 1000) }}
        </template>

        <template #created_time="{ row }">
          {{ TimestampToDate(row.created_time * 1000) }}
        </template>

        <template #op="slotProps">
          <t-space>
            <!-- <t-link theme="primary" @click="handleUpdate(slotProps.row)">update</t-link> -->
            <t-link theme="primary" @click="handleEdit(slotProps.row)">edit</t-link>

            <t-link theme="danger" @click="handleClickDelete(slotProps.row)">removing</t-link>
          </t-space>
        </template>
      </t-table>

      <!-- 录入 Token dialog -->
      <t-dialog v-model:visible="showDialog" header="input ChatGPT Token" width="50%" :on-confirm="handleAdd">
        <t-form v-loading="loading" :data="newChat" :label-width="0">
          <t-form-item label="Token">
            <div style="display: flex; flex-direction: column; width: 100%">
              <t-textarea
                v-model="newChat.chatgpt_token"
                :autosize="{ minRows: 5, maxRows: 5 }"
                autofocus
                size="large"
                placeholder="Please enter Access Token or Session Token or Refresh Token. one line for one token, more than one token on a different line.。"
              ></t-textarea>
              <span style="font-size: 12px; color: #888">
                <t-link target="_blank" theme="primary" size="small" href="https://chatgpt.com/api/auth/session">
                  Access Token</t-link
                >：Valid for 10 days
              </span>
              <span style="font-size: 12px; color: #888">
                <t-link target="_blank" theme="primary" size="small" :href="ChatgptTokenTutorialUrl"
                  >Session Token</t-link
                >：Valid for 30 days
                <!-- or
                <t-link target="_blank" theme="primary" size="small" :href="ChatgptTokenAuthUrl">Automatic acquisition</t-link> -->
              </span>
              <span style="font-size: 12px; color: #888"> Refresh Token：Validity period is permanent </span>
            </div>
          </t-form-item>
        </t-form>
      </t-dialog>

      <!-- 编辑 备注信息 -->
      <t-dialog v-model:visible="dialogVisibleEdit" header="Edit information" width="50%" :on-confirm="handleEditConfirm">
        <t-form v-loading="loading" :data="editChatInfo" :label-width="120">
          <t-form-item label="Remarks">
            <t-input v-model="editChatInfo.remark" size="large" placeholder="Remarks"></t-input>
          </t-form-item>
        </t-form>
      </t-dialog>

      <!-- 确认删除 dialog -->
      <t-dialog
        v-model:visible="dialogVisibleDelete"
        header="Confirm to delete the ChatGPT token ?"
        width="600"
        :on-confirm="handleDelete"
      >
      </t-dialog>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { MessagePlugin, TableProps } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import RequestApi from '@/api/request';
import { ChatgptTokenTutorialUrl } from '@/constants/index';
import { TimestampToDate } from '@/utils/date';

interface TableData {
  username: string;
  status: number;
  plan_type: string;
  // expires_at: number;
  updated_at: number;
  access_token_exp: number;
}
const selectedRowKeys = ref<TableProps['selectedRowKeys']>([]);
const loading = ref(false);
const tableLoading = ref(false);
const tableData = ref<TableData[]>([]);

const pagination = {
  defaultPageSize: 20,
  total: 0,
  defaultCurrent: 1,
};

const rehandlePageChange = (curr: any) => {
  pagination.defaultCurrent = curr.current;
  pagination.defaultPageSize = curr.pageSize;
  getChatGPTList();
};

const columns: TableProps['columns'] = [
  { colKey: 'row-select', type: 'multiple' },
  { colKey: 'id', title: 'ID', width: 50 },
  { colKey: 'chatgpt_username', title: 'chatgpt_username', width: 220, fixed: 'left' },
  { colKey: 'auth_status', title: 'auth_status', width: 100, fixed: 'left' },
  { colKey: 'plan_type', title: 'plan_type', width: 100 },
  // { colKey: 'use_count', title: 'use_count', width: 350 },
  { colKey: 'access_token_exp', title: 'access_token_exp', width: 200 },
  { colKey: 'created_time', title: '创建时间', width: 200 },
  // { colKey: 'updated_at', title: 'updated_at', width: 200 },
  { colKey: 'remark', title: 'remark' },
  { width: 200, colKey: 'op', title: 'operating' },
];
const showDialog = ref(false);
const dialogVisibleDelete = ref(false);
const usernameDelete = ref('');
const dialogVisibleEdit = ref(false);

const newChat = ref({ chatgpt_token: '', remark: '' });
const editChatInfo = ref({ remark: '', chatgpt_username: '' });

const ChatgptTokenUrl = '/0x/chatgpt/';

onMounted(async () => {
  await getChatGPTList();
});

const getChatGPTList = async () => {
  // 发送请求获取 Token 列表
  tableLoading.value = true;
  const params: any = {
    page: pagination.defaultCurrent,
    page_size: pagination.defaultPageSize,
  };

  const queryString = new URLSearchParams(params).toString();
  const response = await RequestApi(`${ChatgptTokenUrl}?${queryString}`);

  const data = await response.json();
  // console.log('results', data.results);
  tableData.value = data.results;
  pagination.total = data.count;

  tableLoading.value = false;
};

const addChatToken = async () => {
  // 发送请求添加 Token
  loading.value = true;

  const response = await RequestApi(ChatgptTokenUrl, 'POST', {
    chatgpt_token_list: newChat.value.chatgpt_token.split('\n'),
  });

  const data = await response.json();
  loading.value = false;

  if (response.status !== 200) {
    MessagePlugin.error(JSON.stringify(Object.values(data)[0]));

    // if (data.message.includes('status: 403')) {
    //   window.location.href = '/';
    // }
  } else {
    showDialog.value = false;
    await getChatGPTList();
    newChat.value.chatgpt_token = '';
    MessagePlugin.success('Added successfully');
  }
};

const handleEdit = (row: any) => {
  console.log('row', row.remark);
  editChatInfo.value = { ...row };

  dialogVisibleEdit.value = true;
};

const handleClickDelete = (row: any) => {
  usernameDelete.value = row.chatgpt_username;
  dialogVisibleDelete.value = true;
};

const handleDelete = async () => {
  const response = await RequestApi(ChatgptTokenUrl, 'DELETE', { chatgpt_username: usernameDelete.value });

  const data = await response.json();
  dialogVisibleDelete.value = false;
  usernameDelete.value = '';

  if (response.status !== 200) {
    MessagePlugin.error(JSON.stringify(Object.values(data)[0]));
  } else {
    await getChatGPTList();
    MessagePlugin.success('Deleted successfully');
  }
};

const handleAdd = () => {
  if (newChat.value.chatgpt_token.trim() === '') {
    MessagePlugin.error('Token Cannot be empty');
  } else {
    addChatToken();
  }
};

const onSelectChange: TableProps['onSelectChange'] = (value, _) => {
  selectedRowKeys.value = value;
  // console.log(value, ctx);
};

const handleEditConfirm = async () => {
  await RequestApi(ChatgptTokenUrl, 'PUT', {
    remark: editChatInfo.value.remark,
    chatgpt_username: editChatInfo.value.chatgpt_username,
  });
  await getChatGPTList();
  MessagePlugin.success('Modification successful');
  dialogVisibleEdit.value = false;
};
</script>

<style lang="less" scoped>
.left-operation-container {
  padding: 6px 0;
  margin-bottom: 16px;

  .selected-count {
    display: inline-block;
    margin-left: 8px;
    color: var(--td-text-color-secondary);
  }
}
</style>
