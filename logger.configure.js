module.exports = {
  appenders: { 
    app: { 
      type: 'stdout', 
    } 
  },
  categories: { 
    default: { 
      appenders: ['app'], 
      level: 'debug' 
    } 
  }
};