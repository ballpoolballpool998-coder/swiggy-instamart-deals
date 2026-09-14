const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

function ensureDataDir() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadUsers() {
  ensureDataDir();
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (e) {}
  return {};
}

function saveUsers(users) {
  ensureDataDir();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('[UserManager] Error saving users:', e.message);
  }
}

function getUser(chatId, defaultConfig = {}) {
  const users = loadUsers();
  return users[String(chatId)] || {
    chatId: String(chatId),
    pincode: null,
    area: null,
    storeId: defaultConfig.sid || '1400216',
    primaryStoreId: defaultConfig.pid || '1400216',
    secondaryStoreId: defaultConfig.secid || '1231805',
    minDiscount: defaultConfig.minDiscount || 30
  };
}

function updateUser(chatId, partialData) {
  const users = loadUsers();
  const id = String(chatId);
  users[id] = { ...(users[id] || { chatId: id }), ...partialData, updatedAt: Date.now() };
  saveUsers(users);
  return users[id];
}

function getAllUsers() {
  const users = loadUsers();
  return Object.values(users);
}

module.exports = {
  getUser,
  updateUser,
  getAllUsers
};
