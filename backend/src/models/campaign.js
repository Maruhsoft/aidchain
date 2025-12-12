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
    // Return a Campaign instance so callers have access to instance methods like save()
    return c ? new Campaign(Object.assign({}, c)) : null;
  }

  static async findAll() {
    // Return shallow clones to avoid accidental mutation of the DB array
    return db.campaigns.map(c => Object.assign({}, c));
  }
}

module.exports = Campaign;
