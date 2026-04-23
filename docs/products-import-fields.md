# Products import from Excel

Supported columns:

- `name` — base product title, required
- `slug` — product URL slug; if it matches an existing product slug, that product will be updated
- `status` — `Активен`, `Черновик`, `Нет в наличии`, `Брак`
- `category` — one or multiple categories separated by `|`
- `brand` — brand
- `size` — size or size list
- `centimeters` — dimensions in centimeters
- `ageGroup` — age or age group
- `audience` — who the product is for
- `season` — one or multiple seasons separated by `|`
- `price` — current price, decimals allowed
- `oldPrice` — old price, optional
- `stock` — stock quantity
- `material` — material
- `colors` — colors separated by `|`
- `badge` — card badge
- `description` — base description
- `image` — main image
- `gallery` — gallery images separated by `|`
- `features` — features separated by `|`
- `name_ru` — Russian title
- `name_en` — English title
- `description_ru` — Russian description
- `description_en` — English description

Example row:

| name | slug | status | category | brand | season | price | stock |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Base product title | bazova-nazva-tovaru | Активен | Clothes \| New arrivals | Nova | Spring \| Summer | 2499.99 | 12 |
