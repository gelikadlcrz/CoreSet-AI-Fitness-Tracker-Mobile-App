<!-- apps/api/sql/README.md -->
## Running Migrations

### Prerequisites
- psql installed locally, OR use the SQLTools extension in VS Code
- Your ca.pem file from the Aiven console
- Your connection string from .env

### First-time setup (run in order)
psql "YOUR_AIVEN_CONNECTION_STRING?sslmode=require&sslrootcert=./ca.pem" \
  -f 001_initial_schema.sql

psql "YOUR_AIVEN_CONNECTION_STRING?sslmode=require&sslrootcert=./ca.pem" \
  -f 002_seed_exercises.sql

### Adding future migrations
Name them sequentially: 003_add_column.sql, 004_new_table.sql
Always run in order. Never edit a file that has already been run in production.