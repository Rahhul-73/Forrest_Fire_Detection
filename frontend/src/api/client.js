import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const detect = async (formData) => {
  const response = await api.post('/detect', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getSpread = async (params = {}) => {
  const response = await api.get('/spread/simulate', {
    params: {
      lat: params.lat ?? 37.7749,
      lon: params.lon ?? -122.4194,
      wind: params.wind ?? 25.0,
      dir: params.dir ?? 45.0,
      slope: params.slope ?? 15.0,
      fuel: params.fuel ?? 1.2,
    },
  });
  return response.data;
};

export const getRiskZones = async (lat = 37.7749, lon = -122.4194) => {
  const response = await api.get('/risk/zones', {
    params: { lat, lon },
  });
  return response.data;
};

export const getLoRaNodes = async () => {
  const response = await api.get('/lora/nodes');
  return response.data;
};

export const sendLoRaAlert = async (message) => {
  const response = await api.post('/lora/alert', { message });
  return response.data;
};

export const getLoRaMessages = async () => {
  const response = await api.get('/lora/messages');
  return response.data;
};

// Also export apiClient object for maximum compatibility
export const apiClient = {
  detect,
  getSpread,
  getRiskZones,
  getLoRaNodes,
  sendLoRaAlert,
  getLoRaMessages,
  simulateSpread: getSpread,
  acknowledgeAlert: async (id) => {
    const res = await api.post(`/alerts/${id}/acknowledge`);
    return res.data;
  },
  getNodes: getLoRaNodes,
  getAlerts: getLoRaMessages
};

export default api;
