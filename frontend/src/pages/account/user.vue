<!-- eslint-disable camelcase -->
<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <!-- <t-button @click="$router.push('/login')">access</t-button> -->
          <t-button @click="handleShowDialog()">Added</t-button>
          <t-button
            variant="base"
            :loading="loading"
            theme="default"
            :disabled="!selectedRowKeys.length"
            @click="BatcModelLimit"
          >
            limit</t-button
          >
          <p v-if="!!selectedRowKeys.length" class="selected-count">
            {{ $t('pages.listBase.select') }} {{ selectedRowKeys.length }} {{ $t('pages.listBase.items') }}
          </p>
        </div>
      </t-row>
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="id"
        :loading="tableLoading"
        bordered
        hover
        :pagination="pagination"
        @page-change="rehandlePageChange"
        @select-change="onSelectChange"
      >
        <template #is_active="{ row }">
          <t-switch :value="row.is_active" :custom-value="[true, false]">
            <!-- <template #label="slotProps">{{ slotProps.value == 1 ? 'Enable' : 'Deactivate' }} </template> -->
          </t-switch>
        </template>

        <template #title-username>
          <div><user-circle-icon style="margin-right: 8px" />user</div>
        </template>

        <template #last_login="{ row }">
          {{ row.last_login }}
        </template>

        <template #chatgpt_count="{ row }">
          <t-link theme="primary" @click="getChatGPTDetails(row)">Bound: {{ row.chatgpt_count }} 个</t-link>
        </template>

        <template #isolated_session="{ row }">
          <t-switch :value="row.isolated_session" :custom-value="[true, false]">
            <!--             @change="(value) => changeIsolatedSession(row, Number(value))" -->
            <template #label="slotProps">{{ slotProps.value == true ? 'yes' : 'no' }} </template>
          </t-switch>
        </template>

        <template #op="slotProps">
          <t-space>
            <t-link theme="primary" @click="handleEdit(slotProps.row)"> edit</t-link>
            <t-link theme="danger" @click="handleClickDelete(slotProps.row)"> delete</t-link>
          </t-space>
        </template>
      </t-table>

      <!-- chatgpt 账号 -->
      <t-dialog
        v-model:visible="showChatGPTDetailsDialog"
        title="ChatGPT Account Details"
        width="950px"
        :cancel-btn="null"
        :confirm-btn="null"
      >
        <user-chatgpt-details-component ref="userChatgptDetailsRef" />
      </t-dialog>

      <!-- 添加/编辑 用户 dialog -->
      <t-dialog v-model:visible="showDialog" :on-confirm="handleConfirm" title="Add User" width="800px">
        <t-form
          ref="addFormRef"
          v-loading="loading"
          :rules="rules"
          :data="newUser"
          :label-width="120"
          @submit="handleAdd"
        >
          <t-form-item label="status" name="is_active">
            <t-radio-group v-model="newUser.is_active" class="side-mode-radio">
              <t-radio-button key="true" :value="true" label="Enable" />
              <t-radio-button key="false" :value="false" label="Deactivate" />
            </t-radio-group>
          </t-form-item>

          <t-form-item label="username" name="username">
            <t-input v-model="newUser.username" :disabled="actionType == 'edit'" style="width: 240px"></t-input>
          </t-form-item>

          <t-form-item v-if="actionType == 'add'" label="password" name="password">
            <t-input v-model="newUser.password" style="width: 240px"></t-input>
          </t-form-item>

          <t-form-item label="Independent Session" name="isolated_session">
            <t-switch v-model="newUser.isolated_session" :custom-value="[true, false]" />
          </t-form-item>

          <t-form-item label="Expiration Date" name="expired_date">
            <t-date-picker
              v-model="newUser.expired_date"
              placeholder=""
              :disable-date="{
                before: dayjs().subtract(0, 'day').format(),
              }"
              clearable
              allow-input
            />
          </t-form-item>

          <t-form-item label="choose ChatGPT" name="gptcar_list">
            <t-space>
              <t-radio-group v-model="isGptcarListEmpty" class="side-mode-radio">
                <t-radio-button key="true" :value="true" label="All accounts" />
                <t-radio-button key="false" :value="false" label="Designated number pool" />
              </t-radio-group>

              <t-select
                v-if="!isGptcarListEmpty"
                v-model="newUser.gptcar_list"
                multiple
                placeholder="Select"
                filterable
                style="width: 240px"
              >
                <t-option v-for="item in gptCarList" :key="item.car_name" :label="item.car_name" :value="item.id" />
              </t-select>
            </t-space>
          </t-form-item>

          <t-form-item label="limit" name="model_limit">
            <t-space direction="vertical">
              <t-switch
                v-model="hasModelLimit"
                :custom-value="[true, false]"
                @change="(value) => onModelLimitChange(value as boolean)"
              />
              <div v-if="hasModelLimit">
                <t-space direction="vertical" :size="3">
                  <div v-for="(line, idx) in newUser.model_limit" :key="line">
                    <t-space :size="5" align="center">
                      <t-select v-model="line.model_name" filterable style="width: 120px">
                        <t-option
                          v-for="model in modelList"
                          :key="model.value"
                          :label="model.label"
                          :value="model.value"
                        />
                      </t-select>
                      <span>limit</span>
                      <t-input-adornment prepend="Every" append="minute">
                        <t-input-number v-model="line.every_minute" theme="normal" min="0" style="width: 70px" />
                      </t-input-adornment>
                      <span>send</span>
                      <t-input-adornment append="strip">
                        <t-input-number v-model="line.limit_count" theme="normal" min="0" style="width: 70px" />
                      </t-input-adornment>
                      <span>information</span>

                      <div>
                        <t-button
                          v-if="idx + 1 === newUser.model_limit.length"
                          shape="circle"
                          theme="primary"
                          style="margin-left: 10px"
                          @click="onAddModelLimit()"
                        >
                          <template #icon><add-icon /></template>
                        </t-button>

                        <t-button
                          v-else
                          shape="circle"
                          theme="danger"
                          style="margin-left: 10px"
                          @click="onDeleteModelLimit(idx)"
                        >
                          <template #icon><delete-icon /></template>
                        </t-button>
                      </div>
                    </t-space>
                  </div>
                </t-space>
              </div>
            </t-space>
          </t-form-item>

          <t-form-item label="Remark" name="remark">
            <t-textarea v-model="newUser.remark"></t-textarea>
          </t-form-item>
        </t-form>
      </t-dialog>

      <!--- 模型限制 dialog  -->
      <t-dialog
        v-model:visible="showModelLimitDialog"
        :on-confirm="handleBatchModelLimitConfirm"
        title="Batch Limit Model"
        width="800px"
      >
        <t-form
          ref="batchModelLimitUserFormRef"
          v-loading="loading"
          :data="batchModelLimitUser"
          :rules="rules"
          :label-width="120"
          @submit="handlebatchModelLimit"
        >
          <t-form-item label="limit" name="model_limit">
            <t-space direction="vertical">
              <t-switch
                v-model="hasModelLimit"
                :custom-value="[true, false]"
                @change="(value) => onModelLimitChange(value as boolean)"
              />
              <div v-if="hasModelLimit">
                <t-space direction="vertical" :size="3">
                  <div v-for="(line, idx) in batchModelLimitUser.model_limit" :key="line">
                    <t-space :size="5" align="center">
                      <t-select v-model="line.model_name" filterable style="width: 120px">
                        <t-option
                          v-for="model in modelList"
                          :key="model.value"
                          :label="model.label"
                          :value="model.value"
                        />
                      </t-select>
                      <span>limit</span>
                      <t-input-adornment prepend="Every" append="minute">
                        <t-input-number v-model="line.every_minute" theme="normal" min="0" style="width: 70px" />
                      </t-input-adornment>
                      <span>minute</span>
                      <t-input-adornment append="strip">
                        <t-input-number v-model="line.limit_count" theme="normal" min="0" style="width: 70px" />
                      </t-input-adornment>
                      <span>information</span>

                      <div>
                        <t-button
                          v-if="idx + 1 === batchModelLimitUser.model_limit.length"
                          shape="circle"
                          theme="primary"
                          style="margin-left: 10px"
                          @click="onAddModelLimit('batch')"
                        >
                          <template #icon><add-icon /></template>
                        </t-button>

                        <t-button
                          v-else
                          :disabled="batchModelLimitUser.username == 'free'"
                          shape="circle"
                          theme="danger"
                          style="margin-left: 10px"
                          @click="onDeleteModelLimit(idx, 'batch')"
                        >
                          <template #icon><delete-icon /></template>
                        </t-button>
                      </div>
                    </t-space>
                  </div>
                </t-space>
              </div>
            </t-space>
          </t-form-item>
        </t-form>
      </t-dialog>
      <!-- 确认删除 dialog -->
      <t-dialog v-model:visible="showDeleteDialog" header="Are you sure you want to delete this user?？" width="500" :on-confirm="handleDelete">
      </t-dialog>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { AddIcon, DeleteIcon, UserCircleIcon } from 'tdesign-icons-vue-next';
import { CustomValidator, FormProps, MessagePlugin, TableProps } from 'tdesign-vue-next';
import { ref } from 'vue';

import RequestApi from '@/api/request';

import UserChatgptDetailsComponent from './user_chatgpt.vue';

const userChatgptDetailsRef = ref<typeof UserChatgptDetailsComponent | null>(null);

interface TableData {
  token: string;
  user_info: string;
}

const isGptcarListEmpty = ref(true);
const hasModelLimit = ref(false);
const actionType = ref('add');
const loading = ref(false);
const tableLoading = ref(false);
const tableData = ref<TableData[]>([]);
const gptCarList = ref<any>([]);
const showDialog = ref(false);
const showModelLimitDialog = ref(false);
const showDeleteDialog = ref(false);
const usernameDelete = ref('');
const addFormRef = ref();
const batchModelLimitUserFormRef = ref();
const UserAccountUri = '/0x/user/';
const BatchModelLimitUri = '/0x/user/batch-model-limit';
const GptCarEnumUri = '/0x/chatgpt/car-enum';
const selectedRowKeys = ref<TableProps['selectedRowKeys']>([]);
const showChatGPTDetailsDialog = ref(false);

interface TokenUserForm {
  is_active: boolean;
  username: string;
  password?: string;
  chatgpt_username: string;
  isolated_session: boolean;
  remark: string;
  model_limit: any[];
  gptcar_list: any[];
  expired_date: any;
}

const pagination = {
  defaultPageSize: 20,
  total: 0,
  defaultCurrent: 1,
};

const rehandlePageChange = (curr: any) => {
  pagination.defaultCurrent = curr.current;
  pagination.defaultPageSize = curr.pageSize;
  getUserList();
};

const BatcModelLimit = async () => {
  showModelLimitDialog.value = true;
};
const onSelectChange: TableProps['onSelectChange'] = (value, _) => {
  selectedRowKeys.value = value;
  // console.log(value, _);
};

const columns: TableProps['columns'] = [
  { colKey: 'row-select', type: 'multiple', checkProps: ({ row }) => ({ disabled: row.username === 'free_account' }) },
  { colKey: 'is_active', title: 'status', width: 100 },
  { colKey: 'username', title: 'title-username', width: 200, fixed: 'left' },
  { colKey: 'isolated_session', title: 'isolated_session', width: 100 },
  { colKey: 'chatgpt_count', title: 'ChatGPT', width: 120 },
  { colKey: 'use_count', title: 'use_count', width: 100 },
  { colKey: 'last_login', title: 'last_login', width: 160 },
  { colKey: 'expired_date', title: 'expired_date', width: 160 },
  { colKey: 'date_joined', title: 'date_joined', width: 160 },
  { colKey: 'remark', title: 'remark', width: 200 },
  { width: 200, colKey: 'op', title: 'operating' },
];

const modelLimitValidator: CustomValidator = (val) => {
  for (const item of val) {
    if (!item.model_name) {
      return { result: false, message: 'Model cannot be empty', type: 'error' };
    }
    if (!item.every_minute || item.every_minute <= 0) {
      return { result: false, message: 'The per minute limit must be greater than 0', type: 'error' };
    }
    if (!item.limit_count || item.limit_count <= 0) {
      return { result: false, message: 'The number of sent messages must be greater than 0', type: 'error' };
    }
  }

  return { result: true, message: '', type: 'success' };
};

const rules: FormProps['rules'] = {
  // gptcar_list: [{ required: true, message: 'Please input gptcar_list', trigger: 'blur' }],
  model_limit: [{ validator: modelLimitValidator, trigger: 'change' }],
  is_active: [{ required: true, message: 'Please input is_active', trigger: 'blur' }],
  username: [
    { required: true, message: 'Please input username', trigger: 'blur' },
    { validator: (val) => val.length >= 4, message: 'At least 4 characters' },
  ],
  password: [{ required: true, message: 'Please input password', trigger: 'blur' }],
  isolated_session: [{ required: true, message: 'Please select isolated_session', trigger: 'blur' }],
};

const modelList = [
  { label: 'GPT-4', value: 'gpt-4' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o-mini', value: 'gpt-4o-mini' },
  { label: 'o1-mini', value: 'o1-mini' },
  { label: 'o1', value: 'o1' },
  { label: 'o1-pro', value: 'o1-pro' },

];

const defaultUser = {
  is_active: true,
  username: '',
  password: '',
  chatgpt_username: '',
  isolated_session: false,
  remark: '',
  model_limit: [] as any[],
  gptcar_list: [] as any[],
  expired_date: undefined as Date | undefined,
};

const batchModelLimitUser = ref(JSON.parse(JSON.stringify({ model_limit: defaultUser.model_limit })));

const newUser = ref<TokenUserForm>({ ...defaultUser });

const getGptCarEnum = async () => {
  // 发送请求获取 号池 列表
  const response = await RequestApi(GptCarEnumUri);
  const data = await response.json();
  gptCarList.value = data.data;
};

const onAddModelLimit = (atype = 'default') => {
  if (atype === 'default') {
    newUser.value.model_limit.push({});
  } else {
    batchModelLimitUser.value.model_limit.push({});
  }
};
const onDeleteModelLimit = (idx: number, atype: string = 'default') => {
  if (atype === 'default') {
    newUser.value.model_limit.splice(idx, 1);
  } else {
    batchModelLimitUser.value.model_limit.splice(idx, 1);
  }
};

const getUserList = async () => {
  // 发送请求获取 用户 列表
  tableLoading.value = true;

  const params: any = {
    page: pagination.defaultCurrent,
    page_size: pagination.defaultPageSize,
  };

  const queryString = new URLSearchParams(params).toString();
  const response = await RequestApi(`${UserAccountUri}?${queryString}`);

  const data = await response.json();
  tableData.value = data.results;
  pagination.total = data.count;
  tableLoading.value = false;
};

const handleConfirm = async () => {
  if (addFormRef.value) {
    addFormRef.value.submit();
  }
};

const handleBatchModelLimitConfirm = async () => {
  if (batchModelLimitUserFormRef.value) {
    batchModelLimitUserFormRef.value.submit();
  }
};

const addOrUpdateUser = async () => {
  // 发送请求 添加/编辑 用户

  loading.value = true;
  if (isGptcarListEmpty.value) {
    newUser.value.gptcar_list = [];
  }

  newUser.value.expired_date = newUser.value.expired_date || null;
  const response = await RequestApi(UserAccountUri, 'POST', newUser.value);

  const data = await response.json();
  loading.value = false;

  if (response.status !== 200) {
    MessagePlugin.error(JSON.stringify(Object.values(data)[0]));
  } else {
    await getUserList();
    newUser.value = defaultUser;
    showDialog.value = false;
    MessagePlugin.success('Added successfully');
  }
};

const batchUpdateUserModelLimit = async () => {
  //  批量更新 用户模型限制
  console.log(selectedRowKeys, batchModelLimitUser.value);
  loading.value = true;
  const response = await RequestApi(BatchModelLimitUri, 'POST', {
    model_limit: batchModelLimitUser.value.model_limit,
    user_id_list: selectedRowKeys.value,
  });

  const data = await response.json();
  loading.value = false;

  if (response.status !== 200) {
    MessagePlugin.error(JSON.stringify(Object.values(data)[0]));
  } else {
    await getUserList();
    batchModelLimitUser.value = JSON.parse(JSON.stringify({ model_limit: defaultUser.model_limit }));
    showModelLimitDialog.value = false;
    MessagePlugin.success('Limiting Success');
  }
};

const handleEdit = async (user: TokenUserForm) => {
  newUser.value = { ...user };
  hasModelLimit.value = Boolean(newUser.value.model_limit.length !== 0);
  isGptcarListEmpty.value = Boolean(newUser.value.gptcar_list.length === 0);

  await getGptCarEnum();

  showDialog.value = true;
  actionType.value = 'edit';
};

const handleShowDialog = async () => {
  await getGptCarEnum();
  showDialog.value = true;
  actionType.value = 'add';
  newUser.value = { ...defaultUser };
};

const handleClickDelete = (row: any) => {
  console.log('row', row.username);
  usernameDelete.value = row.username;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  const response = await RequestApi(UserAccountUri, 'DELETE', { username: usernameDelete.value });
  const data = await response.json();
  showDeleteDialog.value = false;
  usernameDelete.value = '';

  if (response.status !== 200) {
    MessagePlugin.error(JSON.stringify(Object.values(data)[0]));
  } else {
    await getUserList();
    MessagePlugin.success('Deleted successfully');
  }
};

const handlebatchModelLimit: FormProps['onSubmit'] = async ({ validateResult, firstError }) => {
  if (validateResult === true) {
    batchUpdateUserModelLimit();
  } else {
    console.error('Form reference is not defined', firstError);
  }
};

const handleAdd: FormProps['onSubmit'] = async ({ validateResult, firstError }) => {
  console.log('validateResult', validateResult);
  if (validateResult === true) {
    addOrUpdateUser();
  } else {
    console.error('Form reference is not defined', firstError);
  }
};

const onModelLimitChange = (value: boolean) => {
  if (value) {
    if (newUser.value.model_limit.length === 0) {
      newUser.value.model_limit = [{}];
    }
    if (batchModelLimitUser.value.model_limit.length === 0) {
      batchModelLimitUser.value.model_limit = [{}];
    }
  } else {
    newUser.value.model_limit = [];
    batchModelLimitUser.value.model_limit = [];
  }
  console.log('onModelLimitChange', value);
};

const getChatGPTDetails = async (user: any) => {
  showChatGPTDetailsDialog.value = true;
  userChatgptDetailsRef.value.getChatGPTDetails(user);
};

getUserList();
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
