# Push new version of library to given set of projects
Deploy the latest version of a library to a given set of script projects

Useful if you want to make sure all your Apps Script projects (or a given set of projects) are using the latest version of a specific Apps Script library (created by you or someone else).
This script will retrieve the latest available version of a given library and will then check if each project in a given set are using this latest version. If not, they will be updated (update of the manifest - appsscript.json + creation of a new version of each project).
