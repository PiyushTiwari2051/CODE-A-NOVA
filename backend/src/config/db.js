const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Ensure env variables are loaded before evaluating mock status
require('dotenv').config();

const uri = process.env.MONGODB_URI;
let useMock = !uri;
if (useMock) {
  global.useMockDb = true;
}

// Logger placeholder
const log = (msg) => console.log(`[DB] ${msg}`);

let isConnected = false;

// Mock DB Storage Directory
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Simple JSON File helper for Mock Database
class MockCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.data = [];
    this.load();
  }

  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        log(`Error loading mock data for ${this.name}: ${err.message}. Initializing empty.`);
        this.data = [];
      }
    } else {
      this.data = [];
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      log(`Error saving mock data for ${this.name}: ${err.message}`);
    }
  }

  // Mimic basic Mongoose queries
  async find(query = {}) {
    this.load();
    return this.data.filter(item => {
      for (let key in query) {
        // Handle basic key-value match
        if (query[key] !== undefined && item[key] !== query[key]) {
          // Check for sub-properties or regex
          if (query[key] instanceof RegExp) {
            if (!query[key].test(item[key])) return false;
          } else if (typeof query[key] === 'object' && query[key] !== null) {
            // Basic $in, $gte, $lte support
            const op = Object.keys(query[key])[0];
            const val = query[key][op];
            if (op === '$in') {
              if (!val.includes(item[key])) return false;
            } else if (op === '$gte') {
              if (item[key] < val) return false;
            } else if (op === '$lte') {
              if (item[key] > val) return false;
            } else if (op === '$ne') {
              if (item[key] === val) return false;
            }
          } else {
            return false;
          }
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const results = await this.find(query);
    return results[0] || null;
  }

  async findById(id) {
    this.load();
    const strId = String(id);
    return this.data.find(item => String(item._id) === strId) || null;
  }

  async create(doc) {
    this.load();
    const newDoc = {
      _id: doc._id || Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    this.data.push(newDoc);
    this.save();
    return newDoc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    this.load();
    const strId = String(id);
    const idx = this.data.findIndex(item => String(item._id) === strId);
    if (idx === -1) return null;

    const oldVal = this.data[idx];
    const changes = update.$set || update; // support simple update or Mongoose $set
    
    const newVal = {
      ...oldVal,
      ...changes,
      updatedAt: new Date().toISOString()
    };
    
    // Support numeric increments if specified (like Mongoose $inc)
    if (update.$inc) {
      for (let key in update.$inc) {
        newVal[key] = (newVal[key] || 0) + update.$inc[key];
      }
    }

    this.data[idx] = newVal;
    this.save();
    return options.new === false ? oldVal : newVal;
  }

  async findByIdAndDelete(id) {
    this.load();
    const strId = String(id);
    const idx = this.data.findIndex(item => String(item._id) === strId);
    if (idx === -1) return null;
    const deleted = this.data.splice(idx, 1)[0];
    this.save();
    return deleted;
  }

  async updateOne(query, update) {
    this.load();
    const doc = await this.findOne(query);
    if (!doc) return { nModified: 0 };
    await this.findByIdAndUpdate(doc._id, update);
    return { nModified: 1 };
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }
}

// Global holder for mock collections
const mockCollections = {};
function getMockCollection(name) {
  if (!mockCollections[name]) {
    mockCollections[name] = new MockCollection(name);
  }
  return mockCollections[name];
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    log('MONGODB_URI not provided. Falling back to persistent Local JSON Database.');
    useMock = true;
    global.useMockDb = true;
    return;
  }

  try {
    // Attempt Mongoose connection
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    });
    isConnected = true;
    log('MongoDB Connected Successfully.');
  } catch (err) {
    log(`MongoDB Connection failed: ${err.message}. Falling back to persistent Local JSON Database.`);
    useMock = true;
    global.useMockDb = true;
  }
};

// Model helper that returns either standard Mongoose model or custom Mock Model wrapper
const createModel = (modelName, schemaObj) => {
  if (useMock || global.useMockDb) {
    const coll = getMockCollection(modelName.toLowerCase() + 's');
    return coll;
  }

  // Fallback in case schema is loaded before DB connection completes
  // We define Mongoose schema dynamically
  const schema = new mongoose.Schema(schemaObj, { timestamps: true });
  
  // Register or retrieve model
  try {
    return mongoose.model(modelName);
  } catch (e) {
    return mongoose.model(modelName, schema);
  }
};

module.exports = {
  connectDB,
  createModel,
  getMockCollection,
  isMock: () => useMock || global.useMockDb
};
