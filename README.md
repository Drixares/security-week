## Security Week Project

### Installation

```sh
bun install
```

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/security_week

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# Server
PORT=3000
NODE_ENV=development

# Shopify API
SHOPIFY_SHOP_NAME=your-shop-name
SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
SHOPIFY_WEBHOOK_SECRET=your-shopify-webhook-secret
```

### Database Setup

1. Start the PostgreSQL database:
```sh
docker-compose up -d
```

2. Push the schema to the database:
```sh
bun db:push
```

3. Seed the database with initial roles:
```sh
bun run src/db/seed.ts
```

### Running the Application

```sh
bun run dev
```

Then open http://localhost:3000

### Database Management

#### Available Commands
- `bun db:push` - Push schema changes to database (⚠️ see note below)
- `bun db:generate` - Generate migration files from schema changes
- `bun db:migrate` - Apply pending migrations
- `bun dev:db` - Open Drizzle Studio for database management

#### Known Issue with `drizzle-kit push`

Due to a bug in drizzle-kit 0.31.5, running `bun db:push` multiple times may fail with:
```
error: column "id" is in a primary key
```

This happens because drizzle-kit creates explicit NOT NULL constraints and then tries to remove them on subsequent runs.

**Workaround:** Use the migration workflow instead:
```sh
# 1. Generate migration after schema changes
bun db:generate

# 2. Apply the migration
bun db:migrate
```

Alternatively, if you encounter this issue, the database is likely already in sync with your schema and no action is needed.

### API Endpoints

#### Products API

**POST /products**
- Creates a product in Shopify and saves it to the database
- Requires authentication and `canPostProducts` permission (ADMIN role only)
- Request body:
  ```json
  {
    "name": "Product Name",
    "price": 29.99
  }
  ```
- Response:
  ```json
  {
    "id": "01HQXYZ123",
    "shopifyId": "7891234567890",
    "message": "Product created successfully"
  }
  ```

**GET /products**
- Returns all products with creator information
- Requires authentication
- Response:
  ```json
  [
    {
      "id": "01HQXYZ123",
      "shopifyId": "7891234567890",
      "salesCount": 0,
      "createdAt": "2024-10-24T10:00:00.000Z",
      "creator": {
        "id": "01HQUSER123",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
  ```

**GET /my-products**
- Returns products created by the authenticated user
- Requires authentication
- Response:
  ```json
  [
    {
      "id": "01HQXYZ123",
      "shopifyId": "7891234567890",
      "salesCount": 0,
      "createdAt": "2024-10-24T10:00:00.000Z"
    }
  ]
  ```

#### Webhooks API

**POST /webhooks/shopify-sales**
- Webhook endpoint for Shopify order creation events
- Automatically increments `salesCount` for products when orders are placed
- Secured with HMAC SHA-256 signature verification
- Handles multiple products and quantities in a single order
- No authentication required (secured by HMAC signature)
- Expected headers:
  - `X-Shopify-Hmac-SHA256`: HMAC signature from Shopify
- Request body: Shopify order webhook payload (JSON)
- Response:
  ```json
  {
    "success": true,
    "message": "Webhook processed successfully. Updated 2 product(s).",
    "processedProducts": 2
  }
  ```

For detailed webhook setup instructions, see [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md).

### Testing Webhook Signature

To generate a test HMAC signature for webhook testing:

```sh
bun test:webhook
```

This will output an example payload and the corresponding HMAC signature you can use with cURL.

### Permissions

The application uses role-based permissions:
- `ADMIN` - Full access including creating products (`canPostProducts: true`)
- `USER` - Read-only access to products (`canPostProducts: false`)
- `BAN` - No access to any resources
