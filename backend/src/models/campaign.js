const db = require('../db');

class Campaign {
  constructor(data = {}) {
    // shallow copy
    Object.assign(this, data);
    if (!this.id) {
      this.id = (db.campaigns.length + 1).toString();
    }
  }

  async save() {
    const idx = db.campaigns.findIndex(c => c.id === this.id);
    if (idx >= 0) {
      // replace existing
      db.campaigns[idx] = this;
    } else {
      db.campaigns.unshift(this);
    }
    return this;
  }

  static async findById(id) {
    const c = db.campaigns.find(x => x.id === id);
    // Return a cloned object so callers can modify and then call save()
    return c ? Object.assign({}, c) : null;
  }

  static async findAll() {
    return db.campaigns.map(c => Object.assign({}, c));
  }
}

module.exports = Campaign;
