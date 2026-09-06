const fs = require("fs/promises");
const path = require("path");

class JsonlStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.queue = Promise.resolve();
  }

  async read() {
    try {
      const text = await fs.readFile(this.filePath, "utf8");
      return text.split("\n").filter(Boolean).map(JSON.parse);
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  async append(record) {
    this.queue = this.queue.then(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.appendFile(this.filePath, JSON.stringify(record) + "\n", "utf8");
    });
    return this.queue;
  }
}

module.exports = { JsonlStore };
