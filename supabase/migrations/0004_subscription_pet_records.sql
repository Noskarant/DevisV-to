-- La nouvelle valeur doit être validée avant d’être utilisée par la migration suivante.
alter type product_type add value if not exists 'monthly';
