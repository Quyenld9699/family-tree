## Prepare

File `.env`

```env
PORT=9999
MONGODB_URI=mongodb://root:123456@localhost:27017/familytree?authSource=admin
JWT_SECRET_KEY= [uuid]
JWT_ACCESS_TOKEN_EXPIRES_IN=1000d
```

## Run dev

```bash
yarn dev
```
