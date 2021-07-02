# MongoDB Migrations using [migrate-mongo](https://www.npmjs.com/package/migrate-mongo)

## What This Does

`migrate-mongo` is a database migration tool for MongoDB running in Node.js
Database migration frameworks **track and apply** granular changes to the database schema, indexes, required base users, and seed data (system, test, demo, etc.). Granular changes are typically reflected as separate scripted files and are reflected as code that can be captured with any version control software. Database migration frameworks, like 

### How To Run

* `node.js` and `npm` are required
* install `migrate-mongo`
* update [migrate-mongo-config.js](./migrate-mongo-config.js) with the mongo uri and database name
* run `migrate-mongo up` to apply the migrations in chronoligical order 

### Adding migrations

* run `migrate-mongo create WHAT-YOUR-MIGRATION-IS-ABOUT`
* a new `.js` file with a time stamp pre-fixed will be created
* update the code for the `up` and `down` steps
* see instructins [here](https://www.npmjs.com/package/migrate-mongo)
