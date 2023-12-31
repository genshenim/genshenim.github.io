<template>
  <SettingsPage page-title="settings.apiKeys.apiKeys">
    <template #actions>
      <VBtn
        color="primary"
        variant="elevated"
        :loading="loading"
        @click="addingNewKey = true">
        {{ t('settings.apiKeys.addNewKey') }}
      </VBtn>
      <VBtn
        v-if="apiKeys.length > 0"
        color="error"
        variant="elevated"
        :loading="loading"
        @click="confirmRevoke = 'all'">
        {{ t('settings.apiKeys.revokeAll') }}
      </VBtn>
    </template>
    <template #content>
      <VCol>
        <VTable>
          <thead>
            <tr>
              <th
                v-for="{ text, value } in headers"
                :id="value"
                :key="value">
                {{ text }}
              </th>
              <th scope="col">
                <!-- delete column -->
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="apiKey in apiKeys"
              :key="apiKey.AppName ?? undefined">
              <td
                v-for="{ value } in headers"
                :key="value">
                {{
                  value !== 'DateCreated'
                    ? apiKey[value]
                    : useDateFns(
                      formatRelative,
                      parseJSON(apiKey[value] ?? 'unknown'),
                      new Date()
                    ).value
                }}
              </td>
              <td>
                <VBtn
                  color="error"
                  :loading="loading"
                  @click="confirmRevoke = apiKey.AccessToken ?? undefined">
                  {{ t('settings.apiKeys.revoke') }}
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCol>
      <AddApiKey
        :adding-new-key="addingNewKey"
        @close="addingNewKey = false"
        @key-added="
          async () => {
            addingNewKey = false;
            await refreshApiKeys();
          }
        " />
      <VDialog
        width="auto"
        :model-value="confirmRevoke !== undefined"
        @update:model-value="confirmRevoke = undefined">
        <VCard>
          <VCardText>
            {{ t('settings.apiKeys.revokeConfirm') }}
          </VCardText>
          <VCardActions>
            <VBtn
              color="primary"
              :loading="loading"
              @click="confirmRevocation">
              {{ t('confirm') }}
            </VBtn>
            <VBtn
              :loading="loading"
              @click="confirmRevoke = undefined">
              {{ t('cancel') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </template>
  </SettingsPage>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import { parseJSON, formatRelative } from 'date-fns';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getApiKeyApi } from '@jellyfin/sdk/lib/utils/api/api-key-api';
import { AuthenticationInfo } from '@jellyfin/sdk/lib/generated-client';
import { useDateFns, useRemote, useSnackbar } from '@/composables';

const { t } = useI18n();
const remote = useRemote();

const apiKeys = ref<AuthenticationInfo[]>([]);
const addingNewKey = ref(false);
/** The key to confirm revocation (will be 'all' if revoking all keys) */
const confirmRevoke = ref<string>();
const loading = ref(false);

const headers = computed(
  (): { text: string; value: keyof AuthenticationInfo }[] => [
    { text: t('settings.apiKeys.appName'), value: 'AppName' },
    { text: t('settings.apiKeys.accessToken'), value: 'AccessToken' },
    { text: t('settings.apiKeys.dateCreated'), value: 'DateCreated' }
  ]
);

/**
 * Confirms revocation and closes the confirmation modal
 */
async function confirmRevocation(): Promise<void> {
  if (!confirmRevoke.value) {
    return;
  }

  await (confirmRevoke.value === 'all'
    ? revokeAllApiKeys()
    : revokeApiKey(confirmRevoke.value));

  confirmRevoke.value = undefined;
}

/**
 * Revokes an api key
 */
async function revokeApiKey(token: string): Promise<void> {
  loading.value = true;

  try {
    await remote.sdk.newUserApi(getApiKeyApi).revokeKey({
      key: token
    });

    useSnackbar(t('settings.apiKeys.revokeSuccess'), 'success');
    await refreshApiKeys();
  } catch (error) {
    console.error(error);
    useSnackbar(t('settings.apiKeys.revokeFailure'), 'error');
  } finally {
    loading.value = false;
  }
}

/**
 * Revokes all api keys
 */
async function revokeAllApiKeys(): Promise<void> {
  loading.value = true;

  try {
    for (const key of apiKeys.value) {
      if (key.AccessToken) {
        await remote.sdk.newUserApi(getApiKeyApi).revokeKey({
          key: key.AccessToken
        });
      }
    }

    useSnackbar(t('settings.apiKeys.revokeAllSuccess'), 'success');
    await refreshApiKeys();
  } catch (error) {
    console.error(error);
    useSnackbar(t('settings.apiKeys.revokeAllFailure'), 'error');
  } finally {
    loading.value = false;
  }
}

/**
 * Refreshes the list of api keys
 */
async function refreshApiKeys(): Promise<void> {
  try {
    apiKeys.value =
      (await remote.sdk.newUserApi(getApiKeyApi).getKeys()).data.Items ?? [];
  } catch (error) {
    apiKeys.value = [];
    console.error(error);
    useSnackbar(t('settings.apiKeys.refreshKeysFailure'), 'error');
  }
}

await refreshApiKeys();
</script>
