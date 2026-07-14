export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} م`;
  }
  return `${distance.toFixed(1)} كم`;
};

export const formatPrice = (amount) => {
  return `${Number(amount).toLocaleString('en-US')} دج`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusText = (status) => {
  const statuses = {
    pending: 'في الانتظار',
    accepted: 'مقبول',
    picked_up: 'تم الاستلام',
    in_transit: 'في الطريق',
    delivered: 'تم التوصيل',
    completed: 'مكتمل',
    cancelled: 'ملغى',
  };
  return statuses[status] || status;
};

export const getStatusColor = (status) => {
  const colors = {
    pending: '#FF9800',
    accepted: '#2196F3',
    picked_up: '#9C27B0',
    in_transit: '#3F51B5',
    delivered: '#4CAF50',
    completed: '#4CAF50',
    cancelled: '#F44336',
  };
  return colors[status] || '#9E9E9E';
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^(05|06|07)\d{8}$/;
  return re.test(phone);
};

