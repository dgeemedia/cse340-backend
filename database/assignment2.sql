-- 1) Insert Tony Stark (account_id and account_type are handled by defaults)
INSERT INTO public.account (account_firstname, account_lastname, account_email, account_password)
VALUES ('Tony', 'Stark', 'tony@starkent.com', 'Iam1ronM@n');

-- 2) Modify Tony Stark record to change account_type to "Admin" (uses primary key via subquery)
UPDATE public.account
SET account_type = 'Admin'
WHERE account_id = (
  SELECT account_id FROM public.account WHERE account_email = 'tony@starkent.com'
);

-- 3) Delete the Tony Stark record (uses primary key via subquery)
DELETE FROM public.account
WHERE account_id = (
  SELECT account_id FROM public.account WHERE account_email = 'tony@starkent.com'
);

-- 4) Inner join: select make, model (inventory) and classification_name (classification) for 'Sport' items
SELECT i.inv_make AS make, i.inv_model AS model, c.classification_name
FROM public.inventory AS i
INNER JOIN public.classification AS c
  ON i.classification_id = c.classification_id
WHERE c.classification_name = 'Sport';

-- 5) (Optional) Quick check of current image paths in inventory
SELECT inv_id, inv_image, inv_thumbnail FROM public.inventory
LIMIT 50;

-- 6) Update inventory: insert "/vehicles" into the image path for both inv_image and inv_thumbnail
UPDATE public.inventory
SET inv_image = replace(inv_image, '/images/', '/images/vehicles/'),
    inv_thumbnail = replace(inv_thumbnail, '/images/', '/images/vehicles/')
WHERE inv_image LIKE '/images/%' OR inv_thumbnail LIKE '/images/%';
