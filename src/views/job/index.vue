<template>
  <div class="chat-container">
    <div class="chat-messages">
      <div v-for="message in sortedMessages" :key="message.id" class="message">
        <div
          class="message-content"
          :class="{ sent: message.sent }"
          v-if="message.sent"
        >
          我：{{ message.text }}
        </div>
        <div class="message-content chat-gpt" v-if="!message.sent">
          <div>ChatGPT：</div>
          <div>{{ message.text }}</div>
        </div>
      </div>
    </div>
    <div class="chat-input">
      <el-input
        v-model="inputText"
        placeholder="Type your message"
        :disabled="loading"
        @keyup.enter="sendMessage"
      />
      <el-button
        type="primary"
        @click="sendMessage"
        :disabled="loading || inputText.trim() === ''"
        >Send</el-button
      >
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, nextTick } from "vue";
import { generateText } from "../../utils/utils";
import { ElNotification } from "element-plus";

interface Message {
  id: number;
  text: string;
  sent: boolean;
  timestamp: number;
}
export default {
  name: "Chat",
  setup() {
    const inputText = ref("");
    const messages = ref<Message[]>([]);
    const loading = ref(false);
    const scrollToBottom = async () => {
      await nextTick();
      console.log("scrollToBottom1");
      const chatContainer: any = document.querySelector(".chat-container");
      console.log("scrollToBottom2", chatContainer);
      const chatMessages = chatContainer.querySelector(".chat-messages");
      console.log("scrollToBottom3", chatMessages);
      const lastMessage = chatMessages.lastElementChild;
      console.log("scrollToBottom4", lastMessage);
      lastMessage?.scrollIntoView({ behavior: "smooth" });
      console.log("scrollToBottom5");
    };

    const sendMessage = async () => {
      const text = inputText.value.trim();
      console.log("text", text);
      if (text !== "") {
        const timestamp = Date.now();
        messages.value.push({
          id: messages.value.length + 1,
          text: text,
          sent: true,
          timestamp: timestamp,
        });
        inputText.value = "";
        try {
          loading.value = true; // 显示等待动画
          console.log("messages.value", messages.value);
          const conversation = messages.value
            .filter((message) => message.sent)
            .map((message) => message.text)
            .join("\n");
          console.log("conversation", conversation);

          const chatResult: any = await generateText(conversation);
          console.log("chatResult ", chatResult);
          messages.value.push({
            id: messages.value.length + 1,
            text: chatResult,
            sent: false,
            timestamp: timestamp + 1,
          });
          scrollToBottom();
        } catch (error) {
          ElNotification.error({
            title: "Error",
            message: "Failed to generate text. Please try again.",
          });
        } finally {
          loading.value = false; // 隐藏等待动画
        }
        console.log("sortedMessages", sortedMessages.value);
      }
    };
    const sortedMessages = computed(() =>
      messages.value.sort((a, b) => a.timestamp - b.timestamp)
    );
    return {
      inputText,
      messages,
      sendMessage,
      sortedMessages,
      loading,
    };
  },
};
</script>
<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 94vh;
  padding: 20px;
}

.chat-messages {
  flex: 1;
  overflow-y: scroll;
}

.message {
  margin-bottom: 10px;
}

.message-content {
  padding: 10px;
  border-radius: 5px;
}
.chat-gpt {
  display: flex;
  white-space: pre-line;
}
.message-content.sent {
  background-color: #efefef;
  align-self: flex-end;
}

.chat-input {
  display: flex;
  align-items: center;
  margin-top: 10px;
}
</style>