// Deploy the latest version of a library to a given set of script projects
function updateProjectsWithLastLibraryVersion() {
  // This is the ID of the FirebaseApp library, replace with any library you have access to
  // https://github.com/RomainVialard/FirebaseApp
  var libraryId = "1hguuh4Zx72XVC1Zldm_vTtcUUKUA6iBUOoGnJUWLfqDWx5WlOJHqYkrt";
  var libraryName = getLibraryName_(libraryId);
  var latestVersionNb = getLibraryLatestVersionNumber_(libraryId);
  
  // list of projects you want to update with the latest version of your library
  var projectIds = ["1AUxZTkOqLpP33ywkgo8T2NJlkfZ3CznkkKvWiTAiHY6KIhq7hFqbjpsM"];
  
  for (var i in projectIds) {
    var versionUsedInProject = checkLibraryVersionUsedInProject_(projectIds[i], libraryId);
    
    // only update project if it is not already using the latest version of the library
    if (versionUsedInProject < latestVersionNb) {
      updateLibraryVersionUsedInProject_(projectIds[i], libraryId, latestVersionNb);
      // once the manifest has been updated with the latest version of the library, save a new version of the project
      
      var description = 'Library "' + libraryName + '" updated to version ' + latestVersionNb;
      var newVersionNumber = saveNewProjectVersion_(projectIds[i], description);
      
      // if project is deployed as web app, you can then automatically deploy the new version:
      // https://github.com/RomainVialard/programmatically-deploy-a-web-app
    }
  }
}

/**
 * Gets the name of the library.
 *
 * @param  {string} libraryId - The library / script project's Drive ID.
 *
 * @return {string} The library / script project's title.
 */
function getLibraryName_(libraryId) {
  var output = makeRequest_(libraryId, '');
  return output.title;
}

/**
 * Gets the latest version of the library.
 *
 * @param  {string} libraryId - The library / script project's Drive ID.
 *
 * @return {number} The latest version number of the library.
 */
function getLibraryLatestVersionNumber_(libraryId) {
  var output = makeRequest_(libraryId, 'versions');
  if (output.nextPageToken) throw "Project contains more than 50 saved versions, update code to retrieve all results";
  var versions = output.versions;
  return versions[versions.length - 1].versionNumber;
}

/**
 * Gets from manifest the library version used in the specified script project.
 *
 * @param  {string} projectId - The script project's Drive ID.
 * @param  {string} libraryId - The library / script project's Drive ID.
 *
 * @return {number} The version of the library used in the script project.
 */
function checkLibraryVersionUsedInProject_(projectId, libraryId) {
  var [files, manifest] = getProjectManifest_(projectId);
  var libraries = manifest.dependencies.libraries;
  for (var i in libraries) {
    if (libraries[i].libraryId == libraryId) return libraries[i].version;
  }
}

/**
 * Updates manifest of the specified script project with a new version of the specific library
 *
 * @param  {string} projectId - The script project's Drive ID.
 * @param  {string} libraryId - The library / script project's Drive ID.
 * @param  {number} versionNumber - The library version number
 */
function updateLibraryVersionUsedInProject_(projectId, libraryId, versionNumber) {
  var [files, manifest] = getProjectManifest_(projectId);
  var libraries = manifest.dependencies.libraries;
  for (var i in libraries) {
    if (libraries[i].libraryId == libraryId) libraries[i].version = versionNumber;
  }
  for (var i in files) {
    if (files[i].type == "JSON") files[i].source = JSON.stringify(manifest);
  }
  
  makeRequest_(projectId, 'content', 'put', JSON.stringify({files:files}));
}

function getProjectManifest_(projectId) {
  var output = makeRequest_(projectId, 'content');
  var files = output.files;
  for (var i in files) {
    if (files[i].type == "JSON") return [files, JSON.parse(files[i].source)];
  }
}

/**
 * Save a new version of the script project.
 *
 * @param  {string} projectId - The script project's Drive ID.
 * @param  {string} description - The description for this version.
 *
 * @return {number} The version number for the newly created version.
 */
function saveNewProjectVersion_(projectId, description) {
  var payload = JSON.stringify({description: description});
  return makeRequest_(projectId, 'versions', 'post', payload).versionNumber;
}

/**
 * Make calls to the Apps Script API
 * Required scopes:
 * - https://www.googleapis.com/auth/script.external_request
 * - https://www.googleapis.com/auth/script.projects
 *
 * @param  {string} projectId - The script project's Drive ID.
 * @param  {string} resourcePath - The resource path.
 * @param  {string} [method] - the HTTP method for the request.
 * @param  {string} [payload] - the payload (e.g. POST body) for the request.
 *
 * @return {object} The response from the Apps Script API.
 */
function makeRequest_(projectId, resourcePath, method, payload) {
  var baseUrl = "https://script.googleapis.com/v1/projects/";
  var url = baseUrl + projectId + "/" + resourcePath;
  var options = {
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    }
  };
  if (method == 'post' || method == 'put') {
    options.method = method;
    options.payload = payload;
    options.headers['Content-Type'] = 'application/json';
  }
  return JSON.parse(UrlFetchApp.fetch(url, options));
}
