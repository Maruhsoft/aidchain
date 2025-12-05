
const AuthService = require('../services/authService');

const AuthController = {
  login: (req, res) => {
    try {
      const { address, role } = req.body;
      if (!address || !role) {
        return res.status(400).json({ error: "Address and Role are required" });
      }
      
      const result = AuthService.login(address, role);
      res.json(result);
    } catch (e) {
      res.status(401).json({ error: "Authentication failed" });
    }
  }
};

module.exports = AuthController;
