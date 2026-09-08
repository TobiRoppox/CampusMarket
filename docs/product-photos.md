# Product photos

Sellers choose a JPG, PNG, or WebP photo (up to 5 MB) in Add/Edit Product. The form previews the selection and uploads it when the product is saved. Choosing another photo replaces the selection; Remove clears the product's photo.

`POST /api/products/image` accepts one multipart `image` file from an approved seller with an approved stall. It returns an `image_url` served under `/api/product-images/`. The backend checks the file size, MIME type, and image signature and generates the stored filename.

Files are stored in `backend/uploads/products` by default. Set `PRODUCT_PHOTO_DIR` to a persistent directory when deploying, include it in backups, and route `/api/product-images/` to the backend along with other `/api` requests. Uploaded files are excluded from Git. Replaced photos remain stored so historical order images keep working.
