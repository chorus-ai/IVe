const fs = require('fs');
const path = require('path');

const loadRoutes = (router, directory, basedir) => {
  const basename = path.basename(basedir);

  fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {

    const entryPath = path.join(directory, entry.name);
   
    if (entry.isDirectory()) {
      loadRoutes(router, entryPath, basedir);
    } else if (entry.isFile() && entry.name.endsWith('.js') && entry.name !== "index.js" && entry.name !== basename) {
      const route = require(entryPath);

      // Adjust the route name (removes base path and .js extension)
      let routeName = '/' + path.relative(basedir, entryPath)
        .replace(/\\/g, '/')   // Replace Windows backslashes with forward slashes
        .replace('.js', '');   // Remove the .js extension

      // If the route is 'index.js', make it the root of the directory
      routeName = routeName.replace('/index', '/');

      console.info(`Loaded route: ${routeName} || ${entryPath}`);

      router.use(routeName, route);
    }
  });
};

module.exports = { loadRoutes };