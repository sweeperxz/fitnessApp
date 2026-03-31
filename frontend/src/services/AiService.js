import api from '../api'

export const sendChatMessage = (data) => api.post('/ai/chat', data).then(r => r.data)

const AiService = {
  sendChatMessage
}

export default AiService
