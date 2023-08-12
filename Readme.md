## Secrets
An app with user registration and login to access and post secrets.

Users can use local auth, or google authentication using oauth 2.0.

This is a simple version of the whisper app, where anyone can see secrets submitted without any user identifying information. Authentication is used to submit new secrets.

Tech stack used:
 - Node.js
 - EJS
 - Express
 - Passort for authentication
 - MongoDB and Mongoose

### The goal is to explore different authentication options.

- v1 has no auth
- v2 uses encrpytion with a secret key to encript the MongoDB records
- v3 has auth using local database and bcyrpt to salt and store password hashes
- v4 has local authentication using Passport.js
- v5 has local and Google oauth 2.0 autentication using Passport.js

