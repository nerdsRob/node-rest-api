# node-rest-api
node.js REST API scaffold to create dummy endpoints on `localhost`.

### Requirements
- local `mysql` database
- `node` package installed on your machine

### Setup
- run `mysql -u username -p password database_name < comments_schema.sql` to create `comments` table in your local mysql database (if you want to use this endpoint :smile:)
- create `.env` file in root directory of this project
- add environment variables for your mysql configuration, see example syntax below
- add your new endpoints under `/routes/{your_endpoint}.js`
- add your routing to `app.js`
- run `npm start`
- `curl localhost:3000/{your_endpoint}`

### .env file syntax
```
DB_HOST=localhost
DB_USER=root
DB_PASS=pass
DB_NAME=database_name
```
