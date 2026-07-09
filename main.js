// main.js - Acode Express Helper
// Registers keywords and a smarter autocomplete provider for javascript files.
// Relies on Acode plugin API: window.acode.registerAutocompleteKeywords / registerAutocomplete
(function () {
  const packages = [
    "express", "body-parser", "cors", "mongoose", "dotenv",
    "sequelize", "pg", "mysql", "bcrypt", "jsonwebtoken",
    "multer", "helmet", "morgan", "winston", "nodemon"
  ];

  const keywords = [
    "express", "require", "import", "module.exports",
    "app", "router", "get", "post", "put", "delete",
    "use", "listen", "next", "res", "req", "async", "await"
  ];

  // Basic keyword registration so simple completions appear
  if (window.acode && window.acode.registerAutocompleteKeywords) {
    window.acode.registerAutocompleteKeywords("javascript", keywords.concat(packages));
  }

  // Helper: create suggestion objects
  function makeSuggestion(caption, value, meta = "snippet") {
    return { caption, value, meta };
  }

  // Common snippets
  const snippets = {
    expressApp: "const express = require('express');\nconst app = express();\n\napp.use(express.json());\n\napp.get('/', (req, res) => {\n  res.send('Hello World');\n});\n\napp.listen(3000, () => console.log('Server started on 3000'));",
    routeHandler: "app.${METHOD}('${PATH}', async (req, res, next) => {\n  try {\n    // TODO\n    res.json({});\n  } catch (err) { next(err); }\n});\n",
    routerSetup: "const express = require('express');\nconst router = express.Router();\n\nrouter.get('/', (req, res) => res.send('ok'));\n\nmodule.exports = router;\n",
    errorHandler: "function errorHandler(err, req, res, next) {\n  console.error(err);\n  res.status(500).json({ error: err.message });\n}\napp.use(errorHandler);\n",
    mongooseModel: "const mongoose = require('mongoose');\n\nconst Schema = new mongoose.Schema({\n  name: { type: String, required: true },\n});\n\nmodule.exports = mongoose.model('Model', Schema);\n",
    multerUpload: "const multer = require('multer');\nconst upload = multer({ dest: 'uploads/' });\n\napp.post('/upload', upload.single('file'), (req, res) => {\n  res.json({ file: req.file });\n});\n",
    jwtAuth: "const jwt = require('jsonwebtoken');\nfunction auth(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1];\n  if (!token) return res.status(401).end();\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET);\n    next();\n  } catch (e) { res.status(401).end(); }\n}\n"
  };

  // Autocomplete provider: triggers on `require(`, `import `, dot-access, or after "app" / "router"
  if (window.acode && window.acode.registerAutocomplete) {
    window.acode.registerAutocomplete({
      language: "javascript",
      trigger: function (code, position) {
        // look back up to 40 chars
        const start = Math.max(0, position - 40);
        const before = code.substring(start, position);
        // trigger on require(" or import, or dot-access, or typing app/router
        if (/\brequire\(['\"]?$/.test(before) || /\bimport\s+.*from\s+['\"]?$/.test(before) || /\bimport\s+['\"]?$/.test(before)) {
          return true;
        }
        if (/\b(app|router)\.\w*$/.test(before) || /\.\w+$/.test(before)) {
          return true;
        }
        // fallback: trigger when typing an identifier
        if (/[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(before)) {
          return true;
        }
        return false;
      },
      provider: function (code, position) {
        const start = Math.max(0, position - 100);
        const before = code.substring(start, position);
        const suggestions = [];

        // Suggest package names inside require/import
        if (/\brequire\(['\"]?$/.test(before) || /\bimport\s+['\"]?$/.test(before) || /\bfrom\s+['\"]?$/.test(before)) {
          packages.forEach(pkg => suggestions.push(makeSuggestion(pkg, pkg, "package")));
          return suggestions;
        }

        // If user typed "app." or "router." show express commonly used methods
        if (/\bapp\.\w*$/.test(before) || /\brouter\.\w*$/.test(before) || /\.\w+$/.test(before)) {
          const methods = [
            { c: "app.get(path, handler)", v: "app.get('${1}', (req, res) => {\n\t\n});", m: "route" },
            { c: "app.post(path, handler)", v: "app.post('${1}', (req, res) => {\n\t\n});", m: "route" },
            { c: "app.use(middleware)", v: "app.use(${1});", m: "middleware" },
            { c: "router.get(path, handler)", v: "router.get('${1}', (req, res) => {\n\t\n});", m: "route" },
            { c: "res.json(obj)", v: "res.json(${1});", m: "response" },
            { c: "res.send()", v: "res.send(${1});", m: "response" },
            { c: "next()", v: "next()", m: "flow" }
          ];
          methods.forEach(m => suggestions.push(makeSuggestion(m.c, m.v, m.m)));
          return suggestions;
        }

        // Generic suggestions: keywords, packages, common snippets
        keywords.forEach(k => suggestions.push(makeSuggestion(k, k, "keyword")));
        packages.forEach(p => suggestions.push(makeSuggestion(p, `require('${p}')`, "package")));

        // Add rich snippets
        suggestions.push(makeSuggestion("Express app (full)", snippets.expressApp, "template"));
        suggestions.push(makeSuggestion("Router scaffold", snippets.routerSetup, "template"));
        suggestions.push(makeSuggestion("Error handler", snippets.errorHandler, "template"));
        suggestions.push(makeSuggestion("Mongoose model", snippets.mongooseModel, "template"));
        suggestions.push(makeSuggestion("Multer upload", snippets.multerUpload, "template"));
        suggestions.push(makeSuggestion("JWT auth middleware", snippets.jwtAuth, "template"));

        return suggestions;
      }
    });
  } else {
    console.warn("Acode plugin API (registerAutocomplete) not available.");
  }
})();
