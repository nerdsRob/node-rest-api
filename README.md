# node-rest-api
node.js REST API scaffold to create dummy endpoints on `localhost`.

### Requirements
- local `mysql` database

### Setup
- create `.env` file in root directory of this project
- add environment variables for your mysql configuration
- run `npm start`
- `curl localhost:3000/{your_endpoint}`

### .env file syntax
```
DB_HOST=localhost
DB_USER=root
DB_PASS=pass
DB_NAME=database_name
```
